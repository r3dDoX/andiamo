(function () {
    'use strict';

    Template.navbar.menuElements = function () {
        return [
            {
                text: 'My Tips',
                pageId: 'myTips',
                children: [
                    {
                        text: 'Worldcup',
                        pageId: 'worldCup'
                    },
                    {
                        text: 'Super League',
                        pageId: 'superLeague'
                    }
                ]
            }
        ];
    };

    Template.navbarElement.isSelectedMenuElement = function (actualId) {
        return Session.get('selectedMenuElement') === actualId;
    };

    Template.navbar.events({
        'click a.navbar-brand, click a.elementLink': function (event) {
            event.preventDefault();
            Router.navigate("pages/" + event.target.getAttribute('data-pageId'), {
                trigger: true
            });
        }
    });
}());
