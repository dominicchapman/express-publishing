var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret; // secret signs and validates JWTs ('secret' in development; reads from env in production).

// index: true options optimize queries that use these fields.
var UserSchema = new mongoose.Schema({
	username: {type: String, lowercase: true, unique: true, required: [true, 'cannot be blank'], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
	email: {type: String, lowercase: true, unique: true, required: [true, 'cannot be blank'], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
	bio: String,
	image: String,
	favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Article'}], // we store all article IDs a user has favorited in an array.
	following: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}], // we store all user IDs a user is following in an array.
	hash: String,
	salt: String
}, {timestamps: true}); // creates auto-updating createdAt and updatedAt fields on models that contain timestamps.

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'}); // we register the plugin with our model to enable the unique validator.

// method to hash password generates random salt then hashes using salt.
UserSchema.methods.setPassword = function(password) {
	this.salt = crypto.randomBytes(16).toString('hex');
	// pbkdf2Sync parameters: the password to hash, the salt, the iteration (number of hashes), the hash length, the algorithm.
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

// valid password if resulting hash === hash stored in the db.
UserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
};

UserSchema.methods.generateJWT = function() {
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 60); // token expiration 60 days in the future.

	return jwt.sign({ // token payload: database id of user, username of user, UNIX timestamp in seconds determining expiry.
		id: this._id, 
		username: this.username,
		exp: parseInt(exp.getTime() / 1000),
	}, secret);
};

// JSON representation of user passed to front-end during authentiction.
UserSchema.methods.toAuthJSON = function() {
	return {
		username: this.username,
		email: this.email,
		token: this.generateJWT(), // should only be passed to specified user (JWT is sensitive).
		bio: this.bio,
		image: this.image
	};
};

// method to return public profile data.
UserSchema.methods.toProfileJSONFor = function(user) {
	return {
		username: this.username,
		bio: this.bio,
		image: this.image || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
		following: user ? user.isFollowing(this._id) : false
	};
};

// method to add article ID to user's favorites array.
UserSchema.methods.favorite = function(id) { 
	// if article ID not found in the favorites array.
	if(this.favorites.indexOf(id) === -1) {
		// add article ID to end of the favorites array.
		this.favorites.push(id);
	}

	return this.save();
};

// method to remove article ID from user's favorites array (unfavorite).
UserSchema.methods.unfavorite = function(id) {
	this.favorites.remove(id);
	return this.save();
};

// method to show if a user has favorited an article.
UserSchema.methods.isFavorite = function(id) {
	// some method tests whether at-least one element in an array passes the test implemented by the provided function.
	return this.favorites.some(function(favoriteId) {
		return favoriteId.toString() === id.toString();
	});
};

// method for following another user.
UserSchema.methods.follow = function(id) {
	// if the user ID is not found in the following array.
	if(this.following.indexOf(id) === -1) {
		// add to the following array.
		this.following.push(id);
	}

	return this.save();
};

// method for unfollowing another user.
UserSchema.methods.unfollow = function(id) {
	this.following.remove(id);
	return this.save();
};

// method to determine if a user is following another user.
UserSchema.methods.isFollowing = function(id) {
	return this.following.some(function(followId) {
		return followId.toString() === id.toString();
	});
};

mongoose.model('User', UserSchema); // registers schema with mongoose; can be accessed by calling mongoose.model('User').