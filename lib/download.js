/*
 * download.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	osHomedir = require('os-homedir'),
	readlineSync = require('readline-sync');
	
var settings = require('./teambeamjs').settings,
	principal = require('./teambeamjs').principal,
	Transfer = require('./transfer');

var mkdirSync = function(path) {
	try {
		fs.mkdirSync(path);
	} catch (e) {
		if (e.code === 'EEXIST') {
			return;
		}
		throw e;
	}
};
var mkdirpSync = function(fullpath) {
	var parts = fullpath.split(path.sep);
	for (var i=1; i<= parts.length; i++) {
		mkdirSync(path.join.apply(null, parts.slice(0, i)));
	}
	console.log('created %j', fullpath);
};


exports.doit = function(options) {
	
	console.log('Downloading transfers for %j', principal.email);

	/*
	 * - get list of all transfers
	 * - download files
	 */
	
	options = options || {};
	
	options.dir = options.dir || path.join(osHomedir(), 'Downloads', 'transfers');
	
	return Transfer.getAll()
	.then(function(transfers) {
		var promise = Q.resolve();

		transfers.forEach(function(transfer) {
			// drive transfers are excluded for the moment
			if (transfer.folderIdx) {
				console.log('Transfer %j is a drive transfer', transfer.recipientId);
				return;
			}
			
			// has been downloaded before?
			if ((transfer.downloadCounter > 0) && !options['include-old']) {
				console.log('Transfer %j has been downloaded before', transfer.recipientId);
				return;
			}
			
			if ((transfer.receiver.email !== principal.email) && !options['include-sent']) {
				console.log('Transfer %j has been sent to someone else', transfer.recipientId);
				return;
			}
			
			console.log('got transfer %j', transfer.recipientId);

			var transferDir = path.join(options.dir, transfer.recipientId);
			mkdirpSync(transferDir);

			promise = promise.then(function() {
				return transfer.downloadFiles(transferDir, options);
			}).then(function() {
				// fetch the transfer again from the API
				return Transfer.get(transfer.recipientId);
			}).then(function(transfer) {
				// write it to file
				return transfer.exportToFile(transferDir);
			});
		});
		
		return promise;
	}).then(function() {
		console.log('all transfers downloaded');
	});
	
	
};

exports.usage = function() {
	var usage =
"Downloads transfers and files and stores them locally. By default, it \n\
downloads new transfers and ends afterwards. In order to download in a loop, \n\
specify an interval.\n\
";
	
	console.log(usage);
};