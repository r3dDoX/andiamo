/*jslint node: true */
/*global MatchesWorldcup, TablesWorldcup, Session, Template */
'use strict';

var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    sessionKeyGroup = 'selectedGroup',
    groupPrefix = 'Group ',
    roundOf16 = 'Round of 16',
    quarterFinals = 'Quarter-finals',
    semiFinals = 'Semi-finals',
    smallFinal = 'Play-off for third place',
    bigFinal = 'Final',
    mapDateToString = function (it) {
        it.date = it.date.toLocaleString();
        return it;
    },
    matchesForGroup = function (groupName) {
        return MatchesWorldcup.find({group: groupName}, {sort: {date: 1}}).fetch().map(mapDateToString);
    };

Template.groupsWorldcup.events({
    'click .pagination a': function () {
        Session.set(sessionKeyGroup, this);
    }
});

Template.groupsWorldcup.matches = function () {
    return matchesForGroup(groupPrefix + Session.get(sessionKeyGroup));
};

Template.groupsWorldcup.groups = function () {
    return groups;
};

Template.groupsWorldcup.isSelectedGroup = function () {
    var sessionGroup = Session.get(sessionKeyGroup) || groups[0];
    return sessionGroup === this;
};

Template.groupTableWorldcup.table = function () {
    return TablesWorldcup.findOne({name: groupPrefix + Session.get(sessionKeyGroup)});
};

Template.roundOf16Worldcup.matches = matchesForGroup.bind(undefined, roundOf16);
Template.quarterFinalsWorldcup.matches = matchesForGroup.bind(undefined, quarterFinals);
Template.semiFinalsWorldcup.matches = matchesForGroup.bind(undefined, semiFinals);

Template.finalsWorldcup.matches = function () {
    return MatchesWorldcup.find({$or: [{group: smallFinal}, {group: bigFinal}]}, {sort: {date: 1}}).fetch().map(mapDateToString);
};

Template.teamWorldcup.team = function (teamName) {
    var table = TablesWorldcup.findOne({teams: {$elemMatch: {name: teamName}}});
    
    if (!table) {
        return {};
    }
    
    return table.teams.filter(function (it) { return it.name === teamName; })[0];
};