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
	settings = require('./teambeamjs').settings;

var User = function(input) {
	this.import(input);
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
	var url = settings.getBaseUrl() +'/rs/v1/auth/login';
	var body = {
		email: settings.get('email'),
		password: '{PLAIN}' + settings.get('password')
	};
	
	return reqHelper.post(url, body)
	.then(function(result) {
		that.import(result);	// not sure if this works...
		return that;
	});
};

User.prototype.logout = function() {
	var url = settings.getBaseUrl() +'/rs/v1/auth/logout';
	return reqHelper.post(url, {});
};

exports = module.exports = User;
