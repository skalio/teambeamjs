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
	jsonfile = require('jsonfile'),
	readlineSync = require('readline-sync'),
	reqHelper = require('./reqHelper'),
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

	/*
	 * - get list of all transfers
	 * - download files
	 */
	
	return Transfer.getAll()
	.then(function(transfers) {
		transfers.forEach(function(transfer) {
			if (transfer.folderIdx) {
				return;
			}
			console.log('got transfer %j', transfer.recipientId);
			
			var transferDir = path.join('transfers', transfer.recipientId),
				exportFile = path.join(transferDir, 'transfer.json');
			mkdirpSync(transferDir);
			jsonfile.writeFileSync(exportFile, transfer.export(), {spaces: 2});
			console.log('Transfer exported to %j', exportFile);
			
			
			var downloadFile = function(file) {
				return Q(reqHelper.getAsStream(file.url))
				.then(function(response) {
					response.on('progress', function(completed, total) {
						var rel = completed / total * 100;
						console.log('Download progress %j %, (%j / %j)', rel, completed, total);
					});

					return response.pipe(fs.createWriteStream(path.join(transferDir, file.objectId)));
				});
			};
			
			var promises = transfer.files.map(downloadFile);
			Q.all(promises).then(function() {
				console.log('all files downloaded for %j', transfer.recipientId);
			});

		});
		
		
				
	});
	
	
};
	