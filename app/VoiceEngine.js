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

function createTemplateFunction(methodName) {
  return function() {
    const args = Array.prototype.slice.call(arguments, 0);
    let passedArgs = [methodName];

    args.forEach((arg) => {
      if (typeof(arg) === 'function') {
        passedArgs.push(this._interop(methodName, arg));
      } else if ((methodName === 'setLocalVolume' ||
                  methodName === 'setOutputVolume'
                 ) && typeof(arg) === 'number') {
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

/*
VoiceEngine.prototype.onConnectionState = function(cb) {
  this.window.webContents.send('on-connection-state', this._interop('on-connection-state', cb));
};
VoiceEngine.prototype.getInputDevices = function(cb) {
  this.window.webContents.send('get-input-devices', this._interop('get-input-devices', cb));
};

['setEchoCancellation', 'setNoiseSuppression', 'setAutomaticGainControl'].forEach(function(method) {
  VoiceEngine.prototype[method] = function(enabled) {
    this.window.webContents.send(method, enabled);
  };
});

VoiceEngine.prototype.setInputDevice = function(inputDeviceIndex) {
  this.window.webContents.send('set-input-device', inputDeviceIndex);
};
VoiceEngine.prototype.setInputMode = function(mode, options) {
  this.window.webContents.send('set-input-mode', mode, options);
};
VoiceEngine.prototype.getOutputDevices = function(cb) {
  this.window.webContents.send('get-output-devices', this._interop('get-output-devices', cb));
};
*/

// WebRTC backend does not support setting the output device
//VoiceEngine.prototype.setOutputDevice = noop;

// WebRTC backend does not support setting the input volume
//VoiceEngine.prototype.setInputVolume = noop;

/*
VoiceEngine.prototype.setOutputVolume = function(volume) {
  this.window.webContents.send('set-output-volume', volume * 100);
};
VoiceEngine.prototype.setSelfMute = function(mute) {
  this.window.webContents.send('set-self-mute', mute);
};
VoiceEngine.prototype.setSelfDeafen = function(deaf) {
  this.window.webContents.send('set-self-deafen', deaf);
};
VoiceEngine.prototype.setLocalMute = function(userId, mute) {
  this.window.webContents.send('set-local-mute', userId, mute);
};
VoiceEngine.prototype.setLocalVolume = function(userId, volume) {
  this.window.webContents.send('set-local-volume', userId, volume * 100);
};
VoiceEngine.prototype.destroyTransport = function() {
  this.window.webContents.send('destroy-transport');
};
*/

// WebRTC backend does not implement this method
//VoiceEngine.prototype.setTransportOptions = logCall('setTransportOptions');

/*
VoiceEngine.prototype.handleSpeaking = function(userId, speaking) {
  this.window.webContents.send('handle-speaking', userId, speaking);
};
VoiceEngine.prototype.handleSessionDescription = function(obj) {
  this.window.webContents.send('handle-session-description', obj);
};
VoiceEngine.prototype.mergeUsers = function(users) {
  this.window.webContents.send('merge-users', users);
};
VoiceEngine.prototype.destroyUser = function(userId) {
  this.window.webContents.send('destroy-user', userId);
};
*/

exports['default'] = new VoiceEngine({});
module.exports = exports['default'];
