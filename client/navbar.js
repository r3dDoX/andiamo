Template.navbar.menuElements = function () {
    return [
        { text: 'My Tips', pageId: 'myTips' }
    ];
};

Template.navbar.isSelectedMenuElement = function(actualId) {
    return Session.get('selectedMenuElement') === actualId;
};

Template.navbar.events({
    'click a': function (event) {
        event.preventDefault();
        Router.navigate("pages/" + event.target.getAttribute('data-pageId'), {trigger: true});
    }
});