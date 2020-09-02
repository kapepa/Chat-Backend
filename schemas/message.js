const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	text: { 
		type: [	{ text: String, date: {type: Date, required: true, default: Date.now}, avatar: {type: String, default: ""}, name: String, userID: mongoose.ObjectId, isReaded: {type: Boolean, default: false}, attachments: {type: Array, default: []}, isTyping: {type: Boolean, default: false}, isAudio: {type: Object, default: {url: "", public_id: ""}} }],
		default: undefined
	},
	unread: false,
},{
	timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('MessageStore', messageSchema);
