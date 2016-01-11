/*
 * reservation.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Henning Verbeek
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	fs = require('fs'),
	
	reqHelper = require('./reqHelper'),
	settings = require('./teambeamjs').settings;
	
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
	this.ttl = 3;
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
 * Adds a receiver to the reservation
 * @param {Object} receiver Receiver object
 * @param {string} receiver.email Email-address of recipient
 * @param {string} [receiver.name] Real name
 * @param {string} [receiver.type] Destination type, one of `to` (default), `cc`, `bcc`
 */
Reservation.prototype.addReceiver = function(receiver) {
	var entry = {
		email: receiver.email,
		name: receiver.name || undefined,
		type: receiver.type || 'to'
	};
	this.receivers.push(entry);
};

Reservation.prototype.addFile = function(filename) {
	var stat = fs.statSync(filename);
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
};

Reservation.prototype.setSubject = function(subject) {
	this.subject = subject;
};

Reservation.prototype.setDescription = function(description) {
	this.description = description;
};

Reservation.prototype.setTtl = function(days) {
	this.ttl = 0+days;
};

Reservation.prototype.setDeliveryNotification = function(state) {
	this.deliveryNotification = !!state;
};

Reservation.prototype.create = function() {
	var that = this,
		url = settings.getBaseUrl() +'/rs/v1/reservations';

	console.log('Creating new confirmation');
	return reqHelper.postJson(
			url, 
			Reservation.export(that)
	).then(function(result) {
		Reservation.import(result, that);
		console.log('Reservation created');
		return that;
	});
};

Reservation.prototype.upload = function() {
	var that = this;
	var uploadFile = function(file) {
		var url = settings.getBaseUrl() +'/skp/v2/upload/' + file.objectId;
		console.log('Uploading %j (%j Bytes)', file.objectId, file.size);
		return reqHelper.putFile(url, file.path, that.token)
		.then(function(result) {
			console.log('Upload finished: %j', result);
			return result;
		});
	};	

	var promises = that.files.map(uploadFile);
	return Q.all(promises);
};

Reservation.prototype.confirm = function() {
	var url = settings.getBaseUrl() +'/rs/v1/reservations/'+ this.token +'/confirm';
	
	console.log('Confirming reservation %j', this.token);
	return reqHelper.postJson(url, {})
	.then(function(result) {
		console.log('Reservation confirmed');
		return result;
	});
};

exports = module.exports = Reservation;
