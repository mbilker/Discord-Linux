'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _NativeUtils = require('../../utils/NativeUtils');

var _NativeUtils2 = _interopRequireDefault(_NativeUtils);

var _platform = require('platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext || navigator.mozAudioContext;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function noop() {}

var VoiceEngine = {
  supported: false,
  autoEnable: false,
  enable: noop,
  playSound: noop,
  supportsMultiplePTT: noop,
  setForceSend: noop,
  setInputMode: noop,
  setInputVolume: noop,
  setOutputVolume: noop,
  setVolumeChangeCallback: noop,
  setOnSpeakingCallback: noop,
  setOnVoiceCallback: noop,
  setOnInputEventCallback: noop,
  setSelfMute: noop,
  setSelfDeaf: noop,
  setLocalMute: noop,
  setLocalVolume: noop,
  createUser: noop,
  destroyUser: noop,
  onSpeaking: noop,
  onVoiceActivity: noop,
  onDevicesChanged: noop,
  onConnectionState: noop,
  getInputDevices: noop,
  getOutputDevices: noop,
  setInputDevice: noop,
  setOutputDevice: noop,
  canSetInputDevice: function canSetInputDevice() {
    return false;
  },
  canSetOutputDevice: function canSetOutputDevice() {
    return false;
  },
  setEncodingBitRate: noop,
  supportsEncodingBitRate: function supportsEncodingBitRate() {
    return false;
  },
  setEchoCancellation: noop,
  setNoiseSuppression: noop,
  setAutomaticGainControl: noop,
  setAttenuation: noop,
  supportsAutomaticVAD: function supportsAutomaticVAD() {
    return false;
  },
  isAttenuationEnabled: function isAttenuationEnabled() {
    return false;
  },
  canSetAttenuation: function canSetAttenuation() {
    return false;
  },
  canSetVoiceProcessing: function canSetVoiceProcessing() {
    return false;
  },
  connect: noop,
  disconnect: noop,
  handleSpeaking: noop,
  handleSessionDescription: noop,
  inputEventRegister: noop,
  inputEventUnregister: noop,
  debugDump: function debugDump() {},
  setNoInputCallback: noop,
  setNoInputThreshold: noop,
  collectDiagnostics: function collectDiagnostics(callback) {
    return callback(null);
  },
  runDiagnostics: function runDiagnostics(callback) {
    return callback(null);
  },
  getDiagnosticInfo: noop,
  diagnosticsEnabled: false,
  Constants: {},
  supportsNativePing: false,
  setPingCallback: null
};

if (__OVERLAY__) {
  VoiceEngine.supported = true;
  VoiceEngine.autoEnable = true;
} else if (_NativeUtils2.default.embedded) {
  VoiceEngine = require('./native');
} else if (window.AudioContext && navigator.getUserMedia && window.RTCPeerConnection) {
  var SUPPORTED_BROWSERS = {
    firefox: 38,
    chrome: 37,
    opera: 27
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(SUPPORTED_BROWSERS)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var browser = _step.value;

      var version = SUPPORTED_BROWSERS[browser];
      if (_platform2.default.name.toLowerCase() === browser && parseInt(_platform2.default.version) >= version) {
        VoiceEngine = require('./webrtc');
        break;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

exports.default = VoiceEngine;

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/index.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsVUFBVSxZQUFWLEdBQXlCLFVBQVUsWUFBVixJQUN2QixVQUFVLGtCQUFWLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxZQUFQLEdBQXNCLE9BQU8sWUFBUCxJQUNwQixPQUFPLGtCQUFQLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxpQkFBUCxHQUEyQixPQUFPLGlCQUFQLElBQ3pCLE9BQU8sb0JBQVAsSUFDQSxPQUFPLHVCQUFQO0FBQ0YsT0FBTyxxQkFBUCxHQUErQixPQUFPLHFCQUFQLElBQzdCLE9BQU8sd0JBQVAsSUFDQSxPQUFPLDJCQUFQOztBQUVGLFNBQVMsSUFBVCxHQUFnQixFQUFoQjs7QUFFQSxJQUFJLGNBQWM7QUFDaEIsYUFBVyxLQUFYO0FBQ0EsY0FBWSxLQUFaO0FBQ0EsVUFBUSxJQUFSO0FBQ0EsYUFBVyxJQUFYO0FBQ0EsdUJBQXFCLElBQXJCO0FBQ0EsZ0JBQWMsSUFBZDtBQUNBLGdCQUFjLElBQWQ7QUFDQSxrQkFBZ0IsSUFBaEI7QUFDQSxtQkFBaUIsSUFBakI7QUFDQSwyQkFBeUIsSUFBekI7QUFDQSx5QkFBdUIsSUFBdkI7QUFDQSxzQkFBb0IsSUFBcEI7QUFDQSwyQkFBeUIsSUFBekI7QUFDQSxlQUFhLElBQWI7QUFDQSxlQUFhLElBQWI7QUFDQSxnQkFBYyxJQUFkO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0EsY0FBWSxJQUFaO0FBQ0EsZUFBYSxJQUFiO0FBQ0EsY0FBWSxJQUFaO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0Esb0JBQWtCLElBQWxCO0FBQ0EscUJBQW1CLElBQW5CO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0Esb0JBQWtCLElBQWxCO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0EscUJBQW1CO1dBQU07R0FBTjtBQUNuQixzQkFBb0I7V0FBTTtHQUFOO0FBQ3BCLHNCQUFvQixJQUFwQjtBQUNBLDJCQUF5QjtXQUFNO0dBQU47QUFDekIsdUJBQXFCLElBQXJCO0FBQ0EsdUJBQXFCLElBQXJCO0FBQ0EsMkJBQXlCLElBQXpCO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0Esd0JBQXNCO1dBQU07R0FBTjtBQUN0Qix3QkFBc0I7V0FBTTtHQUFOO0FBQ3RCLHFCQUFtQjtXQUFNO0dBQU47QUFDbkIseUJBQXVCO1dBQU07R0FBTjtBQUN2QixXQUFTLElBQVQ7QUFDQSxjQUFZLElBQVo7QUFDQSxrQkFBZ0IsSUFBaEI7QUFDQSw0QkFBMEIsSUFBMUI7QUFDQSxzQkFBb0IsSUFBcEI7QUFDQSx3QkFBc0IsSUFBdEI7QUFDQSxhQUFXLHFCQUFNLEVBQU47QUFDWCxzQkFBb0IsSUFBcEI7QUFDQSx1QkFBcUIsSUFBckI7QUFDQSxzQkFBb0I7V0FBWSxTQUFTLElBQVQ7R0FBWjtBQUNwQixrQkFBZ0I7V0FBWSxTQUFTLElBQVQ7R0FBWjtBQUNoQixxQkFBbUIsSUFBbkI7QUFDQSxzQkFBb0IsS0FBcEI7QUFDQSxhQUFXLEVBQVg7QUFDQSxzQkFBb0IsS0FBcEI7QUFDQSxtQkFBaUIsSUFBakI7Q0F2REU7O0FBMERKLElBQUksV0FBSixFQUFpQjtBQUNmLGNBQVksU0FBWixHQUF3QixJQUF4QixDQURlO0FBRWYsY0FBWSxVQUFaLEdBQXlCLElBQXpCLENBRmU7Q0FBakIsTUFJSyxJQUFJLHNCQUFZLFFBQVosRUFBc0I7QUFDN0IsZ0JBQWMsUUFBUSxVQUFSLENBQWQsQ0FENkI7Q0FBMUIsTUFHQSxJQUFJLE9BQU8sWUFBUCxJQUF1QixVQUFVLFlBQVYsSUFBMEIsT0FBTyxpQkFBUCxFQUEwQjtBQUNsRixNQUFNLHFCQUFxQjtBQUN6QixhQUFTLEVBQVQ7QUFDQSxZQUFRLEVBQVI7QUFDQSxXQUFPLEVBQVA7R0FISSxDQUQ0RTs7Ozs7OztBQU9sRix5QkFBb0IsT0FBTyxJQUFQLENBQVksa0JBQVosMkJBQXBCLG9HQUFxRDtVQUE1QyxzQkFBNEM7O0FBQ25ELFVBQU0sVUFBVSxtQkFBbUIsT0FBbkIsQ0FBVixDQUQ2QztBQUVuRCxVQUFJLG1CQUFTLElBQVQsQ0FBYyxXQUFkLE9BQWdDLE9BQWhDLElBQTJDLFNBQVMsbUJBQVMsT0FBVCxDQUFULElBQThCLE9BQTlCLEVBQXVDO0FBQ3BGLHNCQUFjLFFBQVEsVUFBUixDQUFkLENBRG9GO0FBRXBGLGNBRm9GO09BQXRGO0tBRkY7Ozs7Ozs7Ozs7Ozs7O0dBUGtGO0NBQS9FOztrQkFnQlUiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmF0aXZlVXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMvTmF0aXZlVXRpbHMnO1xuaW1wb3J0IHBsYXRmb3JtIGZyb20gJ3BsYXRmb3JtJztcblxubmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHxcbiAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xud2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHxcbiAgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCB8fFxuICBuYXZpZ2F0b3IubW96QXVkaW9Db250ZXh0O1xud2luZG93LlJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG53aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5sZXQgVm9pY2VFbmdpbmUgPSB7XG4gIHN1cHBvcnRlZDogZmFsc2UsXG4gIGF1dG9FbmFibGU6IGZhbHNlLFxuICBlbmFibGU6IG5vb3AsXG4gIHBsYXlTb3VuZDogbm9vcCxcbiAgc3VwcG9ydHNNdWx0aXBsZVBUVDogbm9vcCxcbiAgc2V0Rm9yY2VTZW5kOiBub29wLFxuICBzZXRJbnB1dE1vZGU6IG5vb3AsXG4gIHNldElucHV0Vm9sdW1lOiBub29wLFxuICBzZXRPdXRwdXRWb2x1bWU6IG5vb3AsXG4gIHNldFZvbHVtZUNoYW5nZUNhbGxiYWNrOiBub29wLFxuICBzZXRPblNwZWFraW5nQ2FsbGJhY2s6IG5vb3AsXG4gIHNldE9uVm9pY2VDYWxsYmFjazogbm9vcCxcbiAgc2V0T25JbnB1dEV2ZW50Q2FsbGJhY2s6IG5vb3AsXG4gIHNldFNlbGZNdXRlOiBub29wLFxuICBzZXRTZWxmRGVhZjogbm9vcCxcbiAgc2V0TG9jYWxNdXRlOiBub29wLFxuICBzZXRMb2NhbFZvbHVtZTogbm9vcCxcbiAgY3JlYXRlVXNlcjogbm9vcCxcbiAgZGVzdHJveVVzZXI6IG5vb3AsXG4gIG9uU3BlYWtpbmc6IG5vb3AsXG4gIG9uVm9pY2VBY3Rpdml0eTogbm9vcCxcbiAgb25EZXZpY2VzQ2hhbmdlZDogbm9vcCxcbiAgb25Db25uZWN0aW9uU3RhdGU6IG5vb3AsXG4gIGdldElucHV0RGV2aWNlczogbm9vcCxcbiAgZ2V0T3V0cHV0RGV2aWNlczogbm9vcCxcbiAgc2V0SW5wdXREZXZpY2U6IG5vb3AsXG4gIHNldE91dHB1dERldmljZTogbm9vcCxcbiAgY2FuU2V0SW5wdXREZXZpY2U6ICgpID0+IGZhbHNlLFxuICBjYW5TZXRPdXRwdXREZXZpY2U6ICgpID0+IGZhbHNlLFxuICBzZXRFbmNvZGluZ0JpdFJhdGU6IG5vb3AsXG4gIHN1cHBvcnRzRW5jb2RpbmdCaXRSYXRlOiAoKSA9PiBmYWxzZSxcbiAgc2V0RWNob0NhbmNlbGxhdGlvbjogbm9vcCxcbiAgc2V0Tm9pc2VTdXBwcmVzc2lvbjogbm9vcCxcbiAgc2V0QXV0b21hdGljR2FpbkNvbnRyb2w6IG5vb3AsXG4gIHNldEF0dGVudWF0aW9uOiBub29wLFxuICBzdXBwb3J0c0F1dG9tYXRpY1ZBRDogKCkgPT4gZmFsc2UsXG4gIGlzQXR0ZW51YXRpb25FbmFibGVkOiAoKSA9PiBmYWxzZSxcbiAgY2FuU2V0QXR0ZW51YXRpb246ICgpID0+IGZhbHNlLFxuICBjYW5TZXRWb2ljZVByb2Nlc3Npbmc6ICgpID0+IGZhbHNlLFxuICBjb25uZWN0OiBub29wLFxuICBkaXNjb25uZWN0OiBub29wLFxuICBoYW5kbGVTcGVha2luZzogbm9vcCxcbiAgaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uOiBub29wLFxuICBpbnB1dEV2ZW50UmVnaXN0ZXI6IG5vb3AsXG4gIGlucHV0RXZlbnRVbnJlZ2lzdGVyOiBub29wLFxuICBkZWJ1Z0R1bXA6ICgpID0+IHt9LFxuICBzZXROb0lucHV0Q2FsbGJhY2s6IG5vb3AsXG4gIHNldE5vSW5wdXRUaHJlc2hvbGQ6IG5vb3AsXG4gIGNvbGxlY3REaWFnbm9zdGljczogY2FsbGJhY2sgPT4gY2FsbGJhY2sobnVsbCksXG4gIHJ1bkRpYWdub3N0aWNzOiBjYWxsYmFjayA9PiBjYWxsYmFjayhudWxsKSxcbiAgZ2V0RGlhZ25vc3RpY0luZm86IG5vb3AsXG4gIGRpYWdub3N0aWNzRW5hYmxlZDogZmFsc2UsXG4gIENvbnN0YW50czoge30sXG4gIHN1cHBvcnRzTmF0aXZlUGluZzogZmFsc2UsXG4gIHNldFBpbmdDYWxsYmFjazogbnVsbFxufTtcblxuaWYgKF9fT1ZFUkxBWV9fKSB7XG4gIFZvaWNlRW5naW5lLnN1cHBvcnRlZCA9IHRydWU7XG4gIFZvaWNlRW5naW5lLmF1dG9FbmFibGUgPSB0cnVlO1xufVxuZWxzZSBpZiAoTmF0aXZlVXRpbHMuZW1iZWRkZWQpIHtcbiAgVm9pY2VFbmdpbmUgPSByZXF1aXJlKCcuL25hdGl2ZScpO1xufVxuZWxzZSBpZiAod2luZG93LkF1ZGlvQ29udGV4dCAmJiBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICYmIHdpbmRvdy5SVENQZWVyQ29ubmVjdGlvbikge1xuICBjb25zdCBTVVBQT1JURURfQlJPV1NFUlMgPSB7XG4gICAgZmlyZWZveDogMzgsXG4gICAgY2hyb21lOiAzNyxcbiAgICBvcGVyYTogMjdcbiAgfTtcblxuICBmb3IgKGxldCBicm93c2VyIG9mIE9iamVjdC5rZXlzKFNVUFBPUlRFRF9CUk9XU0VSUykpIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gU1VQUE9SVEVEX0JST1dTRVJTW2Jyb3dzZXJdO1xuICAgIGlmIChwbGF0Zm9ybS5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGJyb3dzZXIgJiYgcGFyc2VJbnQocGxhdGZvcm0udmVyc2lvbikgPj0gdmVyc2lvbikge1xuICAgICAgVm9pY2VFbmdpbmUgPSByZXF1aXJlKCcuL3dlYnJ0YycpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFZvaWNlRW5naW5lO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL2luZGV4LmpzXG4gKiovIl19