/*jslint node: true */
/*global Meteor, Template */
'use strict';

var scrollElementId = 'home',
    initialPositionY = 50,
    
    scrollBgPic = function (pageElement, bgPic, event) {
        if (bgPic && pageElement.scrollTop < bgPic.clientHeight) {
            bgPic.style.backgroundPositionY = (initialPositionY - pageElement.scrollTop / 25) + '%';
        }
    },
    
    compareScore = function(homeTeam, awayTeam) {
        return homeTeam < awayTeam ? -1 : homeTeam > awayTeam ? 1 : 0;
    },

    getPointsFromMatchTip = function (tip) {
        var match = MatchesWorldcup.findOne({id: tip.match, isFinished: true}),
            points = 0;

        if (match && compareScore(match.homeScore, match.awayScore) === compareScore(tip.homeTeam, tip.awayTeam)) {
            points += 2;

            if (match.homeScore - match.awayScore === tip.homeTeam - tip.awayTeam) {
                points += 1;

                if (match.homeScore === tip.homeTeam && match.awayScore === tip.awayTeam) {
                    points += 2;
                }
            }
        }

        return points;
    },

    sortStandingsTable = function (standingsTable) {
        standingsTable.sort(function (a, b) {
            return a.points - b.points
        });
    },

    standingsTable = function () {
        var usersWithRanking = Meteor.users.find({}, {fields: {_id: 1, username: 1}}).fetch(),
            rank = 1;

        usersWithRanking.map(function (user) {
            var tips = TipsWorldcup.find({user: user._id}),
                points = 0;

            tips.forEach(function (element, index, array) {
                points += getPointsFromMatchTip(element);
            });

            user.points = points;
            return user;
        });

        sortStandingsTable(usersWithRanking);

        usersWithRanking.map(function (element) {
            element.rank = rank++;
            return element;
        });

        return usersWithRanking;
    };

Template.home.rendered = function () {
    var pageElement = document.getElementById(scrollElementId),
        bgPic = pageElement.getElementsByClassName('header')[0],
        scrollBgPicPartial = scrollBgPic.bind(this, pageElement, bgPic);
    
    document.getElementById(scrollElementId).addEventListener('scroll', scrollBgPicPartial);
    document.getElementById(scrollElementId).addEventListener('touchmove', scrollBgPicPartial);
};

Template.standingsTable.userRankings = function () {
    return standingsTable();
};