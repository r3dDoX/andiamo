/*jslint node: true, browser: true */
/*global Accounts, Meteor, Template */
'use strict';

var usernameTimeout,
    errorClass = 'has-error',
    successClass = 'has-success';

// -------------------------------- LOGIN --------------------------------

function showLoginResult(passwordInput, emailInput, error) {
    if (error) {
        if (error.reason === 'Incorrect password') {
            passwordInput.parentNode.classList.add(errorClass);
            emailInput.parentNode.classList.remove(errorClass);
        } else {
            passwordInput.parentNode.classList.remove(errorClass);
            emailInput.parentNode.classList.add(errorClass);
        }
    } else {
        emailInput.parentNode.classList.add(successClass);
        passwordInput.parentNode.classList.add(successClass);
    }
}

function checkFormAndLogin(event) {
    var loginForm = document.getElementById('loginForm'),
        emailInput = loginForm.querySelector('input[name=email]'),
        passwordInput = loginForm.querySelector('input[name=password]');
    
    Meteor.loginWithPassword(emailInput.value, passwordInput.value, showLoginResult.bind(undefined, passwordInput, emailInput));
}

Template.loginForm.events({
    'click #submitLogin' : checkFormAndLogin,
    
    'keydown input' : function (event) {
        if (event.which === 13) {
            document.getElementById('submitLogin').click();
        }
    }
});

// -------------------------------- REGISTRATION --------------------------------

function registerNewUser() {
    var registrationForm = document.getElementById('registrationForm'),
        password = registrationForm.querySelector('input[name=password]'),
        repeatPassword = registrationForm.querySelector('input[name=repeatPassword]');

    if (password.value && password.value === repeatPassword.value) {
        password.parentNode.classList.remove(errorClass);
        repeatPassword.parentNode.classList.remove(errorClass);

        Accounts.createUser({
            'username' : registrationForm.querySelector('input[name=username]').value,
            'email' : registrationForm.querySelector('input[name=email]').value,
            'password' : password.value
        });
        
        Meteor.call('addUserRoles');
    } else {
        password.parentNode.classList.add(errorClass);
        repeatPassword.parentNode.classList.add(errorClass);
    }
}

function showUsernameCheckResult(usernameInputContainer, error, success) {
    if (success) {
        usernameInputContainer.classList.remove(successClass);
        usernameInputContainer.classList.add(errorClass);
    } else {
        usernameInputContainer.classList.add(successClass);
        usernameInputContainer.classList.remove(errorClass);
    }
}

function checkUsernameAvailability(event) {
    if (usernameTimeout) {
        clearTimeout(usernameTimeout);
        usernameTimeout = undefined;
    }

    usernameTimeout = setTimeout(function () {
        Meteor.call('checkUsername', event.target.value, showUsernameCheckResult.bind(undefined, event.target.parentNode));
    }, 500);
}

Template.registrationForm.events({
    'click #showRegistration' : function () {
        document.getElementById('registrationForm').classList.remove('hidden');
    },
    
    'click #submitRegistration' : registerNewUser,
    
    'keydown input' : function (event) {
        if (event.which === 13) {
            document.getElementById('submitRegistration').click();
        }
    },
    'keyup input[name=username]' : checkUsernameAvailability
});