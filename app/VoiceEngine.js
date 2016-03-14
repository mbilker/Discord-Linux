'use strict';

const electron = require('electron');
const crypto = require('crypto');
const events = require('events');
const path = require('path');

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

var noop = function noop() {}

var VoiceEngine = function() {};
VoiceEngine.prototype.setEmitVADLevel = noop;
VoiceEngine.prototype.setSelfDeafen = noop;
VoiceEngine.prototype.setInputVolume = noop;
VoiceEngine.prototype.setInputDevice = noop;
VoiceEngine.prototype.setInputMode = noop;
VoiceEngine.prototype.setOutputDevice = noop;
VoiceEngine.prototype.setOutputVolume = noop;

VoiceEngine.prototype.getInputDevices = function(cb) {
  console.log('getInputDevices');
};
VoiceEngine.prototype.getOutputDevices = function(cb) {
  console.log('getOutputDevices');
};

VoiceEngine.prototype.setOnSpeakingCallback = function(cb) {
  //this.window.webContents.send('setOnSpeakingCallback', this._interop('setOnSpeakingCallback', cb));
  console.log('setOnSpeakingCallback');
};
VoiceEngine.prototype.setOnVoiceCallback = function(cb) {
  //this.window.webContents.send('setOnVoiceCallback', this._interop('setOnVoiceCallback', cb));
  console.log('setOnVoiceCallback');
};
VoiceEngine.prototype.setDeviceChangeCallback = function(cb) {
  //this.window.webContents.send('setDeviceChangeCallback', this._interop('setDeviceChangeCallback', cb));
  console.log('setDeviceChangeCallback');
};

VoiceEngine.prototype.playSound = function(name, volume) {
  //this.window.webContents.send('playSound', name, volume);
  console.log('playSound', name, volume);
  BrowserWindow.fromId(mainWindowId).webContents.send('playSound', name, volume);
};

exports['default'] = new VoiceEngine({});
module.exports = exports['default'];
