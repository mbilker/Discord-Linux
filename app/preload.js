console.log('I run before anything else');

var remote = require('electron').remote;
var NativeVoiceEngine = remote.require('./VoiceEngine');

var runWebpackCb = false;

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

  var arr = [];
  var modules = webpackRequire.c;

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (modules[i] && modules[i].exports && modules[i].exports.handleSessionDescription) {
      arr.push(modules[i].exports);
    }
  }

  var VoiceEngine = arr[0];

  ['setEchoCancellation', 'setNoiseSuppression', 'setAutomaticGainControl'].forEach(function(method) {
    VoiceEngine[method] = function(enabled) {
      NativeVoiceEngine[method](enabled);
    };
  });

  VoiceEngine.handleSessionDescription = function(obj) {
    NativeVoiceEngine.handleSessionDescription({ sdp: obj.sdp });
  };

  VoiceEngine.handleSpeaking = function(userId, speaking) {
    NativeVoiceEngine.handleSpeaking(userId, speaking);
  };

  module.exports = { mbilker: true };
}

function afterInitialJsonp() {
  console.log(window['webpackJsonp']);

  window['webpackJsonp']([0], [injectedModule]);
}

//window['webpackJsonp'] = console.log.bind(console, 'parent webpack:');
window['webpackJsonp'] = webpackCb;
