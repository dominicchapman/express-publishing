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

module.exports = router;