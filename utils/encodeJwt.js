const jwt = require('jsonwebtoken');

module.exports = function(data){
	return jwt.sign( typeof data === `object` ? {...data} :{tokenAuth: data},process.env.JWT_TOKEN_SICRET_WORD)
}