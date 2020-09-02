const usersSchema = require('../schemas/users');
const dialogSchema = require('../schemas/dialog');
const messageSchema = require('../schemas/message');
const cloudinary = require('cloudinary').v2;

const socketAction = {
	sendMessage: async function(socket, data){
		const { dialogID, authorID, text, attachments, isAudio, date} = data;
		const author = await usersSchema.findById(authorID);
		const establishDialog = await dialogSchema.findById(dialogID)
		const messageID = establishDialog.messageID;
		const receiveMessage = await messageSchema.findById(messageID)
		const establishPartner = establishDialog.author.toString() === authorID ? establishDialog.partner : establishDialog.author;
		const addData = await usersSchema.findById(establishDialog.author.toString() === authorID ? establishDialog.partner : establishDialog.author)
		establishDialog.lastMessage = text;
		receiveMessage.text.push({text: text, name: author.fullname, userID: authorID, attachments, isAudio, date});
		const newDialog = await establishDialog.save();
		const newMessage = await receiveMessage.save();
		const lastIndex = newMessage.text.length - 1
		const latest = newMessage.text[lastIndex];
		const dialogsUp = {
			...newDialog._doc,
			last_seen: addData.last_seen,
			email: addData.email,
			fullname: addData.fullname,
			cofirmed: addData.cofirmed,
			updatedAt: addData.updatedAt};
		const lastMessage = {id: newMessage._id, message: latest};
		// socket.emit(authorID.toString(), {newDialogs: {...dialogsUp, avatar: addData.avatar, isOnline: addData.isOnline}, newMessage: lastMessage});
		socket.broadcast.emit(addData._id.toString(), {newDialogs: {...dialogsUp, avatar: author.avatar, isOnline: author.isOnline}, newMessage: lastMessage});
	},
	establishOnline: async function(socket, data){
		const { user } = data;
		const exist = await usersSchema.findById(user);
		if(exist){
			exist.isOnline = true;
			await exist.save();
			const isOnline = await usersSchema.find({ isOnline: true }).select('_id');
			socket.emit('enstablishUser',{isOnline: isOnline});
			socket.broadcast.emit('enstablishUser',{isOnline: isOnline});
			socket.on("disconnect",async  function(){
				exist.isOnline = false;
				await exist.save();
				const leaveOnline = await usersSchema.find({isOnline: true}).select('_id')
				socket.broadcast.emit('closeOnline',{isOnline: leaveOnline});
			})
		}
	},
	createDialogs: async function(socket, data){
		const { authorID, partnerID, message } = data;
		const dialogs = await dialogSchema.find().or({author: authorID}, {partner: authorID});
		const checkExist = dialogs.find( (el) => {
			const establistAuthor = el.author.toString() === authorID.toString() ? authorID : el.partner.toString() === authorID.toString() ? el.partner : false ;
			return establistAuthor && establistAuthor.toString() === authorID.toString() && ( el.author.toString() === partnerID.toString() || el.partner.toString() === partnerID.toString()) ? el : false;
		})
		if(checkExist) return socketAction.sendMessage(socket, { dialogID: checkExist._id, authorID, text: message });
		const establishAuthor = await usersSchema.findById(authorID);
		const establishPartner = await usersSchema.findById(partnerID);
		const createMessage = new messageSchema({ text: [{avatar: establishAuthor.avatar,	text: message, name: establishAuthor.fullname, userID: establishAuthor._id}] });
		await createMessage.save();
		const dialogCreate = new dialogSchema({ author: establishAuthor._id, partner: establishPartner._id ,messageID: createMessage._id, lastMessage: message});
		const answerDialog = await dialogCreate.save();
		socket.emit("updateDialogs", {...answerDialog._doc, isOnline: establishPartner.isOnline, fullname: establishPartner.fullname, email: establishPartner.email});
	},
	removeMessage: async function(socket, data){
		const { messageID, userID, date} = data;
		const message = await messageSchema.findById(messageID);
		const dialogs = await dialogSchema.findOne({messageID: messageID});
		const removeIndex = message.text.findIndex( (el) => { 
			return el.userID.toString()	=== userID && el.date.getTime() === new Date(date).getTime()
		} )
		if(removeIndex === -1) return null;
		const del = message.text.splice(removeIndex,1);
		const delObj = del[0]
		if( delObj.attachments && delObj.attachments.length > 0){
			delObj.attachments.forEach((el) => {
				cloudinary.uploader.destroy(el.public_id, function(error, result){ 
					if(error) throw error
					// console.log(result.result)
				})
			})
		}
		if(delObj.isAudio && delObj.isAudio.url.length > 0){
			console.log(delObj.isAudio)
			cloudinary.uploader.destroy(delObj.isAudio.public_id,{resource_type: 'video'}, function(error, result){ 
				if(error) throw error
				// console.log(result.result)
			})
		}
		const lastMessage = message.text[message.text.length - 1].text;
		await message.save();
		dialogs.lastMessage = lastMessage || "";
		await dialogs.save();
		socket.emit(`clear-${messageID}`,{message, lastMessage, messageID})
		socket.broadcast.emit(`clear-${messageID}`,{message, lastMessage, messageID})
	},
	checkReaded: async function(socket, data){
		const { messageID, userID } = data;
		const message = await messageSchema.findById(messageID);
		message.text.map( el => el.userID.toString() === userID ? el.isReaded : el.isReaded = true )
		await message.save();
		socket.broadcast.emit(`read-${messageID}`,{messageID, userID, isReaded: true})
	},
	confirmedCheck: async function(socket, data){
		const { messageID, userID } = data;
		const message = await messageSchema.findById(messageID);
		message.text.map( el => el.userID.toString() === userID ? el.isReaded = true : el.isReaded )
		await message.save();
		socket.broadcast.emit(`confirmed-${messageID}`,{messageID, userID, isReaded: true})
	}
}
module.exports = socketAction;