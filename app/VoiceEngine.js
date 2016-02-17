'use strict';

const electron = require('electron');
const events = require('events');
const path = require('path');

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

var noop = function noop() {}

var VoiceEngine = function() {
  electron.app.on('ready', () => {
    this.window = new BrowserWindow({
      width: 200,
      height: 200,
      show: false,
      webPreferences: {
        blinkFeatures: "EnumerateDevices,AudioOutputDevices"
      }
    });
    this.window.loadURL('file://' + __dirname + '/voice_engine/index.html');
    this.window.webContents.on('did-finish-load', () => {
      this.window.webContents.openDevTools({ detach: true });
    });

    ipcMain.on('get-token-and-fingerprint', (ev, token) => {
      this.window.webContents.send('get-token-and-fingerprint', token);
    });
  });
}

VoiceEngine.prototype.__proto__ = events.EventEmitter.prototype;
VoiceEngine.prototype._init = function () {};

const logCall = (name) => (...args) => {
  console.log(`${name}:`, ...args);
};

VoiceEngine.prototype._interop = function(id, cb) {
  this.callbacks = this.callbacks || {};

  this.callbacks[id] = cb;
  ipcMain.on(`${id}-reply`, (ev, ...args) => {
    this.callbacks[id](...args);
  });

  return { __INTEROP_CALLBACK: true, name: `${id}-reply` };
};

VoiceEngine.prototype.createTransport = function (ssrc, userId, serverIp, port, callback) {
  //this._createTransport(this, ssrc, userId, serverIp, port, callback);
  const window = BrowserWindow.getAllWindows().filter(b => b.id !== this.window.id)[0];
  window.webContents.executeJavaScript("require('electron').ipcRenderer.send('get-token-and-fingerprint', {token:localStorage.getItem('token'),fingerprint:localStorage.getItem('fingerprint')})");

  setTimeout(() => {
    this.window.webContents.send('create-transport', ssrc, userId, serverIp, port, this._interop('create-transport', callback));
  }, 500);
};
VoiceEngine.prototype.setOnSpeakingCallback = function(cb) {
  this.window.webContents.send('set-on-speaking-callback', this._interop('set-on-speaking-callback', cb));
};
VoiceEngine.prototype.setOnVoiceCallback = function(cb) {
  this.window.webContents.send('set-on-voice-callback', this._interop('set-on-voice-callback', cb));
};
VoiceEngine.prototype.setDeviceChangeCallback = function(cb) {
  this.window.webContents.send('set-device-change-callback', this._interop('set-device-change-callback', cb));
};
VoiceEngine.prototype.setEmitVADLevel = noop;
VoiceEngine.prototype.onConnectionState = function(cb) {
  this.window.webContents.send('on-connection-state', this._interop('on-connection-state', cb));
};
VoiceEngine.prototype.getInputDevices = function(cb) {
  this.window.webContents.send('get-input-devices', this._interop('get-input-devices', cb));
};
VoiceEngine.prototype.setInputDevice = function(inputDeviceIndex) {
  this.window.webContents.send('set-input-device', inputDeviceIndex);
};
VoiceEngine.prototype.setInputMode = function(mode, options) {
  this.window.webContents.send('set-input-mode', mode, options);
};
VoiceEngine.prototype.getOutputDevices = function(cb) {
  this.window.webContents.send('get-output-devices', this._interop('get-output-devices', cb));
};

// WebRTC backend does not support setting the output device
VoiceEngine.prototype.setOutputDevice = noop;

// WebRTC backend does not support setting the input volume
VoiceEngine.prototype.setInputVolume = noop;

VoiceEngine.prototype.setOutputVolume = function(volume) {
  this.window.webContents.send('set-output-volume', volume);
};
VoiceEngine.prototype.setSelfDeafen = function(deaf) {
  this.window.webContents.send('set-self-deafen', deaf);
}
VoiceEngine.prototype.destroyTransport = function() {
  this.window.webContents.send('destroy-transport');
};

// WebRTC backend does not implement this method
VoiceEngine.prototype.setTransportOptions = logCall('setTransportOptions');

VoiceEngine.prototype.mergeUsers = function(users) {
  this.window.webContents.send('merge-users', users);
};
VoiceEngine.prototype.destroyUser = function(userId) {
  this.window.webContents.send('destroy-user', userId);
};


exports['default'] = new VoiceEngine({});
module.exports = exports['default'];
