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

var options = {
	headers: {
		"user-agent": pkg.name +"/"+ pkg.version
	},
	agent: https.globalAgent,
	encodeJSON: true
};

var session = bhttp.session(options);

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

exports.get = function(url) {
	return exports.call(
			url,
			{
				method: 'get'
			}
	);
};

exports.getAsStream = function(url) {
	/*
	return session.get(url, {
		stream: true
	});
	*/
	return exports.call(
			url,
			{
				method: 'get',
				stream: true
			}
	);
};


exports.post = function(url, body) {
	return exports.call(
			url,
			{
				method: 'post',
				inputBuffer: body
			}
	);
};

exports.delete = function(url) {
	return exports.call(
			url,
			{
				method: 'delete'
			}
	);
};

exports.putFile = function(url, filename, token) {
	return exports.call(
			url,
			{
				method: 'put',
				encodeJSON: false,
				headers: {
					'X-Skp-Auth': token
				},
				inputStream: fs.createReadStream(filename)
			}		
	);

	/*
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
	*/
};
	
exports.call = function(url, options) {
	var promise = _makeRequest(url, options);
		
	promise = promise.fail(function(error) {
		console.log('got an error: %j (%j)', error.message, error.httpStatusCode);
		switch (error.httpStatusCode) {
			case 401 :
				console.log('attempting autologin');
				return process.principal.login().then(function() {
					console.log('repeating GET');
					return _makeRequest(url, options);
				});
				break;
			default :
				throw error;
		}
	});
	
	return promise;
};

function _makeRequest(url, options) {
	options = options || {};
	options.method = options.method || "get";
	
	console.log('request url: %j, options: %j', url, options);
	
	var defer = Q.defer();
	Q.fcall(function() {
		var promise = session.request(url, options);
		debugger;
		return promise;
	}).then(function(response) {
		console.log('response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(_exceptionToError(response));
		} else {
			defer.resolve(response.body);
		}
	});
	
	return defer.promise;
}

/**
 * Creates an Error based on the response body format
 * @param {http.IncomingMessage} response
 * @returns {Error}
 */
function _exceptionToError(response) {
	var parts = [];
	if (response.body.error) {
		parts = [response.body.error.message].concat(response.body.error.details);
	}
	var error = new Error(parts.join(' '));
	
	error.httpStatusCode = response.statusCode;
	error.code = 0;
	if (response.body.error.code) {
		error.code = response.body.error.code;
	}
	// console.log('Error message: %j', error.message);
	
	return error;
}

