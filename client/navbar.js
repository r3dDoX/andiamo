/*jslint node: true */
/*global Meteor, Template, Session, Router, $ */
'use strict';

Template.navbar.menuElements = function () {
    return [
        {
            text: 'My Tips',
            pageId: 'worldcup'
        },
        {
            text: 'Import',
            pageId: 'importWorldcup'
        }
    ];
};

Template.navbarElement.isSelectedMenuElement = function (actualId) {
    return Session.get('selectedMenuElement') === actualId;
};

Template.navbar.events({
    'click a.navbar-brand, click a.elementLink' : function (event) {
        var linkElement = $(event.target),
            collapseElement = linkElement.parents('.navbar-collapse');
        
        event.preventDefault();
        
        if (collapseElement.hasClass('in')) {
            collapseElement.removeClass('in');
        }
        
        Router.navigate("pages/" + linkElement.attr('data-pageId'), {
            trigger: true
        });
    },
    'click #logout' : function (event) {
        Meteor.logout();
    }
});