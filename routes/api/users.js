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


// allow users to sign up for account.
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

//allow users to log in to their account.
router.post('/users/login', function(req, res, next) {
	// is email provided by front-end? If not, respond with 422.
	if(!req.body.user.email) {
		return res.status(422).json({errors: {email: "can't be blank"}});
	}

	// is password provided by front-end? If not, respond with 422.
	if(!req.body.user.password) {
		return res.status(422).json({errors: {password: "can't be blank"}});
	}

	// pass incoming request to passport.authenticate using local strategy we specified in config/passport.js.
	// since we use JWTs for auth (not sessions), we specify {session: false} to prevent Passport's session serialization.
	passport.authenticate('local', {session: false}, function(err, user, info){
		if(err){ return next(err); }

		// define callback for passport strategy, responding to client depending on auth success.
		if(user) {
			user.token = user.generateJWT();
			return res.json({user: user.toAuthJSON()});
		} else {
			return res.status(422).json(info);
		}
	})(req, res, next);
});


module.exports = router;