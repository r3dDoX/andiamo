if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to andiamo.";
  };
}

if (Meteor.isServer) {
    var cheerio = Meteor.require('cheerio');
    
    Meteor.methods({
        importData: function() {
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
        }
    });
}
