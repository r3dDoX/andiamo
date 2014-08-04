'use strict';

Template.standingsTable.userRankings = function () {
    var rank = 0,
        lastPoints;
    
    return StandingsSuperLeague.find({}, { sort: {points: -1}}).fetch().map(function (userStanding) {
        if (userStanding.points === lastPoints) {
            userStanding.rank = rank;
        } else {
            userStanding.rank = ++rank;
            lastPoints = userStanding.points;
        }
        
        return userStanding;
    });
};
