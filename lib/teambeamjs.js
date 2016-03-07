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

/* global process */

'use strict';

var Q = require('q'),
	path = require('path'),
	pkg = require(path.join(__dirname, '..', 'package.json')),
	program = require('protogram').create(),
	help = require('protogram-help');

var settings = require('./settings');

var User = require('./user');
process.principal = new User();

// other modules
var upload = require('./upload'),
	download = require('./download');

help.set({
	version: pkg.version,
	name: 'TeamBeam CLI',
	handleError: true
});

/**
 * options applicable to all sub-commands
 */
program
		.command('*', { includeRoot: true})
		.option('--help', help)
		.option('--config', {
			description: 'Specify the configfile',
			required: 'filename with path',
			action: function(value) {
				console.log('config option %j', value);
				settings.useConfig(value);
			},
			error: function(err, args) {
				console.log('Error: %j', err.message);
			}
		}).option('--verbose', {
			description: 'Increase verbosity of output',
			shortcut: '-v',
			action: function() {
				console.log('User requested to increase the verbosity');
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
					return process.principal.login();
				})
				.then(function() {
					// do the upload
					return upload.doit(flags);
				})
				.then(function() {
					return process.principal.logout();
				})
				.fail(function(error) {
					console.log('Error %j: %j', error.code, error.message);
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
		}).option('--passphrase', {
			shortcut: '-P',
			description: 'Protect the transfer with a passphrase',
			required: 'passphrase'
		});
		
/**
 * sub-command 'download'
 */
program
		.command('download', {
			description: 'Download files from your inbox',
			action: function(args, flags) {
								
				if (flags.help) {
					download.usage();
					return;
				}
				
				if (flags.interval && !isNaN(parseFloat(flags.interval)) && 
						isFinite(flags.interval) && flags.interval <= 1) {
					console.log('Error: interval must be numeric value > 1');
					download.usage();
					return;
				}
				
				settings.loadConfig()
				.catch(function(error) {
					// user hasn't given us settings yet
					return settings.getUserInput();
				})
				.then(function() {
					return process.principal.login();
				})
				.then(function() {
					// do the download
					return download.doit(flags);
				})
				.then(function() {
					return process.principal.logout();
				})
				.fail(function(error) {
					console.log('Error %j: %j', error.code, error.message);
				})
				.done();
			},
			error: function(err, args) {
				console.log(err.message);
			}
		}).option('--dir', {
			shortcut: '-d',
			description: 'Path to directory where transfers will be stored',
			required: 'directory'
		}).option('--include-old', {
			shortcut: '-O',
			description: 'Download previously transfers as well'
		}).option('--include-sent', {
			shortcut: '-S',
			description: 'Download sent transfers as well'
		}).option('--use-filename', {
			shortcut: '-F',
			description: 'Store downloaded files using their actual filenames'
		/*
		 * I don't think we want to offer this right now...
		 * 
		}).option('--transfer', {
			shortcut: '-t',
			description: 'Download a specific transfer',
			required: 'transfer ID'
		*/
		}).option('--interval', {
			shortcut: '-i',
			description: 'Run in loop, with delay between checks',
			required: 'seconds'
		});

/**
 * Default behaviour without sub-comands
 */
program
		.option('--version', {
			shortcut: '-V',
			action: function() {
				console.log(pkg.name +' '+ pkg.version);
			}
		});

program.action = function(args, flags) {
	// todo: show usage here
	console.log('Default args: %j, flags: %j', args, flags);
};

program.parse(process.argv);
