/**
 * Created by sylwe on 11.05.2017.
 */
var Punkt = require('../models/point');
var mongoose = require('mongoose');
mongoose.connect('localhost:27017/mapakleszczy');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));
db.once('open', function() {
    console.log('db connected!');

    var points = [
        new Punkt({
            name: "Punkt 2",
            user: "Marian",
            geometry : {
                type: "Point",
                loc : [ -73.97, 40.77 ]
            },
            quality: 0
        }),
        new Punkt({
            name: "Punkt 3",
            user: "Marian",
            geometry : {
                type: "Point",
                loc : [ -74.97, 41.77 ]
            },
            quality: 1
        }),
        new Punkt({
            name: "Punkt 4",
            user: "Marian",
            geometry : {
                type: "Point",
                loc : [ -75.97, 42.77 ]
            },
            quality: 2
        }),
    ];

    var done =0;
    for( var i=0; i<points.length; i++) {
        points[i].save(function (err, res) {
            if(err)
                console.log(err);
            done++;
            console.log('db: saving doc...');
            if(done===points.length) exit();
        });
    }

});



function exit() {
    mongoose.disconnect();
    console.log('db: disconnected');
}

//mongoose.disconnect();