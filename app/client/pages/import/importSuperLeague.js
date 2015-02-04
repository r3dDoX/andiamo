'use strict';

Meteor.subscribe('matchesSuperLeague');
Meteor.subscribe('tablesSuperLeague');

Template.importSuperLeague.helpers({
    matches: function () {
        return MatchesSuperLeague.find({}, {
            sort: {
                matchday: 1,
                date: 1
            }
        }).fetch().map(function (element) {
            if (element.date) {
                element.date = element.date.toDateString();
            }

            return element;
        });
    },

    teams: function () {
        return TablesSuperLeague.find({}, {
            sort: {
                rank: 1
            }
        }).fetch();
    }
});