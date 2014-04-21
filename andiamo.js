if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to andiamo.";
  };
}

if (Meteor.isServer) {
    Meteor.methods({
        importData: function() {
            var url = 'http://www.sfl.ch/superleague/matchcenter/';

            return Meteor.http.get(url);
        }
    });
}
