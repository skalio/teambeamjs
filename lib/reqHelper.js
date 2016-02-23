/*
 * reqHelper.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

/* global process */

'use strict';

var Q = require('q'),
	fs = require('fs'),
	bhttp = require('bhttp'),
	https = require('https'),
	settings = require('./settings');

// setup default options for bhttp requests
// see https://github.com/joepie91/node-bhttp#bhttprequesturl-options-callback
var options = {
	headers: {
		"user-agent": settings.getUserAgent()
	},
	agent: https.globalAgent,	// enables SSL support
	encodeJSON: true
};

// setup initial session
var session = bhttp.session(options);

/**
 * Convenience function, making a HTTP GET request to the given URL.
 * 
 * @param {string} url
 * @returns {Q.Promise}
 */
exports.get = function(url) {
	return exports.call(
			url,
			{
				method: 'get'
			}
	);
};

/**
 * Convenience function, making a HTTP GET request to the given URL. Once
 * resolved, the value of the promise will be a stream.
 * 
 * @param {string} url
 * @returns {Q.Promise}
 */
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

/**
 * Convenience function, making a HTTP POST request to the given URL. The body
 * must be an object which will be JSON encoded.
 * 
 * @param {string} url
 * @param {object} body
 * @returns {Q.Promise}
 */
exports.post = function(url, body) {
	return exports.call(
			url,
			{
				method: 'post',
				formFields: body	// will be JSON-encoded
			}
	);
};

/**
 * Convenience function, making a HTTP DELETE request to the given URL.
 * 
 * @param {string} url
 * @returns {Q.Promise}
 */
exports.delete = function(url) {
	return exports.call(
			url,
			{
				method: 'delete'
			}
	);
};

/**
 * Convenience function, making a HTTP PUT request to the given URL. The
 * given filename must refer to a local file. The given token is inserted
 * as auth-token-header
 * 
 * @param {string} url
 * @param {string} filename
 * @param {string} token
 * @returns {Q.Promise}
 */
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
};
	
/**
 * Makes HTTP requests to the given URL. If the HTTP request failed, it may be
 * repeated.
 * 
 * @param {string} url
 * @param {object} options
 * @returns {Q.Promise}
 */
exports.call = function(url, options) {
	var promise = _makeRequest(url, options);
		
	promise = promise.fail(function(error) {
		switch (error.httpStatusCode) {
			case 401 :
				if (url.endsWith('/auth/login')) {
					// failed login attempts won't get any better when retrying
					throw error;
				}
				
				if (url.endsWith('/auth/logout')) {
					// attempting to logout a non-existing session... 
					return Q.resolve();
				}
				
				console.log('Session has timed out. Reauthenticating and retrying...');
				return process.principal.login().then(function() {
					// retry only once
					return _makeRequest(url, options);
				});
				// unreachable
				
			case 410 :
				console.log('The API has been closed, need to update client');
				throw error;
				
			case 503 :
				var delay = 60;	// in seconds
				console.log('Server is currently in maintenance, retrying in %j seconds', delay);
				return Q.delay(delay * 1000).then(function() {
					// retry forever
					return exports.call(url, options);
				});
			default :
				throw error;
		}
	});
	
	return promise;
};

/**
 * Makes the HTTP request and resolves the returned promise with the result.
 * In the event of an unfavourable HTTP response code, the promise will be
 * rejected with an extended Error object.
 * 
 * @param {string} url
 * @param {object} options
 * @returns {Q.Promise}
 */
function _makeRequest(url, options) {
	options = options || {};
	options.method = options.method || "get";
	
	var defer = Q.defer();
	Q.fcall(function() {
		return session.request(url, options);
	}).then(function(response) {
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
	
	return error;
}

