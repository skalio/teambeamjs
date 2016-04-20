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
	request = require('request'),
	https = require('https'),
	settings = require('./settings');

// setup initial session. http client "request"
var session = request.defaults({jar: true});	//enable cookies


var g_options = {
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json, text/javascript, */*',
        'Accept-Charset': 'utf-8',
		'user-agent': settings.getUserAgent()
	},
	agent: https.globalAgent,	// enables SSL support
	json: true
};

/**
 * Convenience function, making a HTTP GET request to the given URL.
 * 
 * @param {string} url
 * @returns {Q.Promise}
 */
exports.get = function(url) {
	return exports.call(
		{
			url: url,
			method: 'get'
		}
	);
};

/**
 * Convenience function, making a HTTP GET request to the given URL. Once
 * resolved, the value of the promise will be a stream.
 * 
 * @param {string} url
 * @param {object} options
 * @returns {Q.Promise}
 */
exports.getAsStream = function(url, options) {
	return exports.call(
		{
			url: url,
			method: 'get',
			stream: true,
			path: options.basedir,
			objectIdOrName: options.use_filename
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
	g_options.url = url;
	g_options.method ='post';
	g_options.body = body;
	var length = Buffer.byteLength(JSON.stringify(body), 'utf8');
	g_options.headers['Content-Length'] = length;
	
	return exports.call(g_options);
};

/**
 * Convenience function, making a HTTP DELETE request to the given URL.
 * 
 * @param {string} url
 * @returns {Q.Promise}
 */
exports.delete = function(url) {
	return exports.call(
		{
			url: url,
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
		{
			url: url,
			method: 'put',
			filename: filename,
			json: false,
			headers: {
				'X-Skp-Auth': token
			}
		}
	);
};

exports.call = function(options) {
	var promise = _makeRequest(options);
	promise = promise.fail(function(error) {
		switch (error.httpStatusCode) {
			case 401 :
				if (options.url.endsWith('/auth/login')) {
					// failed login attempts won't get any better when retrying
					throw error;
				}
				
				if (options.url.endsWith('/auth/logout')) {
					// attempting to logout a non-existing session... 
					return Q.resolve();
				}
				
				console.log('Session has timed out. Reauthenticating and retrying...');
				return process.principal.login().then(function() {
					// retry only once
					return _makeRequest(options);
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
					return exports.call(options);
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
 * @param {object} options
 * @returns {Q.Promise}
 */
function _makeRequest(options) {
	var defer = Q.defer();
	options = options || {};
	options.method = options.method || "get";
	
	var proxy = settings.getProxy();
	if(typeof proxy !== "undefined") {
		options.proxy = proxy;
	}
	
	//callback function
	function callback(error, response, body) {
		if(error) {		
			throw error;
		} 
		if (response.statusCode >= 400) {
			defer.reject(_exceptionToError(response));
		} else {
			if (options.method === "put" || options.stream) {
				defer.resolve(response);
			} else {
				defer.resolve(response.body);
			}
		}
	}
	
	//making request
	if(options.method === "put") {
		fs.createReadStream(options.filename).pipe(session(options, callback));
	} else if(options.stream) {
		session(options, callback).pipe(fs.createWriteStream(options.path + "/" + options.objectIdOrName));
	} else {
		session(options, callback);
	}
	
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
	if (typeof response.body.error !== "undefined" && response.body.error.code) {
		error.code = response.body.error.code;
	}
	
	return error;
}

/**
* Checks if a given string conforms to a email address.
* @param {string} querystring
* @returns Promise
*/
exports.validateEmail = function (querystring) {
	var deferred = Q.defer();
	var validateEmail = settings.getBaseUrl() + "/rs/v1/validate/email?q=" + encodeURIComponent(querystring);
	
	exports.get(validateEmail)
	.then(function(result) {
		deferred.resolve(result);
	});
	return deferred.promise;
};