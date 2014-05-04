/*global Backbone, Session, Meteor */
'use strict';

var AndiamoRouter = Backbone.Router.extend({

    routes: {
        "pages/:page": "pageTransition"
    },

    pageTransition: function (pageId) {
        var page = document.getElementById(pageId),
            fadeOut = (/\bright\b/.exec(page.className) ? 'left' : 'right'),
            activePage = document.getElementsByClassName('page center')[0];

        if (page !== activePage) {
            Session.set('selectedMenuElement', pageId);

            activePage.classList.remove('center');
            activePage.classList.add(fadeOut);
            page.classList.remove('left');
            page.classList.remove('right');
            page.classList.add('center');
        }
    }

});

window.Router = new AndiamoRouter();

Meteor.startup(function () {
    Backbone.history.start({
        pushState: true
    });
});