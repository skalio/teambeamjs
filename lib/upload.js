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
	settings = require('./settings'),
	request = require('request'),
	fs = require('fs'),
	zip = require('node-zip-dir'),
	User = require('./user');
	
	process.principal = new User();
	
exports.doit = function(options, loggedinUser) {
	var defer = Q.defer();
	options = options || {};
	var reservation = new Reservation(),
	existFile = false,
	copyDirCounter = 1;
	
	// add files or directories or both
	if (options.files) {
		options.files.forEach(function(filename) {
			if (fs.existsSync(filename)) {
				existFile = true;
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
	
	if (existFile) {
		var readyToUpload = true;
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
			readyToUpload = false;
			var environment = settings.getBaseUrl() +'/rs/v1/environment';
			request(environment, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					var defaultVal = JSON.parse(body);
					var ttlArr = defaultVal.expiration.values;
					var ttlDefault = defaultVal.expiration.default;
					if(ttlArr.indexOf(options.ttl) === -1) {	//the given ttl doesn't exist and we take the default ttl
						console.log("Your given ttl doesn't exist. The possible ttl are %j and the default ttl %j is automatically selected", ttlArr, ttlDefault);
					} else {
						reservation.setTtl(options.ttl);
					}
					readyToUpload = true;		//to call and run the 
					reservationAndUpload();		//"let's go" part below
				}
			});
		}

		// passphrase protection
		if (options.passphrase) {
			reservation.enableProtection(options.passphrase.trim());
		}

		// let's go
		var reservationAndUpload = function() {
			reservation.create().then(function() {
				reservation.upload().then(function() {
					reservation.confirm().then(function() {
						return;
					}).done(function() {
						//deleting the created tmp folder
						var path = "./tmp";
						if( fs.existsSync(path) ) {
							fs.readdirSync(path).forEach(function (file, index) {
								var curPath = path + "/" + file;
								fs.unlinkSync(curPath);
							});
							fs.rmdirSync(path);
						}

						defer.resolve(true);
					});
				}).fail(function(error) {
					if (reservation.exists) {
						reservation.cancel();
					}
					throw error;
				}).done();
			}).done();
		};
		
		if(readyToUpload) {
			reservationAndUpload();
		}
		
	} else {
		process.principal.logout();
	}
	return defer.promise;
};