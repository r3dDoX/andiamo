'use strict';

if (Meteor.isServer) {
    Meteor.publish('userData', function () {
        return Meteor.users.find({}, {fields: {'_id': 1, 'username': 1}});
    });
    
    Meteor.methods({
        removeUser: function (userId) {
            var user;
            if(Roles.userIsInRole(this.userId, ['admin'])) {
                check(userId, String);
                user = Meteor.users.findOne({_id: userId});
                
                Meteor.users.remove(userId);
                StandingsSuperLeague.remove({ username: user.username });
            }
        }
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('userData');
}