/*jslint node: true */
/*global Meteor, WebApp */
'use strict';

var connectHandler = WebApp.connectHandlers; // get meteor-core's connect-implementation

Meteor.startup(function () {
    connectHandler.use(function (req, res, next) {
        res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
        return next();
    });
});