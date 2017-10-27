/*
 * settings.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

/* global __dirname */

'use strict';

var Q = require('q'),
	path = require('path'),
	readlineSync = require('readline-sync'),
	jsonfile = require('jsonfile'),
	osHomedir = require('os-homedir'),
	os = require('os');	
	
var	pkg = require(path.join(__dirname, '..', 'package.json'));

// The userAgent used in the HTTP requests
var separator = "; ";
var userAgent = pkg.name +"/"+ pkg.version + separator + 
		os.platform() +"/"+ os.release() +"/"+ os.arch();

var Settings = function() {
	this.storagehost = 'transfer.teambeam.de';
	this.timezone = 'Europe/Berlin';
	this.configFile = path.join(osHomedir(), '.teambeamjs');
	this.verbose = false;
	this.quiet = false;
	this.proxy = undefined;
	this.logfile = false;
	
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
	
	return val;
};

/**
 * return base url
 * @returns {string}
 */
Settings.prototype.getBaseUrl = function() {
	return 'https://' + this.storagehost;
};

/**
 * return proxy options
 * @returns {string}
 */
Settings.prototype.getProxy = function() {
	if (typeof this.proxy === "undefined") {
		return;		//without proxy
	}
	if(typeof this.proxy.auth !== "undefined") {
		return "http://" + this.proxy.auth.user + ":" + this.proxy.auth.password + "@" + this.proxy.host + ":" + this.proxy.port;	//with proxy with password
	} else {
		return "http://" + this.proxy.host + ":" + this.proxy.port;		//with proxy without password
	}
	
};

Settings.prototype.loadConfig = function() {
	var defer = Q.defer();
	var data,
		i,
		fields = ['email', 'password', 'storagehost', 'proxy'];

	try {
		data = jsonfile.readFileSync(this.configFile);
		for (i=0; i<fields.length; i++) {
			var prop = fields[i];
			if (data.hasOwnProperty(prop)) {
				this[prop] = data[prop];
			}
		}
		defer.resolve();
		
	} catch (error) {
		console.log('Settings could not be imported');
		defer.reject(error);
	}
	
	return defer.promise;
};

/**
 * save login data
 * @returns {undefined}
 */
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
	
	//show the question with the right default entring/presseing
	var proxyQuery;
	if(typeof settings.proxy !== 'undefined') {
		proxyQuery = readlineSync.question('Proxy (Y/n)? ');
		if(proxyQuery === "") {
			proxyQuery = 'y';
		}
	} else {
		proxyQuery = readlineSync.question('Proxy (y/N)? ');
	}
	
	if (proxyQuery === 'y' || proxyQuery === 'Y') {
		if(typeof settings.proxy === "undefined") {
			settings.proxy = {};
		}
		settings.proxy.host = readlineSync.question('Proxy host [${defaultInput}]: ', {
			defaultInput: settings.proxy.host
		});
		settings.proxy.port = readlineSync.question('Proxy port [${defaultInput}]: ', {
			defaultInput: settings.proxy.port
		});
		
		//show the question with the right default entring/presseing
		var proxyAuthQuery;
		if(typeof settings.proxy.auth !== "undefined") {
			proxyAuthQuery = readlineSync.question('Proxy authenticating (Y/n)? ');
			if(proxyAuthQuery === "") {
				proxyAuthQuery = 'y';
			}
		} else {
			proxyAuthQuery = readlineSync.question('Proxy authenticating (y/N)? ');
		}
		
		if (proxyAuthQuery === 'y' || proxyAuthQuery === 'Y') {
			if(typeof settings.proxy.auth === "undefined") {
				settings.proxy.auth = {};
			}
			settings.proxy.auth.user = readlineSync.question('Proxy user [${defaultInput}]: ', {
				defaultInput: settings.proxy.auth.user
			});
			settings.proxy.auth.password = readlineSync.question('Proxy password: ', {
				hideEchoBack: true
			});
		} else {
			delete settings.proxy.auth;	//deleting the password part of proxy
		}
	} else {
		delete settings.proxy;		//deleting the proxy part
	}
	
	if (readlineSync.question('Save settings (y/N)? ') === 'y') {
		jsonfile.writeFileSync(settings.configFile, settings, {spaces: 2});
		console.log('Settings have been saved');
	}
	
};

exports = module.exports = new Settings();
