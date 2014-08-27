MatchesSuperLeague = new Meteor.Collection('matchesSuperLeague');
TablesSuperLeague = new Meteor.Collection('tablesSuperLeague');
TipsSuperLeague = new Meteor.Collection('tipsSuperLeague');
StandingsSuperLeague = new Meteor.Collection('standingsSuperLeague');
FlagsSuperLeague = new Meteor.Collection('flagsSuperLeague');

if (Meteor.isServer) { // speed up mongodb with indices
    MatchesSuperLeague._ensureIndex({'id': 1, 'date': 1, 'isFinished': 1});
    TablesSuperLeague._ensureIndex({'shortName': 1});
    TipsSuperLeague._ensureIndex({'match': 1, 'user': 1});
    
    //publish collections
    Meteor.publish('matchesSuperLeague', function () {
        'use strict';
        return MatchesSuperLeague.find();
    });

    Meteor.publish('tablesSuperLeague', function () {
        'use strict';
        return TablesSuperLeague.find();
    });
    
    Meteor.publish('tipsSuperLeague', function () {
        'use strict';
        return TipsSuperLeague.find({ user: this.userId }, { fields: { user: 0 }});
    });
    
    Meteor.publish('standingsSuperLeague', function () {
        'use strict';
        return StandingsSuperLeague.find();
    });
    
    Meteor.publish('flagsSuperLeague', function () {
        'use strict';
        return FlagsSuperLeague.find();
    });
}