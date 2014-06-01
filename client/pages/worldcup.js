/*jslint node: true */
/*global MatchesWorldcup, TablesWorldcup, Session, Template */
'use strict';

var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    sessionKeyGroup = 'selectedGroup';

Template.groupsWorldcup.rendered = function () {
    if (!Session.get(sessionKeyGroup)) {
        Session.set(sessionKeyGroup, groups[0]);
    }
};

Template.groupsWorldcup.events({
    'click .pagination a': function () {
        Session.set(sessionKeyGroup, this);
    }
});

Template.groupsWorldcup.groups = function () {
    return groups;
};

Template.groupsWorldcup.isSelectedGroup = function () {
    return Session.get(sessionKeyGroup) === this;
};

Template.groupMatchesWorldcup.matches = function () {
    return MatchesWorldcup.find({group: 'Group ' + Session.get(sessionKeyGroup)}, {sort: {date: 1}}).fetch().map(function (it) {
        it.date = it.date.toLocaleString();
        return it;
    });
};

Template.teamWorldcup.team = function (groupName, teamName) {
    return TablesWorldcup.findOne({name: groupName}).teams.filter(function (it) {
        return it.name === teamName;
    })[0];
};