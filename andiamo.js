if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to andiamo.";
  };
}

if (Meteor.isServer) {
    var cheerio = Meteor.require('cheerio');
    
    Meteor.methods({
        importMatches: function() {
            var url = 'http://www.fifa.com/worldcup/matches/index.html',
                $ = cheerio.load(Meteor.http.get(url).content),
                matches = new Array(),
                actMatch,
                timeParts;

            $('.match-list .fixture').each(function(index, element) {
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

                matches.push(actMatch);
            });

            return matches;
        },
        importTables: function() {
            var baseuri = 'http://www.fifa.com',
                uri = baseuri + '/worldcup/groups/index.html',
                $ = cheerio.load(Meteor.http.get(uri).content),
                groups = new Array(),
                actGroup,
                actGroupNameLink,
                actTeam,
                actTeamNameLink;

            $('#standings .group-wrap').each(function(index, groupElement) {
                actGroup = {};
                actGroup.teams = new Array();

                actGroupNameLink = $('caption.caption-link a', groupElement);
                actGroup.name = actGroupNameLink.text();
                actGroup.link = baseuri + actGroupNameLink.attr('href');

                $('table.tbl-standings tbody tr:not(.expandcol)', groupElement).each(function(index, teamElement) {
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

                groups.push(actGroup);
            });

            return groups;
        }
    });
}
