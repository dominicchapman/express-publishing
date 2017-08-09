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

// endpoint to get current user's auth payload from their token.
router.get('/user', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user) {
		// if User.findById() promise not rejected, but user retrieved is falsey, user id in JWT payload is invalid => 401 (user removed from db).
		if(!user){ return res.sendStatus(401); }

		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});

// authenticated endpoint to facilitate updates to user information.
router.put('/user', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user){
		if(!user){ return res.sendStatus(401); }

		// only update fields that were actually passed...
		if(typeof req.body.user.username !== 'undefined') {
			user.username = req.body.user.username;
		}
		if(typeof req.body.user.email !== 'undefined') {
			user.email = req.body.user.email;
		}
		if(typeof req.body.user.bio !== 'undefined') {
			user.bio = req.body.user.bio;
		}
		if(typeof req.body.user.image !== 'undefined') {
			user.image = req.body.user.image;
		}
		if(typeof req.body.user.password !== 'undefined') {
			user.setPassword(req.body.user.password);
		}

		return user.save().then(function() {
			return res.json({user: user.toAuthJSON()});
		});
	}).catch(next);
});


module.exports = router;