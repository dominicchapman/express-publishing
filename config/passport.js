var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');


passport.use(new LocalStrategy({ // new LocalStrategy option to match format we will write request body from front-end.
	usernameField: 'user[email]',
	passwordField: 'user[password]',
}, function(email, password, done) {
	// look up user using information in the request body
	User.findOne({email: email}).then(function(user) {
		// email not found or user password incorrect, so return error message.
		if(!user || !user.validPassword(password)) {
			return done(null, false, {errors: {'email or password': 'is invalid'}});
		}
		// success
		return done(null, user);
	}).catch(done);
}));