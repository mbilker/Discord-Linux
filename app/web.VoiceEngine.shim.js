console.log('I run before anything else');

import platform from 'platform';

var VoiceEngine = require('remote').require('./VoiceEngine');
var runWebpackCb = false;

function noop() {}

var VoiceEngineShim = {
  supported: true,

  autoEnable: false,

  supportsAutomaticVAD() {
    return false;
  },

  supportsMultiplePTT() {
    return true;
  },

  supportsPTTReleaseDelay() {
    return true;
  },

  canSetOutputDevice() {
    return false;
  },

  supportsEncodingBitRate() {
    return true;
  },

  canSetAttenuation() {
    return false;
  },

  canSetVoiceProcessing() {
    return platform.layout === 'Blink';
  },

  setNoInputCallback() {},

  setNoInputThreshold() {},

  collectDiagnostics(callback) {
    callback(null);
  },

  diagnosticsEnabled: false,

  runDiagnostics(callback) {
    callback(null);
  },

  getDiagnosticInfo() {
    return null;
  },

  supportsNativePing: false,

  setInputVolume: noop,
  setVolumeChangeCallback: noop,
  setOutputDevice: noop,
  setAttenuation: noop,
  setPingCallback: noop,

  enable: VoiceEngine.enable,
  setForceSend: VoiceEngine.setPTTActive,
  setInputMode: VoiceEngine.setInputMode,
  setOutputVolume: VoiceEngine.setOutputVolume,
  setSelfMute: VoiceEngine.setSelfMute,
  setSelfDeaf: VoiceEngine.setSelfDeaf,
  setLocalMute: VoiceEngine.setLocalMute,
  setLocalVolume: VoiceEngine.setLocalVolume,
  createUser: VoiceEngine.createUser,
  destroyUser: VoiceEngine.destroyUser,
  onSpeaking: VoiceEngine.onSpeaking,
  onVoiceActivity: VoiceEngine.onVoiceActivity,
  onDevicesChanged: VoiceEngine.onDevicesChanged,
  getInputDevices: VoiceEngine.getInputDevices,
  getOutputDevices: VoiceEngine.getOutputDevices,
  canSetInputDevice: VoiceEngine.canSetInputDevice,
  setInputDevice: VoiceEngine.setInputDevice,
  setEncodingBitRate: VoiceEngine.setEncodingBitRate,
  setEchoCancellation: VoiceEngine.setEchoCancellation,
  setNoiseSuppression: VoiceEngine.setNoiseSuppression,
  setAutomaticGainControl: VoiceEngine.setAutomaticGainControl,
  onConnectionState: VoiceEngine.onConnectionState,
  connect: VoiceEngine.connect,
  disconnect: VoiceEngine.disconnect,
  handleSessionDescription: VoiceEngine.handleSessionDescription,
  handleSpeaking: VoiceEngine.handleSpeaking,
  debugDump: VoiceEngine.debugDump,

  Constants: {}
};

function webpackCb(chunkIds, moreModules) {
  if (runWebpackCb) return;
  runWebpackCb = true;

  console.log('parent webpack:', moreModules);

  setImmediate(afterInitialJsonp);
}

function injectedModule(module, exports, webpackRequire) {
  console.log('injected module');
  window.__webpackRequre = webpackRequire;
  console.log(webpackRequire.c);

  var webpackVoiceEngines = [0];
  var modules = webpackRequire.c;

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (modules[i] && modules[i].exports && modules[i].exports.handleSessionDescription) {
      webpackVoiceEngines[0] = modules[i];
      break;
    }
  }

  if (webpackVoiceEngines[0]) {
    console.log('Found exports of NativeVoiceEngine, setting to shim...');
    for (var i = 0; i < webpackVoiceEngines.length; i++) {
      Object.assign(webpackVoiceEngines[i].exports, VoiceEngineShim);
    }
  }

  module.exports = { mbilker: true };
}

function afterInitialJsonp() {
  console.log(window['webpackJsonp']);

  window['webpackJsonp']([0], [injectedModule]);
}

//window['webpackJsonp'] = console.log.bind(console, 'parent webpack:');
window['webpackJsonp'] = webpackCb;
