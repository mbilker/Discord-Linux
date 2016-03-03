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
var bitrate = null;

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

  setEncodingBitRate: function setEncodingBitRate(newBitRate) {
    bitrate = newBitRate;
    peerConnection && peerConnection.setBitRate(bitrate);
  },
  supportsEncodingBitRate: function supportsEncodingBitRate() {
    return true;
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
    peerConnection = new _PeerConnection2.default(ssrc, address, port, bitrate);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxJQUFNLGlCQUFpQixHQUFqQjs7QUFFTixJQUFJLDBCQUFKO0FBQ0EsSUFBSSxrQkFBa0IsaUNBQXNCLGtCQUF0QjtBQUN0QixJQUFJLGVBQWUsRUFBZjtBQUNKLElBQUksY0FBYyxFQUFkO0FBQ0osSUFBSSxXQUFXLEtBQVg7QUFDSixJQUFJLGVBQWUsY0FBZjtBQUNKLElBQUksYUFBYSxFQUFiO0FBQ0osSUFBSSxlQUFlLEVBQWY7QUFDSixJQUFJLFdBQVcsRUFBWDtBQUNKLElBQUksY0FBYSxzQkFBVyxFQUFYO0FBQ2pCLElBQUkscUJBQW9CLElBQXBCO0FBQ0osSUFBSSxVQUFVLElBQVY7O0FBRUosSUFBTSxhQUFhLDBCQUFiO0FBQ04sV0FBVyxVQUFYLEdBQXdCO1NBQVksWUFBVyxJQUFYLEVBQWlCLFFBQWpCO0NBQVo7O0FBRXhCLFNBQVMsY0FBVCxDQUF3QixNQUF4QixFQUFnQztBQUM5QixNQUFNLFNBQVMsYUFBYSxNQUFiLENBQVQsQ0FEd0I7QUFFOUIsU0FBTyxVQUFVLElBQVYsR0FBaUIsTUFBakIsR0FBMEIsY0FBMUIsQ0FGdUI7Q0FBaEM7O0FBS0EsU0FBUyxrQkFBVCxDQUE0QixNQUE1QixFQUFvQztBQUNsQyxTQUFPLFlBQUMsR0FBZSxlQUFlLE1BQWYsQ0FBZixHQUF5QyxjQUExQyxDQUQyQjtDQUFwQzs7QUFJQSxTQUFTLGtCQUFULENBQTRCLEtBQTVCLEVBQW1DO0FBQ2pDLG9CQUFrQixLQUFsQixDQURpQztBQUVqQyx3QkFBcUIsbUJBQWtCLEtBQWxCLENBQXJCLENBRmlDO0NBQW5DOztBQUtBLFNBQVMsaUJBQVQsQ0FBMkIsTUFBM0IsRUFBbUMsTUFBbkMsRUFBMkM7QUFDekMsTUFBSSxjQUFjLDBCQUFnQixNQUFoQixF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LElBQVQsRUFERztLQTNCTDtHQWxQVztBQWtSYixvREFBcUIsRUFsUlI7QUFvUmIsc0RBQXNCLEVBcFJUO0FBc1JiLGtEQUFtQixVQUFVO0FBQzNCLGFBQVMsSUFBVCxFQUQyQjtHQXRSaEI7OztBQTBSYixzQkFBb0IsS0FBcEI7O0FBRUEsMENBQWUsVUFBVTtBQUN2QixhQUFTLElBQVQsRUFEdUI7R0E1Ulo7QUFnU2Isa0RBQW9CO0FBQ2xCLFdBQU8sSUFBUCxDQURrQjtHQWhTUDs7O0FBb1NiLGFBQVcsRUFBWDtBQUNBLG1CQUFpQixJQUFqQjtBQUNBLHNCQUFvQixLQUFwQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBdWRpb0lucHV0IGZyb20gJy4vQXVkaW9JbnB1dCc7XG5pbXBvcnQgQXVkaW9PdXRwdXQgZnJvbSAnLi9BdWRpb091dHB1dCc7XG5pbXBvcnQgUGVlckNvbm5lY3Rpb24gZnJvbSAnLi9QZWVyQ29ubmVjdGlvbic7XG5pbXBvcnQge1ZvaWNlQ29ubmVjdGlvblN0YXRlc30gZnJvbSAnLi4vLi4vLi4vQ29uc3RhbnRzJztcbmltcG9ydCBwbGF0Zm9ybSBmcm9tICdwbGF0Zm9ybSc7XG5cbmNvbnN0IERFRkFVTFRfVk9MVU1FID0gMTAwO1xuXG5sZXQgcGVlckNvbm5lY3Rpb247XG5sZXQgY29ubmVjdGlvblN0YXRlID0gVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRDtcbmxldCBhdWRpb091dHB1dHMgPSB7fTtcbmxldCByZW1vdGVTU1JDcyA9IHt9O1xubGV0IHNlbGZEZWFmID0gZmFsc2U7XG5sZXQgb3V0cHV0Vm9sdW1lID0gREVGQVVMVF9WT0xVTUU7XG5sZXQgbG9jYWxNdXRlcyA9IHt9O1xubGV0IGxvY2FsVm9sdW1lcyA9IHt9O1xubGV0IHNwZWFrZXJzID0ge307XG5sZXQgb25TcGVha2luZyA9IGZ1bmN0aW9uKCkge307XG5sZXQgb25Db25uZWN0aW9uU3RhdGUgPSBudWxsO1xubGV0IGJpdHJhdGUgPSBudWxsO1xuXG5jb25zdCBhdWRpb0lucHV0ID0gbmV3IEF1ZGlvSW5wdXQoKTtcbmF1ZGlvSW5wdXQub25TcGVha2luZyA9IHNwZWFraW5nID0+IG9uU3BlYWtpbmcobnVsbCwgc3BlYWtpbmcpO1xuXG5mdW5jdGlvbiBnZXRMb2NhbFZvbHVtZSh1c2VySWQpIHtcbiAgY29uc3Qgdm9sdW1lID0gbG9jYWxWb2x1bWVzW3VzZXJJZF07XG4gIHJldHVybiB2b2x1bWUgIT0gbnVsbCA/IHZvbHVtZSA6IERFRkFVTFRfVk9MVU1FO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTG9jYWxWb2x1bWUodXNlcklkKSB7XG4gIHJldHVybiAob3V0cHV0Vm9sdW1lICogZ2V0TG9jYWxWb2x1bWUodXNlcklkKSkgLyBERUZBVUxUX1ZPTFVNRTtcbn1cblxuZnVuY3Rpb24gc2V0Q29ubmVjdGlvblN0YXRlKHN0YXRlKSB7XG4gIGNvbm5lY3Rpb25TdGF0ZSA9IHN0YXRlO1xuICBvbkNvbm5lY3Rpb25TdGF0ZSAmJiBvbkNvbm5lY3Rpb25TdGF0ZShzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUF1ZGlvT3V0cHV0KHVzZXJJZCwgc3RyZWFtKSB7XG4gIGxldCBhdWRpb091dHB1dCA9IG5ldyBBdWRpb091dHB1dCh1c2VySWQsIHN0cmVhbSk7XG4gIGF1ZGlvT3V0cHV0Lm11dGUgPSBzZWxmRGVhZiB8fCBsb2NhbE11dGVzW3VzZXJJZF07XG4gIGF1ZGlvT3V0cHV0LnZvbHVtZSA9IGNvbXB1dGVMb2NhbFZvbHVtZSh1c2VySWQpO1xuICBhdWRpb091dHB1dC5vblNwZWFraW5nID0gc3BlYWtpbmcgPT4gb25TcGVha2luZyh1c2VySWQsIHNwZWFraW5nKTtcbiAgYXVkaW9PdXRwdXQuc3BlYWtpbmcgPSBzcGVha2Vyc1t1c2VySWRdIHx8IGZhbHNlO1xuICBhdWRpb091dHB1dHNbdXNlcklkXSA9IGF1ZGlvT3V0cHV0O1xufVxuXG5mdW5jdGlvbiBkZXN0cm95QXVkaW9PdXRwdXQodXNlcklkKSB7XG4gIGNvbnN0IGF1ZGlvT3V0cHV0ID0gYXVkaW9PdXRwdXRzW3VzZXJJZF07XG4gIGlmIChhdWRpb091dHB1dCAhPSBudWxsKSB7XG4gICAgYXVkaW9PdXRwdXQuZGVzdHJveSgpO1xuICAgIGRlbGV0ZSBhdWRpb091dHB1dHNbdXNlcklkXTtcbiAgfVxufVxuXG5sZXQgb25EZXZpY2VzQ2hhbmdlZDtcbmZ1bmN0aW9uIHN5bmNEZXZpY2VzKCkge1xuICBhdWRpb0lucHV0LmdldElucHV0RGV2aWNlcyhpbnB1dERldmljZXMgPT4ge1xuICAgIGF1ZGlvSW5wdXQuZ2V0T3V0cHV0RGV2aWNlcyhvdXRwdXREZXZpY2VzID0+IHtcbiAgICAgIG9uRGV2aWNlc0NoYW5nZWQgJiYgb25EZXZpY2VzQ2hhbmdlZChpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpO1xuICAgIH0pO1xuICB9KTtcbn1cbnNldEludGVydmFsKHN5bmNEZXZpY2VzLCA1MDAwKTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3VwcG9ydGVkOiB0cnVlLFxuXG4gIGF1dG9FbmFibGU6IGZhbHNlLFxuXG4gIGVuYWJsZShjYWxsYmFjaykge1xuICAgIGF1ZGlvSW5wdXQuZW5hYmxlKChlcnIsIHN0cmVhbSkgPT4ge1xuICAgICAgY2FsbGJhY2soZXJyKTtcblxuICAgICAgaWYgKHBlZXJDb25uZWN0aW9uKSB7XG4gICAgICAgIHBlZXJDb25uZWN0aW9uLnN0cmVhbSA9IHN0cmVhbTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBzdXBwb3J0c0F1dG9tYXRpY1ZBRCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgc3VwcG9ydHNNdWx0aXBsZVBUVCgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICBzdXBwb3J0c1BUVFJlbGVhc2VEZWxheSgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICBzZXRGb3JjZVNlbmQoc2VuZCkge1xuICAgIGF1ZGlvSW5wdXQuc2V0UFRUQWN0aXZlKHNlbmQpO1xuICB9LFxuXG4gIHNldElucHV0TW9kZShtb2RlLCBvcHRpb25zKSB7XG4gICAgYXVkaW9JbnB1dC5zZXRNb2RlKG1vZGUsIG9wdGlvbnMpO1xuICB9LFxuXG4gIHNldElucHV0Vm9sdW1lOiBub29wLFxuXG4gIHNldE91dHB1dFZvbHVtZSh2b2x1bWUpIHtcbiAgICBvdXRwdXRWb2x1bWUgPSB2b2x1bWU7XG4gICAgZm9yIChsZXQgdXNlcklkIG9mIE9iamVjdC5rZXlzKGF1ZGlvT3V0cHV0cykpIHtcbiAgICAgIGF1ZGlvT3V0cHV0c1t1c2VySWRdLnZvbHVtZSA9IGNvbXB1dGVMb2NhbFZvbHVtZSh1c2VySWQpO1xuICAgIH1cbiAgfSxcblxuICBzZXRWb2x1bWVDaGFuZ2VDYWxsYmFjazogbm9vcCxcblxuICBzZXRTZWxmTXV0ZShtdXRlKSB7XG4gICAgYXVkaW9JbnB1dC5tdXRlID0gbXV0ZTtcbiAgfSxcblxuICBzZXRTZWxmRGVhZihkZWFmKSB7XG4gICAgc2VsZkRlYWYgPSBkZWFmO1xuICAgIGZvciAobGV0IHVzZXJJZCBvZiBPYmplY3Qua2V5cyhhdWRpb091dHB1dHMpKSB7XG4gICAgICBhdWRpb091dHB1dHNbdXNlcklkXS5tdXRlID0gZGVhZiB8fCBsb2NhbE11dGVzW3VzZXJJZF07XG4gICAgfVxuICB9LFxuXG4gIHNldExvY2FsTXV0ZSh1c2VySWQsIG11dGUpIHtcbiAgICBsb2NhbE11dGVzW3VzZXJJZF0gPSBtdXRlO1xuICAgIGlmIChhdWRpb091dHB1dHNbdXNlcklkXSAhPSBudWxsKSB7XG4gICAgICBhdWRpb091dHB1dHNbdXNlcklkXS5tdXRlID0gc2VsZkRlYWYgfHwgbXV0ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0TG9jYWxWb2x1bWUodXNlcklkLCB2b2x1bWUpIHtcbiAgICBsb2NhbFZvbHVtZXNbdXNlcklkXSA9IHZvbHVtZTtcbiAgICBpZiAoYXVkaW9PdXRwdXRzW3VzZXJJZF0gIT0gbnVsbCkge1xuICAgICAgYXVkaW9PdXRwdXRzW3VzZXJJZF0udm9sdW1lID0gY29tcHV0ZUxvY2FsVm9sdW1lKHVzZXJJZCk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZVVzZXIodXNlcklkLCBzc3JjKSB7XG4gICAgcmVtb3RlU1NSQ3NbdXNlcklkXSA9IHNzcmM7XG4gICAgcGVlckNvbm5lY3Rpb24gJiYgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlU3RyZWFtKHVzZXJJZCwgc3NyYyk7XG4gIH0sXG5cbiAgZGVzdHJveVVzZXIodXNlcklkKSB7XG4gICAgZGVsZXRlIHJlbW90ZVNTUkNzW3VzZXJJZF07XG4gICAgcGVlckNvbm5lY3Rpb24gJiYgcGVlckNvbm5lY3Rpb24ucmVtb3ZlUmVtb3RlU3RyZWFtKHVzZXJJZCk7XG4gIH0sXG5cbiAgb25TcGVha2luZyhjYWxsYmFjaykge1xuICAgIG9uU3BlYWtpbmcgPSBjYWxsYmFjaztcbiAgfSxcblxuICBvblZvaWNlQWN0aXZpdHkoY2FsbGJhY2spIHtcbiAgICBhdWRpb0lucHV0Lm9uVm9pY2VBY3Rpdml0eSA9IGNhbGxiYWNrO1xuICB9LFxuXG4gIG9uRGV2aWNlc0NoYW5nZWQoY2FsbGJhY2spIHtcbiAgICBvbkRldmljZXNDaGFuZ2VkID0gY2FsbGJhY2s7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhzeW5jRGV2aWNlcyk7XG4gIH0sXG5cbiAgZ2V0SW5wdXREZXZpY2VzKGNhbGxiYWNrKSB7XG4gICAgYXVkaW9JbnB1dC5nZXRJbnB1dERldmljZXMoY2FsbGJhY2spO1xuICB9LFxuXG4gIGdldE91dHB1dERldmljZXMoY2FsbGJhY2spIHtcbiAgICBhdWRpb0lucHV0LmdldE91dHB1dERldmljZXMoY2FsbGJhY2spO1xuICB9LFxuXG4gIGNhblNldElucHV0RGV2aWNlKCkge1xuICAgIHJldHVybiBNZWRpYVN0cmVhbVRyYWNrLmdldFNvdXJjZXMgIT0gbnVsbDtcbiAgfSxcblxuICBzZXRJbnB1dERldmljZShpZCkge1xuICAgIGF1ZGlvSW5wdXQuc2V0U291cmNlKGlkLCAoZXJyLCBzdHJlYW0pID0+IHtcbiAgICAgIGlmIChlcnIgPT0gbnVsbCAmJiBwZWVyQ29ubmVjdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHBlZXJDb25uZWN0aW9uLnN0cmVhbSA9IHN0cmVhbTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBjYW5TZXRPdXRwdXREZXZpY2UoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIHNldE91dHB1dERldmljZTogbm9vcCxcblxuICBzZXRFbmNvZGluZ0JpdFJhdGUobmV3Qml0UmF0ZSkge1xuICAgIGJpdHJhdGUgPSBuZXdCaXRSYXRlO1xuICAgIHBlZXJDb25uZWN0aW9uICYmIHBlZXJDb25uZWN0aW9uLnNldEJpdFJhdGUoYml0cmF0ZSk7XG4gIH0sXG5cbiAgc3VwcG9ydHNFbmNvZGluZ0JpdFJhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgc2V0RWNob0NhbmNlbGxhdGlvbihlbmFibGVkKSB7XG4gICAgYXVkaW9JbnB1dC5lY2hvQ2FuY2VsbGF0aW9uID0gZW5hYmxlZDtcbiAgfSxcblxuICBzZXROb2lzZVN1cHByZXNzaW9uKGVuYWJsZWQpIHtcbiAgICBhdWRpb0lucHV0Lm5vaXNlU3VwcHJlc3Npb24gPSBlbmFibGVkO1xuICB9LFxuXG4gIHNldEF1dG9tYXRpY0dhaW5Db250cm9sKGVuYWJsZWQpIHtcbiAgICBhdWRpb0lucHV0LmF1dG9tYXRpY0dhaW5Db250cm9sID0gZW5hYmxlZDtcbiAgfSxcblxuICBjYW5TZXRBdHRlbnVhdGlvbigpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgY2FuU2V0Vm9pY2VQcm9jZXNzaW5nKCkge1xuICAgIHJldHVybiBwbGF0Zm9ybS5sYXlvdXQgPT09ICdCbGluayc7XG4gIH0sXG5cbiAgc2V0QXR0ZW51YXRpb246IG5vb3AsXG5cbiAgb25Db25uZWN0aW9uU3RhdGUoY2FsbGJhY2spIHtcbiAgICBvbkNvbm5lY3Rpb25TdGF0ZSA9IGNhbGxiYWNrO1xuICB9LFxuXG4gIGNvbm5lY3Qoc3NyYywgdXNlcklkLCBhZGRyZXNzLCBwb3J0LCBjYWxsYmFjaykge1xuICAgIHBlZXJDb25uZWN0aW9uID0gbmV3IFBlZXJDb25uZWN0aW9uKHNzcmMsIGFkZHJlc3MsIHBvcnQsIGJpdHJhdGUpO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uKCdhZGRzdHJlYW0nLCAoY25hbWUsIHN0cmVhbSkgPT4gY3JlYXRlQXVkaW9PdXRwdXQoY25hbWUsIHN0cmVhbSkpO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uKCdyZW1vdmVzdHJlYW0nLCBjbmFtZSA9PiBkZXN0cm95QXVkaW9PdXRwdXQoY25hbWUpKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbmNlKCdjb25uZWN0ZWQnLCAoKSA9PiB7XG4gICAgICBhdWRpb0lucHV0LnJlc2V0KCk7XG4gICAgICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0NPTk5FQ1RFRCk7XG4gICAgfSk7XG4gICAgcGVlckNvbm5lY3Rpb24ub24oJ2NoZWNraW5nJywgKCkgPT4gc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5JQ0VfQ0hFQ0tJTkcpKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5vbignZmFpbGVkJywgKCkgPT4gc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5OT19ST1VURSkpO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uKCdkaXNjb25uZWN0ZWQnLCAoKSA9PiBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRCkpO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uKCdjbG9zZWQnLCAoKSA9PiBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRCkpO1xuICAgIHBlZXJDb25uZWN0aW9uLm9uY2UoJ29mZmVyJywgc2RwID0+IGNhbGxiYWNrKG51bGwsICd3ZWJydGMnLCBzZHApKTtcbiAgICBwZWVyQ29ubmVjdGlvbi5zdHJlYW0gPSBhdWRpb0lucHV0LnN0cmVhbTtcbiAgICBwZWVyQ29ubmVjdGlvbi5jb25uZWN0KCk7XG5cbiAgICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0NPTk5FQ1RJTkcpO1xuICB9LFxuXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgcmVtb3RlU1NSQ3MgPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhhdWRpb091dHB1dHMpKSB7XG4gICAgICBkZXN0cm95QXVkaW9PdXRwdXQoa2V5KTtcbiAgICB9XG5cbiAgICBpZiAocGVlckNvbm5lY3Rpb24gIT0gbnVsbCkge1xuICAgICAgcGVlckNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgIHBlZXJDb25uZWN0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRCk7XG4gIH0sXG5cbiAgaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHtzZHB9KSB7XG4gICAgcGVlckNvbm5lY3Rpb24ucmVtb3RlU0RQID0gc2RwO1xuICB9LFxuXG4gIGhhbmRsZVNwZWFraW5nKHVzZXJJZCwgc3BlYWtpbmcpIHtcbiAgICBpZiAoc3BlYWtpbmcpIHtcbiAgICAgIHNwZWFrZXJzW3VzZXJJZF0gPSBzcGVha2luZztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWxldGUgc3BlYWtlcnNbdXNlcklkXTtcbiAgICB9XG4gICAgaWYgKGF1ZGlvT3V0cHV0c1t1c2VySWRdICE9IG51bGwpIHtcbiAgICAgIGF1ZGlvT3V0cHV0c1t1c2VySWRdLnNwZWFraW5nID0gc3BlYWtpbmc7XG4gICAgfVxuICB9LFxuXG4gIGRlYnVnRHVtcChjYWxsYmFjaykge1xuICAgIGxldCBzdHJlYW0gPSBudWxsO1xuICAgIGlmIChhdWRpb0lucHV0LnN0cmVhbSAhPSBudWxsKSB7XG4gICAgICBzdHJlYW0gPSB7XG4gICAgICAgIGlkOiBhdWRpb0lucHV0LnN0cmVhbS5pZCxcbiAgICAgICAgbGFiZWw6IGF1ZGlvSW5wdXQuc3RyZWFtLmxhYmVsLFxuICAgICAgICBlbmRlZDogYXVkaW9JbnB1dC5zdHJlYW0uZW5kZWRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dHMgPSB7fTtcbiAgICBmb3IgKGxldCB1c2VySWQgb2YgT2JqZWN0LmtleXMoYXVkaW9PdXRwdXRzKSkge1xuICAgICAgbGV0IGF1ZGlvT3V0cHV0ID0gYXVkaW9PdXRwdXRzW3VzZXJJZF07XG4gICAgICBvdXRwdXRzW2F1ZGlvT3V0cHV0LmlkXSA9IHtcbiAgICAgICAgbXV0ZTogYXVkaW9PdXRwdXQubXV0ZSxcbiAgICAgICAgdm9sdW1lOiBhdWRpb091dHB1dC52b2x1bWUsXG4gICAgICAgIHNwZWFraW5nOiBhdWRpb091dHB1dC5zcGVha2luZ1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgIGltcGxlbWVudGF0aW9uOiAnd2VicnRjJyxcbiAgICAgIHNlbGZEZWFmLFxuICAgICAgb3V0cHV0Vm9sdW1lLFxuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbXV0ZTogYXVkaW9JbnB1dC5tdXRlLFxuICAgICAgICBzcGVha2luZzogYXVkaW9JbnB1dC5zcGVha2luZyxcbiAgICAgICAgc291cmNlSWQ6IGF1ZGlvSW5wdXRbJ19zb3VyY2VJZCddLFxuICAgICAgICBzb3VjZXM6IGF1ZGlvSW5wdXQuc291cmNlcyxcbiAgICAgICAgbW9kZTogYXVkaW9JbnB1dC5tb2RlLFxuICAgICAgICBtb2RlT3B0aW9uczogYXVkaW9JbnB1dC5tb2RlT3B0aW9ucyxcbiAgICAgICAgbW9kZVJlYWR5OiBhdWRpb0lucHV0LmNsZWFudXAgIT0gbnVsbCxcbiAgICAgICAgc3RyZWFtXG4gICAgICB9LFxuICAgICAgb3V0cHV0c1xuICAgIH07XG5cbiAgICBpZiAocGVlckNvbm5lY3Rpb24gIT0gbnVsbCkge1xuICAgICAgZGF0YS5wZWVyQ29ubmVjdGlvbiA9IHtcbiAgICAgICAgbmVnb3RpYXRpb25OZWVkZWQ6IHBlZXJDb25uZWN0aW9uLm5lZ290aWF0aW9uTmVlZGVkLFxuICAgICAgICBpY2VDb25uZWN0aW9uU3RhdGU6IHBlZXJDb25uZWN0aW9uLmljZUNvbm5lY3Rpb25TdGF0ZSxcbiAgICAgICAgaWNlR2F0aGVyaW5nU3RhdGU6IHBlZXJDb25uZWN0aW9uLmljZUdhdGhlcmluZ1N0YXRlLFxuICAgICAgICBzaWduYWxpbmdTdGF0ZTogcGVlckNvbm5lY3Rpb24uc2lnbmFsaW5nU3RhdGVcbiAgICAgIH07XG5cbiAgICAgIGlmIChwZWVyQ29ubmVjdGlvbi5wYyAhPSBudWxsKSB7XG4gICAgICAgIGRhdGEucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbiA9IHBlZXJDb25uZWN0aW9uLnBjLmxvY2FsRGVzY3JpcHRpb247XG4gICAgICAgIGRhdGEucGVlckNvbm5lY3Rpb24ucmVtb3RlRGVzY3JpcHRpb24gPSBwZWVyQ29ubmVjdGlvbi5wYy5yZW1vdGVEZXNjcmlwdGlvbjtcbiAgICAgICAgcGVlckNvbm5lY3Rpb24ucGMuZ2V0U3RhdHMocmVzID0+IHtcbiAgICAgICAgICBkYXRhLnBlZXJDb25uZWN0aW9uLnN0YXRzID0gcmVzLnJlc3VsdCgpLm1hcChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSB7fTtcbiAgICAgICAgICAgIHJlc3VsdC5uYW1lcygpLmZvckVhY2gobmFtZSA9PiBpdGVtW25hbWVdID0gcmVzdWx0LnN0YXQobmFtZSkpO1xuICAgICAgICAgICAgaXRlbS5pZCA9IHJlc3VsdC5pZDtcbiAgICAgICAgICAgIGl0ZW0udHlwZSA9IHJlc3VsdC50eXBlO1xuICAgICAgICAgICAgaXRlbS50aW1lc3RhbXAgPSByZXN1bHQudGltZXN0YW1wO1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH1cbiAgfSxcblxuICBzZXROb0lucHV0Q2FsbGJhY2soKSB7fSxcblxuICBzZXROb0lucHV0VGhyZXNob2xkKCkge30sXG5cbiAgY29sbGVjdERpYWdub3N0aWNzKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sobnVsbCk7XG4gIH0sXG5cbiAgZGlhZ25vc3RpY3NFbmFibGVkOiBmYWxzZSxcblxuICBydW5EaWFnbm9zdGljcyhjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrKG51bGwpO1xuICB9LFxuXG4gIGdldERpYWdub3N0aWNJbmZvKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIENvbnN0YW50czoge30sXG4gIHNldFBpbmdDYWxsYmFjazogbm9vcCxcbiAgc3VwcG9ydHNOYXRpdmVQaW5nOiBmYWxzZVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvaW5kZXguanNcbiAqKi8iXX0=