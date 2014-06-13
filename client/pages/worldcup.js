/*jslint node: true, nomen: true*/
/*global MatchesWorldcup, TablesWorldcup, TipsWorldcup, Session, Template, Meteor */
'use strict';

var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    sessionKeyGroup = 'selectedGroup',
    groupPrefix = 'Group ',
    groupRegex = /Group\s[A-H]/,
    roundOf16 = 'Round of 16',
    quarterFinals = 'Quarter-finals',
    semiFinals = 'Semi-finals',
    smallFinal = 'Play-off for third place',
    bigFinal = 'Final';

// -------------------------------- HELPERS --------------------------------

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

function isGroupStage() {
    var lastGroupMatch = MatchesWorldcup.findOne({group: groupRegex}, {sort: {date: -1}, fields: {date: 1}});

    if (lastGroupMatch) {
        return lastGroupMatch.date > new Date();
    }
}

function isRoundOf16() {
    var lastGroupMatch = MatchesWorldcup.findOne({group: groupRegex}, {sort: {date: -1}, fields: {date: 1}}),
        lastMatch =  MatchesWorldcup.findOne({group: roundOf16}, {sort: {date: -1}, fields: {date: 1}}),
        date = new Date();
    
    if (lastGroupMatch && lastMatch) {
        return date > lastGroupMatch.date && date <= lastMatch.date;
    }
}

function isQuarterFinals() {
    var lastRoundOf16Match = MatchesWorldcup.findOne({group: roundOf16}, {sort: {date: -1}, fields: {date: 1}}),
        lastQuarterFinalMatch = MatchesWorldcup.findOne({group: quarterFinals}, {sort: {date: -1}, fields: {date: 1}}),
        date = new Date();
    
    if (lastRoundOf16Match && lastQuarterFinalMatch) {
        return date > lastRoundOf16Match.date && date <= lastQuarterFinalMatch.date;
    }
}

function isSemiFinals() {
    var lastQuartFinalMatch = MatchesWorldcup.findOne({group: quarterFinals}, {sort: {date: -1}, fields: {date: 1}}),
        lastSemiFinalMatch = MatchesWorldcup.findOne({group: semiFinals}, {sort: {date: -1}, fields: {date: 1}}),
        date = new Date();
    
    if (lastQuartFinalMatch && lastSemiFinalMatch) {
        return date > lastQuartFinalMatch.date && date <= lastSemiFinalMatch.date;
    }
}

function isFinals() {
    var lastSemiFinalsMatch =  MatchesWorldcup.findOne({group: semiFinals}, {sort: {date: -1}, fields: {date: 1}});

    if (lastSemiFinalsMatch) {
        return lastSemiFinalsMatch.date < new Date();
    }
}

Template.worldcup.isGroupStage = isGroupStage;
Template.worldcup.isRoundOf16 = isRoundOf16;
Template.worldcup.isQuarterFinals = isQuarterFinals;
Template.worldcup.isSemiFinals = isSemiFinals;
Template.worldcup.isFinals = isFinals;

// -------------------------------- RANKING --------------------------------

Template.rankingWorldcup.events({
    'change select': function (event) {
        var selectElement = event.target,
            tip = TipsWorldcup.findOne({user: Meteor.userId(), rank: selectElement.name}) || {user: Meteor.userId(), rank: selectElement.name};
        
        tip.team = selectElement.value;
        
        delete tip._id; //Won't update with _id set
        
        Meteor.call('saveRankingTip', tip, function (error, result) {
            if (error) {
                showErrorSave(selectElement, error);
            } else {
                showSuccessfulSave(selectElement);
            }
        });
    },
    
    'mousedown select, touchstart select, focus select': function (event) {
        if (!isGroupStage()) {
            event.preventDefault();
            event.target.disabled = 'disabled';
        }
    }
});

Template.rankingSelectboxWorldcup.teams = function (rank) {
    var tables = TablesWorldcup.find({}, {fields: {teams: 1}}).fetch(),
        tip = TipsWorldcup.findOne({user: Meteor.userId(), rank: rank}),
        teams = [];
        
    tables.forEach(function (tableElement, index, array) {
        tableElement.teams.forEach(function (team, index, array) {
            var teamObject = {name: team.name};
            
            if (tip && tip.team === team.name) {
                teamObject.selected = true;
            }
            
            teams.push(teamObject);
        });
    });
    
    return teams.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
};

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
    return MatchesWorldcup.find({date: {$gte: new Date()}}, {sort: {date: 1}, limit: 10}).fetch().map(mapDateToString);
};


// -------------------------------- MATCH -------------------------------- 

Template.matchWorldcup.created = function () {
    this.data.tip = TipsWorldcup.findOne({ match: this.data.id, user: Meteor.userId() }, { fields:  { '_id': 0 }});
};

Template.matchWorldcup.events({
    'keyup input, change input': function (event) {
        var inputElement = event.target,
            tip = this;
        
        if (isNaN(inputElement.value)) {
            showErrorSave(inputElement, 'Value is not number');
        } else {
            delete tip._id; //Won't update with _id set

            tip[inputElement.name] = Number(inputElement.value);

            Meteor.call('saveTip', tip, function (error, result) {
                if (error) {
                    showErrorSave(inputElement, error);
                } else {
                    showSuccessfulSave(inputElement);
                }
            });
        }
    },
    
    'mousedown input, touchstart input, focus input': function (event) {
        if (MatchesWorldcup.findOne({id: this.match}, {fields: {date: 1}}).date <= new Date()) {
            event.preventDefault();
            event.target.disabled = 'disabled';
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
    return MatchesWorldcup.find({date: {$lt: new Date()}}, {fields: {id: 1, homeTeam: 1, awayTeam: 1, homeScore: 1, awayScore: 1}, sort: {date: -1}}).fetch();
};

Template.allTipsWorldcup.users = function () {
    return Meteor.users.find({}, {fields: {'_id': 1, username: 1}, sort: {username: 1}}).fetch();
};

Template.allTipsWorldcup.tip = function (matchId) {
    return TipsWorldcup.findOne({user: this._id, match: matchId}) || {};
};

Template.allTipsWorldcup.getCssClass = function (points) {
    var cssClass = 'label ';
    
    switch (points) {
    case 0:
        return cssClass + 'label-danger';
    case 2:
    case 3:
        return cssClass + 'label-warning';
    case 5:
        return cssClass + 'label-success';
    default:
        return cssClass + 'label-default';
    }
};