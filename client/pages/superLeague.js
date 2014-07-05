/*jslint node: true, nomen: true*/
/*global MatchesSuperLeague, TablesSuperLeague, TipsSuperLeague, Session, Template, Meteor */
'use strict';

var hasBeenShown = false,
    nextMatchesHasBeenShown = false,
    allTipsHasBeenShown = false,
    pillSessionKey = 'selectedSuperLeaguePill',
    allTipsLimitSessionKey = 'numberOfAllTips',
    allTipsTableSessionKey = 'allTipsTable',
    sessionKeyMatchday = 'selectedMatchday',
    matchdays = ['«',1,2,3,4,5,'»'];

// -------------------------------- SHOW -----------------------------------

Template.superLeague.events({
    'click .nav-pills a': function (event) {
        var pillId = event.target.id;
        Session.set(pillSessionKey, pillId);
    }
});

Template.superLeague.isShown = function () {
    if (!hasBeenShown && Session.get('selectedMenuElement') === 'superLeague') {
        hasBeenShown = true;
    }
    
    return hasBeenShown;
};

Template.nextMatchesSuperLeague.isShown = function () {
    if (!nextMatchesHasBeenShown && Session.get(pillSessionKey) === 'pillNextMatches') {
        nextMatchesHasBeenShown = true;
    }
    
    return nextMatchesHasBeenShown;
};

Template.allTipsSuperLeague.isShown = function () {
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

function canTipRanking() {
    return new Date('2014-08-01') >= new Date();
}

Template.superLeague.canTipRanking = canTipRanking;

// -------------------------------- RANKING --------------------------------

Template.rankingSuperLeague.events({
    'change select': function (event) {
        var selectElement = event.target,
            tip = TipsSuperLeague.findOne({rank: selectElement.name}) || {rank: selectElement.name};
        
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

Template.rankingSelectboxSuperLeague.teams = function (rank) {
    var tables = TablesSuperLeague.find({}, {fields: {name: 1}}).fetch(),
        tip = TipsSuperLeague.findOne({rank: rank});
    
    return tables.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
};

Template.rankingSelectboxSuperLeague.cannotTipRanking = function () {
    return !canTipRanking();
};

// -------------------------------- GROUP STAGE --------------------------------

Template.matchdaySuperLeague.events({
    'click .pagination a': function () {
        Session.set(sessionKeyMatchday, this);
    }
});

Template.matchdaySuperLeague.matchdays = function () {
    return matchdays;
};

Template.matchdaySuperLeague.isSelectedMatchday = function () {
    if (!Session.get(sessionKeyMatchday)) {
        Session.set(sessionKeyMatchday, matchdays[0]);
    }
    return Session.get(sessionKeyMatchday) === this;
};

// -------------------------------- MATCHES --------------------------------

function mapDateToString(it) {
    it.date = it.date.toLocaleString();
    return it;
}

function matchesForMatchday(matchday) {
    return MatchesSuperLeague.find({matchday: matchday}, {sort: {date: 1}}).fetch().map(mapDateToString);
}

Template.matchdaySuperLeague.matches = function () {
    return matchesForMatchday(Session.get(sessionKeyMatchday));
};

Template.nextMatchesSuperLeague.matches = function () {
    return MatchesSuperLeague.find({date: {$gte: new Date()}}, {sort: {date: 1}, limit: 10}).fetch().map(mapDateToString);
};


// -------------------------------- MATCH -------------------------------- 

Template.matchSuperLeague.events({
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
        if (MatchesSuperLeague.findOne({id: this.match}, {fields: {date: 1}}).date <= new Date()) {
            event.preventDefault();
            event.target.disabled = 'disabled';
        }
    },
    
    'click input': function (event) {
        event.target.select();
    }
});

Template.matchSuperLeague.tip = function () {
    return TipsSuperLeague.findOne({ match: this.id }) || { match: this.id };
};

Template.matchSuperLeague.getCssClass = function (points) {
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

// -------------------------------- ALL TIPS --------------------------------

Template.allTipsSuperLeague.created = function () {
    Session.set(allTipsLimitSessionKey, 10);
};

Template.allTipsSuperLeague.events({
    'click button': function (event) {
        Session.set(allTipsLimitSessionKey, 64);
        event.target.disabled = 'disabled';
        document.getElementById('allTipsWorldcupProgressBar').classList.remove('hide');
    }
});

Template.allTipsSuperLeague.allTipsTable = function () {
    var limit = Session.get(allTipsLimitSessionKey);
    
    Meteor.call('getAllTipsTable', limit, function(error, result) {
        Session.set(allTipsTableSessionKey, result);
        document.getElementById('allTipsSuperLeagueProgressBar').classList.add('hide');
    });

    return Session.get(allTipsTableSessionKey);
};

Template.allTipsSuperLeague.getCssClass = function (points) {
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