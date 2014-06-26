/*jslint node: true */
/*global Meteor, Session, Template, MatchesWorldcup, TablesWorldcup */
'use strict';

var hasBeenShown = false;

Template.importWorldcup.isShown = function () {
    if (!hasBeenShown && Session.get('selectedMenuElement') === 'importWorldcup') {
        hasBeenShown = true;
    }
    
    return hasBeenShown;
};

Template.importWorldcup.matches = function () {
    var matches = MatchesWorldcup.find({isFinished: true}, {sort: {date: -1}}).fetch();
    
    matches.map(function (element) {
        element.date = element.date.toDateString();
    });
    
    return matches;
};