/*jslint node: true */
/*global Accounts, Meteor, Template */
'use strict';

Template.loginForm.events({
    'click #submitLogin' : function () {
        var loginForm = document.getElementById('loginForm'),
            emailInput = loginForm.querySelector('input[name=email]'),
            passwordInput = loginForm.querySelector('input[name=password]'),
            callback = function (error) {
                if (error) {
                    emailInput.parentNode.classList.add('has-error');
                    passwordInput.parentNode.classList.add('has-error');
                } else {
                    emailInput.parentNode.classList.add('has-success');
                    passwordInput.parentNode.classList.add('has-success');
                }
            };
        
        Meteor.loginWithPassword(emailInput.value, passwordInput.value, callback);
    }
});

Template.registrationForm.events({
    'click #showRegistration' : function () {
        document.getElementById('registrationForm').classList.remove('hidden');
    },
    
    'click #submitRegistration' : function () {
        var registrationForm = document.getElementById('registrationForm'),
            password = registrationForm.querySelector('input[name=password]'),
            repeatPassword = registrationForm.querySelector('input[name=repeatPassword]');
        
        if (password.value !== '' && password.value === repeatPassword.value) {
            password.parentNode.classList.remove('has-error');
            repeatPassword.parentNode.classList.remove('has-error');
            
            Accounts.createUser({
                'username' : registrationForm.querySelector('input[name=username]').value,
                'email' : registrationForm.querySelector('input[name=email]').value,
                'password' : password
            });
        } else {
            password.parentNode.classList.add('has-error');
            repeatPassword.parentNode.classList.add('has-error');
        }
    }
});

Template.registrationForm.rendered = function () {
    var usernameTimeout,
        registrationForm = document.getElementById('registrationForm');
    
    registrationForm.querySelector('input[name=username]').addEventListener('keyup', function (event) {
        var usernameInputContainer = event.target.parentNode,
            username = event.target.value,
            checkUsernameCallback = function (result) {
                if (result) {
                    usernameInputContainer.classList.remove('has-success');
                    usernameInputContainer.classList.add('has-error');
                } else {
                    usernameInputContainer.classList.add('has-success');
                    usernameInputContainer.classList.remove('has-error');
                }
            };
        
        if (usernameTimeout) {
            clearTimeout(usernameTimeout);
            usernameTimeout = undefined;
        }
        
        usernameTimeout = setTimeout(function () {
            Meteor.call('checkUsername', username, checkUsernameCallback);
        }, 500);
    });
};