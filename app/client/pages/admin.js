'use strict';

Template.admin.helpers({
    users: function () {
        return Meteor.users.find().fetch();
    }
});

Template.admin.events({
    'click #userTable button.btn-danger, click #userTable button.btn-warning': function (event) {
        var button = $(event.target);

        if (button.hasClass('btn-warning')) {
            Meteor.call('removeUser', button.data('userid'));
        } else {
            button.removeClass('btn-danger');
            button.addClass('btn-warning');
            button.html('Are you sure?');
        }
    }
});