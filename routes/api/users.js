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

module.exports = router;