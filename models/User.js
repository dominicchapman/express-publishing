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

// JSON representation of user passed to front-end during authentiction .
UserSchema.methods.toAuthJSON = function() {
	return {
		username: this.username,
		email: this.email,
		token: this.generateJWT(), // should only be passed to specified user (JWT is sensitive).
		bio: this.bio,
		image: this.image
	};
};

mongoose.model('User', UserSchema); // registers schema with mongoose; can be accessed by calling mongoose.model('User').