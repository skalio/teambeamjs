/*
 * reqHelper.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Henning Verbeek
 * Licensed under the MIT license.
 */

'use strict';

var Q = require('q'),
	fs = require('fs'),
	bhttp = require('bhttp'),
	https = require('https');

exports.awesome = function() {
  return 'awesome';
};

var options = {
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

exports.postJson = function(url, body) {
	var defer = Q.defer();
	Q.fcall(function() {
		console.log('POST to %j: %j', url, body);
		return session.post(
				url,
				body
		);
	}).then(function(response) {
		console.log('POST response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(new Error('Request failed: '+ response.body.error.message));
		} else {
			defer.resolve(response.body);
		}
	});
	
	return defer.promise;
};

exports.putFile = function(url, filename, token) {
	var defer = Q.defer();
	
	
	Q.fcall(function() {
		console.log('PUT to %j: %j', url, filename);
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
		console.log('PUT response: %j %j', response.statusCode, response.body);
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

exports.getJson = function(url) {
	var defer = Q.defer();
	Q.fcall(function() {
		return session.get(url);
	}).then(function(response) {
		console.log('GET response: %j %j', response.statusCode, response.body);
		if (response.statusCode >= 400) {
			defer.reject(new Error('Request failed: '+ response.body.error.message));
		} else {
			defer.resolve(response.body);
		}
	}).catch(function(error) {
		defer.reject(error);
	}).done();
	
	return defer.promise;
};

