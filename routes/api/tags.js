var router = require('express').Router();
var mongoose = require('mongoose');
var Article = mongoose.model('Article');

// route for retrieving tags used on articles.
router.get('/', function(req, res, next) {
	// using find and distinct Mongoose methods, we gather list of unique tags added to articles.
	Article.find().distinct('tagList').then(function(tags) {
		return res.json({tags: tags});
	}).catch(next);
});

module.exports = router;