console.log('I run before anything else');

var VoiceEngine = require('remote').require('./VoiceEngine');
var runWebpackCb = false;

function noop() {}

/*
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
*/

function webpackCb(chunkIds, moreModules) {
  if (runWebpackCb) return;
  runWebpackCb = true;

  console.log('parent webpack');

  setImmediate(afterInitialJsonp);
}

function findWebpackModule(exportedToLookFor) {
  const webpackRequire = window.__webpackRequire;
  const mod = webpackRequire.c;
  let results = [];

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (mod[i] && mod[i].exports && exportedToLookFor.every(x => mod[i].exports[x])) {
      results.push(mod[i]);
    }
  }

  return results;
}

function findWebRTCModule() {
  const voiceLoader = findWebpackModule(['handleSessionDescription'])
    .filter(x => __webpackRequire.m[x.id].toString().match(/webkitGetUserMedia/))[0];
  if (!voiceLoader) {
    throw new Error('Cannot find voice engine loader');
  }
  const text = __webpackRequire.m[voiceLoader.id].toString();
  const reg = /n\(([0-9]+)\)/g;
  let results = [];
  var res = null;

  while ((res = reg.exec(text))) {
    results.push(res);
  }

  return results
    .filter(x => !__webpackRequire.c[x[1]])
    .map(x => parseInt(x[1]))[0];
}

function injectedModule(module, exports, webpackRequire) {
  console.log('injected module');

  const modules = webpackRequire.c;
  let webpackVoiceEngines = [0];

  window.__webpackRequire = webpackRequire;
  window.__voiceEngines = webpackVoiceEngines;

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (modules[i] && modules[i].exports && modules[i].exports.handleSessionDescription) {
      webpackVoiceEngines[0] = modules[i];
      break;
    }
  }

  //if (webpackVoiceEngines[0]) {
  //  console.log('Found exports of NativeVoiceEngine, setting to shim...');
  //  for (var i = 0; i < webpackVoiceEngines.length; i++) {
  //    Object.assign(webpackVoiceEngines[i].exports, VoiceEngineShim);
  //  }
  //}

  if (webpackVoiceEngines[0]) {
    const num = findWebRTCModule();
    const obj = __webpackRequire(num);

    for (var i = 0; i < webpackVoiceEngines.length; i++) {
      Object.assign(webpackVoiceEngines[i].exports, obj);
      webpackVoiceEngines[i].playSound = VoiceEngine.playSound;
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
window['findWebpackModule'] = findWebpackModule;
window['findWebRTCModule'] = findWebRTCModule;
