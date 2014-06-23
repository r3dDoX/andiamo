/*jslint node: true */
/*global Meteor, Template, MatchesSuperLeague, TablesSuperLeague */
'use strict';

Meteor.subscribe('matchesSuperLeague');
Meteor.subscribe('tablesSuperLeague');

Template.importSuperLeague.matches = function () {
    var matches = MatchesSuperLeague.find().fetch();
    
    matches.map(function (element) {
        element.date = element.date.toDateString();
    });
    
    return matches;
};

Template.importSuperLeague.teams = function () {
    return TablesSuperLeague.find().fetch();
};