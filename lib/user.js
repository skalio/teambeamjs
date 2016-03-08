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
	settings = require('./settings');

var User = function(input) {
	//	this.import(input);
};

User.prototype.import = function(input) {
	input = input || {};
	
	this.email = input.email;
	this.realname = input.realname;
	this.timezone = input.timezone || settings.get('timezone');
	this.lang = input.lang;
	this.clientType = input.clientType;
};

User.prototype.login = function() {
	var that = this;
	that.email = settings.get('email');
	
	console.log('Logging in user %j', that.email);
	var url = settings.getBaseUrl() +'/rs/v1/auth/login';
	var body = {
		email: that.email,
		password: '{PLAIN}' + settings.get('password')
	};
	
	return reqHelper.post(url, body)
	.then(function(result) {
		that.import(result);	// not sure if this works...
		console.log('User %j has logged in successfully', that.email);
		return that;
	});
};

User.prototype.logout = function() {
	var that = this;
	var url = settings.getBaseUrl() +'/rs/v1/auth/logout';
	return reqHelper.post(url, {})
	.then(function(result) {
		console.log('User %j has logged out successfully', that.email);
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
