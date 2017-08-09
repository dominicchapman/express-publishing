var jwt = require('express-jwt');
var secret = require('../config').secret;

/* 	
	two cases for handling JWTs: optional and required authentication.
	required: routes that require user to be logged in (e.g. feed)
	optional: public routes (e.g. global article list)

	required && unauthenticated => 401 status code
	optional && authenticated => page possibly enhanced with favorites, etc.
*/

// helper function to extract the JWT from the Authorization header.
function getTokenFromHeader(req) {
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
		return req.headers.authorization.split(' ')[1];
	}

	return null;
}

// JWT is attached to each request through userProperty, so we can access the data using req.payload.
var auth = {
	required: jwt({
		secret: secret,
		userProperty: 'payload',
		getToken: getTokenFromHeader
	}),
	optional: jwt({
		secret: secret,
		userProperty: 'payload',
		credentialsRequired: false, // requests without a token will still succeed.
		getToken: getTokenFromHeader
	})
};