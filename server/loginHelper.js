/*jslint node: true */
/*global Meteor, check */
'use strict';

Meteor.methods({
    checkUsername : function (username) {
        check(username, String);
        return Meteor.users.findOne({ 'username' : username });
    }
});