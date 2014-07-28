/*jslint node: true */
/*global Meteor, Template, Session, Router, $ */
'use strict';

Template.navbar.menuElements = function () {
    return [
        {
            text: 'My Tips',
            pageId: 'superLeague'
        },
        {
            text: 'Import',
            pageId: 'importSuperLeague'
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
    'click #logout' : function (event) {
        Meteor.logout();
    }
});