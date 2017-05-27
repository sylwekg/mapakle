var express = require('express');
var router = express.Router();
var Point = require('../models/point');
var user = require('../models/user');
var mid = require('../middleware');

var passport = require('passport');


/* GET home page. */
router.get('/', function(req, res, next) {
    return res.render('index', { title: 'MapaKleszczy.pl' });
});

router.get('/logout',function (req, res, next) {
    if(req.session) {
        req.session.destroy(function (err) {
            if(err)
                return next(err);
            else
                return res.redirect('/');
        });
    }
});

router.get('/profile', mid.requiresLogin, function (req, res, next) {

    user.findById(res.locals.currentUser)
        .exec(function (error, user) {
            if(error)
                return next(error);
            else {
                console.log(req.session);
                req.session.userId = user._id;
                req.session.userName = user.name;

                return res.render('profile', {
                    title: 'Profile',
                    name: user.name,
                    email: user.email,
                    favorite: user.favoriteBook,
                    timeout: req.session.cookie.maxAge/1000 });
            }
        });
});



router.get('/login',mid.loggedOut, function (req, res, next) {
    var messages = req.flash('error');
    return res.render('login', { title: 'Login', messages:messages, hasErrors: messages.length>0});
});


router.get('/login/facebook',passport.authenticate('facebook',{scope:'public_profile'}));

router.get('/login/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));


router.post('/login',function(req, res, next){
    if (req.body.email && req.body.password) {
        user.authenticate(req.body.email, req.body.password, function (error, user) {
            if(error || !user) {
                var err = new Error('Wrong email or password - test');
                err.status = 401;
                req.flash('error', 'Wrong email or password');
                return res.redirect('/login');
                //return next(error);
            } else {
                req.session.userId = user._id;
                req.session.userName = user.name;
                //
                return res.redirect('/profile');
            }
        });
    } else {
        var err = new Error('Email and password are required');
        err.status = 401;
        return next(err);
    }
});

router.get('/register', mid.loggedOut, function(req, res, next){
    var messages = req.flash('error');
    return res.render('register', { title: 'Register', messages:messages, hasErrors: messages.length>0});
});

router.post('/register',function(req, res, next){
    if(req.body.email &&
        req.body.name &&
        req.body.favoriteBook &&
        req.body.password &&
        req.body.confirmPassword) {
        //pass check
        if (req.body.password !== req.body.confirmPassword) {
            var err = new Error('Password does not match');
            err.status = 400;

            req.flash('error', 'Password does not match');
            return res.redirect('/register');
            //return next(err);
        }
        //create object in mongoDB
        var userData = {
            email: req.body.email,
            name : req.body.name,
            favoriteBook : req.body.favoriteBook,
            password: req.body.password
        };
        user.create(userData, function (error, user) {
            if (error) {
                console.log(error);
                if(error.message.startsWith("E11000"))
                    req.flash('error', 'Podany e-mail juz istnieje. ');
                else
                    req.flash('error', 'Błąd bazy danych. Spróbuj ponownie ');
                return res.redirect('/register');
                //return next(error);
            }
            else
                req.session.userId = user._id;
            return res.redirect('/profile');
        });

    } else {
        var err = new Error('All fields required.');
        err.status = 400;
        req.flash('error', 'All fields required');
        return res.redirect('/register');
        //return next(err);
    }
});



// GET /about
router.get('/about', function(req, res, next) {
    return res.render('about', { title: 'About' });
});

// GET /contact
router.get('/contact', function(req, res, next) {
    return res.render('contact', { title: 'Contact' });
});


//=============== Mongo DB API ==========================================================

/* GET for all points in db */
router.get('/points', function(req, res, next) {
    // return all points
    Point.find({})
        .exec(function(err, points) {
            if(err) {
                console.log('Test na androida :',err.message);
                return next(err);
            }
            res.json(points);
        });
});

// save user point to database
router.post('/addPoint', function (req, res, next) {
    var point = new Point(req.body);
    point.save(function(err, point){
        if(err)
            return next(err);
        res.status(201);
        res.json(point);
    });
});

//znajdz punkt po wspolrzednych :lat,:lon
router.get('/getPoint', function (req, res, next) {
    console.log("zapytanie dla punktu : ",req.query.id);
    // res.json({ lat : req.query.lat,
    //     lon: req.query.lon
    // });

    //Point.findOne({'geometry.loc' : [req.query.lat,req.query.lon]},function (err, doc) {
    Point.findById( req.query.id, function (err, doc) {
        if(err)
            return next(err);
        if(!doc){
            err = new Error(" Punkt nie istnieje");
            err.status = 404;
            return next(err);
        }
        res.json(doc);
    });
});

// znajdz punkty w konkretnym obszarze :rectangle from the points at its south-west and north-east corners
router.get('/getAreaPoints', function (req, res, next) {
    console.log("zapytanie dla punktu : ",req.query.locsw,req.query.locne);
    // res.json({ lat : req.query.lat,
    //     lon: req.query.lon
    // });

    //Point.find({'geometry.loc' :{$geoWithin: req.query.area }},function (err, doc) {
    Point.where('geometry.loc').within({ box: [req.query.locsw,req.query.locne]}).exec(function (err, doc) {
        if(err)
            return next(err);
        if(!doc){
            err = new Error(" Punkt nie istnieje");
            err.status = 404;
            return next(err);
        }
        res.json(doc);
    });
});


module.exports = router;
