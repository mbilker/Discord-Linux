'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _electron = require('electron');

var _events = require('events');

//var _process$binding = process.binding('discord_voice_engine');

//var VoiceEngine = _process$binding.VoiceEngine;

var noop = function noop() {}

var VoiceEngine = function() {}

VoiceEngine.prototype.__proto__ = _events.EventEmitter.prototype;
VoiceEngine.prototype.createTransport = function (ssrc, userId, serverIp, port, callback) {
  this._createTransport(this, ssrc, userId, serverIp, port, callback);
};
VoiceEngine.prototype._init = function () {};
VoiceEngine.prototype.setEmitVADLevel = noop;
VoiceEngine.prototype.getInputDevices = noop;
VoiceEngine.prototype.setInputMode = noop;
VoiceEngine.prototype.getOutputDevices = noop;
VoiceEngine.prototype.setInputVolume = noop;
VoiceEngine.prototype.setOutputVolume = noop;
VoiceEngine.prototype.setSelfDeafen = noop;
VoiceEngine.prototype.destroyTransport = noop;

exports['default'] = new VoiceEngine({});
module.exports = exports['default'];
