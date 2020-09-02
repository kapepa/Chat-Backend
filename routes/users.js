const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const usersSchema = require('../schemas/users');
const dialogSchema = require('../schemas/dialog');
const messageSchema = require('../schemas/message');
const encodeJwt = require('../utils/encodeJwt');
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const { Recoverable } = require('repl');
const { route } = require('.');

router.post(`/verify`,async function(req, res){
	try{
		const hash = req.query.hash;
		const replace = await usersSchema.updateOne({cofirmed_hash: hash},{cofirmed: true});
		res.status(200).json({hash: typeof replace === "object"})
	}catch(e){
		res.status(404).json({hash: false})
	}
})

router.post('/registration', [ check('email').isEmail().withMessage("Email indicate wrong"),  check('fullname').isLength({ min: 3 }),  check('password').isLength({ min: 6 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/).withMessage('Password indicate wrong')], async function(req, res, next) {
	try{
		crypto.randomBytes(128, async (err, buf) => {
			if (err) throw err;
			const hash = buf.toString('hex');
			const user = new usersSchema({email: req.user.email, fullname: req.user.fullname , password: req.user.password, cofirmed_hash: hash, cofirmed: false});
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				host: process.env.MAIN_EMAIL_ADDRESS_NAME,
				auth: {
					user: process.env.MAIN_EMAIL_ADDRESS_NAME,
					pass: process.env.MAIN_EMAIL_ADDRESS_PASSWORD
				}
			});
			const mailOptions = {
				from: process.env.MAIN_EMAIL_ADDRESS_NAME,
				to: req.user.email,
				subject: `Подтверждения регистрации с сайта ${process.env.ROOT_NAME_ADDRES}`,
				text: `Подтверждения регистрации`,
				html: `<p><a href=${process.env.ROOT_NAME_ADDRES}/verify?hash=${hash}> Нажмите чтобы завершить регистрацию </a></p>`
			};
			transporter.sendMail(mailOptions, async function(error, info){
				if (error) {
					res.status(404).json(error);
				} else {
					const answer = await user.save();
					res.status(200).json(typeof answer === "object")
				}
			});
		});
		// res.status(200).json(true)
	}catch(e){
		res.status(200).json(false)
	}
});


router.delete(`/del`, async function(req, res, next){
	try{
		await usersSchema.deleteOne({_id: req.body.id})
		res.status(200).json(true)
	}catch(e){
		res.status(404).json(e)
	}
})

router.post('/id', async function(req, res, next){
	try{
		const id = await usersSchema.findById(req.body.id);
		if(id === null){
			return res.status(404).send("Such Users not be find")
		}
		res.status(200).json(id);
	}catch(e){
		res.status(404).json(e)
	}
})

router.post("/getMe", async function(req, res, next){
	try{
		const { userID } = req.body;
		const exist =  await dialogSchema.findOne({author: userID})
		res.status(201).json({user: exist})
	}catch(e){
		res.status(404).json(e);
	}
})

router.post("/auth", async function(req, res, next){
	try{
		const { email, password } = req.user;
		const exist = await usersSchema.findOne({email,password});
		const token = await encodeJwt({tokenAuth: exist._id, name: exist.fullname, cofirmed: exist.cofirmed, avatar: exist.avatar});
		console.log(exist)
		if(exist && token){
			res.status(200).json(token);
		}else{
			res.status(200).json(false);
		}
	}catch(err){
		res.status(404).json(err)
	}
})

router.post("/recovery", async function(req, res){
	try{
		const { password, token } = req.user;
		const refresh = await usersSchema.updateOne({recovery: token },{ password: password});
		if(refresh.n){
			res.status(200).json(true)
		}else{
			res.status(200).json(false)
		}
	}catch(e){
		res.status(404).json(e.name)
	}
})

router.post("/forget", async function(req, res){
	try{
		const { email } = req.user;
		const Users = await usersSchema.findOne({email});
		if(Users){
			crypto.randomBytes(128, (err, buf) => {
				if (err) throw err;
				const recoveryKey = buf.toString('hex');
				const transporter = nodemailer.createTransport({
					service: 'gmail',
					host: process.env.MAIN_EMAIL_ADDRESS_NAME,
					auth: {
						user: process.env.MAIN_EMAIL_ADDRESS_NAME,
						pass: process.env.MAIN_EMAIL_ADDRESS_PASSWORD
					}
				});

				const mailOptions = {
					from: process.env.MAIN_EMAIL_ADDRESS_NAME,
					to: email,
					subject: `Восстановление пароля с сайта ${process.env.ROOT_NAME_ADDRES}`,
					text: `Восстановление пароля`,
					html: `<p><a href=${process.env.ROOT_NAME_ADDRES}/recovery/${recoveryKey}> Нажмита чтобы восстановить доступ к аккаунту </a></p>`
				};

				transporter.sendMail(mailOptions, async function(error, info){
					if (error) {
						res.status(404).json(error);
					} else {
						await Users.updateOne({recovery: recoveryKey})
						res.status(200).json(true)
					}
				});

			});
			
		}else{
			res.status(200).json({message: "Такого Email адреса нету"})
		}

	}catch(e){
		res.status(404).json(e.name)
	}
})

router.post('/finduser', async function(req, res){
	try{
		const { explore } = req.user;
		const listUser = await usersSchema.find({fullname: new RegExp(`^${explore}`)})
		const populateUser = listUser.map( el => { return {_id: el._id, fullname: el.fullname}})
		res.status(200).json({listUser: populateUser})
	}catch(e){
		req.status(404).json(e.name)
	}
})

router.post('/avatarUpdata', async function(req, res){
	try{
		const { url, userID } = req.body;
		const user = await usersSchema.findById(userID);
		if(!user) throw user;
		user.avatar = url;
		await user.save();
		res.status(200).json({updateAvatar: true})
	}catch(e){
		res.status(404).send(e.name)
	}
})

module.exports = router;
