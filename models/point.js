/**
 * Created by sylwe on 11.05.2017.
 */
var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var point  = new Schema({

    name: String,
    user: String,
    geometry: {
        type: { type: String },
        loc: { type: [Number], index: '2dsphere'} //latitude, longitude
    },
    quality: Number


    //creationDate: { type: Date, default: Date.now },
    //userId: ObjectId,

});


module.exports = mongoose.model('Point', point);