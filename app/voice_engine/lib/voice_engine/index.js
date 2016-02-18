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
  getDiagnosticInfo: function getDiagnosticInfo() {
    return null;
  },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsVUFBVSxZQUFWLEdBQXlCLFVBQVUsWUFBVixJQUN2QixVQUFVLGtCQUFWLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxZQUFQLEdBQXNCLE9BQU8sWUFBUCxJQUNwQixPQUFPLGtCQUFQLElBQ0EsVUFBVSxlQUFWO0FBQ0YsT0FBTyxpQkFBUCxHQUEyQixPQUFPLGlCQUFQLElBQ3pCLE9BQU8sb0JBQVAsSUFDQSxPQUFPLHVCQUFQO0FBQ0YsT0FBTyxxQkFBUCxHQUErQixPQUFPLHFCQUFQLElBQzdCLE9BQU8sd0JBQVAsSUFDQSxPQUFPLDJCQUFQOztBQUVGLFNBQVMsSUFBVCxHQUFnQixFQUFoQjs7QUFFQSxJQUFJLGNBQWM7QUFDaEIsYUFBVyxLQUFYO0FBQ0EsY0FBWSxLQUFaO0FBQ0EsVUFBUSxJQUFSO0FBQ0EsYUFBVyxJQUFYO0FBQ0EsdUJBQXFCLElBQXJCO0FBQ0EsZ0JBQWMsSUFBZDtBQUNBLGdCQUFjLElBQWQ7QUFDQSxrQkFBZ0IsSUFBaEI7QUFDQSxtQkFBaUIsSUFBakI7QUFDQSwyQkFBeUIsSUFBekI7QUFDQSx5QkFBdUIsSUFBdkI7QUFDQSxzQkFBb0IsSUFBcEI7QUFDQSwyQkFBeUIsSUFBekI7QUFDQSxlQUFhLElBQWI7QUFDQSxlQUFhLElBQWI7QUFDQSxnQkFBYyxJQUFkO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0EsY0FBWSxJQUFaO0FBQ0EsZUFBYSxJQUFiO0FBQ0EsY0FBWSxJQUFaO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0Esb0JBQWtCLElBQWxCO0FBQ0EscUJBQW1CLElBQW5CO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0Esb0JBQWtCLElBQWxCO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0EsbUJBQWlCLElBQWpCO0FBQ0EscUJBQW1CO1dBQU07R0FBTjtBQUNuQixzQkFBb0I7V0FBTTtHQUFOO0FBQ3BCLHNCQUFvQixJQUFwQjtBQUNBLHVCQUFxQixJQUFyQjtBQUNBLHVCQUFxQixJQUFyQjtBQUNBLDJCQUF5QixJQUF6QjtBQUNBLGtCQUFnQixJQUFoQjtBQUNBLHdCQUFzQjtXQUFNO0dBQU47QUFDdEIsd0JBQXNCO1dBQU07R0FBTjtBQUN0QixxQkFBbUI7V0FBTTtHQUFOO0FBQ25CLHlCQUF1QjtXQUFNO0dBQU47QUFDdkIsV0FBUyxJQUFUO0FBQ0EsY0FBWSxJQUFaO0FBQ0Esa0JBQWdCLElBQWhCO0FBQ0EsNEJBQTBCLElBQTFCO0FBQ0Esc0JBQW9CLElBQXBCO0FBQ0Esd0JBQXNCLElBQXRCO0FBQ0EsYUFBVyxxQkFBTSxFQUFOO0FBQ1gsc0JBQW9CLElBQXBCO0FBQ0EsdUJBQXFCLElBQXJCO0FBQ0Esc0JBQW9CO1dBQVksU0FBUyxJQUFUO0dBQVo7QUFDcEIsa0JBQWdCO1dBQVksU0FBUyxJQUFUO0dBQVo7QUFDaEIscUJBQW1CO1dBQU07R0FBTjtBQUNuQixzQkFBb0IsS0FBcEI7QUFDQSxhQUFXLEVBQVg7QUFDQSxzQkFBb0IsS0FBcEI7QUFDQSxtQkFBaUIsSUFBakI7Q0F0REU7O0FBeURKLElBQUksV0FBSixFQUFpQjtBQUNmLGNBQVksU0FBWixHQUF3QixJQUF4QixDQURlO0FBRWYsY0FBWSxVQUFaLEdBQXlCLElBQXpCLENBRmU7Q0FBakIsTUFJSyxJQUFJLHNCQUFZLFFBQVosRUFBc0I7QUFDN0IsZ0JBQWMsUUFBUSxVQUFSLENBQWQsQ0FENkI7Q0FBMUIsTUFHQSxJQUFJLE9BQU8sWUFBUCxJQUF1QixVQUFVLFlBQVYsSUFBMEIsT0FBTyxpQkFBUCxFQUEwQjtBQUNsRixNQUFNLHFCQUFxQjtBQUN6QixhQUFTLEVBQVQ7QUFDQSxZQUFRLEVBQVI7QUFDQSxXQUFPLEVBQVA7R0FISSxDQUQ0RTs7Ozs7OztBQU9sRix5QkFBb0IsT0FBTyxJQUFQLENBQVksa0JBQVosMkJBQXBCLG9HQUFxRDtVQUE1QyxzQkFBNEM7O0FBQ25ELFVBQU0sVUFBVSxtQkFBbUIsT0FBbkIsQ0FBVixDQUQ2QztBQUVuRCxVQUFJLG1CQUFTLElBQVQsQ0FBYyxXQUFkLE9BQWdDLE9BQWhDLElBQTJDLFNBQVMsbUJBQVMsT0FBVCxDQUFULElBQThCLE9BQTlCLEVBQXVDO0FBQ3BGLHNCQUFjLFFBQVEsVUFBUixDQUFkLENBRG9GO0FBRXBGLGNBRm9GO09BQXRGO0tBRkY7Ozs7Ozs7Ozs7Ozs7O0dBUGtGO0NBQS9FOztrQkFnQlUiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmF0aXZlVXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMvTmF0aXZlVXRpbHMnO1xuaW1wb3J0IHBsYXRmb3JtIGZyb20gJ3BsYXRmb3JtJztcblxubmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHxcbiAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xud2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHxcbiAgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCB8fFxuICBuYXZpZ2F0b3IubW96QXVkaW9Db250ZXh0O1xud2luZG93LlJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG53aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5sZXQgVm9pY2VFbmdpbmUgPSB7XG4gIHN1cHBvcnRlZDogZmFsc2UsXG4gIGF1dG9FbmFibGU6IGZhbHNlLFxuICBlbmFibGU6IG5vb3AsXG4gIHBsYXlTb3VuZDogbm9vcCxcbiAgc3VwcG9ydHNNdWx0aXBsZVBUVDogbm9vcCxcbiAgc2V0Rm9yY2VTZW5kOiBub29wLFxuICBzZXRJbnB1dE1vZGU6IG5vb3AsXG4gIHNldElucHV0Vm9sdW1lOiBub29wLFxuICBzZXRPdXRwdXRWb2x1bWU6IG5vb3AsXG4gIHNldFZvbHVtZUNoYW5nZUNhbGxiYWNrOiBub29wLFxuICBzZXRPblNwZWFraW5nQ2FsbGJhY2s6IG5vb3AsXG4gIHNldE9uVm9pY2VDYWxsYmFjazogbm9vcCxcbiAgc2V0T25JbnB1dEV2ZW50Q2FsbGJhY2s6IG5vb3AsXG4gIHNldFNlbGZNdXRlOiBub29wLFxuICBzZXRTZWxmRGVhZjogbm9vcCxcbiAgc2V0TG9jYWxNdXRlOiBub29wLFxuICBzZXRMb2NhbFZvbHVtZTogbm9vcCxcbiAgY3JlYXRlVXNlcjogbm9vcCxcbiAgZGVzdHJveVVzZXI6IG5vb3AsXG4gIG9uU3BlYWtpbmc6IG5vb3AsXG4gIG9uVm9pY2VBY3Rpdml0eTogbm9vcCxcbiAgb25EZXZpY2VzQ2hhbmdlZDogbm9vcCxcbiAgb25Db25uZWN0aW9uU3RhdGU6IG5vb3AsXG4gIGdldElucHV0RGV2aWNlczogbm9vcCxcbiAgZ2V0T3V0cHV0RGV2aWNlczogbm9vcCxcbiAgc2V0SW5wdXREZXZpY2U6IG5vb3AsXG4gIHNldE91dHB1dERldmljZTogbm9vcCxcbiAgY2FuU2V0SW5wdXREZXZpY2U6ICgpID0+IGZhbHNlLFxuICBjYW5TZXRPdXRwdXREZXZpY2U6ICgpID0+IGZhbHNlLFxuICBzZXRFbmNvZGluZ0JpdFJhdGU6IG5vb3AsXG4gIHNldEVjaG9DYW5jZWxsYXRpb246IG5vb3AsXG4gIHNldE5vaXNlU3VwcHJlc3Npb246IG5vb3AsXG4gIHNldEF1dG9tYXRpY0dhaW5Db250cm9sOiBub29wLFxuICBzZXRBdHRlbnVhdGlvbjogbm9vcCxcbiAgc3VwcG9ydHNBdXRvbWF0aWNWQUQ6ICgpID0+IGZhbHNlLFxuICBpc0F0dGVudWF0aW9uRW5hYmxlZDogKCkgPT4gZmFsc2UsXG4gIGNhblNldEF0dGVudWF0aW9uOiAoKSA9PiBmYWxzZSxcbiAgY2FuU2V0Vm9pY2VQcm9jZXNzaW5nOiAoKSA9PiBmYWxzZSxcbiAgY29ubmVjdDogbm9vcCxcbiAgZGlzY29ubmVjdDogbm9vcCxcbiAgaGFuZGxlU3BlYWtpbmc6IG5vb3AsXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbjogbm9vcCxcbiAgaW5wdXRFdmVudFJlZ2lzdGVyOiBub29wLFxuICBpbnB1dEV2ZW50VW5yZWdpc3Rlcjogbm9vcCxcbiAgZGVidWdEdW1wOiAoKSA9PiB7fSxcbiAgc2V0Tm9JbnB1dENhbGxiYWNrOiBub29wLFxuICBzZXROb0lucHV0VGhyZXNob2xkOiBub29wLFxuICBjb2xsZWN0RGlhZ25vc3RpY3M6IGNhbGxiYWNrID0+IGNhbGxiYWNrKG51bGwpLFxuICBydW5EaWFnbm9zdGljczogY2FsbGJhY2sgPT4gY2FsbGJhY2sobnVsbCksXG4gIGdldERpYWdub3N0aWNJbmZvOiAoKSA9PiBudWxsLFxuICBkaWFnbm9zdGljc0VuYWJsZWQ6IGZhbHNlLFxuICBDb25zdGFudHM6IHt9LFxuICBzdXBwb3J0c05hdGl2ZVBpbmc6IGZhbHNlLFxuICBzZXRQaW5nQ2FsbGJhY2s6IG51bGxcbn07XG5cbmlmIChfX09WRVJMQVlfXykge1xuICBWb2ljZUVuZ2luZS5zdXBwb3J0ZWQgPSB0cnVlO1xuICBWb2ljZUVuZ2luZS5hdXRvRW5hYmxlID0gdHJ1ZTtcbn1cbmVsc2UgaWYgKE5hdGl2ZVV0aWxzLmVtYmVkZGVkKSB7XG4gIFZvaWNlRW5naW5lID0gcmVxdWlyZSgnLi9uYXRpdmUnKTtcbn1cbmVsc2UgaWYgKHdpbmRvdy5BdWRpb0NvbnRleHQgJiYgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSAmJiB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24pIHtcbiAgY29uc3QgU1VQUE9SVEVEX0JST1dTRVJTID0ge1xuICAgIGZpcmVmb3g6IDM4LFxuICAgIGNocm9tZTogMzcsXG4gICAgb3BlcmE6IDI3XG4gIH07XG5cbiAgZm9yIChsZXQgYnJvd3NlciBvZiBPYmplY3Qua2V5cyhTVVBQT1JURURfQlJPV1NFUlMpKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9IFNVUFBPUlRFRF9CUk9XU0VSU1ticm93c2VyXTtcbiAgICBpZiAocGxhdGZvcm0ubmFtZS50b0xvd2VyQ2FzZSgpID09PSBicm93c2VyICYmIHBhcnNlSW50KHBsYXRmb3JtLnZlcnNpb24pID49IHZlcnNpb24pIHtcbiAgICAgIFZvaWNlRW5naW5lID0gcmVxdWlyZSgnLi93ZWJydGMnKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBWb2ljZUVuZ2luZTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3ZvaWNlX2VuZ2luZS9pbmRleC5qc1xuICoqLyJdfQ==