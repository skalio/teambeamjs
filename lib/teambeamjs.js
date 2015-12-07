#! /usr/bin/env node

/*
 * teambeamjs
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Henning Verbeek
 * Licensed under the MIT license.
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	pkg = require(path.join(__dirname, '..', 'package.json')),
	program = require('commander'),
	read = require('read');

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
			settings.getUserInput();
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
		settings.getUserInput();
		break;
	case 'upload' :
		console.log('setting data');
		args.forEach(function(filename) {
			upload.addFile(filename);
		});
		upload.setSubject('This is my church');
		upload.setDescription('This is where I heal my hurts.');
		upload.addReceiver({email: 'bob@example.org'});

		settings.loadConfig()
				.then(function() {
					return user.login();
				})
				.then(function() {
					return upload.doit();
				})
				.done();
		break;
	default :
		program.help();
		
}
