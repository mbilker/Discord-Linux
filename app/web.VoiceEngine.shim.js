console.log('I run before anything else');

var VoiceEngine = require('remote').require('./VoiceEngine');
var runWebpackCb = false;

function noop() {}

var VoiceEngineShim = {
  supported: true,

  autoEnable: false,

  enable: VoiceEngine.enable,

  supportsAutomaticVAD() {
    return false;
  },

  supportsMultiplePTT() {
    return true;
  },

  supportsPTTReleaseDelay() {
    return true;
  },

  setForceSend: VoiceEngine.setPTTActive,
  setInputMode: VoiceEngine.setInputMode,
  setOutputVolume: VoiceEngine.setOutputVolume,

  setVolumeChangeCallback: noop,

  setSelfMute: VoiceEngine.setSelfMute,
  setSelfDeaf: VoiceEngine.setSelfDeaf,
  setLocalMute: VoiceEngine.setLocalMute,
  setLocalVolume: VoiceEngine.setLocalVolume,
  createUser: VoiceEngine.createUser,
  destroyUser: VoiceEngine.destroyUser,
  //onSpeaking: VoiceEngine.onSpeaking,
  //onVoiceActivity: VoiceEngine.onVoiceActivity,
  //onDevicesChanged: VoiceEngine.onDevicesChanged,

  canSetInputDevice() {
    return true;
  },

  getInputDevices: VoiceEngine.getInputDevices,
  setInputDevice: VoiceEngine.setInputDevice,

  canSetOutputDevice() {
    return false;
  },

  setOutputDevice: noop,

  getOutputDevices: VoiceEngine.getOutputDevices,
  setEncodingBitRate: VoiceEngine.setEncodingBitRate,

  supportsEncodingBitRate() {
    return true;
  },

  setEchoCancellation: VoiceEngine.setEchoCancellation,
  setNoiseSuppression: VoiceEngine.setNoiseSuppression,
  setAutomaticGainControl: VoiceEngine.setAutomaticGainControl,

  canSetAttenuation() {
    return false;
  },

  canSetVoiceProcessing() {
    return true;
  },

  setAttenuation: noop,

  onConnectionState: VoiceEngine.onConnectionState,
  connect: VoiceEngine.connect,
  disconnect: VoiceEngine.disconnect,
  handleSessionDescription: VoiceEngine.handleSessionDescription,
  handleSpeaking: VoiceEngine.handleSpeaking,
  debugDump: VoiceEngine.debugDump,

  setNoInputCallback: noop,
  setNoInputThreshold: noop,

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
  setPingCallback: noop,

  playSound: VoiceEngine.playSound,

  Constants: {}
};

function webpackCb(chunkIds, moreModules) {
  if (runWebpackCb) return;
  runWebpackCb = true;

  console.log('parent webpack');

  setImmediate(afterInitialJsonp);
}

function injectedModule(module, exports, webpackRequire) {
  console.log('injected module');

  var webpackVoiceEngines = [0];
  var modules = webpackRequire.c;

  window.__webpackRequire = webpackRequire;
  window.__voiceEngines = webpackVoiceEngines;

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
