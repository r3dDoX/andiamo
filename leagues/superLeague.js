/*jslint node: true */
/*global check, Deps, Meteor, MatchesSuperLeague: true, TablesSuperLeague: true, TipsSuperLeague: true, StandingsSuperLeague: true, FlagsSuperLeague: true */

MatchesSuperLeague = new Meteor.Collection('matchesSuperLeague');
TablesSuperLeague = new Meteor.Collection('tablesSuperLeague');
TipsSuperLeague = new Meteor.Collection('tipsSuperLeague');
StandingsSuperLeague = new Meteor.Collection('standingsSuperLeague');
FlagsSuperLeague = new Meteor.Collection('flagsSuperLeague');

if (Meteor.isServer) {
    'use strict';
    
    var rankingTipsUntil = new Date('2014-8-1'),
        cheerio = Meteor.require('cheerio'),
        
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
            var tips = TipsSuperLeague.find({match: match.id}, {fields: {_id: 0}}).fetch() || [];
            
            tips.forEach(function (tip) {
                tip.points = getPointsFromMatchTip(match, tip);
                TipsSuperLeague.update({match: tip.match, user: tip.user}, {$set: tip});
            });
        },

        parseTables = function ($) {
            var teams = {},
                actTeam,
                actTeamLink;

            $('.content-container table tbody tr').each(function (index, teamElement) {
                actTeam = {};
                
                actTeamLink = $('td a', teamElement);
                actTeam.id = actTeamLink.parent().data('teamdata');
                actTeam.shortName = $('span.short-name', actTeamLink).text();
                actTeam.name = $('span.name', actTeamLink).text();
                actTeam.rank = Number($('td:first-child', teamElement).text());
                actTeam.matchPlayed = Number($('td:nth-child(4)', teamElement).text());
                actTeam.win = Number($('td:nth-child(5)', teamElement).text());
                actTeam.draw = Number($('td:nth-child(6)', teamElement).text());
                actTeam.lost = Number($('td:nth-child(7)', teamElement).text());
                actTeam.goals = $('td:nth-child(8)', teamElement).text().replace(/\s+/g, '');
                actTeam.goalDifference = $('td:nth-child(9)', teamElement).text().replace(/\s+/g, '');
                actTeam.points = Number($('td:nth-child(10)', teamElement).text());

                teams[actTeam.shortName] = actTeam.name; //make lookup table for importMatches function

                TablesSuperLeague.upsert({ id: actTeam.id }, { $set: actTeam });
            });

            return teams;
        },
        
        isNotDst = function(month, day) {
            return month === 10 && day >= 26 || month > 10 || month < 3 || month === 3 && day < 29;
        },

        parseMatches = function () {
            var uri = 'http://www.sfl.ch/superleague/matchcenter/',
                $ = cheerio.load(Meteor.http.get(uri).content),
                teams,
                matchday,
                actMatch,
                dateParts,
                dateString,
                timeZone,
                scoreParts;

            teams = parseTables($);

            $('section#games .matchday').each(function (index, matchdayElement) {
                matchday = Number(/(\d+)\.\s/g.exec($('.info', matchdayElement).text())[1]);
                $('.match', matchdayElement).each(function (index, matchElement) {
                    actMatch = {};
                    actMatch.id = $(matchElement).data('match');
                    actMatch.matchday = matchday;
                    actMatch.homeTeamShort = $('.home-team.team', matchElement).text();
                    actMatch.homeTeam = teams[actMatch.homeTeamShort];
                    actMatch.awayTeamShort = $('.guest-team.team', matchElement).text();
                    actMatch.awayTeam = teams[actMatch.awayTeamShort];

                    dateParts = /(\d\d)\.(\d\d)\.(\d\d)\s+((\d\d):(\d\d))?/g.exec($('.date', matchElement).text());
                    
                    if (dateParts) {
                        dateString = ['20' + dateParts[3], dateParts[2], dateParts[1]].join('-');

                        if (isNotDst(Number(dateParts[2]), Number(dateParts[1]))) {
                            timeZone = ' GMT+0100';
                        } else {
                            timeZone = ' GMT+0200';
                        }
                        
                        if (dateParts[4]) {
                            dateString += [' ' + dateParts[5], dateParts[6], '00'].join(':');
                        }                        
                        
                        actMatch.date = new Date(dateString + timeZone);
                    }

                    scoreParts = $('.score', matchElement).text().split(':');
                    if ($('.live', matchElement).length) {
                        actMatch.homeScore = Number(scoreParts[0]);
                        actMatch.awayScore = Number(scoreParts[1]);
                        actMatch.isFinished = true;

                        updateTipsForMatch(actMatch);
                    } else {
                        actMatch.isFinished = false;
                    }

                    MatchesSuperLeague.upsert({ id: actMatch.id }, { $set: actMatch });
                });
            });
        },

        importSuperLeague = function () {
            parseMatches();
        },
        
        checkIfHasToImport = function () {
            var dateFrom = new Date(),
                dateTo = new Date();
            
            dateFrom.setMinutes(-200);
            dateTo.setMinutes(-105);
            
            if (MatchesSuperLeague.find({date: {$gt: dateFrom, $lt: dateTo}, isFinished: false}).fetch().length > 0) {
                importSuperLeague();
            }
        },
        
        scheduleFunction = function (functionToCall, milliseconds) {
            functionToCall();
            Meteor.setTimeout(scheduleFunction.bind(undefined, functionToCall, milliseconds), milliseconds);
        },
        
        getRankingTipsForUser = function (user) {
            var rankings = [];
            
            TipsSuperLeague.find({user: user._id, rank: {$exists: true}}).fetch().forEach(function (tip) {
                if (tip.rank === 'champion') {
                    rankings[0] = tip.team;
                } else {
                    rankings[1] = tip.team;
                }
            });
            
            return rankings;
        },
        
        getScoreString = function(score) {
            if (isNaN(score)) {
                return '';
            }
            
            return score;
        },
        
        getAllTipsTable = function (limit) {
            check(limit, Number);
            
            var table = {header: [], rankings: [], matches: []},
                offset = 1,
                startedMatches = MatchesSuperLeague.find({date: {$lt: new Date()}}, {
                    fields: {id: 1, homeTeam: 1, awayTeam: 1, homeScore: 1, awayScore: 1},
                    sort: {date: -1},
                    limit: limit
                }),
                sortedUsers = Meteor.users.find({}, {sort: {username: 1}}).fetch(),
                tip,
                cell;

            table.header[0] = 'Match';
            table.rankings[0] = ['1.', '10.'];
            
            sortedUsers.forEach(function(user, userIndex) {
                table.header[userIndex + offset] = user.username;
                
                if (new Date() > rankingTipsUntil) {
                    table.rankings[userIndex + offset] = getRankingTipsForUser(user);
                }
            });
            
            startedMatches.forEach(function (match, index) {
                table.matches[index] = [];
                table.matches[index][0] = { matchString: true, text: match.homeTeam + ' ' + getScoreString(match.homeScore) + ' - ' + getScoreString(match.awayScore) + ' ' + match.awayTeam };
                
                sortedUsers.forEach(function (user, userIndex) {
                    tip = TipsSuperLeague.findOne({match: match.id, user: user._id}, {fields: {_id: 0, homeTeam: 1, awayTeam: 1, points: 1}}) || {homeTeam: '', awayTeam: '', points: ''};
                    
                    cell = {
                        text: tip.homeTeam + ' - ' + tip.awayTeam,
                        points: tip.points
                    };
                    
                    table.matches[index][userIndex + offset] = cell;
                });
            });
            
            return table;
        },
    
        saveTip = function (tip) {
            check(tip, Object);
            var now = new Date(),
                match = MatchesSuperLeague.findOne({ id: tip.match});
            
            if (now >= match.date) {
                throw new Meteor.Error(500, "The Match has already begun. You cannot tip anymore!");
            }
            
            tip.user = this.userId;
            TipsSuperLeague.upsert({ match: tip.match, user: tip.user }, { $set: tip });
        },
        
        saveRankingTip = function (tip) {
            check(tip, Object);

            if (new Date() >= rankingTipsUntil) {
                throw new Meteor.Error(500, "You cannot tip this anymore!");
            }
            
            tip.user = this.userId;
            TipsSuperLeague.upsert({ user: tip.user, rank: tip.rank}, { $set: tip });
        };

    //publish collections
    Meteor.publish('matchesSuperLeague', function () {
        return MatchesSuperLeague.find();
    });

    Meteor.publish('tablesSuperLeague', function () {
        return TablesSuperLeague.find();
    });
    
    Meteor.publish('tipsSuperLeague', function () {
        return TipsSuperLeague.find({ user: this.userId }, { fields: { user: 0 }});
    });
    
    Meteor.publish('standingsSuperLeague', function () {
        return StandingsSuperLeague.find();
    });
    
    Meteor.publish('flagsSuperLeague', function () {
        return FlagsSuperLeague.find();
    });

    //export Methods
    Meteor.methods({
        'importSuperLeague': importSuperLeague,
        'saveTipSuperLeague': saveTip,
        'saveRankingTipSuperLeague': saveRankingTip,
        'getAllTipsTable': getAllTipsTable
    });
    
    //make indexes to speed up queries
    Meteor.startup(function () {
        MatchesSuperLeague._ensureIndex({'id': 1, 'date': 1, 'isFinished': 1});
        TablesSuperLeague._ensureIndex({'shortName': 1});
        TipsSuperLeague._ensureIndex({'match': 1, 'user': 1});
        
        scheduleFunction(checkIfHasToImport, 300000);
    });
}

if (Meteor.isClient) {
    'use strict';
    
    Deps.autorun(function () {
        Meteor.subscribe('matchesSuperLeague');
        Meteor.subscribe('tablesSuperLeague');
        Meteor.subscribe('tipsSuperLeague');
        Meteor.subscribe('standingsSuperLeague');
        Meteor.subscribe('flagsSuperLeague');
    });
}