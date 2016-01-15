/*
 * file.js
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
	settings = require('./teambeamjs').settings;
	
/**
 * Creates a new File object
 */	
var File = function(input) {
	input = input || {};
	this.objectId = input.objectId || undefined;
	this.name = input.name || undefined;
	this.size = input.size || 0;
	this.hashsum = input.hashsum || undefined;
	this.url = input.url || undefined;
	this.malware = {
		status: input.malware ? (input.malware.status || 'unknown') : 'unknown',
		text: input.malware ? (input.malware.text || undefined) : undefined
	};
};

File.prototype.getShortName = function() {
	if (this.name.length > 30) {
		return this.name.substr(0, 12) + "(...)" + this.name.substr(this.name.length - 12);
	} else {
		return this.name;
	}
};

File.prototype.getHTML5MediaType = function() {
	var ext = this.name.substr(this.name.length - 3);
	var type = false;
	switch (ext.toLowerCase()) {
		case "mp4":
			type = "video/mp4";
			break;
		case "m4v":
			type = "video/mp4";
			break;
		case "webm":
			type = "video/webm";
			break;
		case "mp3":
			type = "audio/mpeg";
			break;
		case "ogg":
			type = "audio/ogg";
			break;
		case "wav":
			type = "audio/wav";
			break;
		default:
			type = false;
			break;
	}
	return type;
};

File.prototype.download = function(basedir) {
	var that = this;
	console.log('Download started for %j', that.objectId);

	return Q(reqHelper.getAsStream(that.url))
	.then(function(response) {
		var deferred = Q.defer();
		
		response.on('progress', function(completed, total) {
			var rel = completed / total * 100;
			console.log('Download progress for %j: %j%, (%j / %j)', that.objectId, rel, completed, total);
		});

		response.pipe(fs.createWriteStream(path.join(basedir, that.objectId)));
		
		response.on('end', function() {
			console.log('Download completed for %j', that.objectId);
			deferred.resolve();
		});
		
		return deferred.promise;
	});
};

exports = module.exports = File;
