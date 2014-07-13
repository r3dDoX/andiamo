/*jslint node: true */
/*global Meteor, Template, MatchesSuperLeague, TablesSuperLeague */
'use strict';

Meteor.subscribe('matchesSuperLeague');
Meteor.subscribe('tablesSuperLeague');

Template.importSuperLeague.matches = function () {
    var matches = MatchesSuperLeague.find().fetch();
    
    matches.map(function (element) {
        if (element.date) {
            element.date = element.date.toDateString();
        }
        
        return element;
    });
    
    return matches;
};

Template.importSuperLeague.teams = function () {
    return TablesSuperLeague.find().fetch();
};