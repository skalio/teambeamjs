/*
 * logHelper.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var settings = require('./settings'),
	logfilestream = require('logfilestream'),
	moment = require('moment'),
	fs = require('fs'),
	readlineSync = require('readline-sync'),
	jsonfile = require('jsonfile');

/**
 * Creates a new File object
 */	
var LogHelper = function() {};

var writeToLogfile = function(thisOutput) {
	//write the logfiles
	var writestream = logfilestream({
		logdir: settings.logFolder,					//path of logFolder
		nameformat: '[logfile_]YYYY-MM-DD[.txt]',
		duration: 60000 * 60 * 24					//duration is currently one day (sec * min * 24)
	});

	writestream.write(thisOutput + '\n');
	writestream.end();
};

LogHelper.prototype.consoleOutput = function(thisOutput) {
	if (!settings.quiet) {		//console output
		console.log(thisOutput);
	}
	
	if(settings.logfile) {
		//make a string >>> adding a timestamp to the output 
		var thisTime = new Date(); 
		thisTime = moment(thisTime).format("YYYY-MM-DD - HH:mm:ss");
		writeToLogfile(thisTime + ": " + thisOutput);
	}
	
	if(thisOutput.indexOf(" has logged out successfully") !== -1) {
		settings.logfile = false;	//set logfile on false after user has been logged out
	}
};

LogHelper.prototype.createLogFolder = function() {
	//loading from .teambeamjs(configFile) and set the path for logFolder
	settings.loadConfig().then(function() {
		settings.logFolder = readlineSync.question('Folder to save logfiles [${defaultInput}]: ', {
			defaultInput: settings.logFolder
		});
		jsonfile.writeFileSync(settings.configFile, settings, {spaces: 2});		// saving logFolder in configFile
		
		if (!fs.existsSync(settings.logFolder)) {
			fs.mkdirSync(settings.logFolder);		//creating the logFolder if not already existing
		}
	}).done();
};

exports = module.exports = new LogHelper();
