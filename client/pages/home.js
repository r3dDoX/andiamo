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
    
    countPoints = function (sum, item) {
        return (sum.points || sum) + item.points;
    },

    standingsTable = function () {
        var usersWithRanking = Meteor.users.find({}).fetch(),
            rank = 0,
            lastPoints;

        usersWithRanking.map(function (user) {
            var tips = TipsWorldcup.find({user: user._id, points: {$exists: true}}).fetch() || [],
                points = tips.reduce(countPoints, 0);
            
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
        scrollBgPicPartial = scrollBgPic.bind(this, pageElement, bgPic),
        width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    
    if (width >= 768) { // if xs device, don't load big Pic
        bgPic.style.backgroundImage = 'url("/arena.jpg")';
    }
    
    document.getElementById(scrollElementId).addEventListener('scroll', scrollBgPicPartial);
    document.getElementById(scrollElementId).addEventListener('touchmove', scrollBgPicPartial);
};

Template.standingsTable.userRankings = function () {
    return standingsTable();
};
