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

module.exports = router;