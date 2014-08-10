'use strict';

var nameFormSelector = 'form[name=displayName]',
    passwordFormSelector = 'form[name=password]',
    errorClass = 'has-error',
    successClass = 'has-success';

function handleKeyPresses(selector, updateFunction, event) {
    $(selector).removeClass(errorClass + ' ' + successClass);
        
    if (event.which === 13) {
        event.preventDefault();
        updateFunction();
    }
}

function updateDisplayName() {
    var displayName = $(nameFormSelector + ' input').val();
        
    if (displayName) {
        Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.name': displayName}});
        Meteor.call('updateStandingsTable');
        $(nameFormSelector + ' .form-group').addClass(successClass);
    }
}

function markPasswordFields(error) {
    var formGroup = $(passwordFormSelector + ' .form-group');
    
    if (error) {
        console.log(error);
        formGroup.addClass(errorClass);
    } else {
        formGroup.addClass(successClass);
    }
}

function updatePassword() {
    var passwordOld = $(passwordFormSelector + ' #profile_password_old').val(),
        passwordNew = $(passwordFormSelector + ' #profile_password_new').val(),
        passwordRetype = $(passwordFormSelector + ' #profile_password_retype').val();
    
    if (passwordOld && passwordNew && passwordNew === passwordRetype) {
        Accounts.changePassword(passwordOld, passwordNew, markPasswordFields);
    } else {
        $(passwordFormSelector + ' .form-group').addClass(errorClass);
    }
}

Template.profile.events({
    'keypress form[name=displayName] input': handleKeyPresses.bind(undefined, nameFormSelector + ' .form-group', updateDisplayName),
    'click form[name=displayName] button': updateDisplayName,
    'keypress form[name=password] input': handleKeyPresses.bind(undefined, passwordFormSelector + ' .form-group', updatePassword),
    'click form[name=password] button': updatePassword
});