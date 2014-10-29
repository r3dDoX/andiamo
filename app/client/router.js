'use strict';

function slidePages(pageToNavigate) {
    var page = document.getElementById(pageToNavigate),
        fadeOut = (/\bright\b/.exec(page.className) ? 'left' : 'right'),
        activePage = document.getElementsByClassName('page center')[0];

    if (page !== activePage) {
        Session.set('selectedMenuElement', pageToNavigate);

        activePage.classList.remove('center');
        activePage.classList.add(fadeOut);
        page.classList.remove('left');
        page.classList.remove('right');
        page.classList.add('center');
    }
}

Router.configure({
    waitOn: {
        ready: function isUserLoggedIn() {
            return !Meteor.loggingIn() && Meteor.user();
        }
    }
}).map(function () {
    this.route('home', {
        path: '/',
        action: function () {
            this.redirect('/pages/home');
        }
    });

    this.route('pages', {
        path: '/pages/:page',
        action: function () {
            if (this.ready()) {
                // add timeout here to let browser remove logging in screen when loading deep link
                setTimeout(slidePages.bind(undefined, this.params.page), 5);
            }
        }
    });
});