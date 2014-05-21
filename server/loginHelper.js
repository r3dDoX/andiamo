/*jslint node: true */
/*global Meteor */
'use strict';

Meteor.methods({
    checkUsername : function (username) {
        return Meteor.users.findOne({ 'username' : username });
    }
});