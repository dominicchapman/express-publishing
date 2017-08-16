var router = require('express').Router();

router.use('/', require('./users'));
router.use('/profiles', require('./profiles'));
router.use('/articles', require('./articles'));
router.use('/tags', require('./tags'));

// middleware function to convert mongoose validation errors to consumable messages on front-end.
router.use(function(err, req, res, next) { // middleware with four arguments treated as error handler
	if(err.name === 'ValidationError') {
		return res.status(422).json({
			errors: Object.keys(err.errors).reduce(function(errors, key) {
				errors[key] = err.errors[key].message;

				return errors;
			}, {})
		});
	}

	return next(err);
})

module.exports = router;