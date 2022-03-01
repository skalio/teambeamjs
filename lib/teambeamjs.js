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

/* global process, __dirname */

'use strict';

var path = require('path'),
	pkg = require(path.join(__dirname, '..', 'package.json')),
	program = require('protogram').create(),
	help = require('protogram-help'),
	settings = require('./settings'),
	logHelper = require('./logHelper'),
	User = require('./user'),
	upload = require('./upload'),
	download = require('./download'),
	copy = require('./copy');

// set the title of the process (what is displayed in `ps`)
process.title = pkg.name;
process.principal = new User();

help.set({
	version: pkg.version,
	name: 'TeamBeam CLI',
	handleError: true
});

/**
 * options applicable to all sub-commands
 */
program
		.command('*', {includeRoot: true})
		.option('--help', help)
		.option('--config', {
			description: 'Specify the configfile',
			required: 'filename with path',
			action: function (value) {
				console.log('config option %j', value);
				settings.useConfig(value);
			},
			error: function (err, args) {
				console.log('Error: %j', err.message);
			}
		})
		.option('--verbose', {
			description: 'Increase verbosity of output',
			shortcut: '-v',
			action: function () {
				logHelper.consoleOutput('User requested to increase the verbosity');
				settings.verbose = true;
			}
		})
		.option('--quiet', {
			description: 'Hide all outputs',
			shortcut: '-q',
			action: function () {
				settings.quiet = true;
			}
		})
		.option('--logfile', {
			shortcut: '-L',
			action: function() {
				settings.logfile = true;
				logHelper.createLogFolder();
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
					settings.getUserInput();	//save login data
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
					process.principal.login().then(function(user) {		//the sequence is required: 1. login()
						upload.doit(flags, user).then(function() {		//2. doit()
							process.principal.logout();					//3.logout()
						}).done();
					}).done();
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
		}).option('--ttl', {
			shortcut: '-t',
			description: 'time to live in days',
			required: 'number'
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
					logHelper.consoleOutput('Error: interval must be numeric value > 1');
					download.usage();
					return;
				}
				
				settings.loadConfig()
				.catch(function(error) {
					// user hasn't given us settings yet
					return settings.getUserInput();
				})
				.then(function() {
					process.principal.login().then(function() {		//the sequence is required: 1. login()
						download.doit(flags).then(function() {		//2. doit()
							process.principal.logout();				//3.logout()
						}).done();
					}).done();
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
		}).option('--interval', {
			shortcut: '-i',
			description: 'Run in loop, with delay between checks',
			required: 'seconds'
		});

/**
 * sub-command 'copy'
 */
 program
 .command('copy', {
	 description: 'Copy transfers from your inbox to a drive folder',
	 action: function(args, flags) {
						 
		 if (flags.help) {
			 copy.usage();
			 return;
		 }
		 
		 if (flags.interval && !isNaN(parseFloat(flags.interval)) && 
				 isFinite(flags.interval) && flags.interval <= 1) {
			 logHelper.consoleOutput('Error: interval must be numeric value > 1');
			 copy.usage();
			 return;
		 }
		 
		 settings.loadConfig()
		 .catch(function(error) {
			 // user hasn't given us settings yet
			 return settings.getUserInput();
		 })
		 .then(function() {
			 process.principal.login().then(function() {		//the sequence is required: 1. login()
				copy.doit(flags).then(function() {		//2. doit()
					 process.principal.logout();				//3.logout()
				 }).done();
			 }).done();
		 })
		 .fail(function(error) {
			 console.log('Error %j: %j', error.code, error.message);
		 })
		 .done();
	 },
	 error: function(err, args) {
		 console.log(err.message);
	 }
 }).option('--drive', {
	 shortcut: '-d',
	 description: 'drive folder idx where to copy transfer into',
	 required: 'directory'
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
	

program.parse(process.argv);
