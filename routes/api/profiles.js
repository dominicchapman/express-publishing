var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var auth = require('../auth');

/*
	We have a method to retrieve a user's public profile.
	Now we need a publicly accessible endpoint to return that data to the frontend.

	1. Create a router that is responsible for all profile related routes.
	2. Create the route responsible for GETting a user's profile.
	3. Create routes for following and unfollowing profiles.
*/

// prepopulate req.profile with user's data when :username paramater is contained within a route.
router.param('username', function(req, res, next, username){
	User.findOne({username: username}).then(function(user){
		if(!user) { return res.sendStatus(404); }

		req.profile = user;

		return next();
	}).catch(next);
});

// endpoint to fetch user's profile based on username using the parameter middleware.
router.get('/:username', auth.optional, function(req, res, next){
	return res.json({profile: req.profile.toProfileJSONFor()});
});

module.exports = router;