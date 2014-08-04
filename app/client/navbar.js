'use strict';

Template.navbar.menuElements = function () {
    return [
        {
            text: 'My Tips',
            pageId: 'superLeague',
            roles: []
        },
        {
            text: 'Import',
            pageId: 'importSuperLeague',
            roles: []
        },
        {
            text: 'Admin',
            pageId: 'admin',
            roles: ['admin']
        }
    ];
};

Template.navbarElement.isSelectedMenuElement = function (actualId) {
    return Session.get('selectedMenuElement') === actualId;
};

Template.navbar.events({
    'click a.navbar-brand, click a.elementLink' : function (event) {
        var collapseElement = $(event.target).parents('.navbar-collapse');
                
        if (collapseElement.hasClass('in')) {
            collapseElement.removeClass('in');
        }
    },
    'click #logout' : function () {
        Meteor.logout();
    }
});

Template.navbarElement.maySeeElement = function (roles) {
    roles = [].concat(roles); // ensure array
    
    if(roles.length === 0) { return true; }

    return Roles.userIsInRole(Meteor.user(), roles);
};