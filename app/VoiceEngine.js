'use strict';

const electron = require('electron');
const crypto = require('crypto');
const events = require('events');
const path = require('path');

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

var noop = function noop() {}

var VoiceEngine = function() {
  this.callbacks = [];

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

//VoiceEngine.prototype.__proto__ = events.EventEmitter.prototype;
VoiceEngine.prototype._init = function () {};
VoiceEngine.prototype._listCallbacks = function() {
  return JSON.stringify(Object.keys(this.callbacks));
};

VoiceEngine.prototype._interop = function(id, cb) {
  const isNewCallback = !this.callbacks[id];
  this.callbacks[id] = cb;

  if (isNewCallback) {
    ipcMain.on(`${id}-reply`, (ev, ...args) => {
      this.callbacks[id](...args);
    });
  }

  return { __INTEROP_CALLBACK: true, name: `${id}-reply` };
};

const methods = [
  'enable',
  'setPTTActive',
  //'setInputMode',
  'setOutputVolume',
  'setSelfMute',
  'setSelfDeaf',
  'setLocalMute',
  'setLocalVolume',
  'createUser',
  'destroyUser',
  'onSpeaking',
  'onVoiceActivity',
  'onDevicesChanged',
  'getInputDevices',
  'getOutputDevices',
  'canSetInputDevice',
  'setInputDevice',
  'setEncodingBitRate',
  'setEchoCancellation',
  'setNoiseSuppression',
  'setAutomaticGainControl',
  'onConnectionState',
  //'connect', // include custom method call
  'disconnect',
  'handleSessionDescription',
  'handleSpeaking',
  'debugDump'
];

function createTemplateFunction(methodName, callbackOnce) {
  return function() {
    const args = Array.prototype.slice.call(arguments, 0);
    let passedArgs = [methodName];

    args.forEach((arg) => {
      if (typeof(arg) === 'function') {
        passedArgs.push(this._interop(methodName, arg, callbackOnce));
      } else if (methodName === 'setOutputVolume' && typeof(arg) === 'number') {
        passedArgs.push(arg * 100);
      } else {
        passedArgs.push(arg);
      }
    });

    this.window.webContents.send('callVoiceEngineMethod', passedArgs);
  };
};

methods.forEach(function(methodName) {
  VoiceEngine.prototype[methodName] = createTemplateFunction(methodName);
});

VoiceEngine.prototype._connect = createTemplateFunction('connect');
VoiceEngine.prototype.connect = function connect(ssrc, userId, serverIp, port, callback) {
  const window = BrowserWindow.getAllWindows().filter(b => b.id !== this.window.id)[0];
  window.webContents.executeJavaScript("require('electron').ipcRenderer.send('get-token-and-fingerprint', {token:localStorage.getItem('token'),fingerprint:localStorage.getItem('fingerprint')})");

  setTimeout(() => {
    this._connect(ssrc, userId, serverIp, port, this._interop('connect', callback));
  }, 500);
};

VoiceEngine.prototype._setInputMode = createTemplateFunction('setInputMode');
VoiceEngine.prototype.setInputMode = function setInputMode(mode, options) {
  if (typeof(mode) === 'number') {
    if (mode === 1) {
      mode = "VOICE_ACTIVITY";
    } else if (mode === 2) {
      mode = "PUSH_TO_TALK";
    }
  }

  options = {
    shortcut: options.shortcut,
    threshold: options.vadThreshold,
    autoThreshold: !!options.vadAutoThreshold,
    delay: options.pttDelay
  };

  this._setInputMode(mode, options);
}

VoiceEngine.prototype.setEmitVADLevel = noop;
VoiceEngine.prototype.setInputVolume = noop;
VoiceEngine.prototype.setSelfDeafen = VoiceEngine.prototype.setSelfDeaf;
VoiceEngine.prototype.setOutputDevice = noop;

VoiceEngine.prototype.setOnSpeakingCallback = function(cb) {
  this.window.webContents.send('setOnSpeakingCallback', this._interop('setOnSpeakingCallback', cb));
};
VoiceEngine.prototype.setOnVoiceCallback = function(cb) {
  this.window.webContents.send('setOnVoiceCallback', this._interop('setOnVoiceCallback', cb));
};
VoiceEngine.prototype.setDeviceChangeCallback = function(cb) {
  this.window.webContents.send('setDeviceChangeCallback', this._interop('setDeviceChangeCallback', cb));
};

VoiceEngine.prototype.playSound = function(name, volume) {
  this.window.webContents.send('playSound', name, volume);
};

exports['default'] = new VoiceEngine({});
module.exports = exports['default'];
