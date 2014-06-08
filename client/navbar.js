/*jslint node: true */
/*global Meteor, Template, Session, Router */
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
        event.preventDefault();
        Router.navigate("pages/" + event.target.getAttribute('data-pageId'), {
            trigger: true
        });
    },
    'click #logout' : function (event) {
        Meteor.logout();
    }
});