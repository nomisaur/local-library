var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// set up mongoose connection
var mongoose = require('mongoose');
//var mongoDB = "mongodb://127.0.0.1:27017/locallibrary";
var mongoDB = process.env.MONGODB_URI || 'mongodb://nsaltis:Databasedgod1@ds044679.mlab.com:44679/local_library1';
// I added the second argument here:
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, "MongoDB connection error:"));

// These are where i get my routes so i can use them later
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog'); //Import routes for "catalog" area of site

var compression = require('compression');
var helmet = require('helmet');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(compression()); //Compress all routes
app.use(express.static(path.join(__dirname, 'public')));

// this is where i use the routes i required earlier
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); // Add catalog routes to middleware chain.

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

module.exports = app;
