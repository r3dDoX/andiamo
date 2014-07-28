/*jslint node: true */
/*global Meteor, Template */
'use strict';

Template.importButton.events({
    'click button#importButton': function (event) {
        var button = event.target,
            classList = button.classList,
            pageId = document.getElementsByClassName('page center')[0].id;
        
        classList.remove('btn-error');
        classList.remove('btn-success');
        classList.add('btn-primary');
        classList.add('disabled');
        
        Meteor.call(pageId, function (error, success) {
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