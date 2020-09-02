const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
	res.send("hellow")
});

router.post("/test", async function(req, res){
	const collection = await usersSchema.find();
	console.log(collection)
	res.send();
})

module.exports = router;
