/*jslint node: true, nomen: true */
/*global Meteor, MatchesWorldcup:true, TablesWorldcup:true, FlagsWorldcup:true, TipsWorldcup:true, StandingsWorldcup:true, check */

MatchesWorldcup = new Meteor.Collection('matchesWorldcup');
TablesWorldcup = new Meteor.Collection('tablesWorldcup');
FlagsWorldcup = new Meteor.Collection('flagsWorldcup');
TipsWorldcup = new Meteor.Collection('tipsWorldcup');
StandingsWorldcup = new Meteor.Collection('standingsWorldcup');

if (Meteor.isServer) {
    'use strict';
    var cheerio = Meteor.require('cheerio'),
        
        compareScore = function (homeTeam, awayTeam) {
            return homeTeam < awayTeam ? -1 : homeTeam > awayTeam ? 1 : 0;
        },

        getPointsFromMatchTip = function (match, tip) {
            var points = 0;

            if (compareScore(match.homeScore, match.awayScore) === compareScore(tip.homeTeam, tip.awayTeam)) {
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
        
        updateTipsForMatch = function (match) {
            var tips = TipsWorldcup.find({match: match.id}, {fields: {_id: 0}}).fetch() || [];
            
            tips.forEach(function (tip) {
                tip.points = getPointsFromMatchTip(match, tip);
                TipsWorldcup.update({match: tip.match, user: tip.user}, {$set: tip});
            });
        },

        parseMatches = function () {
            var url = 'http://www.fifa.com/worldcup/matches/index.html',
                $ = cheerio.load(Meteor.http.get(url).content),
                actMatch,
                timeAttr,
                timeParts,
                scoreParts;

            $('.match-list .mu').each(function (index, element) {
                actMatch = {};
                actMatch.id = $(element).data('id');
                actMatch.date = new Date($('.mu-i-date', element).text() + " UTC");

                if (actMatch.id && !$(element).hasClass('live')) {
                    timeAttr = $('.s-date-HHmm', element).data('timeutc');
                    
                    if (timeAttr) {
                        timeParts = timeAttr.split(':');
                        actMatch.date = new Date($('.mu-i-date', element).text() + " UTC");
                        actMatch.date.setUTCHours(timeParts[0], timeParts[1]);
                        if (timeParts[0] < 3) {
                            actMatch.date.setDate(actMatch.date.getDate() + 1);
                        }
                    } else {
                        actMatch.date = MatchesWorldcup.findOne({id: actMatch.id}, {fields: {date: 1}}).date;
                    }
                    

                    actMatch.location = {};
                    actMatch.location.stadium = $('.mu-i-stadium', element).text();
                    actMatch.location.venue = $('.mu-i-venue', element).text();

                    actMatch.homeTeam = $('.home .t-nText', element).text();
                    actMatch.awayTeam = $('.away .t-nText', element).text();
                    actMatch.group = $('.mu-i-group', element).text();
                    
                    if ($(element).hasClass('result')) {
                        scoreParts = $('.s-scoreText', element).text().split('-');
                        actMatch.homeScore = Number(scoreParts[0]);
                        actMatch.awayScore = Number(scoreParts[1]);
                        actMatch.isFinished = true;
                        
                        updateTipsForMatch(actMatch);
                    } else {
                        actMatch.isFinished = false;
                    }

                    MatchesWorldcup.upsert({ id: actMatch.id }, { $set: actMatch });
                }
            });
        },

        parseTables = function () {
            var baseuri = 'http://www.fifa.com',
                uri = baseuri + '/worldcup/groups/index.html',
                $ = cheerio.load(Meteor.http.get(uri).content),
                actGroup,
                actGroupNameLink,
                actTeam,
                actTeamNameLink,
                flagObject;

            $('#standings .group-wrap').each(function (index, groupElement) {
                actGroup = {};
                actGroup.teams = [];

                actGroup.id = $('table.tbl-standings', groupElement).attr('id');
                actGroupNameLink = $('caption.caption-link a', groupElement);
                actGroup.name = actGroupNameLink.text();
                actGroup.link = baseuri + actGroupNameLink.attr('href');

                $('table.tbl-standings tbody tr:not(.expandcol)', groupElement).each(function (index, teamElement) {
                    actTeam = {};

                    actTeamNameLink = $('td.tbl-teamname.teamname-link a', teamElement);
                    actTeam.name = $('span.t-nText', actTeamNameLink).text();
                    actTeam.link = baseuri + actTeamNameLink.attr('href');
                    
                    flagObject = {
                        team: actTeam.name,
                        imgSrc: $('img', actTeamNameLink).data('src') || $('img', actTeamNameLink).attr('src')
                    };
                    FlagsWorldcup.upsert({ team: flagObject.team }, {$set: flagObject});

                    actTeam.matchPlayed = $('td.tbl-matchplayed span', teamElement).text();
                    actTeam.win = $('td.tbl-win span', teamElement).text();
                    actTeam.draw = $('td.tbl-draw span', teamElement).text();
                    actTeam.lost = $('td.tbl-lost span', teamElement).text();
                    actTeam.goalFor = $('td.tbl-goalfor span', teamElement).text();
                    actTeam.goalAgainst = $('td.tbl-goalagainst span', teamElement).text();
                    actTeam.points = $('td.tbl-pts span', teamElement).text();

                    actGroup.teams.push(actTeam);
                });

                TablesWorldcup.upsert({ id: actGroup.id }, { $set: actGroup });
            });
        },
        
        saveTip = function (tip) {
            check(tip, Object);
            var now = new Date(),
                match = MatchesWorldcup.findOne({ id: tip.match});
            
            if (now >= match.date) {
                throw new Meteor.Error(500, "The Match has already begun. You cannot tip anymore!");
            }
            
            TipsWorldcup.upsert({ match: tip.match, user: tip.user }, { $set: tip });
        },
        
        saveRankingTip = function (tip) {
            check(tip, Object);
            var now = new Date(),
                lastGroupMatchDate = MatchesWorldcup.findOne({group: /Group\s[A-H]/}, {sort: {date: -1}, fields: {date: 1}});
            
            if (now >= lastGroupMatchDate.date) {
                throw new Meteor.Error(500, "The Group Stage is already over. You cannot tip anymore!");
            }
            
            TipsWorldcup.upsert({ user: tip.user, rank: tip.rank}, { $set: tip });
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

        countPoints = function (sum, item) {
            return (sum.points || sum) + item.points;
        },

        updateStandingsTable = function () {
            var usersWithRanking = Meteor.users.find({}).fetch(),
                rank = 0,
                lastPoints;

            usersWithRanking.forEach(function (user) {
                var tips = TipsWorldcup.find({user: user._id, points: {$exists: true}}).fetch() || [],
                    points = tips.reduce(countPoints, 0);

                points += getPointsFromFinalsTips(user);

                user.points = points;
                
                StandingsWorldcup.upsert({ username: user.username }, { $set: { username: user.username, points: points} });
            });
        },
    
        importWorldcup = function () {
            parseTables();
            parseMatches();
            updateStandingsTable();
        };

    //publish collections
    Meteor.publish('matchesWorldcup', function () {
        return MatchesWorldcup.find();
    });

    Meteor.publish('tablesWorldcup', function () {
        return TablesWorldcup.find();
    });
    
    Meteor.publish('tipsWorldcup', function () {
        return TipsWorldcup.find();
    });
    
    Meteor.publish('standingsWorldcup', function () {
        return StandingsWorldcup.find();
    });
    
    Meteor.publish('flagsWorldcup', function () {
        return FlagsWorldcup.find();
    });

    //export Methods
    Meteor.methods({
        'importWorldcup': importWorldcup,
        'saveTip': saveTip,
        'saveRankingTip': saveRankingTip
    });
    
    //make indexes to speed up queries
    Meteor.startup(function () {
        MatchesWorldcup._ensureIndex({'id': 1, 'date': 1, 'isFinished': 1});
        TablesWorldcup._ensureIndex({'id': 1});
        FlagsWorldcup._ensureIndex({'team': 1});
        TipsWorldcup._ensureIndex({'match': 1, 'user': 1});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('matchesWorldcup');
    Meteor.subscribe('tablesWorldcup');
    Meteor.subscribe('tipsWorldcup');
    Meteor.subscribe('standingsWorldcup');
    Meteor.subscribe('flagsWorldcup');
}