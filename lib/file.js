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
	// statusBar = require('status-bar'),
	settings = require('./settings'),
	reqHelper = require('./reqHelper');
	
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

File.prototype.download = function(basedir, options) {
	var that = this;
	options = options || {};
	console.log('Download starting for %s', that.objectId);

	/*
	 * This progressbar is not working well, since stuff needs to be
	 * piped to it, but it is not a duplex stream -> the data is consumed
	 * and afterwards it can't be written out anymore...
	 *  
	var bar = statusBar.create({
		total: that.size
	}).on('render', function(stats) {
		process.stdout.write(' Downloading file ' + that.objectId + ' ' +
				this.format.storage(stats.currentSize) + ' ' +
				this.format.speed(stats.speed) + ' ' +
				this.format.time(stats.remainingTime) + ' [' +
				this.format.progressBar(stats.percentage) + '] ' +
				this.format.percentage(stats.percentage)
		);
		process.stdout.cursorTo(0);
	});
	 */

	var outStream = fs.createWriteStream(path.join(
			basedir, 
			options['use-filename'] ? that.name : that.objectId
	));
	var deferred = Q.defer();
	var lastProgressTimestamp,
			nowTimestamp;
	
	reqHelper.getAsStream(that.url)
	.then(function(response) {
		if (response.statusCode >= 400) {
			deferred.reject(new Error('Request failed: '+ response.body.error.message));
		}
		lastProgressTimestamp = 0;
		
		response.on('progress', function(completedBytes, totalBytes) {
			if (!settings.verbose) {
				return;
			}
			nowTimestamp = new Date().getTime();
			
			// progress output, at least 1sec delta
			if (nowTimestamp - lastProgressTimestamp > 1000) {
				console.log('Download progress for %s: received %s of %s bytes', 
					that.objectId, 
					completedBytes.toLocaleString(), 
					totalBytes.toLocaleString()
				);
				lastProgressTimestamp = nowTimestamp;
			}
		});

		response.on('end', function() {
			console.log('Download completed for %s', that.objectId);
			deferred.resolve();
		});

		response.on('error', function(err) {
			// if (bar) bar.cancel();
			deferred.reject(err);
		});
		
		// write to disk
		response.pipe(outStream);		
	});	

	return deferred.promise;	
};

exports = module.exports = File;
