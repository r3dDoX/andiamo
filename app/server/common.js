'use strict';

global.andiamo = global.andiamo || {};

_.extend(global.andiamo, {
    scheduleFunction : function scheduleFunction (functionToCall, milliseconds) {
        Meteor.setTimeout(function () {
            functionToCall();
            scheduleFunction(functionToCall, milliseconds);
        }, milliseconds);
    }
});