'use strict';

var lastPage = '';

Router.configure({
    waitOn: function () {
        return Meteor.subscribe('userData');
    },
    
    onBeforeAction: function() {
        if (!Meteor.userId()) {
            this.render('login');
        } else {
            $('#activePage').removeClass('flip-in-left');
            $('#lastPage').removeClass('flip-out-right');
            this.next();
        }
    },
    
    onAfterAction: function() {
        window.setTimeout(function() {
            $('#activePage').addClass('flip-in-left');
            $('#lastPage').addClass('flip-out-right');
        }, 1);
    },

    loadingTemplate: 'loading'
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
            var page = this.params.page;
            
            this.layout('PagesLayout');
            
            this.render(lastPage, { to: 'lastPage' });
            this.render(page);
            
            lastPage = page;
            Session.set('selectedMenuElement', page);
        }
    });
});