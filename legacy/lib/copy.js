/*
 * copy.js
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
	osHomedir = require('os-homedir'),
	mkdirp = require('mkdirp'),
	Transfer = require('./transfer'),
	settings = require('./settings'),
	logHelper = require('./logHelper');

exports.doit = function(options) {
	logHelper.consoleOutput('Copying transfers for "' + process.principal.email + '"');
	/*
	 * - get list of all transfers
	 * - download files
	 */
	var transfersLength = 0;
	var reloginNeeded = false;
	options = options || {};
	
	return Transfer.getAll()
	.then(function(transfers) {
		var promise = Q.resolve();
		transfersLength = transfers.length;
		
		transfers.forEach(function(transfer) {
			// drive transfers are excluded
			if (transfer.folderIdx) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not copying transfer "' + transfer.recipientId + '" it is a drive transfer');
				}
				return;
			}
			
			// has been downloaded before?
			if ((!transfer.isUnread)) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not copying transfer "' + transfer.recipientId + '" it has been accessed before');
				}
				return;
			}
			
			if ((transfer.receiver.email !== process.principal.email)) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not copying transfer "' + transfer.recipientId + '" it has been sent to someone else');
				}
				return;
			}
			
			promise = promise.then(function() {
				return transfer.copy(options.drive)
				.catch(function(error) {
					if(error.code == 401 && options.interval && options.interval > 0) {
						//session timed out
						reloginNeeded = true;
					} else {
						throw error;
					}
				})
			}).then(function() {
				// fetch the transfer again from the API
				return Transfer.get(transfer.recipientId);
			});
		});
		
		return promise;
	}).then(function() {
		if(transfersLength > 0) {
			logHelper.consoleOutput('Transfer copy completed');
		} else {
			logHelper.consoleOutput('No transfers to copy');
		}
		
		var promise = Q.resolve();
		
		if (options.interval && options.interval > 0) {
			promise = promise.then(function() {
				logHelper.consoleOutput('Waiting ' + options.interval + ' seconds');
			})
			.delay(1000 * options.interval)
			.then(reloginNeeded && process.principal.login())
			.then(function() {
				return exports.doit(options);
			});
		}
		
		return promise;
	});
	
	
};

exports.usage = function() {
	var usage =
"Copies transfers to a TeamBeam Drive folder. By default, it \n"+
"copies new transfers and ends afterwards. In order to copy in a loop, \n"+
"specify an interval.\n";
	
	console.log(usage);
};