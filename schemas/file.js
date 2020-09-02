const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema(
	{
		size: { type: Number },
		url: { type: String },
		extend: { type: String },
		message: { type: mongoose.ObjectId, ref: "MessageStore", required: true  },
		userID: { type: mongoose.ObjectId, ref: "Users", required: true  }
	},{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
	}
);

module.exports = mongoose.model('File', fileSchema);
