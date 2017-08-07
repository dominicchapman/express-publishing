var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

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

mongoose.model('User', UserSchema); // registers schema with mongoose; can be accessed by calling mongoose.model('User').