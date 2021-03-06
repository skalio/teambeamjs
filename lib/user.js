/*
 * user.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	reqHelper = require('./reqHelper'),
	settings = require('./settings'),
	logHelper = require('./logHelper');
	
var User = function() {};	// new function object

User.prototype.import = function(input) {
	input = input || {};
	
	this.email = input.email;
	this.realname = input.realname;
	this.timezone = input.timezone || settings.get('timezone');
	this.lang = input.lang;
	this.clientType = input.clientType;
};

User.prototype.login = function() {
	var defer = Q.defer();
	var that = this;
	that.email = settings.get('email');
	
	logHelper.consoleOutput('Logging in user "' + that.email + '"');
		
	var url = settings.getBaseUrl() +'/rs/v1/auth/login';
	var body = {
		email: that.email,
		password: '{PLAIN}' + settings.get('password')
	};
	
	reqHelper.post(url, body).then(function(result) {
		that.import(result);
		logHelper.consoleOutput('User "' + that.email + '" has logged in successfully');
		defer.resolve(result);
	}).done();
	
	return defer.promise;
};

User.prototype.logout = function() {
	var that = this;
	var url = settings.getBaseUrl() +'/rs/v1/auth/logout';
	return reqHelper.post(url, {})
	.then(function(result) {
		logHelper.consoleOutput('User "' + that.email + '" has logged out successfully');
		return that;
	});
};

/**
 * Fetches a onetimekey for the current user. The key is available in field
 * `onetimekey` of the user.
 * @returns {User}
 */
User.prototype.getOnetimeKey = function() {
	var that = this;
	var url = settings.getBaseUrl() +'/rs/v1/auth/oneTimeKey';
	
	return reqHelper.get(url)
	.then(function(result) {
		that.onetimeKey = result;
		return that;
	});
};


exports = module.exports = User;
