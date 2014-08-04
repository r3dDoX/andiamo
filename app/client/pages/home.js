'use strict';

Template.standingsTable.userRankings = function () {
    var rank = 0,
        usersInRank = 1,
        lastPoints;
    
    return StandingsSuperLeague.find({}, { sort: {points: -1}}).fetch().map(function (userStanding) {
        if (userStanding.points === lastPoints) {
            usersInRank++;
            userStanding.rank = rank;
        } else {
            userStanding.rank = rank += usersInRank;
            lastPoints = userStanding.points;
            usersInRank = 1;
        }
        
        return userStanding;
    });
};
