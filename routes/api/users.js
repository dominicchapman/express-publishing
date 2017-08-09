var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');

/*
	We have user models and authentication middleware, so we can create authentication endpoints.

		- POST /api/users for registering users:
			If email and username available && valid password provided, create user and return user's auth JSON.

		– POST /api/users/login for logging in users:
			If email and password valid, return user's auth JSON.

		- GET /api/user for front-end to identify logged in user and refresh JWT token:
			If valid JWT token present, return user's auth JSON.

		– PUT /api/user for updating user information;
			IF valid JWT token present, update user's information.
*/


// allow users to sign up for accounts.
router.post('/users', function(req, res, next){
	var user = new User();

	user.username = req.body.user.username;
	user.email = req.body.user.email;
	user.setPassword(req.body.user.password);

	// when user.save() called, promise is returned for us to handle.
	user.save().then(function() {
		// if resolved, user successfully saved, so return user's auth JSON.
		return res.json({user: user.toAuthJSON()});
	}).catch(next); // if promise rejected, catch passes error to handler.
});

module.exports = router;