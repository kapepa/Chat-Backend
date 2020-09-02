const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const dialogRouter = require('./routes/dialog');
const messageRouter = require('./routes/message');
const fileRouter = require('./routes/file');
const upadateLast = require('./middleware/upadateLast');
const jwtToken = require("./middleware/jwt-token");
const socketIO = require('./socket/index');

mongoose.connect(process.env.MONGOOSE_CONNECT_ADDRESS, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true}).catch(err => console.log(err.reason));

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
	res.header(
    "Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
	next()
});

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(upadateLast);
app.use(jwtToken)
app.use((req, res, next) => { res.io = io; next()})

io.on('connection', (socket) => {
	socket.on("sendMessage", (data) => { socketIO.sendMessage(socket, data)});
	socket.on("enstablishUser", (data) => { socketIO.establishOnline(socket, data)});
	socket.on("createDialogs", (data) => { socketIO.createDialogs(socket, data)});
	socket.on("removeMessage", (data) => { socketIO.removeMessage(socket, data)});
	socket.on("beginCheck", (data) => { socketIO.checkReaded(socket, data)});
	socket.on("confirmedReadedmessage", (data) => { socketIO.confirmedCheck(socket, data)});
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dialogs', dialogRouter);
app.use('/message', messageRouter);
app.use('/files', fileRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app: app, server: server, io: io }; 
