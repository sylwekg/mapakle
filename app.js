var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var expressHbs = require('express-handlebars');
var handlebars = require('handlebars');
var dotenv = require('dotenv').config();
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


var user = require('./models/user');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

//DB start
mongoose.connect('localhost:27017/mapakleszczy');
var db = mongoose.connection;
//on DB error
db.on('error',console.error.bind(console,'connection error:'));

//use sessions for tracking logins
app.use(session({
    secret: 'kleszcz',
    resave: true,
    saveUninitialized: false,
    store : new MongoStore({
        mongooseConnection : db
    }),
    cookie: { maxAge: 60000*5 }
}));

//flash messaging
app.use(flash());

//make user ID available in templates/views
app.use(function (req, res, next) {
    //local login
    if(req.session.userId){
        res.locals.currentUser = req.session.userId;
        res.locals.userName=req.session.userName;
        console.log('username :',res.locals.userName);
    }
    next();
});

// view engine setup
app.engine('.hbs',expressHbs({defaultLayout:'layout', extname:'.hbs'}));
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// fb authorization
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'http://localhost:3000/login/facebook/callback'
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log('Profil :',profile);
        user.findOneAndUpdate({ facebookId: profile.id },
            {facebookId:profile.id, name:profile.displayName},
            {new:true, upsert:true},
            function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false, { message: 'Incorrect user.' });
            }
         return cb(err, user);
        });
    }
));



passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    user.findById(id, function(err, user) {
        done(err, user);
    });
});

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

//make user ID available in templates/views
app.use(function (req, res, next) {

    console.log('Diag session:',req.session);
    console.log('Diag user:',req.user);
    //fb login
    if(req.user){
        res.locals.currentUser = req.user._id;
        res.locals.userName=req.user.name;
        console.log('username :',res.locals.userName);
    }
    next();
});

//CORS activation
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     if(req.method === "OPTIONS" ) {
//         res.header("Access-Control-Allow-Methods", "GET,PUT,POST");
//         return res.status(200).json({});
//     }
//     next();
// });


//routing
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
