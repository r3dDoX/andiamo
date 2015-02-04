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
    
    onAfterAction: function() {
        //Run at end of current call stack to let pages render completely before css transitions
        window.setTimeout(function() {
            $('#activePage').addClass('animate from-top');
            $('#lastPage').addClass('scale-down');
        }, 0);
    },

    loadingTemplate: 'loading'
}).map(function () {
    var lastPage = '';

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
            
            $('#activePage').removeClass('animate from-top');
            $('#lastPage').removeClass('scale-down');
            
            lastPage = page;
            Session.set('selectedMenuElement', page);
        }
    });
});