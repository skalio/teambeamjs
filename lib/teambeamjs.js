#! /usr/bin/env node

/*
 * teambeamjs
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
	pkg = require(path.join(__dirname, '..', 'package.json')),
	program = require('commander');

var settings = exports.settings = require('./settings');
var user = require('./user'),
	upload = require('./upload');
var command = null;
var args = [];

function increaseVerbosity(v, total) {
	return total + 1;
}

program
		.version(pkg.version)
		.option('-c, --config <config>', 'Config file to use')
		.option('-v, --verbose', 'Increase verbosity of log information', increaseVerbosity, 0);

program
		.command('init')
		.description('initialises a config file')
		.action(function() {
			command = 'init';
		});
		
program
		.command('upload [file] [otherfiles...]')
		.description('upload one or more files')
		.action(function(firstFile, moreFiles) {
			command = 'upload';
			args = [firstFile].concat(moreFiles);
		});
		
program
		.parse(process.argv);

if (program.config) {
	settings.useConfig(program.config);
}

switch (command) {
	case 'init' :
		settings.loadConfig()
		.catch(function(error) {
			console.log('Creating a new config file');
		})
		.fin(function() {
			settings.getUserInput();	
		}).done();
		break;
		
	case 'upload' :
		settings.loadConfig()
		.catch(function(error) {
			// user hasn't given us settings yet
			return settings.getUserInput();
		})
		.then(function() {
			return user.login();
		})
		.then(function() {
			// do the upload
			var options = {
				files: args
			};
			return upload.doit(options);
		})
		.catch(function(error) {
			console.log('Error: %j', error.message);
		})
		.done();
		break;
		
	default :
		program.help();
		
}
