var AndiamoRouter = Backbone.Router.extend({

    routes: {
        "pages/:page":   "pageTransition"
    },

    pageTransition: function(pageId) {
        var page = $('#' + pageId),
            fadeOut = (page.hasClass('right') ? 'left' : 'right'),
            activePage = $('.page.center');

        if (page.get(0) !== activePage.get(0)) {
            Session.set('selectedMenuElement', pageId);

            activePage.removeClass('center').addClass(fadeOut);
            page.removeClass('left right').addClass('center');
        }
    }

});

Router = new AndiamoRouter();

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});