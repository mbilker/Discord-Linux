console.log('I run before anything else');

import path from 'path';
import {ipcRenderer} from 'electron';

var runWebpackCb = false;

function noop() {};

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

let loadedVoiceEngine = null;
function findWebRTCModule() {
  if (loadedVoiceEngine) {
    return loadedVoiceEngine;
  }

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

  loadedVoiceEngine =  results
    .filter(x => !__webpackRequire.c[x[1]])
    .map(x => parseInt(x[1]))[0];

  return loadedVoiceEngine;
}

function shimVoiceEngine(voiceEngine) {
  const num = findWebRTCModule();
  const obj = __webpackRequire(num);

  const {playSound} = findWebpackModule(['playSound']).filter(x => Object.keys(x.exports).length === 1)[0].exports;

  Object.assign(voiceEngine, obj);
  voiceEngine.playSound = function playSound2(name, volume) {
    playSound(name, volume, true);
  };
  voiceEngine.setOnSpeakingCallback = voiceEngine.onSpeaking;
  voiceEngine.setOnVoiceCallback = voiceEngine.onVoiceActivity;
  voiceEngine.setDeviceChangeCallback = voiceEngine.onDevicesChanged;
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

  if (webpackVoiceEngines[0]) {
    for (var i = 0; i < webpackVoiceEngines.length; i++) {
      shimVoiceEngine(webpackVoiceEngines[i].exports);
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
