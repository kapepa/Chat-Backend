const jwt = require('jsonwebtoken');

module.exports = async function(req, res, next){
  const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (authHeader && token){
		return jwt.verify(token, process.env.JWT_TOKEN_SICRET_WORD, (err, user) => {
			if (err) return res.sendStatus(403)
			req.user = user;
			next()
		})
	}
	next()
}