/*
 * download.js
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
	logHelper.consoleOutput('Downloading transfers for "' + process.principal.email + '"');
	/*
	 * - get list of all transfers
	 * - download files
	 */
	var transfersLength = 0;
	options = options || {};
	
	options.dir = options.dir || path.join(osHomedir(), 'Downloads', 'transfers');
	
	return Transfer.getAll()
	.then(function(transfers) {
		var promise = Q.resolve();
		transfersLength = transfers.length;
		
		transfers.forEach(function(transfer) {
			// drive transfers are excluded for the moment
			if (transfer.folderIdx) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not downloading transfer "' + transfer.recipientId + '" it is a drive transfer');
				}
				return;
			}
			
			// has been downloaded before?
			if ((!transfer.isUnread) && !options['include-old']) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not downloading transfer "' + transfer.recipientId + '" it has been downloaded before');
				}
				return;
			}
			
			if ((transfer.receiver.email !== process.principal.email) && !options['include-sent']) {
				transfersLength--;
				if (settings.verbose) {
					logHelper.consoleOutput('Not downloading transfer "' + transfer.recipientId + '" it has been sent to someone else');
				}
				return;
			}
			
			var transferTargetFolder = path.join(options.dir, transfer.recipientId);
			promise = promise.then(function() {
				var defer = Q.defer();
				mkdirp(transferTargetFolder, function(err) {
					if (err) {
						defer.reject(err);
					} else {
						defer.resolve(transferTargetFolder);
						logHelper.consoleOutput('Created "' + transferTargetFolder + '"');
					}
				});
				
				return defer.promise;
			}).then(function() {
				return transfer.downloadFiles(transferTargetFolder, options);
			}).then(function() {
				// fetch the transfer again from the API
				return Transfer.get(transfer.recipientId);
			}).then(function() {
				// write it to file
				return transfer.exportToFile(transferTargetFolder);
			});
		});
		
		return promise;
	}).then(function() {
		if(transfersLength > 0) {
			logHelper.consoleOutput('Transfer download completed');
		} else {
			logHelper.consoleOutput('No transfers to download');
		}
		
		var promise = Q.resolve();
		
		if (options.interval && options.interval > 0) {
			promise = promise.then(function() {
				logHelper.consoleOutput('Waiting ' + options.interval + ' seconds');
			})
			.delay(1000 * options.interval)
			.then(function() {
				return exports.doit(options);
			});
		}
		
		return promise;
	});
	
	
};

exports.usage = function() {
	var usage =
"Downloads transfers and files and stores them locally. By default, it \n"+
"downloads new transfers and ends afterwards. In order to download in a loop, \n"+
"specify an interval.\n";
	
	console.log(usage);
};