'use strict';

var nextMatchesHasBeenShown = false,
    allTipsHasBeenShown = false,
    pillSessionKey = 'selectedSuperLeaguePill',
    allTipsLimitSessionKey = 'numberOfAllTips',
    allTipsTableSessionKey = 'allTipsTable',
    sessionKeyMatchday = 'selectedMatchday',
    sessionKeyMatchdayArray = 'matchdayArray',
    matchdays = 36,
    previousChar = '«',
    nextChar = '»',
    paginationSteps = 3,
    paginationSize = paginationSteps + 1,
    updateScoreTimeout = {};

// -------------------------------- HELPERS --------------------------------
function showSuccessfulSave(element) {
    var element = $(element),
        parent = element.parent(),
        childButtons = $('button', parent),
        removeSuccessStyle = function () {
            parent.removeClass('has-success');
            childButtons.removeClass('btn-success');
            element.off(removeSuccessStyle);
        };
    
    parent.removeClass('has-error');
    childButtons.removeClass('btn-danger');
    
    parent.addClass('has-success');
    childButtons.addClass('btn-success');
    element.on('transitionend', removeSuccessStyle);
    
}

function showErrorSave(element) {
    var parent = $(element).parent(),
        childButtons = $('button', parent);
    
    parent.addClass('has-error');
    childButtons.addClass('btn-danger');
}

function canTipRanking() {
    return new Date('2014-08-01') >= new Date();
}

Template.superLeague.helpers({
    canTipRanking: canTipRanking
});

Template.superLeague.events({
    'click .nav-pills a': function (event) {
        var pillId = event.target.id;
        Session.set(pillSessionKey, pillId);
    }
});

// -------------------------------- RANKING --------------------------------

Template.rankingSuperLeague.events({
    'change select': function (event) {
        var selectElement = event.target,
            tip = TipsSuperLeague.findOne({
                rank: selectElement.name
            }) || {
                rank: selectElement.name
            };

        tip.team = selectElement.value;

        delete tip._id; //Won't update with _id set

        Meteor.call('saveRankingTipSuperLeague', tip, function (error) {
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

Template.rankingSelectboxSuperLeague.helpers({
    teams: function (rank) {
        var tables = TablesSuperLeague.find({}, {
                fields: {
                    name: 1
                }
            }).fetch(),
            tip = TipsSuperLeague.findOne({
                rank: rank
            });

        return tables.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        }).map(function (element) {
            if (tip && tip.team === element.name) {
                element.selected = true;
            }

            return element;
        });
    },

    cannotTipRanking: function () {
        return !canTipRanking();
    }
});

// -------------------------------- MATCHDAY --------------------------------

function calcPaginationArray(actMatchday) {
    var matchdayArray = Array.apply(null, {
            length: paginationSize
        }),
        i = actMatchday - 1;

    if (i < 1) {
        i = 1;
    } else if (i > matchdays - paginationSteps) {
        i = matchdays - paginationSteps;
    }

    matchdayArray = matchdayArray.map(function () {
        return i++;
    });

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

    matchdayArray = matchdayArray.map(function (element) {
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

    matchdayArray = matchdayArray.map(function (element) {
        if (!isPaginationChar(element)) {
            element += stepsToJump;
        }

        return element;
    });

    Session.set(sessionKeyMatchday, matchdayArray[1]);
    Session.set(sessionKeyMatchdayArray, matchdayArray);
}

function initMatchdayArray() {
    var nextMatch = MatchesSuperLeague.findOne({
            date: {
                $gt: new Date()
            }
        }, {
            fields: {
                matchday: 1
            },
            sort: {
                date: 1
            }
        }) || {
            matchday: 1
        },
        actMatchday = nextMatch.matchday;

    Session.set(sessionKeyMatchday, actMatchday);
    Session.set(sessionKeyMatchdayArray, calcPaginationArray(actMatchday));
}

Template.matchdaySuperLeague.events({
    'click .pagination a': function (event) {
        event.preventDefault();

        switch (this.toString()) {
        case previousChar:
            paginationBack();
            break;
        case nextChar:
            paginationForward();
            break;
        default:
            Session.set(sessionKeyMatchday, Number(this.toString()));
            break;
        }
    }
});

Template.matchdaySuperLeague.helpers({
    matchdays: function () {
        if (!Session.get(sessionKeyMatchday)) {
            initMatchdayArray();
        }

        return Session.get(sessionKeyMatchdayArray);
    },

    isSelectedMatchday: function () {
        return Session.get(sessionKeyMatchday) === this;
    }
});

Template.matchdayTableSuperLeague.helpers({
    teams: function () {
        return TablesSuperLeague.find({}, {
            sort: {
                rank: 1
            }
        }).fetch();
    }
});

// -------------------------------- MATCHES --------------------------------

function mapDateToString(it) {
    if (it.date) {
        it.dateString = it.date.toDateString() + ' ' + it.date.getHours() + ':' + (it.date.getMinutes() < 10 ? '0' : '') + it.date.getMinutes();
    } else {
        it.dateString = 'Not fixed yet!';
    }

    return it;
}

function matchesForMatchday(matchday) {
    return MatchesSuperLeague.find({
        matchday: matchday
    }, {
        sort: {
            date: 1
        }
    }).fetch().map(mapDateToString);
}

Template.matchdaySuperLeague.helpers({
    matches: function () {
        return matchesForMatchday(Session.get(sessionKeyMatchday));
    }
});

Template.nextMatchesSuperLeague.helpers({
    isShown: function () {
        if (!nextMatchesHasBeenShown && Session.get(pillSessionKey) === 'pillNextMatches') {
            nextMatchesHasBeenShown = true;
        }

        return nextMatchesHasBeenShown;
    },

    matches: function () {
        return MatchesSuperLeague.find({
            date: {
                $gte: new Date()
            }
        }, {
            sort: {
                date: 1
            },
            limit: 10
        }).fetch().map(mapDateToString);
    }
});


// -------------------------------- MATCH --------------------------------

function saveTip(tip, team, score, inputElement) {
    if (isNaN(score) || score < 0) {
        showErrorSave(inputElement, 'Value is not a number');
    } else {
        delete tip._id; //Won't update with _id set

        tip[team] = Number(score);

        Meteor.call('saveTipSuperLeague', tip, function (error) {
            if (error) {
                showErrorSave(inputElement, error);
            } else {
                showSuccessfulSave(inputElement);
            }
        });
    }
}

function canSaveTip(match) {
    return match.date > new Date();
}

function updateScore(saveFunction, inputId) {
    var activeTimeout = updateScoreTimeout[inputId];

    if (activeTimeout) {
        window.clearTimeout(activeTimeout);
    }

    updateScoreTimeout[inputId] = window.setTimeout(function () {
        saveFunction();
        delete updateScoreTimeout[inputId];
    }, 500);
}

Template.matchSuperLeague.events({
    'keyup input, change input': function (event) {
        var inputElement = event.target;

        saveTip(this.tip, this.team, inputElement.value, inputElement);
    },

    'mousedown input, touchstart input, focus input, mousedown button, touchdown button, focus button': function (event) {
        if (!canSaveTip(this.match)) {
            event.preventDefault();
            event.target.disabled = 'disabled';
        }
    },

    'click button': function (event) {
        var button = event.target,
            inputElement = button.parentNode.parentNode.querySelector('input'),
            score = Number(inputElement.value);

        if (button.getAttribute('data-sub')) {
            score--;
        } else {
            score++;
        }
        
        if (isNaN(score) || score < 0) {
            score = 0;
        }

        inputElement.value = score;
        updateScore(saveTip.bind(this, this.tip, this.team, score, inputElement), inputElement.id);
    }
});

Template.matchSuperLeague.helpers({
    tip: function () {
        return TipsSuperLeague.findOne({
            match: this.id
        }) || {
            match: this.id
        };
    },

    getCssClass: function () {
        switch (this.points) {
        case 0:
            return 'bg-danger';
        case 2:
        case 3:
            return 'bg-warning';
        case 5:
            return 'bg-success';
        }
    }
});

function getTeamPopOverTitle() {
    var teamName = $('p:last-child', this).text().trim(),
        teamLink = TablesSuperLeague.findOne({
            name: teamName
        }, {
            fields: {
                link: 1
            }
        }).link;

    return '<a href="' + teamLink + '" target="_blank">View on SFL</a>';
}

function getTeamPopOver() {
    var teamName = $('p:last-child', this).text().trim(),
        matches = MatchesSuperLeague.find({
            $or: [{
                homeTeam: teamName
            }, {
                awayTeam: teamName
            }],
            isFinished: true
        }, {
            limit: 3,
            sort: {
                date: -1
            }
        }).fetch(),
        html = '';

    matches.forEach(function (match) {
        var score = (match.homeTeam === teamName) ? match.homeScore - match.awayScore : match.awayScore - match.homeScore,
            cssClass = (score > 0) ? 'label-success' : (score === 0) ? 'label-warning' : 'label-danger';

        html += '<div>' +
            match.homeTeam + ' <span class="label ' + cssClass + '">' +
            match.homeScore + ' : ' +
            match.awayScore + '</span> ' +
            match.awayTeam + '</div>';
    });

    return html;
}

Template.matchSuperLeague.rendered = function () {
    $(this.findAll('.teamname')).popover({
        animation: true,
        container: '#superLeague',
        content: getTeamPopOver,
        title: getTeamPopOverTitle,
        html: true
    });
};

// -------------------------------- ALL TIPS --------------------------------

Template.allTipsSuperLeague.created = function () {
    Session.set(allTipsLimitSessionKey, 10);
};

Template.allTipsSuperLeague.events({
    'click button': function (event) {
        Session.set(allTipsLimitSessionKey, 64);
        event.target.disabled = 'disabled';
        $('#allTipsSuperLeagueProgressBar').removeClass('hide');
    }
});

Template.allTipsSuperLeague.helpers({
    isShown: function () {
        if (!allTipsHasBeenShown && Session.get(pillSessionKey) === 'pillAllTips') {
            allTipsHasBeenShown = true;
        }

        return allTipsHasBeenShown;
    },

    allTipsTable: function () {
        var limit = Session.get(allTipsLimitSessionKey);

        Meteor.call('getAllTipsTable', limit, function (error, result) {
            Session.set(allTipsTableSessionKey, result);
            $('#allTipsSuperLeagueProgressBar').addClass('hide');
        });

        return Session.get(allTipsTableSessionKey);
    },

    getCssClass: function (points) {
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
    }
});