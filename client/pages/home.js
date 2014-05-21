/*jslint node: true */
/*global Template */
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
        scrollBgPicPartial = scrollBgPic.bind(this, pageElement, bgPic);
    
    document.getElementById(scrollElementId).addEventListener('scroll', scrollBgPicPartial);
    document.getElementById(scrollElementId).addEventListener('touchmove', scrollBgPicPartial);
};