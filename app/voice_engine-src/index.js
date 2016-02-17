import {ipcRenderer} from 'electron';

localStorage.debug = '*';

import monkeyPatch from './superagentPatch';

//const _VoiceEngine = require('./lib/voice_engine/webrtc');
//const VoiceEngine = _VoiceEngine && _VoiceEngine['__esModule'] ? _VoiceEngine.default ? _VoiceEngine;
import VoiceEngine from './lib/voice_engine/webrtc';

import {InputModes} from './Constants';
import {NATIVE_TO_REGULAR} from './lib/voice_engine/native/Constants';

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  navigator.mozAudioContext;
window.RTCPeerConnection = window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription ||
  window.mozRTCSessionDescription ||
  window.webkitRTCSessionDescription;

const _deInterop = (cb) => {
  if (cb && cb['__INTEROP_CALLBACK'] && cb.name) {
    return (...args) => {
      if (cb.name !== 'set-on-voice-callback-reply') console.log(`${cb.name}:`, ...args);
      ipcRenderer.send(cb.name, ...args);
    };
  }
};

ipcRenderer.on('get-token-and-fingerprint', function(ev, {token: rawToken, fingerprint}) {
  const token = (rawToken || '').replace(/"/g, '');

  console.log(`get-token-and-fingerprint: token=${token} fingerprint=${fingerprint}`);
  window.token = token;
  window.fingerprint = fingerprint;

  localStorage.setItem('token', token);
  localStorage.setItem('fingerprint', fingerprint);
});
ipcRenderer.on('create-transport', function(ev, ssrc, userId, address, port, cb) {
  console.log('create-transport:', ssrc, userId, address, port, cb);
  VoiceEngine.onConnectionState((connectionState) => {
    console.log('onConnectionState:', connectionState);
  });
  VoiceEngine.enable((err) => {
    console.log('VoiceEngine.enable:', err);
  });
  VoiceEngine.connect(ssrc, userId, address, port, _deInterop(cb));
});
ipcRenderer.on('set-on-speaking-callback', function(ev, cb) {
  console.log('set-on-speaking-callback:', cb);
  VoiceEngine.onSpeaking(_deInterop(cb));
});
ipcRenderer.on('set-on-voice-callback', function(ev, cb) {
  console.log('set-on-voice-callback:', cb);
  VoiceEngine.onVoiceActivity(_deInterop(cb));
});
ipcRenderer.on('set-device-change-callback', function(ev, cb) {
  console.log('set-device-change-callback:', cb);
  VoiceEngine.onDevicesChanged(_deInterop(cb));
});
ipcRenderer.on('get-input-devices', function(ev, cb) {
  console.log('get-input-devices:', cb);
  VoiceEngine.getInputDevices(_deInterop(cb));
});
ipcRenderer.on('set-input-mode', function(ev, mode, options) {
  console.log('set-input-mode:', mode, options);
  if (NATIVE_TO_REGULAR[mode] === InputModes.PUSH_TO_TALK) {
    options = Object.assign({}, options, { delay: options.pttDelay });
  }
  VoiceEngine.setInputMode(NATIVE_TO_REGULAR[mode], options);
});
ipcRenderer.on('set-input-device', function(ev, inputDeviceIndex) {
  console.log('set-input-device:', inputDeviceIndex);
  VoiceEngine.setInputDevice(inputDeviceIndex);
});
ipcRenderer.on('get-output-devices', function(ev, cb) {
  console.log('get-output-devices:', cb);
  VoiceEngine.getOutputDevices(_deInterop(cb));
});
ipcRenderer.on('set-self-deafen', function(ev, deaf) {
  console.log('set-self-deafen:', deaf);
  VoiceEngine.setSelfDeaf(deaf);
});
ipcRenderer.on('destroy-transport', function(ev) {
  console.log('destroy-transport');
  VoiceEngine.disconnect();
});
ipcRenderer.on('merge-users', function(ev, users) {
  console.log('merge-users:', users);
  users.forEach((user) => {
    VoiceEngine.createUser(user.id, user.ssrc);
  });
});
ipcRenderer.on('destroy-user', function(ev, userId) {
  console.log('destroy-user:', userId);
  VoiceEngine.destroyUser(userId);
});
