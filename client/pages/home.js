/*jslint node: true, nomen: true, plusplus: true, browser: true */
/*global Meteor, Template, StandingsSuperLeague:true */
'use strict';

var scrollElementId = 'home',
    initialPositionY = 50,
    
    scrollBgPic = function (pageElement, bgPic, event) {
        if (bgPic && pageElement.scrollTop < bgPic.clientHeight) {
            bgPic.style.backgroundPositionY = (initialPositionY - pageElement.scrollTop / 25) + '%';
        }
    };

Template.home.rendered = function () {
    var pageElement = document.getElementById(scrollElementId),
        bgPic = pageElement.getElementsByClassName('header')[0],
        scrollBgPicPartial = scrollBgPic.bind(this, pageElement, bgPic),
        width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    
    if (width >= 768) { // if xs device, don't load big Pic
        bgPic.style.backgroundImage = 'url("/arena.jpg")';
    }
    
    document.getElementById(scrollElementId).addEventListener('scroll', scrollBgPicPartial);
    document.getElementById(scrollElementId).addEventListener('touchmove', scrollBgPicPartial);
};

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
