/*jslint node: true, nomen: true */
/*global Meteor, MatchesWorldcup:true, TablesWorldcup:true, TipsWorldcup:true, check */

MatchesWorldcup = new Meteor.Collection('matchesWorldcup');
TablesWorldcup = new Meteor.Collection('tablesWorldcup');
TipsWorldcup = new Meteor.Collection('tipsWorldcup');

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
                actTeamNameLink;

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
                    actTeam.imgSrc = $('img', actTeamNameLink).data('src') || $('img', actTeamNameLink).attr('src');

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

        importWorldcup = function () {
            parseTables();
            parseMatches();
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

    //export Methods
    Meteor.methods({
        'importWorldcup': importWorldcup,
        'saveTip': saveTip,
        'saveRankingTip': saveRankingTip
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('matchesWorldcup');
    Meteor.subscribe('tablesWorldcup');
    Meteor.subscribe('tipsWorldcup');
}