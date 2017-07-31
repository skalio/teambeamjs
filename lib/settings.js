/*
 * settings.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

/* global process, __dirname */

'use strict';

var Q = require('q'),
	path = require('path'),
	readlineSync = require('readline-sync'),
	jsonfile = require('jsonfile'),
	osHomedir = require('os-homedir'),
	os = require('os');
	//utf8 = require('utf8');//console.log('utf8 z 21: ', utf8);	
	
var	pkg = require(path.join(__dirname, '..', 'package.json'));

// The userAgent used in the HTTP requests
var separator = "; ";
var userAgent = pkg.name +"/"+ pkg.version + separator + 
		os.platform() +"/"+ os.release() +"/"+ os.arch() + separator +
		"node/"+ process.version;// + separator +
		//"utf8/"+ utf8.version;
	

var Settings = function() {
	this.storagehost = 'transfer.teambeam.de';
	this.timezone = 'Europe/Berlin';
	this.configFile = path.join(osHomedir(), '.teambeamjs');
	this.verbose = false;
	
	this.getUserAgent = function() {
		return userAgent;
	};
};

Settings.prototype.useConfig = function(conf) {
	this.configFile = conf;
	console.log('Configfile has been set to %j', this.configFile);
};

Settings.prototype.get = function(key) {
	var that = this;
	var val = that.hasOwnProperty(key) ? that[key] : null;
	// console.log('Setting %j ==> %j', key, val);
	return val;
};

Settings.prototype.getBaseUrl = function() {
	return 'https://'+ this.storagehost;
};

Settings.prototype.loadConfig = function() {
	var defer = Q.defer();
	var data,
		i,
		fields = ['email', 'password', 'storagehost'];

	try {
		data = jsonfile.readFileSync(this.configFile);
		for (i=0; i<fields.length; i++) {
			var prop = fields[i];
			if (data.hasOwnProperty(prop)) {
				this[prop] = data[prop];
			}
		}
		// console.log('Settings imported: %j', settings);
		
		defer.resolve();
		
	} catch (error) {
		console.log('Settings could not be imported');
		defer.reject(error);
	}
	
	return defer.promise;
};

Settings.prototype.getUserInput = function() {
	var settings = this;
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
		jsonfile.writeFileSync(settings.configFile, settings, {spaces: 2});
		console.log('Settings have been saved');
	}
	
};

exports = module.exports = new Settings();
