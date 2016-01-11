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

exports.login = function() {
	var url = settings.getBaseUrl() +'/rs/v1/auth/login';
	var body = {
		email: settings.get('email'),
		password: '{PLAIN}' + settings.get('password')
	};
	
	return reqHelper.postJson(url, body);
};
