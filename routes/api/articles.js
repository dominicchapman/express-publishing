var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var Comment = mongoose.model('Comment');
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

	
	When we work with relational data in Mongoose (or other NoSQL databases), we need to delete not only the 
	primary data (a comment, say), but also any references to that data (e.g. a comment ID). 
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

// endpoint to create comments on article.
router.post('/:article/comments', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user) {
		if(!user){ return res.sendStatus(401); }

		var comment = new Comment(req.body.comment);
		comment.article = req.article;
		comment.author = user;

		return comment.save().then(function() {
			req.article.comments.push(comment);

			return req.article.save().then(function(article) {
				res.json({comment: comment.toJSONFor(user)});
			});
		});
	}).catch(next);
});

// endpoint to list comments on article.
router.get('/:article/comments', auth.optional, function(req, res, next) {
	// we populate the comments and corresponding author data stored within its model, then return it.
	Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user) {
		return req.article.populate({
			path: 'comments',
			populate: {
				path: 'author'
			},
			options: {
				sort: {
					createdAt: 'desc'
				}
			}
		}).execPopulate().then(function(article) {
			return res.json({comments: req.article.comments.map(function(comment) {
				return comment.toJSONFor(user);
			})});
		});
	}).catch(next);
});


// router param middleware to resolve the /:comment in our URL.
router.param('comment', function(req, res, next, id) {
	Comment.findById(id).then(function(comment) {
		if(!comment) { return res.sendStatus(404); }

		req.comment = comment;

		return next();
	}).catch(next);
});

// router.delete middleware for deleting comments.
router.delete('/:article/comments/:comment', auth.required, function(req, res, next) {
	// check that currently logged in user is the comment author.
	if(req.comment.author.toString() === req.payload.id.toString()) {
		// remove comment ID from the article model.
		req.article.comments.remove(req.comment._id);
		// save the new article data.
		req.article.save()
			// delete the actual comment from the database.
			.then(Comment.find({_id: req.comment._id}).remove().exec())
			.then(function() {
				res.sendStatus(204);
			});
	} else {
		res.sendStatus(403);
	}
});

/* 
	We need to be able to list articles in a couple of ways:
		1. Retrieve articles by tag, author, favoriter with authentication optional;
		2. Return articles by followed users in separate feed with authentication required.

	We'll use queryable endpoints, supporting options through query strings in the URL (e.g. /api/articles?tag=cats).
	We'll implement the following parameters:
		– limit: the number of articles to be returned (defaults to zero);
		– offset: the number of articles to skip, which is useful for retreiving different pages of articles (defaults to zero);
		– tag: query articles that include this tag;
		– author: query articles authored by this username;
		– favorited: query articles favorited by this username.
*/

// endpoint to list all articles.
router.get('/', auth.optional, function(req, res, next) {
	var query = {};
	var limit = 20;
	var offset = 0;

	// add option to filter articles by limit.
	if(typeof req.query.limit !== 'undefined') {
		limit = req.query.limit;
	}

	// add option to filter articles by offset.
	if(typeof req.query.offset !== 'undefined') {
		offset = req.query.offset;
	}

	// add option to filter articles by tags.
	if(typeof req.query.tag !== 'undefined') {
		query.tagList = {"$in" : [req.query.tag]};
	}

	return Promise.all([
		Articles.find(query)
			.limit(Number(limit))
			.skip(Number(offset))
			.sort({createdAt: 'desc'})
			.populate('author')
			.exec(),
		Articles.count(query).exec(),
		req.payload ? User.findById(req.payload.id) : null, // when signed out, last value in array of promises passed to Promise.all() is null, which will resolve the last value to null in the array passed to our .then handler.
	]).then(function(results) {
		var articles = results[0];
		var articlesCount = results[1];
		var user = results[2];

		return res.json({
			articles: articles.map(function(article) {
				return article.toJSONFor(user);
			}),
			articlesCount: articlesCount
		});
	}).catch(next);
});

module.exports = router;