/**
 * Created by sylwe on 02.05.2017.
 */
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required : true,
        trim : true
    },
    name: {
        type: String,
        required : true,
        trim : true
    },
    favoriteBook: {
        type: String,
        required : true,
        trim : true
    },
    password: {
        type: String,
        required : true
    },
    facebookId: {
        type: String
    }
});

//authentication
userSchema.statics.authenticate = function (email, password, callback) {
    User.findOne({ email: email})
        .exec(function (error, user) {
            if(error)
                return callback(error);
            else if(!user) {
                var err = new Error('Uzytkownik nie znaleziony');
                err.status = 401;
                return callback(err);
            }
            bcrypt.compare(password, user.password, function (error, result) {
                if(result)
                    return callback(null, user);
                else {
                    return callback(error);
                }
            });
        });
};

//pre save function to hash the pass
userSchema.pre('save',function (next){
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if(err)
            return next(err);
        else{
            user.password = hash;
            next();
        }
    });
});



var User = mongoose.model('User', userSchema);
module.exports = User;