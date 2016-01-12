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
	pkg = require(path.join(__dirname, '..', 'package.json')),
	program = require('protogram').create(),
	help = require('protogram-help');

var settings = exports.settings = require('./settings');
var user = require('./user'),
	upload = require('./upload');

help.set({
	version: pkg.version,
	name: 'TeamBeam CLI',
	handleError: true
});

program
		.command('*', { includeRoot: true})
		.option('--help', help)
		.option('--config', {
			description: 'Specify the configfile',
			required: 'filename with path',
			action: function(value) {
				console.log('config option %j', value);
			},
			error: function(err, args) {
				console.log('Error: %j', err.message);
			}
		});

/**
 * sub-command 'init'
 */
program
		.command('init', {
			description: 'initialises a config file',
			action: function(args, flags) {
				settings.loadConfig()
				.catch(function(error) {
					console.log('Creating a new config file');
				})
				.fin(function() {
					settings.getUserInput();	
				}).done();
			}
		});

/**
 * sub-command 'upload'
 */
program
		.command('upload', {
			description: 'upload files',
			required: 'file [additional files]',
			action: function(args, flags) {
				flags.files = [].concat(args);
				
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
					console.log('upload object: %j', flags);
					return upload.doit(flags);
				})
				.catch(function(error) {
					console.log('Error: %j', error.message);
				})
				.done();
			},
			error: function(err, args) {
				console.log(err.message);
			}
		}).option('--subject', {
			shortcut: '-s',
			description: 'Set the transfer subject',
			required: 'string'
		}).option('--message', {
			shortcut: '-m',
			description: 'Set the transfer message',
			required: 'string'
		}).option('--to', {
			shortcut: '-T',
			description: 'Add a recipient (repeat possible)',
			required: 'email address'
		}).option('--cc', {
			shortcut: '-C',
			description: 'Add a recipient in copy (repeat possible)',
			required: 'email address'
		}).option('--bcc', {
			shortcut: '-B',
			description: 'Add a recipient in blind copy (repeat possible)',
			required: 'email address'
		});

/**
 * Default behaviour without sub-comands
 */
program.option('--version', {
	action: function() {
		console.log(pkg.name +' '+ pkg.version);
	}
});
program.action = function(args, flags) {
	// todo: show usage here
	console.log('Default args: %j, flags: %j', args, flags);
};

program.parse(process.argv);
