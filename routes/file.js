const express = require('express');
const router = express.Router();
const multer  = require('multer')
const cloudinary = require('cloudinary').v2;
const path = require("path");
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
		cb(null, 'images')
  },
  filename: function (req, file, cb) {
		cb(null, file.originalname)
	},
	fileFilter: function (req, file, cb) {
		if (file.mimetype !== 'image/png' || file.mimetype !== 'image/jpg' || file.mimetype !== 'image/svg') return cb(null, false, new Error("I don\'t have a clue!"));
		cb(null, true);
	}
})

const blobs = multer.diskStorage({
  destination: function (req, file, cb) {
		cb(null, 'blobs')
  },
  filename: function (req, file, cb) {
		cb(null, file.originalname)
	},
})

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
})

router.post('/image',multer({storage}).single('photos'), function(req, res){
	try{

		const path = req.file.path;
		const uniqueFilename = new Date().toISOString();
		
		return cloudinary.uploader.upload(
      path,
      { public_id: `images/${uniqueFilename}`, tags: `images` },
      function(err, image) {
        if (err) return res.send(err)
				fs.unlinkSync(path)
        return res.status(200).json(image)
      }
    )
	}catch(e){
		res.status(404).send(e.name)
	}
})

router.post('/delphot', function(req, res){
	try{
		const { photo } = req.body;
		console.log(typeof photo)
		cloudinary.uploader.destroy(photo, function(error, result){ 
			console.log(result)
			if(error) throw error
			return result.result === "ok" ? res.status(200).json({photo, result: true}) : res.status(200).json({photo, result: false});	
		})
	}catch(e){
		res.status(404).send(e.name)
	}
})

router.post('/avatar', multer({storage}).single("avatar") ,function(req, res){
	try{

		const path = req.file.path;
		const uniqueFilename = new Date().toISOString();

		return cloudinary.uploader.upload(
      path,
      { public_id: `avatar/${uniqueFilename}`, tags: `avatar` },
      function(err, image) {
        if (err) return res.send(err)
				fs.unlinkSync(path)
        return res.status(200).json(image)
      }
    )
	}catch(e){
		res.status(404).send(e.name)
	}
})

router.post('/blobs', multer({storage: blobs}).single("blobs") , function(req, res){
	try{

		const path = req.file.path;
		const uniqueFilename = new Date().toISOString();
		
		return cloudinary.uploader.upload(
			path,
      { resource_type: "video", public_id: `blobs/${uniqueFilename}`, tags: `blobs` },
      function(err, blobs) {				
        if (err) return res.send(err)
				fs.unlinkSync(path)
        return res.status(200).json(blobs)
      }
		)
	}catch(e){
		res.status(404).send(e.name)
	}
})

module.exports = router