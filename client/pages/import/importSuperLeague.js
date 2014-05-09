/*jslint node: true */
/*global Meteor, Template */
'use strict';

Meteor.subscribe('matchesSuperLeague');
Meteor.subscribe('tablesSuperLeague');

Template.importSuperLeague.matches = function () {
    var matches = MatchesSuperLeague.find().fetch();
    
    matches.map(function (element) {
        element.date = element.date.toDateString();
    });
    
    return matches;
};

Template.importSuperLeague.teams = function () {
    return TablesSuperLeague.find().fetch();
};

Template.importSuperLeague.events({
    'click button#importSuperLeague': function (event) {
        var button = event.target;
        button.classList.add('btn-primary');
        button.classList.add('disabled');
        
        Meteor.call('importSuperLeague', function (error, success) {
            button.classList.remove('disabled');
            button.classList.remove('btn-primary');
            
            if (error) {
                button.classList.add('btn-error');
                console.log(error);
            } else {
                button.classList.add('btn-success');
            }
        });
    }
});