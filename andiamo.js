/*jslint node: true, browser: true */
/*global Meteor */
'use strict';

if (Meteor.isClient) {
    if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement('style');
        msViewportStyle.appendChild(document.createTextNode('@-ms-viewport{width:auto!important}'));
        
        document.getElementsByTagName('head')[0].appendChild(msViewportStyle);
    }
    
    Meteor.AppCache.config({onlineOnly: ['/styles/bootstrap-3.2.0']});
}