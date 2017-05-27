/**
 * Created by sylwe on 03.05.2017.
 */
function loggedOut( req, res, next) {
    if (req.session && req.session.userId || req.session && req.user) {
        return res.redirect('/profile');
    }
    return next();
}

function requiresLogin(req, res, next) {
    if(req.session.userId && req.session || req.session && req.user )
        return next();
    else {
        var err=new Error ("you must me logged in to see this page");
        err.status = 401;
        return next(err);
    }
}


module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;