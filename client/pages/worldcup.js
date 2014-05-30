/*jslint node: true */
/*global MatchesWorldcup, TablesWorldcup, Session, Template */
'use strict';

Template.matchWorldcup.matches = function (groupName) {
    return MatchesWorldcup.find({group: groupName}, {sort: {date: 1}}).fetch().map(function (it) {
        it.date = it.date.toLocaleString();
        return it;
    });
};

Template.teamWorldcup.team = function (groupName, teamName) {
    return TablesWorldcup.findOne({name: groupName}).teams.filter(function (it) {
        return it.name === teamName;
    })[0];
};