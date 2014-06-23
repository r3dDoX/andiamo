/*jslint node: true */
/*global Meteor, Template, MatchesWorldcup, TablesWorldcup */
'use strict';

Template.importWorldcup.matches = function () {
    var matches = MatchesWorldcup.find({isFinished: true}, {sort: {date: -1}}).fetch();
    
    matches.map(function (element) {
        element.date = element.date.toDateString();
    });
    
    return matches;
};