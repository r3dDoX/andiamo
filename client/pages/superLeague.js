/*jslint node: true, nomen: true, browser: true*/
/*global MatchesSuperLeague, TablesSuperLeague, TipsSuperLeague, Session, Template, Meteor */
'use strict';

var hasBeenShown = false,
    nextMatchesHasBeenShown = false,
    allTipsHasBeenShown = false,
    pillSessionKey = 'selectedSuperLeaguePill',
    allTipsLimitSessionKey = 'numberOfAllTips',
    allTipsTableSessionKey = 'allTipsTable',
    sessionKeyMatchday = 'selectedMatchday',
    sessionKeyMatchdayArray = 'matchdayArray',
    matchdays = 36,
    matchdayArray = [],
    previousChar = '«',
    nextChar = '»',
    paginationSize = 5,
    paginationSteps = 4;

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
        
        Meteor.call('saveRankingTipSuperLeague', tip, function (error, result) {
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
    }).map(function (element) {
        if (tip && tip.team === element.name) {
            element.selected = true;
        }
        
        return element;
    });
};

Template.rankingSelectboxSuperLeague.cannotTipRanking = function () {
    return !canTipRanking();
};

// -------------------------------- MATCHDAY --------------------------------

function calcPaginationArray(actMatchday) {
    var matchdayArray = [];
    
    if (actMatchday < 4) {
        matchdayArray = [1,2,3,4,5];
    } else if (actMatchday > matchdays - 5) {
        matchdayArray = [matchdays - 4, matchdays - 3, matchdays - 2, matchdays - 1, matchdays];
    } else {
        matchdayArray = [actMatchday - 1, actMatchday, actMatchday + 1, actMatchday + 2, actMatchday + 3];
    }
    
    matchdayArray.unshift(previousChar);
    matchdayArray.push(nextChar);
    
    return matchdayArray;
}

function isPaginationChar(char) {
    return char === nextChar || char === previousChar;
}

function paginationBack() {
    var matchdayArray = Session.get(sessionKeyMatchdayArray),
        stepsToJump = paginationSteps;
    
    if (matchdayArray[1] <= paginationSteps) {
        stepsToJump = matchdayArray[1] - 1;
    }
    
    matchdayArray = matchdayArray.map(function(element) {
        if (!isPaginationChar(element)) {
            element -= stepsToJump;
        }

        return element;
    });

    Session.set(sessionKeyMatchday, matchdayArray[matchdayArray.length - 2]);
    Session.set(sessionKeyMatchdayArray, matchdayArray);
}

function paginationForward() {
    var matchdayArray = Session.get(sessionKeyMatchdayArray),
        stepsToJump = paginationSteps,
        lastArrayElement = matchdayArray[matchdayArray.length - 2];
    
    if (lastArrayElement >= matchdays - 5) {
        stepsToJump = matchdays - lastArrayElement;
    }
    
    matchdayArray = matchdayArray.map(function(element) {
        if (!isPaginationChar(element)) {
            element += stepsToJump;
        }

        return element;
    });

    Session.set(sessionKeyMatchday, matchdayArray[1]);
    Session.set(sessionKeyMatchdayArray, matchdayArray);
}

Template.matchdaySuperLeague.created = function() {
    var nextMatch = MatchesSuperLeague.findOne({date: {$gt: new Date()}}, {fields : {matchday: 1}, sort: {date: 1}}) || {matchday: 1},
        actMatchday = nextMatch.matchday;
    
    Session.set(sessionKeyMatchday, actMatchday);
    Session.set(sessionKeyMatchdayArray, calcPaginationArray(actMatchday));
};

Template.matchdaySuperLeague.events({
    'click .pagination a': function (event) {
        event.preventDefault();
        
        switch (this) {
            case previousChar:
                paginationBack();
                break;
            case nextChar:
                paginationForward();
                break;
            default:
                Session.set(sessionKeyMatchday, this);
                break;
        }
    }
});

Template.matchdaySuperLeague.matchdays = function () {
    return Session.get(sessionKeyMatchdayArray);
};

Template.matchdaySuperLeague.isSelectedMatchday = function () {
    return Session.get(sessionKeyMatchday) === this;
};

Template.matchdayTableSuperLeague.teams = function () {
    return TablesSuperLeague.find({}, {sort: {rank: 1}}).fetch();
};

// -------------------------------- MATCHES --------------------------------

function mapDateToString(it) {
    if (it.date) {
        it.date = it.date.toLocaleString();
    } else {
        it.date = 'Not fixed yet!';
    }
    
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

function saveTip(tip, team, score, inputElement) {
    if (isNaN(score)) {
        showErrorSave(inputElement, 'Value is not number');
    } else {
        delete tip._id; //Won't update with _id set

        tip[team] = Number(score);

        Meteor.call('saveTipSuperLeague', tip, function (error, result) {
            if (error) {
                showErrorSave(inputElement, error);
            } else {
                showSuccessfulSave(inputElement);
            }
        });
    }
}

function canSaveTip(id) {
    return MatchesSuperLeague.findOne({id: id}, {fields: {date: 1}}).date > new Date();
}

function disableIfStarted(match, event) {
    if (!canSaveTip(match.id)) {
        event.preventDefault();
        event.target.disabled = 'disabled';
    }
}

Template.matchSuperLeague.events({
    'keyup input, change input': function (event) {
        var inputElement = event.target,
            tip = this.tip;
        
        saveTip(this.tip, this.team, inputElement.value, inputElement);
    },
    
    'mousedown input, touchstart input, focus input, mousedown button, touchdown button': function (event) {
        if (!canSaveTip(this.match.id)) {
            event.preventDefault();
            event.target.disabled = 'disabled';
        }
    },
    
    'mouseup button, touchup button': function (event) {
        var tip = this.tip,
            button = event.target,
            inputElement = button.parentNode.parentNode.querySelector('input'),
            score = Number(inputElement.value);

        if (button.dataset.sub) {
            if(--score < 0) score = 0;
            saveTip(this.tip, this.team, score, inputElement);
            inputElement.value = score;
        } else {
            saveTip(this.tip, this.team, ++score, inputElement);
            inputElement.value = score;
        }
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
        document.getElementById('allTipsSuperLeagueProgressBar').classList.remove('hide');
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