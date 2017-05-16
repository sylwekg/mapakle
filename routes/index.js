var express = require('express');
var router = express.Router();
var Point = require('../models/point');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MapaKleszczy.pl' });
});

/* GET for all points in db */
router.get('/points', function(req, res, next) {
    // return all points
    Point.find({})
        .exec(function(err, points) {
            if(err)
                return next(err);
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
    console.log("zapytanie dla punktu : ",req.query);
    // res.json({ lat : req.query.lat,
    //     lon: req.query.lon
    // });

    Point.findOne({'geometry.loc' : [req.query.lat,req.query.lon]},function (err, doc) {
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
