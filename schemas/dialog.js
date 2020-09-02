const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dialogSchema = new Schema({
	partner: { type: mongoose.ObjectId, ref: "Users", required: true },
	author: { type: mongoose.ObjectId, ref: "Users", required: true },
	lastMessage: String,
	messageID: { type: mongoose.Schema.Types.ObjectId,  ref: "messages", required: true},
},{
	timestamps: { createdAt: 'created_at', updatedAt: 'update_at' }
});

module.exports = mongoose.model('Dialog', dialogSchema);