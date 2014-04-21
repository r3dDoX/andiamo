if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to andiamo.";
  };

  Template.hello.events({
    'click input': function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
      Meteor.http.get("http://www.google.com", function(err, result) {
          if (!err) {
            console.log('awesome');
          } else {
              console.log('shit');
          }
      });
  });
}
