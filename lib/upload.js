/*
 * upload.js
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
	readlineSync = require('readline-sync'),
	Reservation = require('./reservation'),
	fs = require('fs'),
	zip = require('node-zip-dir');
	
	
exports.doit = function(options) {
	var defer = Q.defer();
	options = options || {};
	var reservation = new Reservation(),
	copyDirCounter = 1;
	
	// add files or directories or both
	if (options.files) {
		options.files.forEach(function(filename) {
			if (fs.existsSync(filename)) {
				var stat = fs.statSync(filename);
				if(stat.isDirectory()) {

					var tmpFolder = "./tmp";
					//mkdir a tmp folder to create the zip files in it for uploading and after that deleting
					if (!fs.existsSync(tmpFolder)) {
						fs.mkdirSync(tmpFolder);
					}

					var zipFilename = filename.split("/").pop() + ".zip";
					if (fs.existsSync("./tmp/"+zipFilename)) {
						//rename the zip-file if this exists in tmp folder
						zipFilename = filename.split("/").pop() + "(" + copyDirCounter + ").zip";
						copyDirCounter++;
					}

					zip.zip(filename, tmpFolder+"/"+zipFilename);
					reservation.addFile(tmpFolder+"/"+zipFilename);
				} else {
					reservation.addFile(filename);
				}
			} else {
				console.log("\x1b[31m%s\x1b[0m", "'" + filename.split("/").pop() + "' does not exist");  //in red			
			}
		});
	}
	
	// recipients
	var types = ['to', 'cc', 'bcc'],
		type,
		recipients;
	for (var i=0; i<types.length; i++) {
		type = types[i];
		if (!options[type]) {
			continue;
		}
		recipients = [].concat(options[type]);	// make sure it's an array
		
		for (var j=0; j<recipients.length; j++) {
			reservation.addRecipient({
				email: recipients[j],
				type: type
			});
		}
	}

	// add recipients manually
	if (!reservation.hasDestination()) {
		process.stdout.write('Enter Recipients:\n');
		var recTypes = ['to', 'cc', 'bcc'];
		while (true) {
			var recipient = {};
			recipient.email = readlineSync.questionEMail('Email address: ');
			recipient.name = readlineSync.question('Name (optional): ');
			if (recipient.name === '') {
				recipient.name = undefined;
			}
			var typeIndex = readlineSync.keyInSelect(
					recTypes, 
					'Destination type: ', 
					{cancel: false}
			);
			recipient.type = recTypes[typeIndex];
			reservation.addRecipient(recipient);

			if (readlineSync.question('Add more (y/N)? ') !== 'y') {
				break;
			}
		}
	}
	
	// subject
	if (options.subject) {
		reservation.setSubject(options.subject);
	} else {
		reservation.setSubject(readlineSync.question('Subject: '));
	}

	// multiline message
	if (options.message) {
		reservation.setDescription((options.message).replace(/(\\n)/g, '\n'));
	} else {
		process.stdout.write('Message (end with . on empty line):\n');
		var message = '';
		readlineSync.promptLoop(function(line) {
			if (line === '.') {
				return true;
			}
			message += line + '\n';
			return false;
		});
		reservation.setDescription(message);
	}
	
	// ttl
	if (options.ttl) {
		reservation.setTtl(options.ttl);
	}
	
	// passphrase protection
	if (options.passphrase) {
		reservation.enableProtection(options.passphrase.trim());
	}
	
	//console.log("upload.js-------------------------------------------------");
	//console.log("upload.js----------------------130 : ", options);
	//console.log("upload.js-------------------------------------------------");
	
	// let's go
	
	reservation.create().then(function() {
		reservation.upload().then(function() {
			reservation.confirm().then(function() {
				return;
			}).done(function() {
				console.log("Transfer upload completed!");
				defer.resolve(true);
			});
		}).fail(function(error) {
			if (reservation.exists) {
				reservation.cancel();
			}
			throw error;
		}).done();
	}).done();
	
	return defer.promise;
};