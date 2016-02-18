'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AudioInput = require('./AudioInput');

var _AudioInput2 = _interopRequireDefault(_AudioInput);

var _AudioOutput = require('./AudioOutput');

var _AudioOutput2 = _interopRequireDefault(_AudioOutput);

var _PeerConnection = require('./PeerConnection');

var _PeerConnection2 = _interopRequireDefault(_PeerConnection);

var _Constants = require('../../../Constants');

var _platform = require('platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_VOLUME = 100;

var peerConnection = undefined;
var connectionState = _Constants.VoiceConnectionStates.VOICE_DISCONNECTED;
var audioOutputs = {};
var remoteSSRCs = {};
var selfDeaf = false;
var outputVolume = DEFAULT_VOLUME;
var localMutes = {};
var localVolumes = {};
var speakers = {};
var _onSpeaking = function onSpeaking() {};
var _onConnectionState = null;

var audioInput = new _AudioInput2.default();
audioInput.onSpeaking = function (speaking) {
  return _onSpeaking(null, speaking);
};

function getLocalVolume(userId) {
  var volume = localVolumes[userId];
  return volume != null ? volume : DEFAULT_VOLUME;
}

function computeLocalVolume(userId) {
  return outputVolume * getLocalVolume(userId) / DEFAULT_VOLUME;
}

function setConnectionState(state) {
  connectionState = state;
  _onConnectionState && _onConnectionState(state);
}

function createAudioOutput(userId, stream) {
  var audioOutput = new _AudioOutput2.default(userId, stream);
  audioOutput.mute = selfDeaf || localMutes[userId];
  audioOutput.volume = computeLocalVolume(userId);
  audioOutput.onSpeaking = function (speaking) {
    return _onSpeaking(userId, speaking);
  };
  audioOutput.speaking = speakers[userId] || false;
  audioOutputs[userId] = audioOutput;
}

function destroyAudioOutput(userId) {
  var audioOutput = audioOutputs[userId];
  if (audioOutput != null) {
    audioOutput.destroy();
    delete audioOutputs[userId];
  }
}

var _onDevicesChanged = undefined;
function syncDevices() {
  audioInput.getInputDevices(function (inputDevices) {
    audioInput.getOutputDevices(function (outputDevices) {
      _onDevicesChanged && _onDevicesChanged(inputDevices, outputDevices);
    });
  });
}
setInterval(syncDevices, 5000);

function noop() {}

exports.default = {
  supported: true,

  autoEnable: false,

  enable: function enable(callback) {
    audioInput.enable(function (err, stream) {
      callback(err);

      if (peerConnection) {
        peerConnection.stream = stream;
      }
    });
  },
  supportsAutomaticVAD: function supportsAutomaticVAD() {
    return false;
  },
  supportsMultiplePTT: function supportsMultiplePTT() {
    return true;
  },
  supportsPTTReleaseDelay: function supportsPTTReleaseDelay() {
    return true;
  },
  setForceSend: function setForceSend(send) {
    audioInput.setPTTActive(send);
  },
  setInputMode: function setInputMode(mode, options) {
    audioInput.setMode(mode, options);
  },


  setInputVolume: noop,

  setOutputVolume: function setOutputVolume(volume) {
    outputVolume = volume;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(audioOutputs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var userId = _step.value;

        audioOutputs[userId].volume = computeLocalVolume(userId);
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
  },


  setVolumeChangeCallback: noop,

  setSelfMute: function setSelfMute(mute) {
    audioInput.mute = mute;
  },
  setSelfDeaf: function setSelfDeaf(deaf) {
    selfDeaf = deaf;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = Object.keys(audioOutputs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var userId = _step2.value;

        audioOutputs[userId].mute = deaf || localMutes[userId];
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  },
  setLocalMute: function setLocalMute(userId, mute) {
    localMutes[userId] = mute;
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].mute = selfDeaf || mute;
    }
  },
  setLocalVolume: function setLocalVolume(userId, volume) {
    localVolumes[userId] = volume;
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].volume = computeLocalVolume(userId);
    }
  },
  createUser: function createUser(userId, ssrc) {
    remoteSSRCs[userId] = ssrc;
    peerConnection && peerConnection.setRemoteStream(userId, ssrc);
  },
  destroyUser: function destroyUser(userId) {
    delete remoteSSRCs[userId];
    peerConnection && peerConnection.removeRemoteStream(userId);
  },
  onSpeaking: function onSpeaking(callback) {
    _onSpeaking = callback;
  },
  onVoiceActivity: function onVoiceActivity(callback) {
    audioInput.onVoiceActivity = callback;
  },
  onDevicesChanged: function onDevicesChanged(callback) {
    _onDevicesChanged = callback;
    process.nextTick(syncDevices);
  },
  getInputDevices: function getInputDevices(callback) {
    audioInput.getInputDevices(callback);
  },
  getOutputDevices: function getOutputDevices(callback) {
    audioInput.getOutputDevices(callback);
  },
  canSetInputDevice: function canSetInputDevice() {
    return MediaStreamTrack.getSources != null;
  },
  setInputDevice: function setInputDevice(id) {
    audioInput.setSource(id, function (err, stream) {
      if (err == null && peerConnection != null) {
        peerConnection.stream = stream;
      }
    });
  },
  canSetOutputDevice: function canSetOutputDevice() {
    return false;
  },


  setOutputDevice: noop,

  setEncodingBitRate: function setEncodingBitRate(bitsPerSecond) {
    // todo -- looks like it needs to be encoded into SDP:
    // https://bugs.chromium.org/p/webrtc/issues/detail?id=1881
  },
  setEchoCancellation: function setEchoCancellation(enabled) {
    audioInput.echoCancellation = enabled;
  },
  setNoiseSuppression: function setNoiseSuppression(enabled) {
    audioInput.noiseSuppression = enabled;
  },
  setAutomaticGainControl: function setAutomaticGainControl(enabled) {
    audioInput.automaticGainControl = enabled;
  },
  canSetAttenuation: function canSetAttenuation() {
    return false;
  },
  canSetVoiceProcessing: function canSetVoiceProcessing() {
    return _platform2.default.layout === 'Blink';
  },


  setAttenuation: noop,

  onConnectionState: function onConnectionState(callback) {
    _onConnectionState = callback;
  },
  connect: function connect(ssrc, userId, address, port, callback) {
    peerConnection = new _PeerConnection2.default(ssrc, address, port);
    peerConnection.on('addstream', function (cname, stream) {
      return createAudioOutput(cname, stream);
    });
    peerConnection.on('removestream', function (cname) {
      return destroyAudioOutput(cname);
    });
    peerConnection.once('connected', function () {
      audioInput.reset();
      setConnectionState(_Constants.VoiceConnectionStates.VOICE_CONNECTED);
    });
    peerConnection.on('checking', function () {
      return setConnectionState(_Constants.VoiceConnectionStates.ICE_CHECKING);
    });
    peerConnection.on('failed', function () {
      return setConnectionState(_Constants.VoiceConnectionStates.NO_ROUTE);
    });
    peerConnection.on('disconnected', function () {
      return setConnectionState(_Constants.VoiceConnectionStates.VOICE_DISCONNECTED);
    });
    peerConnection.on('closed', function () {
      return setConnectionState(_Constants.VoiceConnectionStates.VOICE_DISCONNECTED);
    });
    peerConnection.once('offer', function (sdp) {
      return callback(null, 'webrtc', sdp);
    });
    peerConnection.stream = audioInput.stream;
    peerConnection.connect();

    setConnectionState(_Constants.VoiceConnectionStates.VOICE_CONNECTING);
  },
  disconnect: function disconnect() {
    remoteSSRCs = {};

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Object.keys(audioOutputs)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var key = _step3.value;

        destroyAudioOutput(key);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    if (peerConnection != null) {
      peerConnection.close();
      peerConnection = null;
    }

    setConnectionState(_Constants.VoiceConnectionStates.VOICE_DISCONNECTED);
  },
  handleSessionDescription: function handleSessionDescription(_ref) {
    var sdp = _ref.sdp;

    peerConnection.remoteSDP = sdp;
  },
  handleSpeaking: function handleSpeaking(userId, speaking) {
    if (speaking) {
      speakers[userId] = speaking;
    } else {
      delete speakers[userId];
    }
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].speaking = speaking;
    }
  },
  debugDump: function debugDump(callback) {
    var stream = null;
    if (audioInput.stream != null) {
      stream = {
        id: audioInput.stream.id,
        label: audioInput.stream.label,
        ended: audioInput.stream.ended
      };
    }

    var outputs = {};
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = Object.keys(audioOutputs)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var userId = _step4.value;

        var audioOutput = audioOutputs[userId];
        outputs[audioOutput.id] = {
          mute: audioOutput.mute,
          volume: audioOutput.volume,
          speaking: audioOutput.speaking
        };
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var data = {
      implementation: 'webrtc',
      selfDeaf: selfDeaf,
      outputVolume: outputVolume,
      input: {
        mute: audioInput.mute,
        speaking: audioInput.speaking,
        sourceId: audioInput['_sourceId'],
        souces: audioInput.sources,
        mode: audioInput.mode,
        modeOptions: audioInput.modeOptions,
        modeReady: audioInput.cleanup != null,
        stream: stream
      },
      outputs: outputs
    };

    if (peerConnection != null) {
      data.peerConnection = {
        negotiationNeeded: peerConnection.negotiationNeeded,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        signalingState: peerConnection.signalingState
      };

      if (peerConnection.pc != null) {
        data.peerConnection.localDescription = peerConnection.pc.localDescription;
        data.peerConnection.remoteDescription = peerConnection.pc.remoteDescription;
        peerConnection.pc.getStats(function (res) {
          data.peerConnection.stats = res.result().map(function (result) {
            var item = {};
            result.names().forEach(function (name) {
              return item[name] = result.stat(name);
            });
            item.id = result.id;
            item.type = result.type;
            item.timestamp = result.timestamp;
            return item;
          });
          callback(data);
        });
      } else {
        callback(data);
      }
    } else {
      callback(data);
    }
  },
  setNoInputCallback: function setNoInputCallback() {},
  setNoInputThreshold: function setNoInputThreshold() {},
  collectDiagnostics: function collectDiagnostics(callback) {
    callback(null);
  },


  diagnosticsEnabled: false,

  runDiagnostics: function runDiagnostics(callback) {
    callback(null);
  },
  getDiagnosticInfo: function getDiagnosticInfo() {
    return null;
  },


  Constants: {},
  setPingCallback: noop,
  supportsNativePing: false
};

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/index.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxJQUFNLGlCQUFpQixHQUFqQjs7QUFFTixJQUFJLDBCQUFKO0FBQ0EsSUFBSSxrQkFBa0IsaUNBQXNCLGtCQUF0QjtBQUN0QixJQUFJLGVBQWUsRUFBZjtBQUNKLElBQUksY0FBYyxFQUFkO0FBQ0osSUFBSSxXQUFXLEtBQVg7QUFDSixJQUFJLGVBQWUsY0FBZjtBQUNKLElBQUksYUFBYSxFQUFiO0FBQ0osSUFBSSxlQUFlLEVBQWY7QUFDSixJQUFJLFdBQVcsRUFBWDtBQUNKLElBQUksY0FBYSxzQkFBVyxFQUFYO0FBQ2pCLElBQUkscUJBQW9CLElBQXBCOztBQUVKLElBQU0sYUFBYSwwQkFBYjtBQUNOLFdBQVcsVUFBWCxHQUF3QjtTQUFZLFlBQVcsSUFBWCxFQUFpQixRQUFqQjtDQUFaOztBQUV4QixTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0M7QUFDOUIsTUFBTSxTQUFTLGFBQWEsTUFBYixDQUFULENBRHdCO0FBRTlCLFNBQU8sVUFBVSxJQUFWLEdBQWlCLE1BQWpCLEdBQTBCLGNBQTFCLENBRnVCO0NBQWhDOztBQUtBLFNBQVMsa0JBQVQsQ0FBNEIsTUFBNUIsRUFBb0M7QUFDbEMsU0FBTyxZQUFDLEdBQWUsZUFBZSxNQUFmLENBQWYsR0FBeUMsY0FBMUMsQ0FEMkI7Q0FBcEM7O0FBSUEsU0FBUyxrQkFBVCxDQUE0QixLQUE1QixFQUFtQztBQUNqQyxvQkFBa0IsS0FBbEIsQ0FEaUM7QUFFakMsd0JBQXFCLG1CQUFrQixLQUFsQixDQUFyQixDQUZpQztDQUFuQzs7QUFLQSxTQUFTLGlCQUFULENBQTJCLE1BQTNCLEVBQW1DLE1BQW5DLEVBQTJDO0FBQ3pDLE1BQUksY0FBYywwQkFBZ0IsTUFBaEIsRUFBd0IsTUFBeEIsQ0FBZCxDQURx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LFVBQVU7QUFDdkIsYUFBUyxJQUFULEVBRHVCO0dBeFJaO0FBNFJiLGtEQUFvQjtBQUNsQixXQUFPLElBQVAsQ0FEa0I7R0E1UlA7OztBQWdTYixhQUFXLEVBQVg7QUFDQSxtQkFBaUIsSUFBakI7QUFDQSxzQkFBb0IsS0FBcEIiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQXVkaW9JbnB1dCBmcm9tICcuL0F1ZGlvSW5wdXQnO1xuaW1wb3J0IEF1ZGlvT3V0cHV0IGZyb20gJy4vQXVkaW9PdXRwdXQnO1xuaW1wb3J0IFBlZXJDb25uZWN0aW9uIGZyb20gJy4vUGVlckNvbm5lY3Rpb24nO1xuaW1wb3J0IHtWb2ljZUNvbm5lY3Rpb25TdGF0ZXN9IGZyb20gJy4uLy4uLy4uL0NvbnN0YW50cyc7XG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAncGxhdGZvcm0nO1xuXG5jb25zdCBERUZBVUxUX1ZPTFVNRSA9IDEwMDtcblxubGV0IHBlZXJDb25uZWN0aW9uO1xubGV0IGNvbm5lY3Rpb25TdGF0ZSA9IFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9ESVNDT05ORUNURUQ7XG5sZXQgYXVkaW9PdXRwdXRzID0ge307XG5sZXQgcmVtb3RlU1NSQ3MgPSB7fTtcbmxldCBzZWxmRGVhZiA9IGZhbHNlO1xubGV0IG91dHB1dFZvbHVtZSA9IERFRkFVTFRfVk9MVU1FO1xubGV0IGxvY2FsTXV0ZXMgPSB7fTtcbmxldCBsb2NhbFZvbHVtZXMgPSB7fTtcbmxldCBzcGVha2VycyA9IHt9O1xubGV0IG9uU3BlYWtpbmcgPSBmdW5jdGlvbigpIHt9O1xubGV0IG9uQ29ubmVjdGlvblN0YXRlID0gbnVsbDtcblxuY29uc3QgYXVkaW9JbnB1dCA9IG5ldyBBdWRpb0lucHV0KCk7XG5hdWRpb0lucHV0Lm9uU3BlYWtpbmcgPSBzcGVha2luZyA9PiBvblNwZWFraW5nKG51bGwsIHNwZWFraW5nKTtcblxuZnVuY3Rpb24gZ2V0TG9jYWxWb2x1bWUodXNlcklkKSB7XG4gIGNvbnN0IHZvbHVtZSA9IGxvY2FsVm9sdW1lc1t1c2VySWRdO1xuICByZXR1cm4gdm9sdW1lICE9IG51bGwgPyB2b2x1bWUgOiBERUZBVUxUX1ZPTFVNRTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUxvY2FsVm9sdW1lKHVzZXJJZCkge1xuICByZXR1cm4gKG91dHB1dFZvbHVtZSAqIGdldExvY2FsVm9sdW1lKHVzZXJJZCkpIC8gREVGQVVMVF9WT0xVTUU7XG59XG5cbmZ1bmN0aW9uIHNldENvbm5lY3Rpb25TdGF0ZShzdGF0ZSkge1xuICBjb25uZWN0aW9uU3RhdGUgPSBzdGF0ZTtcbiAgb25Db25uZWN0aW9uU3RhdGUgJiYgb25Db25uZWN0aW9uU3RhdGUoc3RhdGUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBdWRpb091dHB1dCh1c2VySWQsIHN0cmVhbSkge1xuICBsZXQgYXVkaW9PdXRwdXQgPSBuZXcgQXVkaW9PdXRwdXQodXNlcklkLCBzdHJlYW0pO1xuICBhdWRpb091dHB1dC5tdXRlID0gc2VsZkRlYWYgfHwgbG9jYWxNdXRlc1t1c2VySWRdO1xuICBhdWRpb091dHB1dC52b2x1bWUgPSBjb21wdXRlTG9jYWxWb2x1bWUodXNlcklkKTtcbiAgYXVkaW9PdXRwdXQub25TcGVha2luZyA9IHNwZWFraW5nID0+IG9uU3BlYWtpbmcodXNlcklkLCBzcGVha2luZyk7XG4gIGF1ZGlvT3V0cHV0LnNwZWFraW5nID0gc3BlYWtlcnNbdXNlcklkXSB8fCBmYWxzZTtcbiAgYXVkaW9PdXRwdXRzW3VzZXJJZF0gPSBhdWRpb091dHB1dDtcbn1cblxuZnVuY3Rpb24gZGVzdHJveUF1ZGlvT3V0cHV0KHVzZXJJZCkge1xuICBjb25zdCBhdWRpb091dHB1dCA9IGF1ZGlvT3V0cHV0c1t1c2VySWRdO1xuICBpZiAoYXVkaW9PdXRwdXQgIT0gbnVsbCkge1xuICAgIGF1ZGlvT3V0cHV0LmRlc3Ryb3koKTtcbiAgICBkZWxldGUgYXVkaW9PdXRwdXRzW3VzZXJJZF07XG4gIH1cbn1cblxubGV0IG9uRGV2aWNlc0NoYW5nZWQ7XG5mdW5jdGlvbiBzeW5jRGV2aWNlcygpIHtcbiAgYXVkaW9JbnB1dC5nZXRJbnB1dERldmljZXMoaW5wdXREZXZpY2VzID0+IHtcbiAgICBhdWRpb0lucHV0LmdldE91dHB1dERldmljZXMob3V0cHV0RGV2aWNlcyA9PiB7XG4gICAgICBvbkRldmljZXNDaGFuZ2VkICYmIG9uRGV2aWNlc0NoYW5nZWQoaW5wdXREZXZpY2VzLCBvdXRwdXREZXZpY2VzKTtcbiAgICB9KTtcbiAgfSk7XG59XG5zZXRJbnRlcnZhbChzeW5jRGV2aWNlcywgNTAwMCk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHN1cHBvcnRlZDogdHJ1ZSxcblxuICBhdXRvRW5hYmxlOiBmYWxzZSxcblxuICBlbmFibGUoY2FsbGJhY2spIHtcbiAgICBhdWRpb0lucHV0LmVuYWJsZSgoZXJyLCBzdHJlYW0pID0+IHtcbiAgICAgIGNhbGxiYWNrKGVycik7XG5cbiAgICAgIGlmIChwZWVyQ29ubmVjdGlvbikge1xuICAgICAgICBwZWVyQ29ubmVjdGlvbi5zdHJlYW0gPSBzdHJlYW07XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgc3VwcG9ydHNBdXRvbWF0aWNWQUQoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIHN1cHBvcnRzTXVsdGlwbGVQVFQoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgc3VwcG9ydHNQVFRSZWxlYXNlRGVsYXkoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgc2V0Rm9yY2VTZW5kKHNlbmQpIHtcbiAgICBhdWRpb0lucHV0LnNldFBUVEFjdGl2ZShzZW5kKTtcbiAgfSxcblxuICBzZXRJbnB1dE1vZGUobW9kZSwgb3B0aW9ucykge1xuICAgIGF1ZGlvSW5wdXQuc2V0TW9kZShtb2RlLCBvcHRpb25zKTtcbiAgfSxcblxuICBzZXRJbnB1dFZvbHVtZTogbm9vcCxcblxuICBzZXRPdXRwdXRWb2x1bWUodm9sdW1lKSB7XG4gICAgb3V0cHV0Vm9sdW1lID0gdm9sdW1lO1xuICAgIGZvciAobGV0IHVzZXJJZCBvZiBPYmplY3Qua2V5cyhhdWRpb091dHB1dHMpKSB7XG4gICAgICBhdWRpb091dHB1dHNbdXNlcklkXS52b2x1bWUgPSBjb21wdXRlTG9jYWxWb2x1bWUodXNlcklkKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0Vm9sdW1lQ2hhbmdlQ2FsbGJhY2s6IG5vb3AsXG5cbiAgc2V0U2VsZk11dGUobXV0ZSkge1xuICAgIGF1ZGlvSW5wdXQubXV0ZSA9IG11dGU7XG4gIH0sXG5cbiAgc2V0U2VsZkRlYWYoZGVhZikge1xuICAgIHNlbGZEZWFmID0gZGVhZjtcbiAgICBmb3IgKGxldCB1c2VySWQgb2YgT2JqZWN0LmtleXMoYXVkaW9PdXRwdXRzKSkge1xuICAgICAgYXVkaW9PdXRwdXRzW3VzZXJJZF0ubXV0ZSA9IGRlYWYgfHwgbG9jYWxNdXRlc1t1c2VySWRdO1xuICAgIH1cbiAgfSxcblxuICBzZXRMb2NhbE11dGUodXNlcklkLCBtdXRlKSB7XG4gICAgbG9jYWxNdXRlc1t1c2VySWRdID0gbXV0ZTtcbiAgICBpZiAoYXVkaW9PdXRwdXRzW3VzZXJJZF0gIT0gbnVsbCkge1xuICAgICAgYXVkaW9PdXRwdXRzW3VzZXJJZF0ubXV0ZSA9IHNlbGZEZWFmIHx8IG11dGU7XG4gICAgfVxuICB9LFxuXG4gIHNldExvY2FsVm9sdW1lKHVzZXJJZCwgdm9sdW1lKSB7XG4gICAgbG9jYWxWb2x1bWVzW3VzZXJJZF0gPSB2b2x1bWU7XG4gICAgaWYgKGF1ZGlvT3V0cHV0c1t1c2VySWRdICE9IG51bGwpIHtcbiAgICAgIGF1ZGlvT3V0cHV0c1t1c2VySWRdLnZvbHVtZSA9IGNvbXB1dGVMb2NhbFZvbHVtZSh1c2VySWQpO1xuICAgIH1cbiAgfSxcblxuICBjcmVhdGVVc2VyKHVzZXJJZCwgc3NyYykge1xuICAgIHJlbW90ZVNTUkNzW3VzZXJJZF0gPSBzc3JjO1xuICAgIHBlZXJDb25uZWN0aW9uICYmIHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZVN0cmVhbSh1c2VySWQsIHNzcmMpO1xuICB9LFxuXG4gIGRlc3Ryb3lVc2VyKHVzZXJJZCkge1xuICAgIGRlbGV0ZSByZW1vdGVTU1JDc1t1c2VySWRdO1xuICAgIHBlZXJDb25uZWN0aW9uICYmIHBlZXJDb25uZWN0aW9uLnJlbW92ZVJlbW90ZVN0cmVhbSh1c2VySWQpO1xuICB9LFxuXG4gIG9uU3BlYWtpbmcoY2FsbGJhY2spIHtcbiAgICBvblNwZWFraW5nID0gY2FsbGJhY2s7XG4gIH0sXG5cbiAgb25Wb2ljZUFjdGl2aXR5KGNhbGxiYWNrKSB7XG4gICAgYXVkaW9JbnB1dC5vblZvaWNlQWN0aXZpdHkgPSBjYWxsYmFjaztcbiAgfSxcblxuICBvbkRldmljZXNDaGFuZ2VkKGNhbGxiYWNrKSB7XG4gICAgb25EZXZpY2VzQ2hhbmdlZCA9IGNhbGxiYWNrO1xuICAgIHByb2Nlc3MubmV4dFRpY2soc3luY0RldmljZXMpO1xuICB9LFxuXG4gIGdldElucHV0RGV2aWNlcyhjYWxsYmFjaykge1xuICAgIGF1ZGlvSW5wdXQuZ2V0SW5wdXREZXZpY2VzKGNhbGxiYWNrKTtcbiAgfSxcblxuICBnZXRPdXRwdXREZXZpY2VzKGNhbGxiYWNrKSB7XG4gICAgYXVkaW9JbnB1dC5nZXRPdXRwdXREZXZpY2VzKGNhbGxiYWNrKTtcbiAgfSxcblxuICBjYW5TZXRJbnB1dERldmljZSgpIHtcbiAgICByZXR1cm4gTWVkaWFTdHJlYW1UcmFjay5nZXRTb3VyY2VzICE9IG51bGw7XG4gIH0sXG5cbiAgc2V0SW5wdXREZXZpY2UoaWQpIHtcbiAgICBhdWRpb0lucHV0LnNldFNvdXJjZShpZCwgKGVyciwgc3RyZWFtKSA9PiB7XG4gICAgICBpZiAoZXJyID09IG51bGwgJiYgcGVlckNvbm5lY3Rpb24gIT0gbnVsbCkge1xuICAgICAgICBwZWVyQ29ubmVjdGlvbi5zdHJlYW0gPSBzdHJlYW07XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgY2FuU2V0T3V0cHV0RGV2aWNlKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBzZXRPdXRwdXREZXZpY2U6IG5vb3AsXG5cbiAgc2V0RW5jb2RpbmdCaXRSYXRlKGJpdHNQZXJTZWNvbmQpIHtcbiAgICAvLyB0b2RvIC0tIGxvb2tzIGxpa2UgaXQgbmVlZHMgdG8gYmUgZW5jb2RlZCBpbnRvIFNEUDpcbiAgICAvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3Avd2VicnRjL2lzc3Vlcy9kZXRhaWw/aWQ9MTg4MVxuICB9LFxuXG4gIHNldEVjaG9DYW5jZWxsYXRpb24oZW5hYmxlZCkge1xuICAgIGF1ZGlvSW5wdXQuZWNob0NhbmNlbGxhdGlvbiA9IGVuYWJsZWQ7XG4gIH0sXG5cbiAgc2V0Tm9pc2VTdXBwcmVzc2lvbihlbmFibGVkKSB7XG4gICAgYXVkaW9JbnB1dC5ub2lzZVN1cHByZXNzaW9uID0gZW5hYmxlZDtcbiAgfSxcblxuICBzZXRBdXRvbWF0aWNHYWluQ29udHJvbChlbmFibGVkKSB7XG4gICAgYXVkaW9JbnB1dC5hdXRvbWF0aWNHYWluQ29udHJvbCA9IGVuYWJsZWQ7XG4gIH0sXG5cbiAgY2FuU2V0QXR0ZW51YXRpb24oKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGNhblNldFZvaWNlUHJvY2Vzc2luZygpIHtcbiAgICByZXR1cm4gcGxhdGZvcm0ubGF5b3V0ID09PSAnQmxpbmsnO1xuICB9LFxuXG4gIHNldEF0dGVudWF0aW9uOiBub29wLFxuXG4gIG9uQ29ubmVjdGlvblN0YXRlKGNhbGxiYWNrKSB7XG4gICAgb25Db25uZWN0aW9uU3RhdGUgPSBjYWxsYmFjaztcbiAgfSxcblxuICBjb25uZWN0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spIHtcbiAgICBwZWVyQ29ubmVjdGlvbiA9IG5ldyBQZWVyQ29ubmVjdGlvbihzc3JjLCBhZGRyZXNzLCBwb3J0KTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbignYWRkc3RyZWFtJywgKGNuYW1lLCBzdHJlYW0pID0+IGNyZWF0ZUF1ZGlvT3V0cHV0KGNuYW1lLCBzdHJlYW0pKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbigncmVtb3Zlc3RyZWFtJywgY25hbWUgPT4gZGVzdHJveUF1ZGlvT3V0cHV0KGNuYW1lKSk7XG4gICAgcGVlckNvbm5lY3Rpb24ub25jZSgnY29ubmVjdGVkJywgKCkgPT4ge1xuICAgICAgYXVkaW9JbnB1dC5yZXNldCgpO1xuICAgICAgc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9DT05ORUNURUQpO1xuICAgIH0pO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uKCdjaGVja2luZycsICgpID0+IHNldENvbm5lY3Rpb25TdGF0ZShWb2ljZUNvbm5lY3Rpb25TdGF0ZXMuSUNFX0NIRUNLSU5HKSk7XG4gICAgcGVlckNvbm5lY3Rpb24ub24oJ2ZhaWxlZCcsICgpID0+IHNldENvbm5lY3Rpb25TdGF0ZShWb2ljZUNvbm5lY3Rpb25TdGF0ZXMuTk9fUk9VVEUpKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbignZGlzY29ubmVjdGVkJywgKCkgPT4gc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9ESVNDT05ORUNURUQpKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbignY2xvc2VkJywgKCkgPT4gc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9ESVNDT05ORUNURUQpKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbmNlKCdvZmZlcicsIHNkcCA9PiBjYWxsYmFjayhudWxsLCAnd2VicnRjJywgc2RwKSk7XG4gICAgcGVlckNvbm5lY3Rpb24uc3RyZWFtID0gYXVkaW9JbnB1dC5zdHJlYW07XG4gICAgcGVlckNvbm5lY3Rpb24uY29ubmVjdCgpO1xuXG4gICAgc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9DT05ORUNUSU5HKTtcbiAgfSxcblxuICBkaXNjb25uZWN0KCkge1xuICAgIHJlbW90ZVNTUkNzID0ge307XG5cbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoYXVkaW9PdXRwdXRzKSkge1xuICAgICAgZGVzdHJveUF1ZGlvT3V0cHV0KGtleSk7XG4gICAgfVxuXG4gICAgaWYgKHBlZXJDb25uZWN0aW9uICE9IG51bGwpIHtcbiAgICAgIHBlZXJDb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICBwZWVyQ29ubmVjdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9ESVNDT05ORUNURUQpO1xuICB9LFxuXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbih7c2RwfSkge1xuICAgIHBlZXJDb25uZWN0aW9uLnJlbW90ZVNEUCA9IHNkcDtcbiAgfSxcblxuICBoYW5kbGVTcGVha2luZyh1c2VySWQsIHNwZWFraW5nKSB7XG4gICAgaWYgKHNwZWFraW5nKSB7XG4gICAgICBzcGVha2Vyc1t1c2VySWRdID0gc3BlYWtpbmc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGVsZXRlIHNwZWFrZXJzW3VzZXJJZF07XG4gICAgfVxuICAgIGlmIChhdWRpb091dHB1dHNbdXNlcklkXSAhPSBudWxsKSB7XG4gICAgICBhdWRpb091dHB1dHNbdXNlcklkXS5zcGVha2luZyA9IHNwZWFraW5nO1xuICAgIH1cbiAgfSxcblxuICBkZWJ1Z0R1bXAoY2FsbGJhY2spIHtcbiAgICBsZXQgc3RyZWFtID0gbnVsbDtcbiAgICBpZiAoYXVkaW9JbnB1dC5zdHJlYW0gIT0gbnVsbCkge1xuICAgICAgc3RyZWFtID0ge1xuICAgICAgICBpZDogYXVkaW9JbnB1dC5zdHJlYW0uaWQsXG4gICAgICAgIGxhYmVsOiBhdWRpb0lucHV0LnN0cmVhbS5sYWJlbCxcbiAgICAgICAgZW5kZWQ6IGF1ZGlvSW5wdXQuc3RyZWFtLmVuZGVkXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCBvdXRwdXRzID0ge307XG4gICAgZm9yIChsZXQgdXNlcklkIG9mIE9iamVjdC5rZXlzKGF1ZGlvT3V0cHV0cykpIHtcbiAgICAgIGxldCBhdWRpb091dHB1dCA9IGF1ZGlvT3V0cHV0c1t1c2VySWRdO1xuICAgICAgb3V0cHV0c1thdWRpb091dHB1dC5pZF0gPSB7XG4gICAgICAgIG11dGU6IGF1ZGlvT3V0cHV0Lm11dGUsXG4gICAgICAgIHZvbHVtZTogYXVkaW9PdXRwdXQudm9sdW1lLFxuICAgICAgICBzcGVha2luZzogYXVkaW9PdXRwdXQuc3BlYWtpbmdcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICBpbXBsZW1lbnRhdGlvbjogJ3dlYnJ0YycsXG4gICAgICBzZWxmRGVhZixcbiAgICAgIG91dHB1dFZvbHVtZSxcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIG11dGU6IGF1ZGlvSW5wdXQubXV0ZSxcbiAgICAgICAgc3BlYWtpbmc6IGF1ZGlvSW5wdXQuc3BlYWtpbmcsXG4gICAgICAgIHNvdXJjZUlkOiBhdWRpb0lucHV0Wydfc291cmNlSWQnXSxcbiAgICAgICAgc291Y2VzOiBhdWRpb0lucHV0LnNvdXJjZXMsXG4gICAgICAgIG1vZGU6IGF1ZGlvSW5wdXQubW9kZSxcbiAgICAgICAgbW9kZU9wdGlvbnM6IGF1ZGlvSW5wdXQubW9kZU9wdGlvbnMsXG4gICAgICAgIG1vZGVSZWFkeTogYXVkaW9JbnB1dC5jbGVhbnVwICE9IG51bGwsXG4gICAgICAgIHN0cmVhbVxuICAgICAgfSxcbiAgICAgIG91dHB1dHNcbiAgICB9O1xuXG4gICAgaWYgKHBlZXJDb25uZWN0aW9uICE9IG51bGwpIHtcbiAgICAgIGRhdGEucGVlckNvbm5lY3Rpb24gPSB7XG4gICAgICAgIG5lZ290aWF0aW9uTmVlZGVkOiBwZWVyQ29ubmVjdGlvbi5uZWdvdGlhdGlvbk5lZWRlZCxcbiAgICAgICAgaWNlQ29ubmVjdGlvblN0YXRlOiBwZWVyQ29ubmVjdGlvbi5pY2VDb25uZWN0aW9uU3RhdGUsXG4gICAgICAgIGljZUdhdGhlcmluZ1N0YXRlOiBwZWVyQ29ubmVjdGlvbi5pY2VHYXRoZXJpbmdTdGF0ZSxcbiAgICAgICAgc2lnbmFsaW5nU3RhdGU6IHBlZXJDb25uZWN0aW9uLnNpZ25hbGluZ1N0YXRlXG4gICAgICB9O1xuXG4gICAgICBpZiAocGVlckNvbm5lY3Rpb24ucGMgIT0gbnVsbCkge1xuICAgICAgICBkYXRhLnBlZXJDb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24gPSBwZWVyQ29ubmVjdGlvbi5wYy5sb2NhbERlc2NyaXB0aW9uO1xuICAgICAgICBkYXRhLnBlZXJDb25uZWN0aW9uLnJlbW90ZURlc2NyaXB0aW9uID0gcGVlckNvbm5lY3Rpb24ucGMucmVtb3RlRGVzY3JpcHRpb247XG4gICAgICAgIHBlZXJDb25uZWN0aW9uLnBjLmdldFN0YXRzKHJlcyA9PiB7XG4gICAgICAgICAgZGF0YS5wZWVyQ29ubmVjdGlvbi5zdGF0cyA9IHJlcy5yZXN1bHQoKS5tYXAocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtID0ge307XG4gICAgICAgICAgICByZXN1bHQubmFtZXMoKS5mb3JFYWNoKG5hbWUgPT4gaXRlbVtuYW1lXSA9IHJlc3VsdC5zdGF0KG5hbWUpKTtcbiAgICAgICAgICAgIGl0ZW0uaWQgPSByZXN1bHQuaWQ7XG4gICAgICAgICAgICBpdGVtLnR5cGUgPSByZXN1bHQudHlwZTtcbiAgICAgICAgICAgIGl0ZW0udGltZXN0YW1wID0gcmVzdWx0LnRpbWVzdGFtcDtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0Tm9JbnB1dENhbGxiYWNrKCkge30sXG5cbiAgc2V0Tm9JbnB1dFRocmVzaG9sZCgpIHt9LFxuXG4gIGNvbGxlY3REaWFnbm9zdGljcyhjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrKG51bGwpO1xuICB9LFxuXG4gIGRpYWdub3N0aWNzRW5hYmxlZDogZmFsc2UsXG5cbiAgcnVuRGlhZ25vc3RpY3MoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhudWxsKTtcbiAgfSxcblxuICBnZXREaWFnbm9zdGljSW5mbygpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICBDb25zdGFudHM6IHt9LFxuICBzZXRQaW5nQ2FsbGJhY2s6IG5vb3AsXG4gIHN1cHBvcnRzTmF0aXZlUGluZzogZmFsc2Vcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2Rpc2NvcmRfYXBwL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjL2luZGV4LmpzXG4gKiovIl19