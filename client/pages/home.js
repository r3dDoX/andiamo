/*jslint node: true, nomen: true, plusplus: true */
/*global Meteor, Template, MatchesWorldcup:true, TipsWorldcup:true */
'use strict';

var scrollElementId = 'home',
    initialPositionY = 50,
    
    scrollBgPic = function (pageElement, bgPic, event) {
        if (bgPic && pageElement.scrollTop < bgPic.clientHeight) {
            bgPic.style.backgroundPositionY = (initialPositionY - pageElement.scrollTop / 25) + '%';
        }
    },
    
    compareScore = function (homeTeam, awayTeam) {
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
    
    getPointsFromFinalsTips = function (user) {
        var points = 0,
            first,
            second,
            third,
            tip,
            bigFinal = MatchesWorldcup.findOne({group: 'Final', isFinished: true}),
            smallFinal = MatchesWorldcup.findOne({group: 'Play-off for third place', isFinished: true});
        
        if (bigFinal) {
            if (bigFinal.homeScore > bigFinal.awayScore) {
                first = bigFinal.homeTeam;
                second = bigFinal.awayTeam;
            } else {
                first = bigFinal.awayTeam;
                second = bigFinal.homeTeam;
            }
            
            tip =  TipsWorldcup.findOne({user: user._id, rank: 'first'});
            if (tip && tip.team === first) {
                points += 30;
            }
            
            tip = TipsWorldcup.findOne({user: user._id, rank: 'second'});
            if (tip && tip.team === second) {
                points += 20;
            }
        }
        
        if (smallFinal) {
            if (smallFinal.homeScore > smallFinal.awayScore) {
                third = smallFinal.homeTeam;
            } else {
                third = smallFinal.awayTeam;
            }

            tip = TipsWorldcup.findOne({user: user._id, rank: 'third'});
            if (tip && tip.team === third) {
                points += 10;
            }
        }
        
        return points;
    },

    sortStandingsTable = function (standingsTable) {
        standingsTable.sort(function (a, b) {
            return b.points - a.points;
        });
    },

    standingsTable = function () {
        var usersWithRanking = Meteor.users.find({}).fetch(),
            rank = 0,
            lastPoints;

        usersWithRanking.map(function (user) {
            var tips = TipsWorldcup.find({user: user._id}),
                points = 0;

            tips.forEach(function (element, index, array) {
                points += getPointsFromMatchTip(element);
            });
            
            points += getPointsFromFinalsTips(user);

            user.points = points;
            return user;
        });

        sortStandingsTable(usersWithRanking);

        usersWithRanking.map(function (element) {
            if (element.points === lastPoints) {
                element.rank = rank;
            } else {
                element.rank = ++rank;
                lastPoints = element.points;
            }
            
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