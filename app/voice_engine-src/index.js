import {ipcRenderer} from 'electron';

localStorage.debug = '*';

import monkeyPatch from './superagentPatch';
import VoiceEngine from './lib/voice_engine/webrtc';

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

window.VoiceEngine = VoiceEngine;

const _deInterop = (arg) => {
  if (arg && arg['__INTEROP_CALLBACK'] && arg.name) {
    return (...args) => {
      if (!arg.name.startsWith('setOnSpeakingCallback') &&
          !arg.name.startsWith('setOnVoiceCallback') &&
          !arg.name.startsWith('setDeviceChangeCallback')) {
        console.log(`${arg.name}:`, ...args);
      }
      ipcRenderer.send(arg.name, ...args);
    };
  } else {
    return arg;
  }
};

ipcRenderer.on('get-token-and-fingerprint', function(ev, {token: rawToken, fingerprint}) {
  const token = (rawToken || '').replace(/"/g, '');

  console.log(`get-token-and-fingerprint: token=${token} fingerprint=${fingerprint}`);
  window.token = token;
  window.fingerprint = fingerprint;

  localStorage.setItem('token', token);
  localStorage.setItem('fingerprint', fingerprint);

  VoiceEngine.getInputDevices((devices) => {
    const device = devices[0].id;
    VoiceEngine.setInputDevice(device);

    VoiceEngine.enable((err) => {
      console.log('VoiceEngine.enable:', err);
    });
  });
});

ipcRenderer.on('callVoiceEngineMethod', (ev, args) => {
  let methodName = args.shift();
  let passedArgs = [];

  console.log(`${methodName}:`, ...args);

  args.forEach((arg) => {
    if (arg && arg.__INTEROP_CALLBACK) {
      passedArgs.push(_deInterop(arg));
    } else {
      passedArgs.push(arg);
    }
  });

  VoiceEngine[methodName].apply(null, passedArgs);
});

/*
const methods = [
  'enable',
  'setPTTActive',
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
  'connect',
  'disconnect',
  'handleSessionDescription',
  'handleSpeaking',
  'debugDump'
];
*/

/*
methods.forEach((methodName) => {
  ipcRenderer.on(methodName, (ev, ...args) => {
    let passedArgs = [];

    args.forEach((arg) => {
      if (arg.__INTEROP_CALLBACK) {
        passedArgs.push(_deInterop(arg));
      } else {
        passedArgs.push(arg);
      }
    });

    VoiceEngine[methodName].apply(null, passedArgs);
  });
});
*/
/*
ipcRenderer.on('create-transport', function(ev, ssrc, userId, address, port, cb) {
  console.log('create-transport:', ssrc, userId, address, port, cb);
  VoiceEngine.enable((err) => {
    console.log('VoiceEngine.enable:', err);
  });
  VoiceEngine.connect(ssrc, userId, address, port, _deInterop(cb));
});
*/

ipcRenderer.on('setOnSpeakingCallback', function(ev, cb) {
  console.log('setOnSpeakingCallback:', cb);
  VoiceEngine.onSpeaking(_deInterop(cb));
});
ipcRenderer.on('setOnVoiceCallback', function(ev, cb) {
  console.log('setOnVoiceCallback:', cb);
  VoiceEngine.onVoiceActivity(_deInterop(cb));
});
ipcRenderer.on('setDeviceChangeCallback', function(ev, cb) {
  console.log('setDeviceChangeCallback:', cb);
  VoiceEngine.onDevicesChanged(_deInterop(cb));
});

/*
ipcRenderer.on('onConnectionState', function(ev, cb) {
  console.log('onConnectionState:', cb);
  VoiceEngine.onConnectionState(_deInterop(cb));
});
ipcRenderer.on('get-input-devices', function(ev, cb) {
  console.log('get-input-devices:', cb);
  VoiceEngine.getInputDevices(_deInterop(cb));
});
['setEchoCancellation', 'setNoiseSuppression', 'setAutomaticGainControl'].forEach(function(method) {
  ipcRenderer.on(method, function(ev, enabled) {
    console.log(`${method}:`, enabled);
    VoiceEngine[method](enabled);
  });
});
ipcRenderer.on('set-input-device', function(ev, inputDeviceIndex) {
  console.log('set-input-device:', inputDeviceIndex);
  VoiceEngine.getInputDevices((devices) => {
    const device = devices[inputDeviceIndex].id;
    VoiceEngine.setInputDevice(device);
  });
});
ipcRenderer.on('set-input-mode', function(ev, mode, options) {
  console.log('set-input-mode:', mode, options);
  if (NATIVE_TO_REGULAR[mode] === InputModes.PUSH_TO_TALK) {
    options = Object.assign({}, options, { delay: options.pttDelay });
  }
  VoiceEngine.setInputMode(NATIVE_TO_REGULAR[mode], options);
});
ipcRenderer.on('get-output-devices', function(ev, cb) {
  console.log('get-output-devices:', cb);
  VoiceEngine.getOutputDevices(_deInterop(cb));
});
ipcRenderer.on('set-output-volume', function(ev, volume) {
  console.log('set-output-volume:', volume);
  VoiceEngine.setOutputVolume(volume);
});
ipcRenderer.on('set-self-mute', function(ev, mute) {
  console.log('set-self-mute:', mute);
  VoiceEngine.setSelfMute(mute);
});
ipcRenderer.on('set-self-deafen', function(ev, deaf) {
  console.log('set-self-deafen:', deaf);
  VoiceEngine.setSelfDeaf(deaf);
});
ipcRenderer.on('set-local-mute', function(ev, userId, mute) {
  console.log('set-local-mute:', userId, mute);
  VoiceEngine.setLocalMute(userId, mute);
});
ipcRenderer.on('set-local-volume', function(ev, userId, volume) {
  console.log('set-local-volume:', userId, volume);
  VoiceEngine.setLocalVolume(userId, volume);
});
ipcRenderer.on('destroy-transport', function(ev) {
  console.log('destroy-transport');
  VoiceEngine.disconnect();
});
ipcRenderer.on('handle-speaking', function(ev, userId, speaking) {
  //console.log('handle-speaking:', userId, speaking);
  VoiceEngine.handleSpeaking(userId, speaking);
});
ipcRenderer.on('handle-session-description', function(ev, obj) {
  console.log('handle-session-description:', obj);
  VoiceEngine.handleSessionDescription(obj);
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
*/
