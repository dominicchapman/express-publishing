var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug'); // package used to auto-create URL slugs

/*
	– slug: generated string unique to each article used for database lookups;
	– title: title of the article;
	– body: markdown text that makes up the article;
	– description: short explanation of the article;
	– favoritesCount: total number of times users have favorited article (>= 0);
	– tagList: list of tags the article is associated with;
	– author: object that contains the public profile JSON of the article's author.
*/

var ArticleSchema = new mongoose.Schema({
	slug: {type: String, lowercase: true, unique: true},
	title: String,
	description: String,
	body: String,
	favoritesCount: {type: Number, default: 0},
	tagList: [{type: String}],
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, {timestamps: true});

ArticleSchema.plugin(uniqueValidator, {message: 'is already taken'});

// method for generating unique article slugs.
ArticleSchema.methods.slugify = function() {
	// to ensure slug is unique, we generate and prepend a random 6 character string.
	this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

// we generate the slug before Mongoose tires to validate to prevent otherwise saving will fail (there will be no slug, which is a required field).
ArticleSchema.pre('validate', function(next) {
	if(!this.slug) {
		this.slugify();
	}

	next();
});

mongoose.model('Article', ArticleSchema);