'use strict';

var _electron = require('electron');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

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

var sounds = {};

var _deInterop = function _deInterop(arg) {
  if (arg && arg['__INTEROP_CALLBACK'] && arg.name) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!arg.name.startsWith('setOnSpeakingCallback') && !arg.name.startsWith('setOnVoiceCallback') && !arg.name.startsWith('setDeviceChangeCallback')) {
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
  var methodName = args.shift();
  var passedArgs = [];

  if (methodName !== 'createUser' && methodName !== 'handleSpeaking') {
    var _console2;

    (_console2 = console).log.apply(_console2, [methodName + ':'].concat(_toConsumableArray(args)));
  }

  args.forEach(function (arg) {
    if (arg && arg.__INTEROP_CALLBACK) {
      passedArgs.push(_deInterop(arg));
    } else {
      passedArgs.push(arg);
    }
  });

  _webrtc2.default[methodName].apply(null, passedArgs);
});

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

_electron.ipcRenderer.on('playSound', function (ev, name, volume) {
  console.log('playSound:', name, volume);

  var sound = sounds[name];
  if (sound == null) {
    sound = document.createElement('audio');
    sound.src = 'file://' + _path2.default.resolve(__dirname, '..', 'sounds', name + '.wav');
    sound.preload = true;
    sounds[name] = sound;
  }
  sound.volume = volume;
  sound.load();
  sound.play();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3ZvaWNlX2VuZ2luZS1zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxhQUFhLEtBQWIsR0FBcUIsR0FBckI7O0FBS0EsVUFBVSxZQUFWLEdBQXlCLFVBQVUsWUFBVixJQUN2QixVQUFVLGtCQUFWLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxZQUFQLEdBQXNCLE9BQU8sWUFBUCxJQUNwQixPQUFPLGtCQUFQLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxpQkFBUCxHQUEyQixPQUFPLGlCQUFQLElBQ3pCLE9BQU8sb0JBQVAsSUFDQSxPQUFPLHVCQUFQO0FBQ0YsT0FBTyxxQkFBUCxHQUErQixPQUFPLHFCQUFQLElBQzdCLE9BQU8sd0JBQVAsSUFDQSxPQUFPLDJCQUFQOztBQUVGLE9BQU8sV0FBUDs7QUFFQSxJQUFJLFNBQVMsRUFBVDs7QUFFSixJQUFNLGFBQWEsU0FBYixVQUFhLENBQUMsR0FBRCxFQUFTO0FBQzFCLE1BQUksT0FBTyxJQUFJLG9CQUFKLENBQVAsSUFBb0MsSUFBSSxJQUFKLEVBQVU7QUFDaEQsV0FBTyxZQUFhO3dDQUFUOztPQUFTOztBQUNsQixVQUFJLENBQUMsSUFBSSxJQUFKLENBQVMsVUFBVCxDQUFvQix1QkFBcEIsQ0FBRCxJQUNBLENBQUMsSUFBSSxJQUFKLENBQVMsVUFBVCxDQUFvQixvQkFBcEIsQ0FBRCxJQUNBLENBQUMsSUFBSSxJQUFKLENBQVMsVUFBVCxDQUFvQix5QkFBcEIsQ0FBRCxFQUFpRDs7O0FBQ25ELDZCQUFRLEdBQVIsa0JBQWUsSUFBSSxJQUFKLGVBQWdCLEtBQS9CLEVBRG1EO09BRnJEO0FBS0EsNEJBQVksSUFBWiwrQkFBaUIsSUFBSSxJQUFKLFNBQWEsS0FBOUIsRUFOa0I7S0FBYixDQUR5QztHQUFsRCxNQVNPO0FBQ0wsV0FBTyxHQUFQLENBREs7R0FUUDtDQURpQjs7QUFlbkIsc0JBQVksRUFBWixDQUFlLDJCQUFmLEVBQTRDLFVB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QUwsQ0FBYSxTQUFiLEVBQXdCLElBQXhCLEVBQThCLFFBQTlCLEVBQXdDLE9BQU8sTUFBUCxDQUFwRCxDQUZLO0FBR2pCLFVBQU0sT0FBTixHQUFnQixJQUFoQixDQUhpQjtBQUlqQixXQUFPLElBQVAsSUFBZSxLQUFmLENBSmlCO0dBQW5CO0FBTUEsUUFBTSxNQUFOLEdBQWUsTUFBZixDQVZxRDtBQVdyRCxRQUFNLElBQU4sR0FYcUQ7QUFZckQsUUFBTSxJQUFOLEdBWnFEO0NBQTNCLENBQTVCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtpcGNSZW5kZXJlcn0gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmxvY2FsU3RvcmFnZS5kZWJ1ZyA9ICcqJztcblxuaW1wb3J0IG1vbmtleVBhdGNoIGZyb20gJy4vc3VwZXJhZ2VudFBhdGNoJztcbmltcG9ydCBWb2ljZUVuZ2luZSBmcm9tICcuL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjJztcblxubmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHxcbiAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xud2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHxcbiAgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCB8fFxuICBuYXZpZ2F0b3IubW96QXVkaW9Db250ZXh0O1xud2luZG93LlJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG53aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbndpbmRvdy5Wb2ljZUVuZ2luZSA9IFZvaWNlRW5naW5lO1xuXG5sZXQgc291bmRzID0ge307XG5cbmNvbnN0IF9kZUludGVyb3AgPSAoYXJnKSA9PiB7XG4gIGlmIChhcmcgJiYgYXJnWydfX0lOVEVST1BfQ0FMTEJBQ0snXSAmJiBhcmcubmFtZSkge1xuICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKCFhcmcubmFtZS5zdGFydHNXaXRoKCdzZXRPblNwZWFraW5nQ2FsbGJhY2snKSAmJlxuICAgICAgICAgICFhcmcubmFtZS5zdGFydHNXaXRoKCdzZXRPblZvaWNlQ2FsbGJhY2snKSAmJlxuICAgICAgICAgICFhcmcubmFtZS5zdGFydHNXaXRoKCdzZXREZXZpY2VDaGFuZ2VDYWxsYmFjaycpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2FyZy5uYW1lfTpgLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoYXJnLm5hbWUsIC4uLmFyZ3MpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfVxufTtcblxuaXBjUmVuZGVyZXIub24oJ2dldC10b2tlbi1hbmQtZmluZ2VycHJpbnQnLCBmdW5jdGlvbihldiwge3Rva2VuOiByYXdUb2tlbiwgZmluZ2VycHJpbnR9KSB7XG4gIGNvbnN0IHRva2VuID0gKHJhd1Rva2VuIHx8ICcnKS5yZXBsYWNlKC9cIi9nLCAnJyk7XG5cbiAgY29uc29sZS5sb2coYGdldC10b2tlbi1hbmQtZmluZ2VycHJpbnQ6IHRva2VuPSR7dG9rZW59IGZpbmdlcnByaW50PSR7ZmluZ2VycHJpbnR9YCk7XG4gIHdpbmRvdy50b2tlbiA9IHRva2VuO1xuICB3aW5kb3cuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcblxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCB0b2tlbik7XG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmaW5nZXJwcmludCcsIGZpbmdlcnByaW50KTtcblxuICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoKGRldmljZXMpID0+IHtcbiAgICBjb25zdCBkZXZpY2UgPSBkZXZpY2VzWzBdLmlkO1xuICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGRldmljZSk7XG5cbiAgICBWb2ljZUVuZ2luZS5lbmFibGUoKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1ZvaWNlRW5naW5lLmVuYWJsZTonLCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5pcGNSZW5kZXJlci5vbignY2FsbFZvaWNlRW5naW5lTWV0aG9kJywgKGV2LCBhcmdzKSA9PiB7XG4gIGxldCBtZXRob2ROYW1lID0gYXJncy5zaGlmdCgpO1xuICBsZXQgcGFzc2VkQXJncyA9IFtdO1xuXG4gIGlmIChtZXRob2ROYW1lICE9PSAnY3JlYXRlVXNlcicgJiYgbWV0aG9kTmFtZSAhPT0gJ2hhbmRsZVNwZWFraW5nJykge1xuICAgIGNvbnNvbGUubG9nKGAke21ldGhvZE5hbWV9OmAsIC4uLmFyZ3MpO1xuICB9XG5cbiAgYXJncy5mb3JFYWNoKChhcmcpID0+IHtcbiAgICBpZiAoYXJnICYmIGFyZy5fX0lOVEVST1BfQ0FMTEJBQ0spIHtcbiAgICAgIHBhc3NlZEFyZ3MucHVzaChfZGVJbnRlcm9wKGFyZykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXNzZWRBcmdzLnB1c2goYXJnKTtcbiAgICB9XG4gIH0pO1xuXG4gIFZvaWNlRW5naW5lW21ldGhvZE5hbWVdLmFwcGx5KG51bGwsIHBhc3NlZEFyZ3MpO1xufSk7XG5cbmlwY1JlbmRlcmVyLm9uKCdzZXRPblNwZWFraW5nQ2FsbGJhY2snLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ3NldE9uU3BlYWtpbmdDYWxsYmFjazonLCBjYik7XG4gIFZvaWNlRW5naW5lLm9uU3BlYWtpbmcoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0T25Wb2ljZUNhbGxiYWNrJywgZnVuY3Rpb24oZXYsIGNiKSB7XG4gIGNvbnNvbGUubG9nKCdzZXRPblZvaWNlQ2FsbGJhY2s6JywgY2IpO1xuICBWb2ljZUVuZ2luZS5vblZvaWNlQWN0aXZpdHkoX2RlSW50ZXJvcChjYikpO1xufSk7XG5pcGNSZW5kZXJlci5vbignc2V0RGV2aWNlQ2hhbmdlQ2FsbGJhY2snLCBmdW5jdGlvbihldiwgY2IpIHtcbiAgY29uc29sZS5sb2coJ3NldERldmljZUNoYW5nZUNhbGxiYWNrOicsIGNiKTtcbiAgVm9pY2VFbmdpbmUub25EZXZpY2VzQ2hhbmdlZChfZGVJbnRlcm9wKGNiKSk7XG59KTtcblxuaXBjUmVuZGVyZXIub24oJ3BsYXlTb3VuZCcsIGZ1bmN0aW9uKGV2LCBuYW1lLCB2b2x1bWUpIHtcbiAgY29uc29sZS5sb2coJ3BsYXlTb3VuZDonLCBuYW1lLCB2b2x1bWUpO1xuXG4gIGxldCBzb3VuZCA9IHNvdW5kc1tuYW1lXTtcbiAgaWYgKHNvdW5kID09IG51bGwpIHtcbiAgICBzb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgc291bmQuc3JjID0gJ2ZpbGU6Ly8nICsgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ3NvdW5kcycsIG5hbWUgKyAnLndhdicpO1xuICAgIHNvdW5kLnByZWxvYWQgPSB0cnVlO1xuICAgIHNvdW5kc1tuYW1lXSA9IHNvdW5kO1xuICB9XG4gIHNvdW5kLnZvbHVtZSA9IHZvbHVtZTtcbiAgc291bmQubG9hZCgpO1xuICBzb3VuZC5wbGF5KCk7XG59KTtcbiJdfQ==