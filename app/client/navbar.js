'use strict';

var selectedMenuElementKey = 'selectedMenuElement',
    hasBeenShown = [];

Template.navbar.helpers({
    menuElements: function () {
        return [
            {
                text: 'My Tips',
                pageId: 'superLeague',
                roles: []
            },
            {
                text: 'Profile',
                pageId: 'profile',
                roles: []
            },
            {
                text: 'Import',
                pageId: 'importSuperLeague',
                roles: ['admin']
            },
            {
                text: 'Admin',
                pageId: 'admin',
                roles: ['admin']
            }
        ];
    },
    
    isDisconnected: function () {
        return !Meteor.status().connected;
    }
});

Template.navbar.events({
    'click a.navbar-brand, click a.elementLink': function (event) {
        var collapseElement = $(event.target).parents('.navbar-collapse');

        if (collapseElement.hasClass('in')) {
            collapseElement.removeClass('in');
        }
    },
    'click #logout': function () {
        Meteor.logout();
    }
});

Template.navbarElement.helpers({
    isSelectedMenuElement: function (actualId) {
        return Session.get(selectedMenuElementKey) === actualId;
    },

    maySeeElement: function (roles) {
        roles = [].concat(roles); // ensure array

        if (roles.length === 0) {
            return true;
        }

        return Roles.userIsInRole(Meteor.user(), roles);
    }
});

UI.registerHelper('shouldBeDisplayed', function (templateName) {
    if (hasBeenShown.indexOf(templateName) < 0 && Session.get(selectedMenuElementKey) === templateName) {
        hasBeenShown.push(templateName);
    }

    return hasBeenShown.indexOf(templateName) >= 0;
});