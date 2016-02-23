/*
 * upload.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	readlineSync = require('readline-sync'),
	Reservation = require('./reservation');
	
	
exports.doit = function(options) {

	options = options || {};
	var reservation = new Reservation();
	
	// add files
	if (options.files) {
		options.files.forEach(function(filename) {
			reservation.addFile(filename);
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
		
		recipients.forEach(function(email) {
			reservation.addRecipient({
				email: email,
				type: type
			});
		});
	}

	// add recipients manually
	if (!reservation.hasDestination()) {
		process.stdout.write('Enter Recipients:\n');
		while (true) {
			var recipient = {};
			recipient.email = readlineSync.questionEMail('Email address: ');
			recipient.name = readlineSync.question('Name (optional): ');
			if (recipient.name === '') {
				recipient.name = undefined;
			}
			var types = ['to', 'cc', 'bcc'];
			var typeIndex = readlineSync.keyInSelect(
					types, 
					'Destination type: ', 
					{cancel: false}
			);
			recipient.type = types[typeIndex];
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
		reservation.setDescription(options.message);
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
	
	// passphrase protection
	if (options.passphrase) {
		reservation.enableProtection(options.passphrase.trim());
	}

	// let's go
	return reservation.create()
	.then(function() {
		return reservation.upload();
	})
	.then(function() {
		return reservation.confirm();
	})
	.fail(function(error) {
		if (reservation.exists) {
			reservation.cancel();
		}
		throw error;
	});
};