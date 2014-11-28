'use strict';

Router.configure({
    waitOn: function () {
        return Meteor.subscribe('userData');
    },
    
    onBeforeAction: function() {
        if (!Meteor.userId()) {
            this.render('login');
        } else {
            this.next();
        }
    },
    
    onStop: function() {
        console.log(arguments);
        console.log(this);
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
            
            Session.set('selectedMenuElement', page);
            this.layout('ContentLayout');
            this.render(page);
        }
    });
});