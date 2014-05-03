/*global Meteor */
(function () {
    'use strict';

    var cheerio = Meteor.require('cheerio'),
        MatchesSuperLeague = new Meteor.Collection("matchesSuperLeague"),
        TablesSuperLeague = new Meteor.Collection("tablesSuperLeague"),

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
        };

    Meteor.methods({
        importMatchesSuperLeague: function () {
            var uri = 'http://www.sfl.ch/superleague/matchcenter/',
                $ = cheerio.load(Meteor.http.get(uri).content),
                teams,
                matchday,
                dateParts,
                actMatch;

            teams = parseTables($);

            $('.matchday').each(function (index, matchdayElement) {
                matchday = /(\d+)\.\s/g.exec($('.info', matchdayElement).text())[1];
                $('.match', matchdayElement).each(function (index, matchElement) {
                    actMatch = {};
                    actMatch.id = $(matchElement).data('match');
                    actMatch.matchday = matchday;
                    actMatch.homeTeam = teams[$('.home-team.team', matchElement).text()];
                    actMatch.awayTeam = teams[$('.guest-team.team', matchElement).text()];

                    dateParts = /(\d\d)\.(\d\d)\.(\d\d)\s+(\d\d):(\d\d)/g.exec($('.date', matchElement).text());
                    dateParts[2] = Number(dateParts[2]) - 1; //JavaScript Months start at 0
                    dateParts[3] = '20' + dateParts[3]; //JavaScript parses two digit years as 19**
                    actMatch.date = new Date(dateParts[3], dateParts[2], dateParts[1], dateParts[4], dateParts[5]);

                    MatchesSuperLeague.upsert({ id: actMatch.id }, { $set: actMatch });
                });
            });
        }
    });
}());
