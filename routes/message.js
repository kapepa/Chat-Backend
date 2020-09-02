const express = require('express');
const router = express.Router();
const Message = require('../schemas/message');
const Dialogs = require('../schemas/dialog');

router.post('/', async function(req, res, next){
	try{
		const { id } = req.user;
		const answer = await Message.findById(id);
		res.status(200).json({message: answer})
	}catch(err){
		res.status(404).send(err);
	}
})

router.post('/getMessage', async function(req, res, next){
	try{
		const { id } = req.body;
		const answer = await Message.findById(id).populate(['partner','author']);
		res.status(200).json(answer)
	}catch(err){
		res.status(404).send(err);
	}
})

router.delete('/', async function(req, res, next){
	try{
		const { id } = req.body;
		await Message.deleteOne({_id: id});
		res.status(200).json(true)
	}catch(err){
		res.status(404).send(err)
	}
})

router.post('/createMessage', async function(req, res, next){
	try{
		const { messageID, message } = req.body;
		Message.findOneAndUpdate({_id: messageID}, function(err, doc){
			if(err) res.status(404).send(err);
			doc.message.push(message);
			doc.save()
			res.status(200).send(true)
		})
	}catch(err){
		res.status(404).send(err)
	}
})

module.exports = router;