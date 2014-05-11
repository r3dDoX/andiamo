/*jslint node: true */
/*global Template */
'use strict';

var scrollElementId = 'home',
    scrollBgPic = function (event) {
        var pageElement = document.getElementById(scrollElementId),
            bgPic = pageElement.getElementsByClassName('header')[0],
            initialPositionY = 50,
            newPositionY;

        // stop scroll of bg if pic is out of the viewport
        if (bgPic && pageElement.scrollTop < bgPic.clientHeight) {
            bgPic.style.backgroundPositionY = initialPositionY - pageElement.scrollTop / 20 + '%';
        }
    };

Template.home.rendered = function () {
    document.getElementById(scrollElementId).addEventListener('scroll', scrollBgPic);
    document.getElementById(scrollElementId).addEventListener('touchmove', scrollBgPic);
};

Template.home.destroyed = function () {
    document.getElementById(scrollElementId).removeEventListener('scroll', scrollBgPic);
    document.getElementById(scrollElementId).removeEventListener('touchmove', scrollBgPic);
};