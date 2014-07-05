/*jslint node: true */
/*global check, Deps, Meteor, MatchesSuperLeague: true, TablesSuperLeague: true, TipsSuperLeague: true, StandingsSuperLeague: true */

MatchesSuperLeague = new Meteor.Collection('matchesSuperLeague');
TablesSuperLeague = new Meteor.Collection('tablesSuperLeague');
TipsSuperLeague = new Meteor.Collection('tipsSuperLeague');
StandingsSuperLeague = new Meteor.Collection('standingsSuperLeague');

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

        parseMatches = function () {
            var uri = 'http://www.sfl.ch/superleague/matchcenter/',
                $ = cheerio.load(Meteor.http.get(uri).content),
                teams,
                matchday,
                actMatch,
                dateParts,
                scoreParts;

            teams = parseTables($);

            $('section#games .matchday').each(function (index, matchdayElement) {
                matchday = Number(/(\d+)\.\s/g.exec($('.info', matchdayElement).text())[1]);
                $('.match', matchdayElement).each(function (index, matchElement) {
                    actMatch = {};
                    actMatch.id = $(matchElement).data('match');
                    actMatch.matchday = matchday;
                    actMatch.homeTeam = teams[$('.home-team.team', matchElement).text()];
                    actMatch.awayTeam = teams[$('.guest-team.team', matchElement).text()];

                    dateParts = /(\d\d)\.(\d\d)\.(\d\d)\s+((\d\d):(\d\d))?/g.exec($('.date', matchElement).text());
                    dateParts[2] = Number(dateParts[2]) - 1; //JavaScript Months start at 0
                    dateParts[3] = '20' + dateParts[3]; //JavaScript parses two digit years as 19**
                    actMatch.date = new Date(dateParts[3], dateParts[2], dateParts[1]);
                    
                    if (dateParts[4]) {
                        actMatch.date.setHours(dateParts[5]);
                        actMatch.date.setMinutes(dateParts[6]);
                    }
                    
                    scoreParts = $('.score', matchElement).text().split(':');
                    if (isNaN(Number(scoreParts[0]))) {
                        actMatch.isFinished = false;
                    } else {
                        actMatch.homeScore = Number(scoreParts[0]);
                        actMatch.awayScore = Number(scoreParts[1]);
                        actMatch.isFinished = true;
                        
                        updateTipsForMatch(actMatch);
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
        
        getAllTipsTable = function (limit) {
            check(limit, Number);
            
            var table = {header: [], rankings: [], matches: []},
                offset = 1,
                startedMatches = MatchesSuperLeague.find({date: {$lt: new Date()}}, {
                    fields: {id: 1, homeTeam: 1, awayTeam: 1, homeScore: 1, awayScore: 1},
                    sort: {date: -1},
                    limit: limit
                }),
                tip,
                cell;

            table.header[0] = 'Match';
            table.rankings[0] = ['1.', '10.'];
            
            startedMatches.forEach(function (match, index) {
                table.matches[index] = [];
                table.matches[index][0] = { matchString: true, text: match.homeTeam + ' ' + (match.homeScore || '') + ' - ' + (match.awayScore || '') + ' ' + match.awayTeam };
                
                Meteor.users.find({}, {sort: {username: 1}}).fetch().forEach(function (user, userIndex) {
                    tip = TipsSuperLeague.findOne({match: match.id, user: user._id}, {fields: {_id: 0, homeTeam: 1, awayTeam: 1, points: 1}}) || {homeTeam: '', awayTeam: '', points: ''};
                    
                    cell = {
                        text: tip.homeTeam + ' - ' + tip.awayTeam,
                        points: tip.points
                    };
                    
                    table.header[userIndex + offset] = table.header[userIndex + offset] || user.username;
                    table.rankings[userIndex + offset] = table.rankings[userIndex + offset] || getRankingTipsForUser(user);
                    table.matches[index][userIndex + offset] = cell;
                });
            });
            
            return table;
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

    //export Methods
    Meteor.methods({
        'importSuperLeague': importSuperLeague
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
        Meteor.subscribe('TipsSuperLeague');
        Meteor.subscribe('standingsSuperLeague');
    });
}