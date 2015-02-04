'use strict';

Template.importButton.events({
    'click button#importButton': function (event) {
        var button = $(event.currentTarget);
        
        button.removeClass('btn-error btn-success');
        button.addClass('btn-primary disabled');
        
        Meteor.call('importSuperLeague', function (error) {
            button.removeClass('btn-primary disabled');
            
            if (error) {
                button.addClass('btn-error');
            } else {
                button.addClass('btn-success');
            }
        });
    }
});