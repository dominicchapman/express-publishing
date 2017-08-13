var mongoose = require('mongoose');

/*
	Commenting requires a brand new model that stores the contents of a given comment.
	It must also associate itself with the author and the article it was posted on.
*/

var CommentSchema = new mongoose.Schema({
	body: String,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, {timestamps: true});

// method for returning proper JSON output of a comment for the API endpoints to return.
CommentSchema.methods.toJSONFor = function(user) {
	return {
		id: this._id,
		body: this.body,
		createdAt: this.createdAt,
		author: this.author.toProfileJSONFor(user)
	};
};

mongoose.model('Comment', CommentSchema);