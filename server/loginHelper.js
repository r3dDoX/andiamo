/*jslint node: true */
/*global Meteor */
'use strict';

Meteor.methods({
    checkUsername : function (username) {
        Meteor.users.findOne({ 'username' : username });
    }
});