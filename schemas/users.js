const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
	email: {
		type: String,
		required: true,
		validate: {
			validator: function(email) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
			},
			message: props => `${props.value} is not a valid email!`
		},
		unique: true, 
	},
	fullname: {
		type: String,
		required: true,
		validate: {
			validator: function(name) {
				return /\w{3,}/.test(name);
			},
			message: props => `${props.value} is not a valid name!`,
		}
	}, 
	password: {
		type: String,
		required: true,
		validate: {
			validator: function(password) {
				return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/.test(password);
			},
			message: props => `${props.value} is not a valid password!`,
		}
	},
	cofirmed: {
		type: Boolean,
		required: false,
	},
	avatar: String,
	cofirmed_hash: String,
	last_seen: {
		type: Date,
		default: new Date(),
	},
	recovery: String,
	isOnline: false
},{
	timestamps: { createdAt: 'created_at' },
});

module.exports = mongoose.model('Users', usersSchema);