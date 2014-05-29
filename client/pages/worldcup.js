/*jslint node: true */
/*global MatchesWorldcup, TablesWorldcup, Session, Template */
'use strict';

Template.matchWorldcup.matches = function () {
    return MatchesWorldcup.find().fetch();
};

Template.teamWorldcup.team = function (groupName, teamName) {
    return TablesWorldcup.findOne({name: groupName}).teams.filter(function (it) {
        return it.name === teamName;
    })[0];
};