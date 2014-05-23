/*jslint node: true */
/*global $, MatchesSuperLeague, Template */
'use strict';

Template.superLeague.matches = function () {
    return MatchesSuperLeague.find().fetch();
};