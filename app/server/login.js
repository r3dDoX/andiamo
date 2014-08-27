'use strict';

Meteor.methods({
    checkUsername : function (username) {
        check(username, String);
        return Meteor.users.findOne({ 'username' : username });
    },
    
    addUserRoles : function () {
        if (Meteor.users.find().fetch().length === 1) {
            Roles.addUsersToRoles(Meteor.users.findOne()._id, ['admin']);
        }
    }
});