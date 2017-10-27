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
	readlineSync = require('readline-sync');

/**
 * Creates a new File object
 */	
var LogHelper = function() {};

var writeToLogfile = function(thisOutput) {
	var writestream = logfilestream({
		logdir: './logfiles',
		nameformat: '[logfile_]YYYY-MM-DD[.txt]',
		duration: 60000 * 60 * 24
	});

	writestream.write(thisOutput + '\n');
	writestream.end();
};

LogHelper.prototype.consoleOutput = function(thisOutput) {
	//var logFolder = createLogFolder();
	if (!settings.quiet) {
		console.log(thisOutput);
	}
	
	if(settings.logfile) {
		var thisTime = new Date(); 
		thisTime = moment(thisTime).format("YYYY-MM-DD - HH:mm:ss");
		writeToLogfile(thisTime + ": " + thisOutput);
	}
};

LogHelper.prototype.createLogFolder = function(test) {
	console.log('createLogFolder()..............47: ', test);//options.dir = options.dir || path.join(osHomedir(), 'Downloads', 'transfers');
	this.logFolder = readlineSync.question('Folder to save logfiles: ', {
		//defaultInput: settings.email
	});
	console.log('createLogFolder()..............52: ', this.logFolder);
};


exports = module.exports = new LogHelper();
