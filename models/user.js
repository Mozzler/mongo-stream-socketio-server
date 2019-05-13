const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
	first_name: {
		type: String,
		required: true
	},
	last_name: {
		type: String,
		required: true
	},
	age: {
		type: Number,
		required: true
	}
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
