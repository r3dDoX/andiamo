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
    bigFinal = 'Final';

// -------------------------------- GROUP STAGE --------------------------------

Template.groupsWorldcup.events({
    'click .pagination a': function () {
        Session.set(sessionKeyGroup, this);
    }
});

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

// -------------------------------- MATCHES --------------------------------

function mapDateToString(it) {
    it.date = it.date.toLocaleString();
    return it;
}

function matchesForGroup(groupName) {
    return MatchesWorldcup.find({group: groupName}, {sort: {date: 1}}).fetch().map(mapDateToString);
}

Template.groupsWorldcup.matches = function () {
    return matchesForGroup(groupPrefix + Session.get(sessionKeyGroup));
};

Template.roundOf16Worldcup.matches = matchesForGroup.bind(undefined, roundOf16);
Template.quarterFinalsWorldcup.matches = matchesForGroup.bind(undefined, quarterFinals);
Template.semiFinalsWorldcup.matches = matchesForGroup.bind(undefined, semiFinals);

Template.finalsWorldcup.matches = function () {
    return MatchesWorldcup.find({$or: [{group: smallFinal}, {group: bigFinal}]}, {sort: {date: 1}}).fetch().map(mapDateToString);
};

Template.nextMatchesWorldcup.matches = function () {
    return MatchesWorldcup.find({date: {$gte: new Date()}}, {sort: {date: 1}, limit: 8}).fetch().map(mapDateToString);
};


// -------------------------------- MATCH -------------------------------- 

function toggleFadeEffect(element, className) {
    var classList = element.parentNode.classList,
        removeSuccessStyle = function (event) {
            classList.remove('has-success');
            element.removeEventListener(removeSuccessStyle);
        };
    
    classList.add('has-success');
    element.addEventListener('transitionend', removeSuccessStyle);
}

function showSuccessfulSave(element) {
    toggleFadeEffect(element, 'has-success');
}

function showErrorSave(element, error) {
    toggleFadeEffect(element, 'has-error');
}

Template.matchWorldcup.created = function () {
    this.data.tip = TipsWorldcup.findOne({ match: this.data.id, user: Meteor.userId() }, { fields:  { '_id': 0 }});
};

Template.matchWorldcup.events({
    'keyup input, change input': function (event) {
        var inputElement = event.target,
            tip = this;
        
        if (isNaN(Number(inputElement.value))) {
            showErrorSave(inputElement, 'Value is not number');
        } else {
            /*jslint nomen: true*/
            delete tip._id; //Won't update with _id set
            /*jslint nomen: false*/

            tip[inputElement.name] = Number(inputElement.value);

            Meteor.call('saveTip', tip, function (error, result) {
                if (error) {
                    showErrorSave(inputElement, error);
                } else {
                    showSuccessfulSave(inputElement);
                }
            });
        }
    }
});

Template.matchWorldcup.tip = function () {
    return TipsWorldcup.findOne({ match: this.id, user: Meteor.userId() }) || { match: this.id, user: Meteor.userId() };
};

// -------------------------------- IMAGE --------------------------------

Template.imageTeamWorldcup.team = function (teamName) {
    var table = TablesWorldcup.findOne({teams: {$elemMatch: {name: teamName}}});
    
    if (!table) {
        return {};
    }
    
    return table.teams.filter(function (it) { return it.name === teamName; })[0];
};

// -------------------------------- ALL TIPS --------------------------------

Template.allTipsWorldcup.matches = function () {
    return MatchesWorldcup.find({date: {$lt: new Date()}}, {fields: {id: 1, homeTeam: 1, awayTeam: 1}, sort: {date: 1}, limit: 20}).fetch();
};

Template.allTipsWorldcup.users = function () {
    return Meteor.users.find({}, {fields: {'_id': 1, username: 1}}).fetch();
};

Template.allTipsWorldcup.tip = function (matchId) {
    return TipsWorldcup.findOne({user: this._id, match: matchId}) || {};
};