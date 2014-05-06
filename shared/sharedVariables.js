/*jslint node: true */
/*global Meteor, leaguesImports:true */

leaguesImports = [];

Meteor.methods({
    leaguesImports : function () {
        return leaguesImports;
    }
});