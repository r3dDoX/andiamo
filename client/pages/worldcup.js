/*jslint node: true */
/*global Session, Template */
'use strict';

var sessionKeyPill = 'selectedWorldcupPill';

Template.worldcup.pills = function () {
    return [
        { id: "general", title: "General" },
        { id: "nextMatches", title: "Next Matches" },
        { id: "allTips", title: "All Tips" }
    ];
};

Template.worldcup.rendered = function () {
    if (!Session.get(sessionKeyPill)) {
        Session.set(sessionKeyPill, 'general');
    }
};


Template.pillElement.isSelectedPill = function () {
    return Session.get(sessionKeyPill) === this.id;
};

Template.pillElement.events({
    "click a": function () {
        Session.set(sessionKeyPill, this.id);
    }
});