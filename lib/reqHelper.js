/*
 * reqHelper.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	fs = require('fs'),
	bhttp = require('bhttp'),
	https = require('https'),
	path = require('path'),
	pkg = require(path.join(__dirname, '..', 'package.json'));

var principal = require('./teambeamjs').principal;

var options = {
	headers: {
		"user-agent": pkg.name +"/"+ pkg.version
	},
	agent: https.globalAgent,
	encodeJSON: true
};

var session = bhttp.session(options);

/**
 * Creates an Error based on the response body format
 * @param {type} responseBody
 * @returns {Error}
 */
function exceptionToError(responseBody) {
	var parts = [];
	if (responseBody.error) {
		parts = [responseBody.error.message].concat(responseBody.error.details);
	}
	var error = new Error(parts.join(' '));
	
	if (responseBody.error.code && (responseBody.error.code > 0)) {
		error.code = responseBody.error.code;
	}
	// console.log('Error message: %j', error.message);
	
	return error;
}

exports.getEnvironment = function() {
	Q.fcall(function() {
		return session.get(
				'https://transfer.teambeam.de/rs/v1/environment',
				options
		);
	}).then(function(response) {
		var env = response.body;
		console.log('Version: %j', env.server_version);
	}).done();
};

exports.post = function(url, body) {
	var defer = Q.defer();
	Q.fcall(function() {
		// console.log('POST to %j: %j', url, body);
		return session.post(
				url,
				body
		);
	}).then(function(response) {
		if (response.statusCode >= 400) {
			defer.reject(exceptionToError(response.body));
		} else {
			defer.resolve(response.body);
		}
	});
	
	return defer.promise;
};

exports.delete = function(url) {
	var defer = Q.defer();
	Q.fcall(function() {
		// console.log('DELETE to %j: %j', url);
		return session.delete(url);
	}).then(function(response) {
		// console.log('DELETE response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(exceptionToError(response.body));
		} else {
			defer.resolve(response.body);
		}
	});
	
	return defer.promise;
};

exports.putFile = function(url, filename, token) {
	var defer = Q.defer();
	
	
	Q.fcall(function() {
		// console.log('PUT to %j: %j', url, filename);
		return session.put(
				url,
				fs.createReadStream(filename),
				{
					encodeJSON: false,
					headers: {
						'X-Skp-Auth': token
					}
				}
		);
	}).then(function(response) {
		// console.log('PUT response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(new Error('Request failed: '+ response.body.error.message));
		} else {
			defer.resolve(response.body);
		}
	}).catch(function(error) {
		console.log('Oops, that didnt go well: %j', error);
		defer.reject(new Error(error));
	});
	
	return defer.promise;
};

exports.get = function(url) {
	var defer = Q.defer();
	Q.fcall(function() {
		return session.get(url);
	}).then(function(response) {
		// console.log('GET response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(exceptionToError(response.body));
		} else {
			defer.resolve(response.body);
		}
	}).fail(function(error) {
		// need to evaluate if it is a http 401, in which case
		// a login shall be performed, then the request be repeated
	});
	
	return defer.promise;
};

exports.getAsStream = function(url) {
	return session.get(url, {
		stream: true
	});
};
