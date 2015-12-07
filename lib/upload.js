/*
 * upload.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Henning Verbeek
 * Licensed under the MIT license.
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	fs = require('fs'),
	
	reqHelper = require('./reqHelper'),
	settings = require('./teambeamjs').settings;
	
var reservation = {
	exists: false,
	token: undefined,
	publicBoxIdx: undefined,
	folderIdx: undefined,
	receivers: [],
	groups: [],
	files: [],
	subject: null,
	description: null,
	deliveryNotification: true,
	ttl: 3,
	priority: 3,
	signatureId: 0,
	protection: {
		enabled: false,
		key: null
	}
};

var idCounter = 0;

exports.addReceiver = function(receiver) {
	var entry = {
		email: receiver.email,
		name: receiver.name || undefined,
		type: receiver.type || 'to'
	};
	reservation.receivers.push(entry);
};

exports.addFile = function(filename) {
	var stat = fs.statSync(filename);
	if (!stat.isFile()) {
		throw new Error('Not a file: '+ filename);
	}
	var entry = {
		path: filename,
		id: "file"+ idCounter++,
		name: path.basename(filename),
		size: stat.size || -1
	};
	reservation.files.push(entry);
};

exports.setSubject = function(subject) {
	reservation.subject = subject;
};

exports.setDescription = function(description) {
	reservation.description = description;
};

exports.withDeliveryReport = function(state) {
	reservation.deliveryNotification = !!state;
};

exports.setTtl = function(ttl) {
	reservation.ttl = 0 + ttl;
};



exports.doit = function() {
	var url = settings.getBaseUrl() +'/rs/v1/reservations';
	
	return reqHelper.postJson(url, reservation)
	.then(function(result) {
		var i,
			fields = ['token', 'totalSize'];
		console.log('got %j', result);		

		for (i=0; i<fields.length; i++) {
			var prop = fields[i];
			if (result.hasOwnProperty(prop)) {
				reservation[prop] = result[prop];
			}
		}
		reservation.exists = true;
		if (result.hasOwnProperty('files')) {
			if (!reservation.hasOwnProperty('files')) {
				reservation.files = [];
			}
			for (var j=0; j<result.files.length; j++) {
				var ourId = result.files[j].id;
				var needToAddIt = true;
				for (i=0; i<reservation.files.length; i++) {
					if (reservation.files[i].id === ourId) {
						// found it!
						reservation.files[i].objectId = result.files[j].objectId;
						needToAddIt = false;
						break;
					}
				}
				if (needToAddIt) {
					reservation.files.push({
						id: result.files[j].id,
						objectId: result.files[j].objectId
					});
				}
			}
		}
		
		console.log('Reservation now: %j', reservation);
		return reservation;
	}).then(function() {
		// do the upload
		var promises = reservation.files.map(uploadFile);
		return Q.all(promises);
	}).then(function() {
		// confirm the upload
		var url = settings.getBaseUrl() +'/rs/v1/reservations/'+ reservation.token +'/confirm';
		return reqHelper.postJson(url, {});
	}).then(function(result) {
		// that's it, we're done here!
		result.result.forEach(function(entry) {
			console.log('Transfer %j created', entry.recipientId);
		});
		return true;
	});
};

function uploadFile(file) {
	var url = settings.getBaseUrl() +'/skp/v2/upload/' + file.objectId;
	console.log('Uploading %j (%j Bytes)', file.objectId, file.size);
	return reqHelper.putFile(url, file.path, reservation.token)
			.then(function(result) {
				console.log('Upload finished: %j', result);
				return result;
			});
}
