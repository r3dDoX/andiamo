'use strict';

Template.importButton.events({
    'click button#importButton': function (event) {
        var button = event.target,
            classList = button.classList;
        
        classList.remove('btn-error');
        classList.remove('btn-success');
        classList.add('btn-primary');
        classList.add('disabled');
        
        Meteor.call('importSuperLeague', function (error) {
            classList.remove('disabled');
            classList.remove('btn-primary');
            
            if (error) {
                classList.add('btn-error');
                console.log(error);
            } else {
                classList.add('btn-success');
            }
        });
    }
});