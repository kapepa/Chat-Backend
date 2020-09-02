const express = require('express');
const router = express.Router();
const Dialog = require("../schemas/dialog");
const Message = require("../schemas/message");
const User = require("../schemas/users");
const { route } = require('./users');

router.post('/derived',async function( req, res, next) {
	try{
		const authorID = req.body.authorID;
		const dialog = await Dialog.findOne({author: authorID})
		res.status(200).json(dialog)
	}catch(err){
		res.status(404).send(err)
	}
})

router.post('/addDialog', async function(req, res, next){
	try{
		const { dialogID, partner, author, lastMessage, text } = req.body;
		const dialog = new Dialog({ partner, author, lastMessage });
		const message = new Message.updateOne({dialog: dialogID},{text});
		await dialog.save();
		await message.save()
		res.status(200).json(true);
	}catch(err){
		console.log(err," adderr")
		res.status(404).json(err);
	}
});

router.post('/findDialog', async function(req, res, next){
	try{
		const dialogArr = new Array();
		const { tokenAuth } = req.user;
		const dialogs = [...await Dialog.find({author: tokenAuth}), ...await Dialog.find({partner: tokenAuth})]

		for await (let key of dialogs){
			const partnerID = key.partner ;
			const partnerTest = partnerID.toString() !== tokenAuth ? key.partner : key.author ;
			const partner = await User.findById(partnerTest).select('-password -cofirmed_hash')
			dialogArr.push({...key._doc,...partner._doc,_id: key._id})
		}
		res.status(200).json({dialog: dialogArr})
	}catch(err){
		res.status(404).send(err);
	}
})

module.exports = router;