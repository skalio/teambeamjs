/*
 * settings.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	readlineSync = require('readline-sync'),
	jsonfile = require('jsonfile'),
	osHomedir = require('os-homedir');

var settings = {
	email: undefined,
	password: undefined,
	storagehost: 'transfer.teambeam.de',
	timezone: 'Europe/Berlin'
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
	console.log('Please provide the details of your TeamBeam account.\n\n');
	settings.email = readlineSync.question('Your email address [${defaultInput}]: ', {
		defaultInput: settings.email
	});
	settings.password = readlineSync.question('Your password: ', {
		hideEchoBack: true
	});
	settings.storagehost = readlineSync.question('Hostname [${defaultInput}]: ', {
		defaultInput: settings.storagehost 
	});
	
	if (readlineSync.question('Save settings (y/N)? ') === 'y') {
		jsonfile.writeFileSync(configFile, settings, {spaces: 2});
		console.log('Settings have been saved');
	}
	
};

