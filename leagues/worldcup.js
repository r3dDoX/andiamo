/*jslint node: true */
/*global Meteor, MatchesWorldcup:true, TablesWorldcup:true */

MatchesWorldcup = new Meteor.Collection("matchesWorldcup");
TablesWorldcup = new Meteor.Collection("tablesWorldcup");

if (Meteor.isServer) {
    'use strict';
    var cheerio = Meteor.require('cheerio'),

        parseMatches = function () {
            var url = 'http://www.fifa.com/worldcup/matches/index.html',
                $ = cheerio.load(Meteor.http.get(url).content),
                actMatch,
                timeParts;

            $('.match-list .fixture').each(function (index, element) {
                actMatch = {};
                actMatch.id = $(element).attr('id');
                actMatch.date = new Date($('.mu-i-date', element).text() + " UTC");

                timeParts = $('.s-date-HHmm', element).data('timeutc').split(':');
                actMatch.date.setUTCHours(timeParts[0], timeParts[1]);

                actMatch.location = {};
                actMatch.location.stadium = $('.mu-i-stadium', element).text();
                actMatch.location.venue = $('.mu-i-venue', element).text();

                actMatch.homeTeam = $('.home .t-nText', element).text();
                actMatch.awayTeam = $('.away .t-nText', element).text();
                actMatch.group = $('.mu-i-group', element).text();

                MatchesWorldcup.upsert({ id: actMatch.id }, { $set: actMatch });
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
        };

    //publish collections
    Meteor.publish('matchesWorldcup', function () {
        return MatchesWorldcup.find();
    });

    Meteor.publish('tablesWorldcup', function () {
        return TablesWorldcup.find();
    });

    //export Methods
    Meteor.methods({
        'importWorldcup': importWorldcup
    });
}