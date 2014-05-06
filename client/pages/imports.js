/*jslint node: true */
/*global Meteor, Session, Template, leaguesImports:true */
'use strict';

Template.imports.leagues = function () {
    var leaguesImports = Session.get('leaguesImports');
    
    if (leaguesImports) {
        return leaguesImports;
    } else {
        Meteor.call('leaguesImports', function (error, success) {
            Session.set('leaguesImports', success);
        });
    }
};