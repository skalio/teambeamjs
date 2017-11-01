/*
 * reservation.js
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
	fs = require('fs'),
	reqHelper = require('./reqHelper'),
	settings = require('./settings'),
	logHelper = require('./logHelper');
	
/**
 * Creates a new Reservation object
 */	
var Reservation = function() {
	this.exists = false;
	this.token = undefined;
	this.publicBoxIdx = undefined;
	this.folderIdx = undefined;
	this.receivers = [];
	this.groups = [];
	this.files = [];
	this.subject = undefined;
	this.description = undefined;
	this.deliveryNotification = true;
	this.ttl = undefined;
	this.priority = 3;
	this.signatureId = 0;
	this.protection = {
		enabled: false,
		key: undefined
	};
	this.anon = {
		email: undefined,
		name: undefined
	};
	this.meta = [];
	this.srcRecipientId = undefined;
	this.idCounter = 0;
	
	return this;
};

/**
 * Exports a Reservation for serialisation.
 * @param {Reservation} reservation Instance of object to be exported
 * @returns {Object} reservation-object as required by API
 */
Reservation.export = function(reservation) {
	var obj = {
		receivers: reservation.receivers,
		groups: reservation.groups,
		publicBoxIdx: reservation.publicBoxIdx,
		folderIdx: reservation.folderIdx,
		files: reservation.files,
		srcRecipientId: reservation.srcRecipientId,
		subject: reservation.subject,
		description: reservation.description,
		deliveryNotification: reservation.deliveryNotification,
		ttl: reservation.ttl,
		priority: reservation.priority,
		signatureId: reservation.signatureId,
		protection: reservation.protection,
		anon: reservation.anon,
		meta: reservation.meta
	};
	return obj;
};

/**
 * Imports a serialized object into the given reservation
 * @param {object} source serialized input
 * @param {Reservation} reservation Instance of reservation to be updated
 */
Reservation.import = function(source, reservation) {
	var i,
		fields = ['token', 'totalSize'];

	for (i=0; i<fields.length; i++) {
		var prop = fields[i];
		if (source.hasOwnProperty(prop)) {
			reservation[prop] = source[prop];
		}
	}
	reservation.exists = true;

	if (source.hasOwnProperty('files')) {
		if (!reservation.hasOwnProperty('files')) {
			reservation.files = [];
		}
		for (var j=0; j<source.files.length; j++) {
			var ourId = source.files[j].id;
			var needToAddIt = true;
			for (i=0; i<reservation.files.length; i++) {
				if (reservation.files[i].id === ourId) {
					// found it!
					reservation.files[i].objectId = source.files[j].objectId;
					needToAddIt = false;
					break;
				}
			}
			if (needToAddIt) {
				reservation.files.push({
					id: source.files[j].id,
					objectId: source.files[j].objectId
				});
			}
		}
	}	
};

/**
 * Adds a recipient to the reservation
 * @param {Object} recipient Recipient object
 * @param {string} recipient.email Email-address of recipient
 * @param {string} [recipient.name] Real name
 * @param {string} [recipient.type] Destination type, one of `to` (default), `cc`, `bcc`
 */
Reservation.prototype.addRecipient = function(recipient) {
	var entry = {
		email: recipient.email,
		name: recipient.name || undefined,
		type: recipient.type || 'to'
	};
	this.receivers.push(entry);
};

Reservation.prototype.addFile = function(filename) {
	var stat = fs.statSync(filename);
	
	try {
		if (!stat.isFile()) {
			throw new Error('Not a file: '+ filename);
		}
		var entry = {
			path: filename,
			id: "file-"+ this.idCounter++,
			name: path.basename(filename),
			size: stat.size || -1
		};
		this.files.push(entry);
	} catch (err) {
		//here we get and show the errors
		//console.log("error: ", err);
		logHelper.consoleOutput('error: ' + err);
		return false;
	}
};

/**
 * Sets the subject
 * @param {string} subject
 */
Reservation.prototype.setSubject = function(subject) {
	this.subject = subject;
};

/**
 * Sets the description or message of the transfer
 * @param {string} description
 */
Reservation.prototype.setDescription = function(description) {
	this.description = description;
};

/**
 * Sets the time-to-live value of the reservation
 * @param {integer} days
 */
Reservation.prototype.setTtl = function(days) {
	this.ttl = 0+days;
};

/**
 * Activates or deactivates delivery notification
 * @param {Boolean} state
 */
Reservation.prototype.setDeliveryNotification = function(state) {
	this.deliveryNotification = !!state;
};

/**
 * Activates transfer passphrase protection, if the given passphrase
 * is set and non-empty.
 * @param {string} passphrase
 */
Reservation.prototype.enableProtection = function(passphrase) {
	if (passphrase && passphrase.length > 0) {
		this.protection.enabled = true;
		this.protection.key = ""+ passphrase;
	} else {
		this.protection.enabled = false;
		this.protection.key = undefined;
	}
};

/**
 * Attempts to create the reservation remotely
 * @returns {unresolved}
 */
Reservation.prototype.create = function() {
	var that = this,
		url = settings.getBaseUrl() +'/rs/v1/reservations';
	var reservationData = Reservation.export(that);
	
	logHelper.consoleOutput('Creating new reservation');

	return reqHelper.post(
			url, 
			reservationData
	).then(function(result) {
		Reservation.import(result, that);
		logHelper.consoleOutput('Reservation ' + that.token + ' created');
		return that;
	}).catch(function(error) {
		//console.log('Reservation not created. %j', error.message);
		logHelper.consoleOutput('Reservation not created. ' + error.message);
		throw error;
	});
};

/**
 * Attempts to upload each file sequentially
 * @returns {unresolved}
 */
Reservation.prototype.upload = function() {
	if (!this.token) {
		throw new Error('Reservation has not been created yet!');
	}
	var that = this;
	
	var uploadFile = function(file) {
		var url = settings.getBaseUrl() +'/rs/v1/upload/' + file.objectId;
		logHelper.consoleOutput('Uploading ' + file.objectId + ' (' + file.size.toLocaleString() + ' Bytes)');

		return reqHelper.putFile(url, file.path, that.token)
		.then(function(result) {
			logHelper.consoleOutput('Upload of ' + file.objectId + ' completed');
			return result;
		});
	};	

	var promises = that.files.map(uploadFile);
	return Q.all(promises);
};

/**
 * Attempst to confirm the reservation remotely
 * @returns {unresolved}
 */
Reservation.prototype.confirm = function() {
	if (!this.token) {
		throw new Error('Reservation has not been created yet!');
	}
	var url = settings.getBaseUrl() +'/rs/v1/reservations/'+ this.token +'/confirm';
	
	logHelper.consoleOutput('Confirming reservation ' + this.token);
	return reqHelper.post(url, {})
	.then(function(result) {
		logHelper.consoleOutput('Reservation confirmed');
		return result;
	});
};

/**
 * Attempts to cancel the reservation remotely
 * @returns {unresolved}
 */
Reservation.prototype.cancel = function() {
	if (!this.token) {
		throw new Error('Reservation has not been created yet!');
	}
	var url = settings.getBaseUrl() +'/rs/v1/reservations/'+ this.token;
	
	//console.log('Cancelling reservation %s', this.token);
	logHelper.consoleOutput('Cancelling reservation ' + this.token);
	return reqHelper.delete(url)
	.then(function(result) {
		//console.log('Reservation cancelled');
		logHelper.consoleOutput('Reservation cancelled');
		return result;
	});
};

/**
 * Checks if the reservation has a destination. This can be either a
 * recipient, a group, a folder or a publicBox, or a combination of them.
 * 
 * A reservation without any destinations will be rejected by the server.
 * 
 * @returns {Boolean} true if at least one destination is set
 */
Reservation.prototype.hasDestination = function() {
	if (this.receivers.length > 0) {
		return true;
	}
	if (this.groups.length > 0) {
		return true;
	}
	if (this.folderIdx) {
		return true;
	}
	if (this.publicBoxIdx) {
		return true;
	}
	return false;
};

exports = module.exports = Reservation;
