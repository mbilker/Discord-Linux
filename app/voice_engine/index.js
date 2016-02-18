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

var _deInterop = function _deInterop(arg) {
  if (arg && arg['__INTEROP_CALLBACK'] && arg.name) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (arg.name !== 'setOnSpeakingCallback-reply' && arg.name !== 'setOnVoiceCallback-reply' && arg.name !== 'setDeviceChangeCallback-reply') {
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
ipcRenderer.on('set-on-speaking-callback', function(ev, cb) {
  console.log('set-on-speaking-callback:', cb);
  VoiceEngine.onSpeaking(_deInterop(cb));
});
ipcRenderer.on('set-on-voice-callback', function(ev, cb) {
  console.log('set-on-voice-callback:', cb);
  VoiceEngine.onVoiceActivity(_deInterop(cb));
});
ipcRenderer.on('on-connection-state', function(ev, cb) {
  console.log('on-connection-state:', cb);
  VoiceEngine.onConnectionState(_deInterop(cb));
});
ipcRenderer.on('set-device-change-callback', function(ev, cb) {
  console.log('set-device-change-callback:', cb);
  VoiceEngine.onDevicesChanged(_deInterop(cb));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3ZvaWNlX2VuZ2luZS1zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLGFBQWEsS0FBYixHQUFxQixHQUFyQjs7QUFLQSxVQUFVLFlBQVYsR0FBeUIsVUFBVSxZQUFWLElBQ3ZCLFVBQVUsa0JBQVYsSUFDQSxVQUFVLGVBQVY7QUFDRixPQUFPLFlBQVAsR0FBc0IsT0FBTyxZQUFQLElBQ3BCLE9BQU8sa0JBQVAsSUFDQSxVQUFVLGVBQVY7QUFDRixPQUFPLGlCQUFQLEdBQTJCLE9BQU8saUJBQVAsSUFDekIsT0FBTyxvQkFBUCxJQUNBLE9BQU8sdUJBQVA7QUFDRixPQUFPLHFCQUFQLEdBQStCLE9BQU8scUJBQVAsSUFDN0IsT0FBTyx3QkFBUCxJQUNBLE9BQU8sMkJBQVA7O0FBRUYsSUFBTSxhQUFhLFNBQWIsVUFBYSxDQUFDLEdBQUQsRUFBUztBQUMxQixNQUFJLE9BQU8sSUFBSSxvQkFBSixDQUFQLElBQW9DLElBQUksSUFBSixFQUFVO0FBQ2hELFdBQU8sWUFBYTt3Q0FBVDs7T0FBUzs7QUFDbEIsVUFBSSxJQUFJLElBQUosS0FBYSw2QkFBYixJQUNBLElBQUksSUFBSixLQUFhLDBCQUFiLElBQ0EsSUFBSSxJQUFKLEtBQWEsK0JBQWIsRUFBOEM7OztBQUNoRCw2QkFBUSxHQUFSLGtCQUFlLElBQUksSUFBSixlQUFnQixLQUEvQixFQURnRDtPQUZsRDtBQUtBLDRCQUFZLElBQVosK0JBQWlCLElBQUksSUFBSixTQUFhLEtBQTlCLEVBTmtCO0tBQWIsQ0FEeUM7R0FBbEQsTUFTTztBQUNMLFdBQU8sR0FBUCxDQURLO0dBVFA7Q0FEaUI7O0FBZW5CLHNCQUFZLEVBQVosQ0FBZSwyQkFBZixFQUE0QyxVQUFTLEVBQVQsUUFBNkM7TUFBeEIsZ0JBQVAsTUFBK0I7TUFBZCwrQkFBYzs7QUFDdkYsTUFBTSxRQUFRLENBQUMsWUFBWSxFQUFaLENBQUQsQ0FBaUIsT0FBakIsQ0FBeUIsSUFBekIsRUFBK0IsRUFBL0IsQ0FBUixDQURpRjs7QUFHdkYsVUFBUSxHQUFSLHVDQUFnRCwwQkFBcUIsV0FBckUsRUFIdUY7QUFJdkYsU0FBTyxLQUFQLEdBQWUsS0FBZixDQUp1RjtBQUt2RixTQUFPLFdBQVAsR0FBcUIsV0FBckIsQ0FMdUY7O0FBT3ZGLGVBQWEsT0FBYixDQUFxQixPQUFyQixFQUE4QixLQUE5QixFQVB1RjtBQVF2RixlQUFhLE9BQWIsQ0FBcUIsYUFBckIsRUFBb0MsV0FBcEMsRUFSdUY7O0FBVXZGLG1CQUFZLGVBQVosQ0FBNEIsVUFBQyxPQUFELEVBQWE7QUFDdkMsUUFBTSxTQUFTLFFBQVEsQ0FBUixFQUFXLEVBQVgsQ0FEd0I7QUFFdkMscUJBQVksY0FBWixDQUEyQixNQUEzQixFQUZ1Qzs7QUFJdkMscUJBQVksTUFBWixDQUFtQixVQUFDLEdBQUQsRUFBUztBQUMxQixjQUFRLEdBQVIsQ0FBWSxxQkFBWixFQUFtQyxHQUFuQyxFQUQwQjtLQUFULENBQW5CLENBSnVDO0dBQWIsQ0FBNUIsQ0FWdUY7Q0FBN0MsQ0FBNUM7O0FBb0JBLHNCQUFZLEVBQVosQ0FBZSx1QkFBZixFQUF3QyxVQUFDLEVBQUQsRUFBSyxJQUFMLEVBQWM7OztBQUNwRCxNQUFJLGFBQWEsS0FBSyxLQUFMLEVBQWIsQ0FEZ0Q7QUFFcEQsTUFBSSxhQUFhLEVBQWIsQ0FGZ0Q7O0FBSXBELHdCQUFRLEdBQVIsbUJBQWUsNENBQWtCLE1BQWpDLEVBSm9EOztBQU1wRCxPQUFLLE9BQUwsQ0FBYSxVQUFDLEdBQUQsRUFBUztBQUNwQixRQUFJLE9BQU8sSUFBSSxrQkFBSixFQUF3QjtBQUNqQyxpQkFBVyxJQUFYLENBQWdCLFdBQVcsR0FBWCxDQUFoQixFQURpQztLQUFuQyxNQUVPO0FBQ0wsaUJBQVcsSUFBWCxDQUFnQixHQUFoQixFQURLO0tBRlA7R0FEVyxDQUFiLENBTm9EOztBQWNwRCxtQkFBWSxVQUFaLEVBQXdCLEtBQXhCLENBQThCLElBQTlCLEVBQW9DLFVBQXBDLEVBZG9EO0NBQWQsQ0FBeEMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2lwY1JlbmRlcmVyfSBmcm9tICdlbGVjdHJvbic7XG5cbmxvY2FsU3RvcmFnZS5kZWJ1ZyA9ICcqJztcblxuaW1wb3J0IG1vbmtleVBhdGNoIGZyb20gJy4vc3VwZXJhZ2VudFBhdGNoJztcbmltcG9ydCBWb2ljZUVuZ2luZSBmcm9tICcuL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjJztcblxubmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHxcbiAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xud2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHxcbiAgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCB8fFxuICBuYXZpZ2F0b3IubW96QXVkaW9Db250ZXh0O1xud2luZG93LlJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG53aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbmNvbnN0IF9kZUludGVyb3AgPSAoYXJnKSA9PiB7XG4gIGlmIChhcmcgJiYgYXJnWydfX0lOVEVST1BfQ0FMTEJBQ0snXSAmJiBhcmcubmFtZSkge1xuICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKGFyZy5uYW1lICE9PSAnc2V0T25TcGVha2luZ0NhbGxiYWNrLXJlcGx5JyAmJlxuICAgICAgICAgIGFyZy5uYW1lICE9PSAnc2V0T25Wb2ljZUNhbGxiYWNrLXJlcGx5JyAmJlxuICAgICAgICAgIGFyZy5uYW1lICE9PSAnc2V0RGV2aWNlQ2hhbmdlQ2FsbGJhY2stcmVwbHknKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2FyZy5uYW1lfTpgLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoYXJnLm5hbWUsIC4uLmFyZ3MpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfVxufTtcblxuaXBjUmVuZGVyZXIub24oJ2dldC10b2tlbi1hbmQtZmluZ2VycHJpbnQnLCBmdW5jdGlvbihldiwge3Rva2VuOiByYXdUb2tlbiwgZmluZ2VycHJpbnR9KSB7XG4gIGNvbnN0IHRva2VuID0gKHJhd1Rva2VuIHx8ICcnKS5yZXBsYWNlKC9cIi9nLCAnJyk7XG5cbiAgY29uc29sZS5sb2coYGdldC10b2tlbi1hbmQtZmluZ2VycHJpbnQ6IHRva2VuPSR7dG9rZW59IGZpbmdlcnByaW50PSR7ZmluZ2VycHJpbnR9YCk7XG4gIHdpbmRvdy50b2tlbiA9IHRva2VuO1xuICB3aW5kb3cuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcblxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCB0b2tlbik7XG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmaW5nZXJwcmludCcsIGZpbmdlcnByaW50KTtcblxuICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoKGRldmljZXMpID0+IHtcbiAgICBjb25zdCBkZXZpY2UgPSBkZXZpY2VzWzBdLmlkO1xuICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGRldmljZSk7XG5cbiAgICBWb2ljZUVuZ2luZS5lbmFibGUoKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1ZvaWNlRW5naW5lLmVuYWJsZTonLCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5pcGNSZW5kZXJlci5vbignY2FsbFZvaWNlRW5naW5lTWV0aG9kJywgKGV2LCBhcmdzKSA9PiB7XG4gIGxldCBtZXRob2ROYW1lID0gYXJncy5zaGlmdCgpO1xuICBsZXQgcGFzc2VkQXJncyA9IFtdO1xuXG4gIGNvbnNvbGUubG9nKGAke21ldGhvZE5hbWV9OmAsIC4uLmFyZ3MpO1xuXG4gIGFyZ3MuZm9yRWFjaCgoYXJnKSA9PiB7XG4gICAgaWYgKGFyZyAmJiBhcmcuX19JTlRFUk9QX0NBTExCQUNLKSB7XG4gICAgICBwYXNzZWRBcmdzLnB1c2goX2RlSW50ZXJvcChhcmcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFzc2VkQXJncy5wdXNoKGFyZyk7XG4gICAgfVxuICB9KTtcblxuICBWb2ljZUVuZ2luZVttZXRob2ROYW1lXS5hcHBseShudWxsLCBwYXNzZWRBcmdzKTtcbn0pO1xuXG4vKlxuY29uc3QgbWV0aG9kcyA9IFtcbiAgJ2VuYWJsZScsXG4gICdzZXRQVFRBY3RpdmUnLFxuICAnc2V0T3V0cHV0Vm9sdW1lJyxcbiAgJ3NldFNlbGZNdXRlJyxcbiAgJ3NldFNlbGZEZWFmJyxcbiAgJ3NldExvY2FsTXV0ZScsXG4gICdzZXRMb2NhbFZvbHVtZScsXG4gICdjcmVhdGVVc2VyJyxcbiAgJ2Rlc3Ryb3lVc2VyJyxcbiAgJ29uU3BlYWtpbmcnLFxuICAnb25Wb2ljZUFjdGl2aXR5JyxcbiAgJ29uRGV2aWNlc0NoYW5nZWQnLFxuICAnZ2V0SW5wdXREZXZpY2VzJyxcbiAgJ2dldE91dHB1dERldmljZXMnLFxuICAnY2FuU2V0SW5wdXREZXZpY2UnLFxuICAnc2V0SW5wdXREZXZpY2UnLFxuICAnc2V0RW5jb2RpbmdCaXRSYXRlJyxcbiAgJ3NldEVjaG9DYW5jZWxsYXRpb24nLFxuICAnc2V0Tm9pc2VTdXBwcmVzc2lvbicsXG4gICdzZXRBdXRvbWF0aWNHYWluQ29udHJvbCcsXG4gICdvbkNvbm5lY3Rpb25TdGF0ZScsXG4gICdjb25uZWN0JyxcbiAgJ2Rpc2Nvbm5lY3QnLFxuICAnaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uJyxcbiAgJ2hhbmRsZVNwZWFraW5nJyxcbiAgJ2RlYnVnRHVtcCdcbl07XG4qL1xuXG4vKlxubWV0aG9kcy5mb3JFYWNoKChtZXRob2ROYW1lKSA9PiB7XG4gIGlwY1JlbmRlcmVyLm9uKG1ldGhvZE5hbWUsIChldiwgLi4uYXJncykgPT4ge1xuICAgIGxldCBwYXNzZWRBcmdzID0gW107XG5cbiAgICBhcmdzLmZvckVhY2goKGFyZykgPT4ge1xuICAgICAgaWYgKGFyZy5fX0lOVEVST1BfQ0FMTEJBQ0spIHtcbiAgICAgICAgcGFzc2VkQXJncy5wdXNoKF9kZUludGVyb3AoYXJnKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXNzZWRBcmdzLnB1c2goYXJnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIFZvaWNlRW5naW5lW21ldGhvZE5hbWVdLmFwcGx5KG51bGwsIHBhc3NlZEFyZ3MpO1xuICB9KTtcbn0pO1xuKi9cbi8qXG5pcGNSZW5kZXJlci5vbignY3JlYXRlLXRyYW5zcG9ydCcsIGZ1bmN0aW9uKGV2LCBzc3JjLCB1c2VySWQsIGFkZHJlc3MsIHBvcnQsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdjcmVhdGUtdHJhbnNwb3J0OicsIHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2IpO1xuICBWb2ljZUVuZ2luZS5lbmFibGUoKGVycikgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdWb2ljZUVuZ2luZS5lbmFibGU6JywgZXJyKTtcbiAgfSk7XG4gIFZvaWNlRW5naW5lLmNvbm5lY3Qoc3NyYywgdXNlcklkLCBhZGRyZXNzLCBwb3J0LCBfZGVJbnRlcm9wKGNiKSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdzZXQtb24tc3BlYWtpbmctY2FsbGJhY2snLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ3NldC1vbi1zcGVha2luZy1jYWxsYmFjazonLCBjYik7XG4gIFZvaWNlRW5naW5lLm9uU3BlYWtpbmcoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LW9uLXZvaWNlLWNhbGxiYWNrJywgZnVuY3Rpb24oZXYsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtb24tdm9pY2UtY2FsbGJhY2s6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5vblZvaWNlQWN0aXZpdHkoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignb24tY29ubmVjdGlvbi1zdGF0ZScsIGZ1bmN0aW9uKGV2LCBjYikge1xuICBjb25zb2xlLmxvZygnb24tY29ubmVjdGlvbi1zdGF0ZTonLCBjYik7XG4gIFZvaWNlRW5naW5lLm9uQ29ubmVjdGlvblN0YXRlKF9kZUludGVyb3AoY2IpKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1kZXZpY2UtY2hhbmdlLWNhbGxiYWNrJywgZnVuY3Rpb24oZXYsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtZGV2aWNlLWNoYW5nZS1jYWxsYmFjazonLCBjYik7XG4gIFZvaWNlRW5naW5lLm9uRGV2aWNlc0NoYW5nZWQoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignZ2V0LWlucHV0LWRldmljZXMnLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ2dldC1pbnB1dC1kZXZpY2VzOicsIGNiKTtcbiAgVm9pY2VFbmdpbmUuZ2V0SW5wdXREZXZpY2VzKF9kZUludGVyb3AoY2IpKTtcbn0pO1xuWydzZXRFY2hvQ2FuY2VsbGF0aW9uJywgJ3NldE5vaXNlU3VwcHJlc3Npb24nLCAnc2V0QXV0b21hdGljR2FpbkNvbnRyb2wnXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICBpcGNSZW5kZXJlci5vbihtZXRob2QsIGZ1bmN0aW9uKGV2LCBlbmFibGVkKSB7XG4gICAgY29uc29sZS5sb2coYCR7bWV0aG9kfTpgLCBlbmFibGVkKTtcbiAgICBWb2ljZUVuZ2luZVttZXRob2RdKGVuYWJsZWQpO1xuICB9KTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1pbnB1dC1kZXZpY2UnLCBmdW5jdGlvbihldiwgaW5wdXREZXZpY2VJbmRleCkge1xuICBjb25zb2xlLmxvZygnc2V0LWlucHV0LWRldmljZTonLCBpbnB1dERldmljZUluZGV4KTtcbiAgVm9pY2VFbmdpbmUuZ2V0SW5wdXREZXZpY2VzKChkZXZpY2VzKSA9PiB7XG4gICAgY29uc3QgZGV2aWNlID0gZGV2aWNlc1tpbnB1dERldmljZUluZGV4XS5pZDtcbiAgICBWb2ljZUVuZ2luZS5zZXRJbnB1dERldmljZShkZXZpY2UpO1xuICB9KTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1pbnB1dC1tb2RlJywgZnVuY3Rpb24oZXYsIG1vZGUsIG9wdGlvbnMpIHtcbiAgY29uc29sZS5sb2coJ3NldC1pbnB1dC1tb2RlOicsIG1vZGUsIG9wdGlvbnMpO1xuICBpZiAoTkFUSVZFX1RPX1JFR1VMQVJbbW9kZV0gPT09IElucHV0TW9kZXMuUFVTSF9UT19UQUxLKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgZGVsYXk6IG9wdGlvbnMucHR0RGVsYXkgfSk7XG4gIH1cbiAgVm9pY2VFbmdpbmUuc2V0SW5wdXRNb2RlKE5BVElWRV9UT19SRUdVTEFSW21vZGVdLCBvcHRpb25zKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ2dldC1vdXRwdXQtZGV2aWNlcycsIGZ1bmN0aW9uKGV2LCBjYikge1xuICBjb25zb2xlLmxvZygnZ2V0LW91dHB1dC1kZXZpY2VzOicsIGNiKTtcbiAgVm9pY2VFbmdpbmUuZ2V0T3V0cHV0RGV2aWNlcyhfZGVJbnRlcm9wKGNiKSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdzZXQtb3V0cHV0LXZvbHVtZScsIGZ1bmN0aW9uKGV2LCB2b2x1bWUpIHtcbiAgY29uc29sZS5sb2coJ3NldC1vdXRwdXQtdm9sdW1lOicsIHZvbHVtZSk7XG4gIFZvaWNlRW5naW5lLnNldE91dHB1dFZvbHVtZSh2b2x1bWUpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LXNlbGYtbXV0ZScsIGZ1bmN0aW9uKGV2LCBtdXRlKSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtc2VsZi1tdXRlOicsIG11dGUpO1xuICBWb2ljZUVuZ2luZS5zZXRTZWxmTXV0ZShtdXRlKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1zZWxmLWRlYWZlbicsIGZ1bmN0aW9uKGV2LCBkZWFmKSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtc2VsZi1kZWFmZW46JywgZGVhZik7XG4gIFZvaWNlRW5naW5lLnNldFNlbGZEZWFmKGRlYWYpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0LWxvY2FsLW11dGUnLCBmdW5jdGlvbihldiwgdXNlcklkLCBtdXRlKSB7XG4gIGNvbnNvbGUubG9nKCdzZXQtbG9jYWwtbXV0ZTonLCB1c2VySWQsIG11dGUpO1xuICBWb2ljZUVuZ2luZS5zZXRMb2NhbE11dGUodXNlcklkLCBtdXRlKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ3NldC1sb2NhbC12b2x1bWUnLCBmdW5jdGlvbihldiwgdXNlcklkLCB2b2x1bWUpIHtcbiAgY29uc29sZS5sb2coJ3NldC1sb2NhbC12b2x1bWU6JywgdXNlcklkLCB2b2x1bWUpO1xuICBWb2ljZUVuZ2luZS5zZXRMb2NhbFZvbHVtZSh1c2VySWQsIHZvbHVtZSk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdkZXN0cm95LXRyYW5zcG9ydCcsIGZ1bmN0aW9uKGV2KSB7XG4gIGNvbnNvbGUubG9nKCdkZXN0cm95LXRyYW5zcG9ydCcpO1xuICBWb2ljZUVuZ2luZS5kaXNjb25uZWN0KCk7XG59KTtcbmlwY1JlbmRlcmVyLm9uKCdoYW5kbGUtc3BlYWtpbmcnLCBmdW5jdGlvbihldiwgdXNlcklkLCBzcGVha2luZykge1xuICAvL2NvbnNvbGUubG9nKCdoYW5kbGUtc3BlYWtpbmc6JywgdXNlcklkLCBzcGVha2luZyk7XG4gIFZvaWNlRW5naW5lLmhhbmRsZVNwZWFraW5nKHVzZXJJZCwgc3BlYWtpbmcpO1xufSk7XG5pcGNSZW5kZXJlci5vbignaGFuZGxlLXNlc3Npb24tZGVzY3JpcHRpb24nLCBmdW5jdGlvbihldiwgb2JqKSB7XG4gIGNvbnNvbGUubG9nKCdoYW5kbGUtc2Vzc2lvbi1kZXNjcmlwdGlvbjonLCBvYmopO1xuICBWb2ljZUVuZ2luZS5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24ob2JqKTtcbn0pO1xuaXBjUmVuZGVyZXIub24oJ21lcmdlLXVzZXJzJywgZnVuY3Rpb24oZXYsIHVzZXJzKSB7XG4gIGNvbnNvbGUubG9nKCdtZXJnZS11c2VyczonLCB1c2Vycyk7XG4gIHVzZXJzLmZvckVhY2goKHVzZXIpID0+IHtcbiAgICBWb2ljZUVuZ2luZS5jcmVhdGVVc2VyKHVzZXIuaWQsIHVzZXIuc3NyYyk7XG4gIH0pO1xufSk7XG5pcGNSZW5kZXJlci5vbignZGVzdHJveS11c2VyJywgZnVuY3Rpb24oZXYsIHVzZXJJZCkge1xuICBjb25zb2xlLmxvZygnZGVzdHJveS11c2VyOicsIHVzZXJJZCk7XG4gIFZvaWNlRW5naW5lLmRlc3Ryb3lVc2VyKHVzZXJJZCk7XG59KTtcbiovXG4iXX0=