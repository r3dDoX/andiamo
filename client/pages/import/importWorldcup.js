/*jslint node: true */
/*global Meteor, Template, MatchesWorldcup, TablesWorldcup */
'use strict';

Meteor.subscribe('matchesWorldcup');
Meteor.subscribe('tablesWorldcup');

Template.importWorldcup.matches = function () {
    var matches = MatchesWorldcup.find().fetch();
    
    matches.map(function (element) {
        element.date = element.date.toDateString();
    });
    
    return matches;
};

Template.importWorldcup.tables = function () {
    return TablesWorldcup.find().fetch();
};