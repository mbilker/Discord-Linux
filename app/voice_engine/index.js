'use strict';

var _electron = require('electron');

var _superagentPatch = require('./superagentPatch');

var _superagentPatch2 = _interopRequireDefault(_superagentPatch);

var _webrtc = require('./lib/voice_engine/webrtc');

var _webrtc2 = _interopRequireDefault(_webrtc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

localStorage.debug = '*';

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext || navigator.mozAudioContext;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

window.VoiceEngine = _webrtc2.default;

var _deInterop = function _deInterop(arg) {
  if (arg && arg['__INTEROP_CALLBACK'] && arg.name) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!arg.startsWith('setOnSpeakingCallback') && !arg.startsWith('setOnVoiceCallback') && !arg.startsWith('setDeviceChangeCallback')) {
        var _console;

        (_console = console).log.apply(_console, [arg.name + ':'].concat(args));
      }
      _electron.ipcRenderer.send.apply(_electron.ipcRenderer, [arg.name].concat(args));
    };
  } else {
    return arg;
  }
};

_electron.ipcRenderer.on('get-token-and-fingerprint', function (ev, _ref) {
  var rawToken = _ref.token;
  var fingerprint = _ref.fingerprint;

  var token = (rawToken || '').replace(/"/g, '');

  console.log('get-token-and-fingerprint: token=' + token + ' fingerprint=' + fingerprint);
  window.token = token;
  window.fingerprint = fingerprint;

  localStorage.setItem('token', token);
  localStorage.setItem('fingerprint', fingerprint);

  _webrtc2.default.getInputDevices(function (devices) {
    var device = devices[0].id;
    _webrtc2.default.setInputDevice(device);

    _webrtc2.default.enable(function (err) {
      console.log('VoiceEngine.enable:', err);
    });
  });
});

_electron.ipcRenderer.on('callVoiceEngineMethod', function (ev, args) {
  var _console2;

  var methodName = args.shift();
  var passedArgs = [];

  (_console2 = console).log.apply(_console2, [methodName + ':'].concat(_toConsumableArray(args)));

  args.forEach(function (arg) {
    if (arg && arg.__INTEROP_CALLBACK) {
      passedArgs.push(_deInterop(arg));
    } else {
      passedArgs.push(arg);
    }
  });

  _webrtc2.default[methodName].apply(null, passedArgs);
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

_electron.ipcRenderer.on('setOnSpeakingCallback', function (ev, cb) {
  console.log('setOnSpeakingCallback:', cb);
  _webrtc2.default.onSpeaking(_deInterop(cb));
});
_electron.ipcRenderer.on('setOnVoiceCallback', function (ev, cb) {
  console.log('setOnVoiceCallback:', cb);
  _webrtc2.default.onVoiceActivity(_deInterop(cb));
});
_electron.ipcRenderer.on('setDeviceChangeCallback', function (ev, cb) {
  console.log('setDeviceChangeCallback:', cb);
  _webrtc2.default.onDevicesChanged(_deInterop(cb));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3ZvaWNlX2VuZ2luZS1zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLGFBQWEsS0FBYixHQUFxQixHQUFyQjs7QUFLQSxVQUFVLFlBQVYsR0FBeUIsVUFBVSxZQUFWLElBQ3ZCLFVBQVUsa0JBQVYsSUFDQSxVQUFVLGVBQVY7QUFDRixPQUFPLFlBQVAsR0FBc0IsT0FBTyxZQUFQLElBQ3BCLE9BQU8sa0JBQVAsSUFDQSxVQUFVLGVBQVY7QUFDRixPQUFPLGlCQUFQLEdBQTJCLE9BQU8saUJBQVAsSUFDekIsT0FBTyxvQkFBUCxJQUNBLE9BQU8sdUJBQVA7QUFDRixPQUFPLHFCQUFQLEdBQStCLE9BQU8scUJBQVAsSUFDN0IsT0FBTyx3QkFBUCxJQUNBLE9BQU8sMkJBQVA7O0FBRUYsT0FBTyxXQUFQOztBQUVBLElBQU0sYUFBYSxTQUFiLFVBQWEsQ0FBQyxHQUFELEVBQVM7QUFDMUIsTUFBSSxPQUFPLElBQUksb0JBQUosQ0FBUCxJQUFvQyxJQUFJLElBQUosRUFBVTtBQUNoRCxXQUFPLFlBQWE7d0NBQVQ7O09BQVM7O0FBQ2xCLFVBQUksQ0FBQyxJQUFJLFVBQUosQ0FBZSx1QkFBZixDQUFELElBQ0EsQ0FBQyxJQUFJLFVBQUosQ0FBZSxvQkFBZixDQUFELElBQ0EsQ0FBQyxJQUFJLFVBQUosQ0FBZSx5QkFBZixDQUFELEVBQTRDOzs7QUFDOUMsNkJBQVEsR0FBUixrQkFBZSxJQUFJLElBQUosZUFBZ0IsS0FBL0IsRUFEOEM7T0FGaEQ7QUFLQSw0QkFBWSxJQUFaLCtCQUFpQixJQUFJLElBQUosU0FBYSxLQUE5QixFQU5rQjtLQUFiLENBRHlDO0dBQWxELE1BU087QUFDTCxXQUFPLEdBQVAsQ0FESztHQVRQO0NBRGlCOztBQWVuQixzQkFBWSxFQUFaLENBQWUsMkJBQWYsRUFBNEMsVUFBUyxFQUFULFFBQTZDO01BQXhCLGdCQUFQLE1BQStCO01BQWQsK0JBQWM7O0FBQ3ZGLE1BQU0sUUFBUSxDQUFDLFlBQVksRUFBWixDQUFELENBQWlCLE9BQWpCLENBQXlCLElBQXpCLEVBQStCLEVBQS9CLENBQVIsQ0FEaUY7O0FBR3ZGLFVBQVEsR0FBUix1Q0FBZ0QsMEJBQXFCLFdBQXJFLEVBSHVGO0FBSXZGLFNBQU8sS0FBUCxHQUFlLEtBQWYsQ0FKdUY7QUFLdkYsU0FBTyxXQUFQLEdBQXFCLFdBQXJCLENBTHVGOztBQU92RixlQUFhLE9BQWIsQ0FBcUIsT0FBckIsRUFBOEIsS0FBOUIsRUFQdUY7QUFRdkYsZUFBYSxPQUFiLENBQXFCLGFBQXJCLEVBQW9DLFdBQXBDLEVBUnVGOztBQVV2RixtQkFBWSxlQUFaLENBQTRCLFVBQUMsT0FBRCxFQUFhO0FBQ3ZDLFFBQU0sU0FBUyxRQUFRLENBQVIsRUFBVyxFQUFYLENBRHdCO0FBRXZDLHFCQUFZLGNBQVosQ0FBMkIsTUFBM0IsRUFGdUM7O0FBSXZDLHFCQUFZLE1BQVosQ0FBbUIsVUFBQyxHQUFELEVBQVM7QUFDMUIsY0FBUSxHQUFSLENBQVkscUJBQVosRUFBbUMsR0FBbkMsRUFEMEI7S0FBVCxDQUFuQixDQUp1QztHQUFiLENBQTVCLENBVnVGO0NBQTdDLENBQTVDOztBQW9CQSxzQkFBWSxFQUFaLENBQWUsdUJBQWYsRUFBd0MsVUFBQyxFQUFELEVBQUssSUFBTCxFQUFjOzs7QUFDcEQsTUFBSSxhQUFhLEtBQUssS0FBTCxFQUFiLENBRGdEO0FBRXBELE1BQUksYUFBYSxFQUFiLENBRmdEOztBQUlwRCx3QkFBUSxHQUFSLG1CQUFlLDRDQUFrQixNQUFqQyxFQUpvRDs7QUFNcEQsT0FBSyxPQUFMLENBQWEsVUFBQyxHQUFELEVBQVM7QUFDcEIsUUFBSSxPQUFPLElBQUksa0JBQUosRUFBd0I7QUFDakMsaUJBQVcsSUFBWCxDQUFnQixXQUFXLEdBQVgsQ0FBaEIsRUFEaUM7S0FBbkMsTUFFTztBQUNMLGlCQUFXLElBQVgsQ0FBZ0IsR0FBaEIsRUFESztLQUZQO0dBRFcsQ0FBYixDQU5vRDs7QUFjcEQsbUJBQVksVUFBWixFQUF3QixLQUF4QixDQUE4QixJQUE5QixFQUFvQyxVQUFwQyxFQWRvRDtDQUFkLENBQXhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyRUEsc0JBQVksRUFBWixDQUFlLHVCQUFmLEVBQXdDLFVBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUI7QUFDdkQsVUFBUSxHQUFSLENBQVksd0JBQVosRUFBc0MsRUFBdEMsRUFEdUQ7QUFFdkQsbUJBQVksVUFBWixDQUF1QixXQUFXLEVBQVgsQ0FBdkIsRUFGdUQ7Q0FBakIsQ0FBeEM7QUFJQSxzQkFBWSxFQUFaLENBQWUsb0JBQWYsRUFBcUMsVUFBUyxFQUFULEVBQWEsRUFBYixFQUFpQjtBQUNwRCxVQUFRLEdBQVIsQ0FBWSxxQkFBWixFQUFtQyxFQUFuQyxFQURvRDtBQUVwRCxtQkFBWSxlQUFaLENBQTRCLFdBQVcsRUFBWCxDQUE1QixFQUZvRDtDQUFqQixDQUFyQztBQUlBLHNCQUFZLEVBQVosQ0FBZSx5QkFBZixFQUEwQyxVQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCO0FBQ3pELFVBQVEsR0FBUixDQUFZLDBCQUFaLEVBQXdDLEVBQXhDLEVBRHlEO0FBRXpELG1CQUFZLGdCQUFaLENBQTZCLFdBQVcsRUFBWCxDQUE3QixFQUZ5RDtDQUFqQixDQUExQyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aXBjUmVuZGVyZXJ9IGZyb20gJ2VsZWN0cm9uJztcblxubG9jYWxTdG9yYWdlLmRlYnVnID0gJyonO1xuXG5pbXBvcnQgbW9ua2V5UGF0Y2ggZnJvbSAnLi9zdXBlcmFnZW50UGF0Y2gnO1xuaW1wb3J0IFZvaWNlRW5naW5lIGZyb20gJy4vbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMnO1xuXG5uYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fFxuICBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8XG4gIG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWE7XG53aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fFxuICB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0IHx8XG4gIG5hdmlnYXRvci5tb3pBdWRpb0NvbnRleHQ7XG53aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24gPSB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgd2luZG93Lm1velJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gIHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcbndpbmRvdy5SVENTZXNzaW9uRGVzY3JpcHRpb24gPSB3aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gIHdpbmRvdy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgd2luZG93LndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcblxud2luZG93LlZvaWNlRW5naW5lID0gVm9pY2VFbmdpbmU7XG5cbmNvbnN0IF9kZUludGVyb3AgPSAoYXJnKSA9PiB7XG4gIGlmIChhcmcgJiYgYXJnWydfX0lOVEVST1BfQ0FMTEJBQ0snXSAmJiBhcmcubmFtZSkge1xuICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKCFhcmcuc3RhcnRzV2l0aCgnc2V0T25TcGVha2luZ0NhbGxiYWNrJykgJiZcbiAgICAgICAgICAhYXJnLnN0YXJ0c1dpdGgoJ3NldE9uVm9pY2VDYWxsYmFjaycpICYmXG4gICAgICAgICAgIWFyZy5zdGFydHNXaXRoKCdzZXREZXZpY2VDaGFuZ2VDYWxsYmFjaycpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2FyZy5uYW1lfTpgLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoYXJnLm5hbWUsIC4uLmFyZ3MpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfVxufTtcblxuaXBjUmVuZGVyZXIub24oJ2dldC10b2tlbi1hbmQtZmluZ2VycHJpbnQnLCBmdW5jdGlvbihldiwge3Rva2VuOiByYXdUb2tlbiwgZmluZ2VycHJpbnR9KSB7XG4gIGNvbnN0IHRva2VuID0gKHJhd1Rva2VuIHx8ICcnKS5yZXBsYWNlKC9cIi9nLCAnJyk7XG5cbiAgY29uc29sZS5sb2coYGdldC10b2tlbi1hbmQtZmluZ2VycHJpbnQ6IHRva2VuPSR7dG9rZW59IGZpbmdlcnByaW50PSR7ZmluZ2VycHJpbnR9YCk7XG4gIHdpbmRvdy50b2tlbiA9IHRva2VuO1xuICB3aW5kb3cuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcblxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCB0b2tlbik7XG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmaW5nZXJwcmludCcsIGZpbmdlcnByaW50KTtcblxuICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoKGRldmljZXMpID0+IHtcbiAgICBjb25zdCBkZXZpY2UgPSBkZXZpY2VzWzBdLmlkO1xuICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGRldmljZSk7XG5cbiAgICBWb2ljZUVuZ2luZS5lbmFibGUoKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1ZvaWNlRW5naW5lLmVuYWJsZTonLCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5pcGNSZW5kZXJlci5vbignY2FsbFZvaWNlRW5naW5lTWV0aG9kJywgKGV2LCBhcmdzKSA9PiB7XG4gIGxldCBtZXRob2ROYW1lID0gYXJncy5zaGlmdCgpO1xuICBsZXQgcGFzc2VkQXJncyA9IFtdO1xuXG4gIGNvbnNvbGUubG9nKGAke21ldGhvZE5hbWV9OmAsIC4uLmFyZ3MpO1xuXG4gIGFyZ3MuZm9yRWFjaCgoYXJnKSA9PiB7XG4gICAgaWYgKGFyZyAmJiBhcmcuX19JTlRFUk9QX0NBTExCQUNLKSB7XG4gICAgICBwYXNzZWRBcmdzLnB1c2goX2RlSW50ZXJvcChhcmcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFzc2VkQXJncy5wdXNoKGFyZyk7XG4gICAgfVxuICB9KTtcblxuICBWb2ljZUVuZ2luZVttZXRob2ROYW1lXS5hcHBseShudWxsLCBwYXNzZWRBcmdzKTtcbn0pO1xuXG4vKlxuY29uc3QgbWV0aG9kcyA9IFtcbiAgJ2VuYWJsZScsXG4gICdzZXRQVFRBY3RpdmUnLFxuICAnc2V0T3V0cHV0Vm9sdW1lJyxcbiAgJ3NldFNlbGZNdXRlJyxcbiAgJ3NldFNlbGZEZWFmJyxcbiAgJ3NldExvY2FsTXV0ZScsXG4gICdzZXRMb2NhbFZvbHVtZScsXG4gICdjcmVhdGVVc2VyJyxcbiAgJ2Rlc3Ryb3lVc2VyJyxcbiAgJ29uU3BlYWtpbmcnLFxuICAnb25Wb2ljZUFjdGl2aXR5JyxcbiAgJ29uRGV2aWNlc0NoYW5nZWQnLFxuICAnZ2V0SW5wdXREZXZpY2VzJyxcbiAgJ2dldE91dHB1dERldmljZXMnLFxuICAnY2FuU2V0SW5wdXREZXZpY2UnLFxuICAnc2V0SW5wdXREZXZpY2UnLFxuICAnc2V0RW5jb2RpbmdCaXRSYXRlJyxcbiAgJ3NldEVjaG9DYW5jZWxsYXRpb24nLFxuICAnc2V0Tm9pc2VTdXBwcmVzc2lvbicsXG4gICdzZXRBdXRvbWF0aWNHYWluQ29udHJvbCcsXG4gICdvbkNvbm5lY3Rpb25TdGF0ZScsXG4gICdjb25uZWN0JyxcbiAgJ2Rpc2Nvbm5lY3QnLFxuICAnaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uJyxcbiAgJ2hhbmRsZVNwZWFraW5nJyxcbiAgJ2RlYnVnRHVtcCdcbl07XG4qL1xuXG4vKlxubWV0aG9kcy5mb3JFYWNoKChtZXRob2ROYW1lKSA9PiB7XG4gIGlwY1JlbmRlcmVyLm9uKG1ldGhvZE5hbWUsIChldiwgLi4uYXJncykgPT4ge1xuICAgIGxldCBwYXNzZWRBcmdzID0gW107XG5cbiAgICBhcmdzLmZvckVhY2goKGFyZykgPT4ge1xuICAgICAgaWYgKGFyZy5fX0lOVEVST1BfQ0FMTEJBQ0spIHtcbiAgICAgICAgcGFzc2VkQXJncy5wdXNoKF9kZUludGVyb3AoYXJnKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXNzZWRBcmdzLnB1c2goYXJnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIFZvaWNlRW5naW5lW21ldGhvZE5hbWVdLmFwcGx5KG51bGwsIHBhc3NlZEFyZ3MpO1xuICB9KTtcbn0pO1xuKi9cbi8qXG5pcGNSZW5kZXJlci5vbignY3JlYXRlLXRyYW5zcG9ydCcsIGZ1bmN0aW9uKGV2LCBzc3JjLCB1c2VySWQsIGFkZHJlc3MsIHBvcnQsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdjcmVhdGUtdHJhbnNwb3J0OicsIHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2IpO1xuICBWb2ljZUVuZ2luZS5lbmFibGUoKGVycikgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdWb2ljZUVuZ2luZS5lbmFibGU6JywgZXJyKTtcbiAgfSk7XG4gIFZvaWNlRW5naW5lLmNvbm5lY3Qoc3NyYywgdXNlcklkLCBhZGRyZXNzLCBwb3J0LCBfZGVJbnRlcm9wKGNiKSk7XG59KTtcbiovXG5cbmlwY1JlbmRlcmVyLm9uKCdzZXRPblNwZWFraW5nQ2FsbGJhY2snLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ3NldE9uU3BlYWtpbmdDYWxsYmFjazonLCBjYik7XG4gIFZvaWNlRW5naW5lLm9uU3BlYWtpbmcoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0T25Wb2ljZUNhbGxiYWNrJywgZnVuY3Rpb24oZXYsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdzZXRPblZvaWNlQ2FsbGJhY2s6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5vblZvaWNlQWN0aXZpdHkoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0RGV2aWNlQ2hhbmdlQ2FsbGJhY2snLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ3NldERldmljZUNoYW5nZUNhbGxiYWNrOicsIGNiKTtcbiAgVm9pY2VFbmdpbmUub25EZXZpY2VzQ2hhbmdlZChfZGVJbnRlcm9wKGNiKSk7XG59KTtcblxuLypcbmlwY1JlbmRlcmVyLm9uKCdvbkNvbm5lY3Rpb25TdGF0ZScsIGZ1bmN0aW9uKGV2LCBjYikge1xuICBjb25zb2xlLmxvZygnb25Db25uZWN0aW9uU3RhdGU6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5vbkNvbm5lY3Rpb25TdGF0ZShfZGVJbnRlcm9wKGNiKSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdnZXQtaW5wdXQtZGV2aWNlcycsIGZ1bmN0aW9uKGV2LCBjYikge1xuICBjb25zb2xlLmxvZygnZ2V0LWlucHV0LWRldmljZXM6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoX2RlSW50ZXJvcChjYikpO1xufSk7XG5bJ3NldEVjaG9DYW5jZWxsYXRpb24nLCAnc2V0Tm9pc2VTdXBwcmVzc2lvbicsICdzZXRBdXRvbWF0aWNHYWluQ29udHJvbCddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XG4gIGlwY1JlbmRlcmVyLm9uKG1ldGhvZCwgZnVuY3Rpb24oZXYsIGVuYWJsZWQpIHtcbiAgICBjb25zb2xlLmxvZyhgJHttZXRob2R9OmAsIGVuYWJsZWQpO1xuICAgIFZvaWNlRW5naW5lW21ldGhvZF0oZW5hYmxlZCk7XG4gIH0pO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LWlucHV0LWRldmljZScsIGZ1bmN0aW9uKGV2LCBpbnB1dERldmljZUluZGV4KSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtaW5wdXQtZGV2aWNlOicsIGlucHV0RGV2aWNlSW5kZXgpO1xuICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoKGRldmljZXMpID0+IHtcbiAgICBjb25zdCBkZXZpY2UgPSBkZXZpY2VzW2lucHV0RGV2aWNlSW5kZXhdLmlkO1xuICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGRldmljZSk7XG4gIH0pO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LWlucHV0LW1vZGUnLCBmdW5jdGlvbihldiwgbW9kZSwgb3B0aW9ucykge1xuICBjb25zb2xlLmxvZygnc2V0LWlucHV0LW1vZGU6JywgbW9kZSwgb3B0aW9ucyk7XG4gIGlmIChOQVRJVkVfVE9fUkVHVUxBUlttb2RlXSA9PT0gSW5wdXRNb2Rlcy5QVVNIX1RPX1RBTEspIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBkZWxheTogb3B0aW9ucy5wdHREZWxheSB9KTtcbiAgfVxuICBWb2ljZUVuZ2luZS5zZXRJbnB1dE1vZGUoTkFUSVZFX1RPX1JFR1VMQVJbbW9kZV0sIG9wdGlvbnMpO1xufSk7XG5pcGNSZW5kZXJlci5vbignZ2V0LW91dHB1dC1kZXZpY2VzJywgZnVuY3Rpb24oZXYsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdnZXQtb3V0cHV0LWRldmljZXM6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5nZXRPdXRwdXREZXZpY2VzKF9kZUludGVyb3AoY2IpKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1vdXRwdXQtdm9sdW1lJywgZnVuY3Rpb24oZXYsIHZvbHVtZSkge1xuICBjb25zb2xlLmxvZygnc2V0LW91dHB1dC12b2x1bWU6Jywgdm9sdW1lKTtcbiAgVm9pY2VFbmdpbmUuc2V0T3V0cHV0Vm9sdW1lKHZvbHVtZSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdzZXQtc2VsZi1tdXRlJywgZnVuY3Rpb24oZXYsIG11dGUpIHtcbiAgY29uc29sZS5sb2coJ3NldC1zZWxmLW11dGU6JywgbXV0ZSk7XG4gIFZvaWNlRW5naW5lLnNldFNlbGZNdXRlKG11dGUpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LXNlbGYtZGVhZmVuJywgZnVuY3Rpb24oZXYsIGRlYWYpIHtcbiAgY29uc29sZS5sb2coJ3NldC1zZWxmLWRlYWZlbjonLCBkZWFmKTtcbiAgVm9pY2VFbmdpbmUuc2V0U2VsZkRlYWYoZGVhZik7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdzZXQtbG9jYWwtbXV0ZScsIGZ1bmN0aW9uKGV2LCB1c2VySWQsIG11dGUpIHtcbiAgY29uc29sZS5sb2coJ3NldC1sb2NhbC1tdXRlOicsIHVzZXJJZCwgbXV0ZSk7XG4gIFZvaWNlRW5naW5lLnNldExvY2FsTXV0ZSh1c2VySWQsIG11dGUpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LWxvY2FsLXZvbHVtZScsIGZ1bmN0aW9uKGV2LCB1c2VySWQsIHZvbHVtZSkge1xuICBjb25zb2xlLmxvZygnc2V0LWxvY2FsLXZvbHVtZTonLCB1c2VySWQsIHZvbHVtZSk7XG4gIFZvaWNlRW5naW5lLnNldExvY2FsVm9sdW1lKHVzZXJJZCwgdm9sdW1lKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ2Rlc3Ryb3ktdHJhbnNwb3J0JywgZnVuY3Rpb24oZXYpIHtcbiAgY29uc29sZS5sb2coJ2Rlc3Ryb3ktdHJhbnNwb3J0Jyk7XG4gIFZvaWNlRW5naW5lLmRpc2Nvbm5lY3QoKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ2hhbmRsZS1zcGVha2luZycsIGZ1bmN0aW9uKGV2LCB1c2VySWQsIHNwZWFraW5nKSB7XG4gIC8vY29uc29sZS5sb2coJ2hhbmRsZS1zcGVha2luZzonLCB1c2VySWQsIHNwZWFraW5nKTtcbiAgVm9pY2VFbmdpbmUuaGFuZGxlU3BlYWtpbmcodXNlcklkLCBzcGVha2luZyk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdoYW5kbGUtc2Vzc2lvbi1kZXNjcmlwdGlvbicsIGZ1bmN0aW9uKGV2LCBvYmopIHtcbiAgY29uc29sZS5sb2coJ2hhbmRsZS1zZXNzaW9uLWRlc2NyaXB0aW9uOicsIG9iaik7XG4gIFZvaWNlRW5naW5lLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihvYmopO1xufSk7XG5pcGNSZW5kZXJlci5vbignbWVyZ2UtdXNlcnMnLCBmdW5jdGlvbihldiwgdXNlcnMpIHtcbiAgY29uc29sZS5sb2coJ21lcmdlLXVzZXJzOicsIHVzZXJzKTtcbiAgdXNlcnMuZm9yRWFjaCgodXNlcikgPT4ge1xuICAgIFZvaWNlRW5naW5lLmNyZWF0ZVVzZXIodXNlci5pZCwgdXNlci5zc3JjKTtcbiAgfSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdkZXN0cm95LXVzZXInLCBmdW5jdGlvbihldiwgdXNlcklkKSB7XG4gIGNvbnNvbGUubG9nKCdkZXN0cm95LXVzZXI6JywgdXNlcklkKTtcbiAgVm9pY2VFbmdpbmUuZGVzdHJveVVzZXIodXNlcklkKTtcbn0pO1xuKi9cbiJdfQ==