/*jslint node: true, nomen: true*/
/*global MatchesWorldcup, TablesWorldcup, FlagsWorldcup, TipsWorldcup, Session, Template, Meteor */
'use strict';

var hasBeenShown = false,
    nextMatchesHasBeenShown = false,
    allTipsHasBeenShown = false,
    pillSessionKey = 'selectedWorldcupPill',
    allTipsLimitSessionKey = 'numberOfAllTips',
    allTipsTableSessionKey = 'allTipsTable',
    groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    sessionKeyGroup = 'selectedGroup',
    groupPrefix = 'Group ',
    groupRegex = /Group\s[A-H]/,
    roundOf16 = 'Round of 16',
    quarterFinals = 'Quarter-finals',
    semiFinals = 'Semi-finals',
    smallFinal = 'Play-off for third place',
    bigFinal = 'Final';

// -------------------------------- SHOW -----------------------------------

Template.worldcup.events({
    'click .nav-pills a': function (event) {
        var pillId = event.target.id;
        Session.set(pillSessionKey, pillId);
    }
});

Template.worldcup.isShown = function () {
    if (!hasBeenShown && Session.get('selectedMenuElement') === 'worldcup') {
        hasBeenShown = true;
    }
    
    return hasBeenShown;
};

Template.nextMatchesWorldcup.isShown = function () {
    if (!nextMatchesHasBeenShown && Session.get(pillSessionKey) === 'pillNextMatches') {
        nextMatchesHasBeenShown = true;
    }
    
    return nextMatchesHasBeenShown;
};

Template.allTipsWorldcup.isShown = function () {
    if (!allTipsHasBeenShown && Session.get(pillSessionKey) === 'pillAllTips') {
        allTipsHasBeenShown = true;
    }
    
    return allTipsHasBeenShown;
};

// -------------------------------- HELPERS --------------------------------

function toggleFadeEffect(element, className) {
    var classList = element.parentNode.classList,
        removeSuccessStyle = function (event) {
            classList.remove(className);
            element.removeEventListener(removeSuccessStyle);
        };
    
    classList.add(className);
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

function canTipRanking() {
    var firstRoundOf16Match = MatchesWorldcup.findOne({group: roundOf16}, {sort: {date: 1}, fields: {date: 1}});
    
    if (firstRoundOf16Match) {
        return firstRoundOf16Match.date > new Date();
    }
}

Template.worldcup.isGroupStage = isGroupStage;
Template.worldcup.isRoundOf16 = isRoundOf16;
Template.worldcup.isQuarterFinals = isQuarterFinals;
Template.worldcup.isSemiFinals = isSemiFinals;
Template.worldcup.isFinals = isFinals;
Template.worldcup.canTipRanking = canTipRanking;

// -------------------------------- RANKING --------------------------------

Template.rankingWorldcup.events({
    'change select': function (event) {
        var selectElement = event.target,
            tip = TipsWorldcup.findOne({user: Meteor.userId(), rank: selectElement.name}) || {rank: selectElement.name};
        
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
        if (!canTipRanking()) {
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

Template.rankingSelectboxWorldcup.cannotTipRanking = function () {
    return !canTipRanking();
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
    },
    
    'click input': function (event) {
        event.target.select();
    }
});

Template.matchWorldcup.tip = function () {
    return TipsWorldcup.findOne({ match: this.id, user: Meteor.userId() }) || { match: this.id };
};

Template.matchWorldcup.getCssClass = function (points) {
    switch (this.points) {
    case 0:
        return 'bg-danger';
    case 2:
    case 3:
        return 'bg-warning';
    case 5:
        return 'bg-success';
    }
};

// -------------------------------- IMAGE --------------------------------

Template.imageTeamWorldcup.teamFlag = function (teamName) {
    return FlagsWorldcup.findOne({ team: teamName }, { fields: { imgSrc: 1 }}) || {};
};

// -------------------------------- ALL TIPS --------------------------------

Template.allTipsWorldcup.created = function () {
    Session.set(allTipsLimitSessionKey, 10);
};

Template.allTipsWorldcup.events({
    'click button': function (event) {
        Session.set(allTipsLimitSessionKey, 64);
    }
});

Template.allTipsWorldcup.allTipsTable = function () {
    var limit = Session.get(allTipsLimitSessionKey);
    
    Meteor.call('getAllTipsTable', limit, function(error, result) {
        Session.set(allTipsTableSessionKey, result);
    });

    return Session.get(allTipsTableSessionKey);
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