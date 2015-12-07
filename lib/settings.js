/*
 * settings.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Henning Verbeek
 * Licensed under the MIT license.
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	read = require('read'),
	jsonfile = require('jsonfile'),
	osHomedir = require('os-homedir');

var settings = {
	email: undefined,
	password: undefined,
	storagehost: 'transfer.teambeam.de'
};
var configFile = path.join(osHomedir(), '.teambeamjs');

exports.useConfig = function(conf) {
	configFile = conf;
	console.log('Configfile has been set to %j', configFile);
};

exports.get = function(key) {
	var val = settings.hasOwnProperty(key) ? settings[key] : null;
	console.log('Setting %j ==> %j', key, val);
	return val;
};

exports.getBaseUrl = function() {
	return 'https://'+ settings.storagehost;
};

exports.loadConfig = function() {
	var defer = Q.defer();
	var data,
		i,
		fields = ['email', 'password', 'storagehost'];

	try {
		data = jsonfile.readFileSync(configFile);
		for (i=0; i<fields.length; i++) {
			var prop = fields[i];
			if (data.hasOwnProperty(prop)) {
				settings[prop] = data[prop];
			}
		}
		console.log('Settings imported: %j', settings);
		
		defer.resolve();
		
	} catch (error) {
		console.log('Settings could not be imported');
		defer.reject(error);
	}
	
	return defer.promise;
};

exports.getUserInput = function() {
	Q.fcall(function() {
		var def = Q.defer();
		read({
			prompt: 'Email address:'
		}, function(error, data, isDefault) {
			settings.email = data;
			def.resolve();
		});
		return def.promise;
	}).then(function() {
		var def = Q.defer();
		read({
			prompt: 'Password:',
			silent: true
		}, function(error, data, isDefault) {
			settings.password = data;
			def.resolve();
		});
		return def.promise;
	}).then(function() {
		var def = Q.defer();
		read({
			prompt: 'Hostname:',
			default: settings.storagehost
		}, function(error, data, isDefault) {
			settings.storagehost = data;
			def.resolve();
		});
		return def.promise;
	}).then(function() {
		var def = Q.defer();
		console.log(' Settings: %j', settings);
		read({
			prompt: 'Save settings (y/N)?'
		}, function(error, data, isDefault) {
			if (data !== 'y') {
				def.resolve();
				return;
			}
			
			jsonfile.writeFileSync(configFile, settings, {spaces: 2});
			console.log('Settings have been saved');
		});
		return def.promise;
	}).done();
};

