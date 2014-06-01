/*jslint node: true */
/*global MatchesWorldcup, TablesWorldcup, TipsWorldcup, Session, Template, Meteor */
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
    if (!Session.get(sessionKeyGroup)) {
        Session.set(sessionKeyGroup, groups[0]);
    }
    return Session.get(sessionKeyGroup) === this;
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

Template.nextMatchesWorldcup.matches = function () {
    var now = new Date();
    return MatchesWorldcup.find({date: {$gte: now}}, {sort: {date: 1}, limit: 8}).fetch().map(mapDateToString);
};

Template.matchWorldcup.created = function () {
    this.data.tip = TipsWorldcup.findOne({ match: this.data.id, user: Meteor.userId() }, { fields:  { '_id': 0 }});
};

Template.matchWorldcup.events({
    'keyup input, change input': function (event) {
        var inputElement = event.target,
            tip = this.match.tip || { match: this.match.id, user: Meteor.userId() };
        
        tip[this.side] = inputElement.value;

        Meteor.call('saveTip', tip, function (error, result) { if (error) { console.log(error); } });
    }
});

Template.teamWorldcup.team = function () {
    var teamName = this.match[this.side],
        table = TablesWorldcup.findOne({teams: {$elemMatch: {name: teamName}}});
    
    if (!table) {
        return {};
    }
    
    return table.teams.filter(function (it) { return it.name === teamName; })[0];
};

Template.teamWorldcup.teamName = function () {
    return this.match[this.side];
};

Template.teamWorldcup.tip = function () {
    if (this.match.tip) {
        return this.match.tip[this.side];
    }
};