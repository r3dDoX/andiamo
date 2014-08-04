'use strict';

Meteor.subscribe('matchesSuperLeague');
Meteor.subscribe('tablesSuperLeague');

Template.importSuperLeague.matches = function () {
    var matches = MatchesSuperLeague.find({}, {sort: {matchday: 1, date: 1}}).fetch();
    
    matches.map(function (element) {
        if (element.date) {
            element.date = element.date.toDateString();
        }
        
        return element;
    });
    
    return matches;
};

Template.importSuperLeague.teams = function () {
    return TablesSuperLeague.find({}, {sort: {rank: 1}}).fetch();
};