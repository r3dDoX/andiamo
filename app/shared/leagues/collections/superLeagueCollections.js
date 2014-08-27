MatchesSuperLeague = new Meteor.Collection('matchesSuperLeague');
TablesSuperLeague = new Meteor.Collection('tablesSuperLeague');
TipsSuperLeague = new Meteor.Collection('tipsSuperLeague');
StandingsSuperLeague = new Meteor.Collection('standingsSuperLeague');
FlagsSuperLeague = new Meteor.Collection('flagsSuperLeague');

if (Meteor.isServer) { // speed up mongodb with indices
    MatchesSuperLeague._ensureIndex({'id': 1, 'date': 1, 'isFinished': 1});
    TablesSuperLeague._ensureIndex({'shortName': 1});
    TipsSuperLeague._ensureIndex({'match': 1, 'user': 1});
}