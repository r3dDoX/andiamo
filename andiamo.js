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
                $ = cheerio.load(Meteor.http.get(url).content);

            return $('.match-list .fixture .s-scoreText').text();
        }
    });
}
