'use strict';

global.andiamo = global.andiamo || {};

_.extend(global.andiamo, {
    scheduleFunction : function scheduleFunction (functionToCall, milliseconds) {
        functionToCall();
        Meteor.setTimeout(scheduleFunction.bind(undefined, functionToCall, milliseconds), milliseconds);
    }
});