/*jslint node: true */
/*global $, MatchesSuperLeague, Template */
'use strict';

Template.superLeague.rendered = function () {
    $("#superLeagueMatches").owlCarousel({
        items: 5,
        itemsDesktop : [1000, 4],
        itemsDesktopSmall : [800, 3],
        itemsTablet: [600, 2],
        itemsMobile: [479, 1]
    });
};

Template.superLeague.matches = function () {
    return MatchesSuperLeague.find().fetch().slice(0, 5);
};