'use strict';

var connectHandler = WebApp.connectHandlers; // get meteor-core's connect-implementation

Meteor.startup(function () {
    connectHandler.use(function (req, res, next) {
        res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
        return next();
    });
    
    Meteor.users.find().fetch().forEach(function (user){
        if(!user.profile) {
            user.profile = { name: user.username };
            Meteor.users.update({_id: user._id}, user);
        }
    });
});