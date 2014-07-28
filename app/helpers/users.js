/*jslint node: true, nomen: true */
/*global Meteor */
'use strict';

if (Meteor.isServer) {
    Meteor.publish("userData", function () {
        return Meteor.users.find({}, {fields: {'_id': 1, 'username': 1}});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe("userData");
}