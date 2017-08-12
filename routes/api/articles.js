var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var auth = require('../auth');

/*
	We should be able to create a new article.
	We and others should be able to view an article.
	We should be able to edit an article.
	We should be able to delete an article. 
	i.e. Create, Read, Update, Destroy (CRUD).

	Reading, updating and deleting requires a query of the database for a particular article based on its slug.

	Rather than writing the same query for every route, Express can intercept requests with specific URL parameters 
	and perform logic on them before handing over to the next middleware function we define.
	
		In this case, when a URL definition contains :article, Express will look for a router.param that specifies 'article',
		and our corresponding function will set the corresponding article's data to req.article for the other routes to use. 
*/

// endpoint for creating articles.
router.post('/', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user) {
		// articles can only be created by logged in users, so we check for authentication.
		if (!user) { return res.sendStatus(401); }

		var article = new Article(req.body.article);

		article.author = user;

		return article.save().then(function() {
			console.log(article.author);
			return res.json({article: article.toJSONFor(user)});
		});
	}).catch(next);
})

// intercept and prepopulate article data from the slug.
router.param('article', function(req, res, next, slug) { // Express will hand the value of the article's slug.
	Article.findOne({ slug: slug})
	.populate('author')
	.then(function (article) {
		if (!article) { return res.sendStatus(404); }

		req.article = article;

		return next();
	}).catch(next);
});

// endpoint to retrieve an article by its slug.
router.get('/:article', auth.optional, function(req, res, next) {
	Promise.all([
		req.payload ? User.findById(req.payload.id) : null,
		req.article.populate('author').execPopulate()
	]).then(function(results) {
		var user = results[0];

		return res.json({article: req.article.toJSONFor(user)});
	}).catch(next);
});

// endpoint for updating articles, performed with PUT method.
router.put('/:article', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user) {
		// ensure author of the article is the logged in user (only author can update their articles).
		if(req.article.author._id.toString() === req.payload.id.toString()) {
			// body of the request used to overwrite the relevant fields in the article's model data.
			if(typeof req.body.article.title !== 'undefined') { // we check that fields contain data, otherwise we might overwrite existing fields with undefined.
				req.article.title = req.body.article.title;
			}

			if(typeof req.body.article.description !== 'undefined') {
				req.article.description = req.body.article.description;
			}

			if(typeof req.body.article.body !== 'undefined') {
				req.article.body = req.body.article.body;
			}

			req.article.save().then(function(article) {
				return res.json({article: article.toJSONFor(user)});
			}).catch(next);
		} else {
			return res.sendStatus(403);
		}
	});
});

// endpoint for deleting articles.
router.delete('/:article', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function() {
		// ensure user currently logged in is author of the article.
		if(req.article.author._id.toString() === req.payload.id.toString()) {
			// delete the article and send status code 204 (request was successful and returns no content).
			return req.article.remove().then(function() {
				return res.sendStatus(204);
			});
		} else {
			return res.sendStatus(403);
		}
	});
});


// endpoint for favoriting an article.
router.post('/:article/favorite', auth.required, function(req, res, next) {
	var articleId = req.article._id;

	User.findById(req.payload.id).then(function(user) {
		if(!user) { return res.sendStatus(401); }

		return user.favorite(articleId).then(function() {
			return req.article.updateFavoriteCount().then(function(article) {
				return res.json({article: article.toJSONFor(user)});
			});
		});
	}).catch(next);
});

// endpoint for unfavoriting an article.
router.delete('/:article/favorite', auth.required, function(req, res, next) {
	var articleId = req.article._id;

	User.findById(req.payload.id).then(function(user) {
		if(!user) { return res.sendStatus(401); }

		return user.unfavorite(articleId).then(function() {
			return req.article.updateFavoriteCount().then(function(article) {
				return res.json({article: article.toJSONFor(user)});
			});
		});
	}).catch(next);
});

module.exports = router;