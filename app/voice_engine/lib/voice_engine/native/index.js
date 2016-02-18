'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _NativeUtils = require('../../../utils/NativeUtils');

var _NativeUtils2 = _interopRequireDefault(_NativeUtils);

var _VersionGuard = require('../../VersionGuard');

var _VersionGuard2 = _interopRequireDefault(_VersionGuard);

var _i18n = require('../../../i18n');

var _i18n2 = _interopRequireDefault(_i18n);

var _GlobalShortcut = require('../../GlobalShortcut');

var _GlobalShortcut2 = _interopRequireDefault(_GlobalShortcut);

var _Constants = require('../../../Constants');

var _Logger = require('../../Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Constants2 = require('./Constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VoiceEngine = _NativeUtils2.default.getVoiceEngine();

var logger = _Logger2.default.create('VoiceEngine');

// citron note: this will be replaced with a VoiceEngine version
var VERSION_REQ_FULL_PATH_SOUNDS = false;
var VERSION_REQ_PTT_RELEASE_DELAY = false;
var VERSION_REQ_AUTOMATIC_VAD = false;
if (_NativeUtils2.default.isWindows() || _NativeUtils2.default.isOSX()) {
  VERSION_REQ_FULL_PATH_SOUNDS = _NativeUtils2.default.isVersionEqualOrNewer({
    'stable': ['0.0.275', '0.0.218'],
    'canary': ['0.0.41', '0.0.47'],
    'ptb': ['0.0.1', '0.0.1']
  });
  VERSION_REQ_PTT_RELEASE_DELAY = _NativeUtils2.default.isVersionEqualOrNewer({
    'stable': ['0.0.278', '0.0.229'],
    'canary': ['0.0.67', '0.0.58'],
    'ptb': ['0.0.1', '0.0.1']
  });
  VERSION_REQ_AUTOMATIC_VAD = _NativeUtils2.default.isVersionEqualOrNewer({
    'stable': ['0.0.239', '0.0.231'],
    'canary': ['0.0.73', '0.0.62'],
    'ptb': ['0.0.1', '0.0.1']
  });
}

var DEFAULT_VOLUME = 100;

var connectionState = _Constants.VoiceConnectionStates.VOICE_DISCONNECTED;
var hasTransport = false;
var selfMute = false;
var inputVolume = DEFAULT_VOLUME;
var outputVolume = DEFAULT_VOLUME;
var inputDeviceIndex = 0;
var outputDeviceIndex = 0;
var localMutes = {};
var localVolumes = {};
var remoteSSRCs = {};
var encryptionSettings = null;
var _onSpeaking = function onSpeaking() {
  return null;
};
var _onDevicesChanged = null;
var _onConnectionState = null;
var _onVoiceActivity = null;
var inputMode = _Constants.InputModes.VOICE_ACTIVITY;
var vadThreshold = -40;
var vadAutoThreshold = true;
var pttShortcut = undefined;
var pttDelay = 0;
var echoCancellation = _Constants2.EchoCancellation.CONFERANCE;
var noiseSuppression = _Constants2.NoiseSuppression.HIGH_SUPPRESSION;
var automaticGainControl = _Constants2.AutomaticGainControl.ADAPTIVE_ANALOG;
var attenuationFactor = 0.5;

// setOnSpeakingCallback
function onUserSpeaking(userId, speaking) {
  _onSpeaking(userId, speaking);
}
if (VoiceEngine.setOnSpeakingCallback) {
  VoiceEngine.setOnSpeakingCallback(_NativeUtils2.default.makeDeferred(onUserSpeaking, false));
} else {
  _NativeUtils2.default.on('user-speaking', function (_ref) {
    var isSpeaking = _ref.isSpeaking;
    var userId = _ref.userId;
    return onUserSpeaking(userId, isSpeaking);
  });
}

// setOnVoiceCallback
var lastOnVoice = undefined;
function onVoice(level) {
  if (_onVoiceActivity != null) {
    var now = Date.now();
    if (lastOnVoice == null || Date.now() - lastOnVoice > 20) {
      lastOnVoice = now;
      _onVoiceActivity(level);
    }
  }
}
if (VoiceEngine.setOnVoiceCallback) {
  VoiceEngine.setOnVoiceCallback(_NativeUtils2.default.makeDeferred(onVoice));
} else {
  _NativeUtils2.default.on('on-voice', function (_ref2) {
    var level = _ref2.level;
    return onVoice(level);
  });
}

// setDeviceChangeCallback
function onDeviceChange(inputDevices, outputDevices) {
  _onDevicesChanged && _onDevicesChanged(inputDevices, outputDevices);
}
if (VoiceEngine.setDeviceChangeCallback) {
  VoiceEngine.setDeviceChangeCallback(_NativeUtils2.default.makeDeferred(onDeviceChange));
} else {
  _NativeUtils2.default.on('device-changed', function (_ref3) {
    var inputDevices = _ref3.inputDevices;
    var outputDevices = _ref3.outputDevices;
    return onDeviceChange(inputDevices, outputDevices);
  });
}

VoiceEngine.setEmitVADLevel(false);

function getLocalVolume(userId) {
  var volume = localVolumes[userId];
  return (volume != null ? volume : DEFAULT_VOLUME) / DEFAULT_VOLUME;
}

function getLocalMute(userId) {
  return localMutes[userId] || false;
}

function createInputModeOptions() {
  if (inputMode === _Constants.InputModes.VOICE_ACTIVITY) {
    return {
      vadThreshold: vadThreshold,
      vadAutoThreshold: vadAutoThreshold ? _Constants2.VADAggressiveness.VERY_AGGRESSIVE : -1,
      vadLeading: 5,
      vadTrailing: 25
    };
  } else if (inputMode === _Constants.InputModes.PUSH_TO_TALK) {
    return {
      pttScanCodeCombos: pttShortcut || [],
      pttReleaseDelay: pttDelay
    };
  }

  return {};
}

function sanitizeDevices(devices) {
  devices = devices.map(function (_ref4) {
    var index = _ref4.index;
    var guid = _ref4.guid;
    var name = _ref4.name;
    var originalName = _ref4.name;

    if (/^default/.test(name)) {
      guid = 'default';
      name = _i18n2.default.Messages.DEFAULT;
    }
    guid = guid || name;
    return { id: guid, index: index, name: name, originalName: originalName };
  });
  if (_NativeUtils2.default.isWindows()) {
    devices.unshift({ id: 'default', index: -1, name: _i18n2.default.Messages.DEFAULT });
  }
  return devices;
}

function setConnectionState(state) {
  connectionState = state;
  _onConnectionState && _onConnectionState(state);
}

function isAttenuating() {
  return attenuationFactor < 1;
}

function getTransportOptions() {
  var includeEncryptionSettings = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

  var transportOptions = {
    builtInEchoCancellation: true,
    echoCancellation: echoCancellation,
    noiseSuppression: noiseSuppression,
    automaticGainControl: automaticGainControl,
    inputDevice: inputDeviceIndex,
    outputDevice: outputDeviceIndex,
    inputVolume: inputVolume / DEFAULT_VOLUME,
    outputVolume: outputVolume / DEFAULT_VOLUME,
    inputMode: _Constants2.NATIVE_MODE_VALUES[inputMode],
    inputModeOptions: createInputModeOptions(),
    selfMute: selfMute,
    attenuation: isAttenuating(),
    attenuationFactor: attenuationFactor,
    ducking: false
  };

  if (includeEncryptionSettings) {
    transportOptions.encryptionSettings = encryptionSettings;
  }

  return transportOptions;
}

function getUserOptions() {
  return Object.keys(remoteSSRCs).map(function (userId) {
    return {
      id: userId,
      ssrc: remoteSSRCs[userId],
      mute: getLocalMute(userId),
      volume: getLocalVolume(userId)
    };
  });
}

function createTransport(ssrc, userId, address, port, callback) {
  var _arguments = arguments;

  if (hasTransport) {
    logger.warn('Transport already exists');
  }

  _NativeUtils2.default.setProcessPriority(_Constants.ProcessPriority.HIGH);
  setConnectionState(_Constants.VoiceConnectionStates.VOICE_CONNECTING);

  logger.info('createTransport', ssrc, userId, address, port);
  VoiceEngine.createTransport(ssrc, userId, address, port, _NativeUtils2.default.makeDeferred(function (err, transportInfo) {
    if (err != null && err !== '') {
      setConnectionState(_Constants.VoiceConnectionStates.NO_ROUTE);
      callback(err);
      return;
    }

    setConnectionState(_Constants.VoiceConnectionStates.VOICE_CONNECTED);
    if ((typeof transportInfo === 'undefined' ? 'undefined' : _typeof(transportInfo)) === 'object') {
      callback(null, transportInfo['protocol'], {
        address: transportInfo['address'],
        port: transportInfo['port'],
        mode: 'xsalsa20_poly1305'
      });
    } else {
      callback(null, transportInfo /* protocol */, _arguments[2] /* port */);
    }

    var transportOptions = getTransportOptions();
    logger.info('setTransportOptions', transportOptions);
    VoiceEngine.setTransportOptions(transportOptions);

    var users = getUserOptions();
    logger.info('mergeUsers', users);
    VoiceEngine.mergeUsers(users);
  }));

  hasTransport = true;
}

function destroyTransport() {
  logger.info('deleteTransport');
  VoiceEngine.destroyTransport();

  _NativeUtils2.default.setProcessPriority(_Constants.ProcessPriority.NORMAL);
  setConnectionState(_Constants.VoiceConnectionStates.VOICE_DISCONNECTED);

  hasTransport = false;
}

function noop() {}

var inputDetectionVersionGuard = (0, _VersionGuard2.default)({
  'stable': ['0.0.284', '0.0.234'],
  'canary': ['0.0.87', '0.0.73'],
  'ptb': ['0.0.1', '0.0.1']
});

exports.default = {
  supported: true,

  autoEnable: true,

  enable: noop,

  setInputMode: function setInputMode(mode, _ref5) {
    var shortcut = _ref5.shortcut;
    var threshold = _ref5.threshold;
    var autoThreshold = _ref5.autoThreshold;
    var delay = _ref5.delay;

    inputMode = mode;
    vadThreshold = threshold;
    vadAutoThreshold = autoThreshold;
    pttShortcut = shortcut;
    pttDelay = delay;
    VoiceEngine.setInputMode(_Constants2.NATIVE_MODE_VALUES[inputMode], createInputModeOptions());
  },
  setInputVolume: function setInputVolume(volume) {
    inputVolume = volume;
    VoiceEngine.setInputVolume(inputVolume / DEFAULT_VOLUME);
  },
  setOutputVolume: function setOutputVolume(volume) {
    outputVolume = volume;
    VoiceEngine.setOutputVolume(outputVolume / DEFAULT_VOLUME);
  },
  setVolumeChangeCallback: function setVolumeChangeCallback(callback) {
    if (VoiceEngine.setVolumeChangeCallback) {
      VoiceEngine.setVolumeChangeCallback(_NativeUtils2.default.makeDeferred(function (inVol01, outVol01) {
        callback(inVol01 * DEFAULT_VOLUME, outVol01 * DEFAULT_VOLUME);
      }));
    }
  },
  setSelfMute: function setSelfMute(mute) {
    selfMute = mute;
    if (hasTransport) {
      VoiceEngine.setSelfMute(selfMute);
    }
  },
  setSelfDeaf: function setSelfDeaf(deaf) {
    VoiceEngine.setSelfDeafen(deaf);
  },
  setLocalMute: function setLocalMute(userId, mute) {
    localMutes[userId] = mute;
    if (hasTransport) {
      VoiceEngine.setLocalMute(userId, mute);
    }
  },
  setLocalVolume: function setLocalVolume(userId, volume) {
    localVolumes[userId] = volume;
    if (hasTransport) {
      VoiceEngine.setLocalVolume(userId, getLocalVolume(userId));
    }
  },
  createUser: function createUser(userId, ssrc) {
    if (hasTransport && remoteSSRCs[userId] !== ssrc) {
      var user = {
        id: userId,
        ssrc: ssrc,
        mute: getLocalMute(userId),
        volume: getLocalVolume(userId)
      };
      logger.info('mergeUsers', [user]);
      VoiceEngine.mergeUsers([user]);
    }
    remoteSSRCs[userId] = ssrc;
  },
  destroyUser: function destroyUser(userId) {
    if (hasTransport) {
      logger.info('destroyUser', userId);
      VoiceEngine.destroyUser(userId);
    }
    delete remoteSSRCs[userId];
  },
  onSpeaking: function onSpeaking(callback) {
    _onSpeaking = callback;
  },
  onVoiceActivity: function onVoiceActivity(callback) {
    _onVoiceActivity = callback;
    VoiceEngine.setEmitVADLevel(callback != null);
  },
  onDevicesChanged: function onDevicesChanged(callback) {
    if (callback != null) {
      _onDevicesChanged = function _onDevicesChanged(inputDevices, outputDevices) {
        callback(sanitizeDevices(inputDevices), sanitizeDevices(outputDevices));
      };

      VoiceEngine.getInputDevices(_NativeUtils2.default.makeDeferred(function (inputDevices) {
        VoiceEngine.getOutputDevices(_NativeUtils2.default.makeDeferred(function (outputDevices) {
          _onDevicesChanged(inputDevices, outputDevices);
        }));
      }));
    } else {
      _onDevicesChanged = null;
    }
  },
  getInputDevices: function getInputDevices(callback) {
    VoiceEngine.getInputDevices(_NativeUtils2.default.makeDeferred(function (devices) {
      return callback(sanitizeDevices(devices));
    }));
  },
  getOutputDevices: function getOutputDevices(callback) {
    VoiceEngine.getOutputDevices(_NativeUtils2.default.makeDeferred(function (devices) {
      return callback(sanitizeDevices(devices));
    }));
  },
  setEncodingBitRate: function setEncodingBitRate(bitsPerSecond) {
    if (VoiceEngine.setEncodingBitRate) {
      VoiceEngine.setEncodingBitRate(bitsPerSecond);
    }
  },
  setEchoCancellation: function setEchoCancellation(enabled) {
    echoCancellation = enabled ? _Constants2.EchoCancellation.CONFERANCE : _Constants2.EchoCancellation.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({ echoCancellation: echoCancellation });
    }
  },
  setNoiseSuppression: function setNoiseSuppression(enabled) {
    noiseSuppression = enabled ? _Constants2.NoiseSuppression.HIGH_SUPPRESSION : _Constants2.NoiseSuppression.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({ noiseSuppression: noiseSuppression });
    }
  },
  setAutomaticGainControl: function setAutomaticGainControl(enabled) {
    automaticGainControl = enabled ? _Constants2.AutomaticGainControl.ADAPTIVE_ANALOG : _Constants2.AutomaticGainControl.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({ automaticGainControl: automaticGainControl });
    }
  },
  setAttenuation: function setAttenuation(attenuation) {
    attenuationFactor = (100 - attenuation) / 100;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({
        attenuation: isAttenuating(),
        attenuationFactor: attenuationFactor
      });
    }
  },
  isAttenuationEnabled: function isAttenuationEnabled() {
    return isAttenuating();
  },
  canSetAttenuation: function canSetAttenuation() {
    return _NativeUtils2.default.isWindows();
  },
  canSetVoiceProcessing: function canSetVoiceProcessing() {
    return true;
  },
  canSetInputDevice: function canSetInputDevice() {
    return true;
  },
  canSetOutputDevice: function canSetOutputDevice() {
    return true;
  },
  setInputDevice: function setInputDevice(id) {
    this.getInputDevices(function (inputDevices) {
      var inputDevice = inputDevices.filter(function (device) {
        return device.id === id;
      })[0] || inputDevices[0];
      inputDeviceIndex = inputDevice.index;
      VoiceEngine.setInputDevice(inputDeviceIndex);
    });
  },
  setOutputDevice: function setOutputDevice(id) {
    this.getOutputDevices(function (outputDevices) {
      var outputDevice = outputDevices.filter(function (device) {
        return device.id === id;
      })[0] || outputDevices[0];
      outputDeviceIndex = outputDevice.index;
      VoiceEngine.setOutputDevice(outputDeviceIndex);
    });
  },
  connect: function connect(ssrc, userId, address, port, callback) {
    return createTransport(ssrc, userId, address, port, callback);
  },
  disconnect: function disconnect() {
    destroyTransport();
  },


  handleSpeaking: noop,

  handleSessionDescription: function handleSessionDescription(desc) {
    encryptionSettings = {
      mode: desc['mode'],
      secretKey: desc['secret_key']
    };
    VoiceEngine.setTransportOptions({ encryptionSettings: encryptionSettings });
  },
  playSound: function playSound(name) {
    var volume = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

    if (VERSION_REQ_FULL_PATH_SOUNDS) {
      var _NativeUtils$require = _NativeUtils2.default.require('process', true);

      var resourcesPath = _NativeUtils$require.resourcesPath;

      VoiceEngine.playSound(_path2.default.join(_path2.default.join(resourcesPath, 'sounds'), name + '.wav'), volume);
    } else {
      VoiceEngine.playSound(name, volume);
    }
  },
  supportsAutomaticVAD: function supportsAutomaticVAD() {
    return VERSION_REQ_AUTOMATIC_VAD;
  },
  supportsMultiplePTT: function supportsMultiplePTT() {
    return VoiceEngine.setPTTActive != null;
  },
  supportsPTTReleaseDelay: function supportsPTTReleaseDelay() {
    return VERSION_REQ_PTT_RELEASE_DELAY;
  },
  setForceSend: function setForceSend(send) {
    VoiceEngine.setPTTActive && VoiceEngine.setPTTActive(send);
  },
  onConnectionState: function onConnectionState(callback) {
    _onConnectionState = callback;
  },


  getTransportOptions: getTransportOptions,
  getUserOptions: getUserOptions,

  debugDump: function debugDump(callback) {
    var data = {
      implementation: 'native',
      hasTransport: hasTransport,
      selfMute: selfMute,
      inputVolume: inputVolume,
      outputVolume: outputVolume,
      inputDeviceIndex: inputDeviceIndex,
      outputDeviceIndex: outputDeviceIndex,
      inputMode: inputMode,
      vadThreshold: vadThreshold
    };
    VoiceEngine.debugDump(_NativeUtils2.default.makeDeferred(function (_ref6) {
      var Native = _ref6.Native;

      data.native = Native;
      callback(data);
    }));
  },
  collectDiagnostics: function collectDiagnostics(callback) {
    if (VoiceEngine.collectDiagnostics) {
      VoiceEngine.collectDiagnostics(_NativeUtils2.default.makeDeferred(callback));
    } else {
      callback(null);
    }
  },


  diagnosticsEnabled: VoiceEngine.collectDiagnostics != null,

  setNoInputThreshold: inputDetectionVersionGuard(VoiceEngine.setNoInputThreshold),

  setNoInputCallback: inputDetectionVersionGuard(VoiceEngine.setNoInputCallback),

  // Not a fan of how this is imported, but doing it quick.
  runDiagnostics: require('./Diagnostics').runDiagnostics,
  getDiagnosticInfo: require('./Diagnostics').getDiagnosticInfo,
  Constants: require('./Constants'),
  supportsNativePing: VoiceEngine.setPingCallback != null,
  setPingCallback: VoiceEngine.setPingCallback ? function (callback) {
    if (callback == null) {
      // Set to noop, as native code doesn't support passing "null".
      VoiceEngine.setPingCallback(noop);
    } else {
      VoiceEngine.setPingCallback(_NativeUtils2.default.makeDeferred(callback));
    }
  } : noop
};

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/native/index.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS9uYXRpdmUvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBTSxjQUFjLHNCQUFZLGNBQVosRUFBZDs7QUFFTixJQUFNLFNBQVMsaUJBQU8sTUFBUCxDQUFjLGFBQWQsQ0FBVDs7O0FBR04sSUFBSSwrQkFBK0IsS0FBL0I7QUFDSixJQUFJLGdDQUFnQyxLQUFoQztBQUNKLElBQUksNEJBQTRCLEtBQTVCO0FBQ0osSUFBSSxzQkFBWSxTQUFaLE1BQTJCLHNCQUFZLEtBQVosRUFBM0IsRUFBZ0Q7QUFDbEQsaUNBQStCLHNCQUFZLHFCQUFaLENBQWtDO0FBQy9ELGNBQVUsQ0FBQyxTQUFELEVBQVksU0FBWixDQUFWO0FBQ0EsY0FBVSxDQUFDLFFBQUQsRUFBVyxRQUFYLENBQVY7QUFDQSxXQUFPLENBQUMsT0FBRCxFQUFVLE9BQVYsQ0FBUDtHQUg2QixDQUEvQixDQURrRDtBQU1sRCxrQ0FBZ0Msc0JBQVkscUJBQVosQ0FBa0M7QUFDaEUsY0FBVSxDQUFDLFNBQUQsRUFBWSxTQUFaLENBQVY7QUFDQSxjQUFVLENBQUMsUUFBRCxFQUFXLFFBQVgsQ0FBVjtBQUNBLFdBQU8sQ0FBQyxPQUFELEVBQVUsT0FBVixDQUFQO0dBSDhCLENBQWhDLENBTmtEO0FBV2xELDhCQUE0QixzQkFBWSxxQkFBWixDQUFrQztBQUM1RCxjQUFVLENBQUMsU0FBRCxFQUFZLFNBQVosQ0FBVjtBQUNBLGNBQVUsQ0FBQyxRQUFELEVBQVcsUUFBWCxDQUFWO0FBQ0EsV0FBTyxDQUFDLE9BQUQsRUFBVSxPQUFWLENBQVA7R0FIMEIsQ0FBNUIsQ0FYa0Q7Q0FBcEQ7O0FBa0JBLElBQU0saUJBQWlCLEdBQWpCOztBQUVOLElBQUksa0JBQWtCLGlDQUFzQixrQkFBdEI7QUFDdEIsSUFBSSxlQUFlLEtBQWY7QUFDSixJ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LFlBQVosQ0FBeUIsUUFBekIsQ0FBL0IsRUFEa0M7S0FBcEMsTUFHSztBQUNILGVBQVMsSUFBVCxFQURHO0tBSEw7R0FsUVc7OztBQTBRYixzQkFBb0IsWUFBWSxrQkFBWixJQUFrQyxJQUFsQzs7QUFFcEIsdUJBQXFCLDJCQUEyQixZQUFZLG1CQUFaLENBQWhEOztBQUVBLHNCQUFvQiwyQkFBMkIsWUFBWSxrQkFBWixDQUEvQzs7O0FBR0Esa0JBQWdCLFFBQVEsZUFBUixFQUF5QixjQUF6QjtBQUNoQixxQkFBbUIsUUFBUSxlQUFSLEVBQXlCLGlCQUF6QjtBQUNuQixhQUFXLFFBQVEsYUFBUixDQUFYO0FBQ0Esc0JBQW9CLFlBQVksZUFBWixJQUErQixJQUEvQjtBQUNwQixtQkFBaUIsWUFBWSxlQUFaLEdBQThCLFVBQUMsUUFBRCxFQUFjO0FBQzNELFFBQUksWUFBWSxJQUFaLEVBQWtCOztBQUVwQixrQkFBWSxlQUFaLENBQTRCLElBQTVCLEVBRm9CO0tBQXRCLE1BSUs7QUFDSCxrQkFBWSxlQUFaLENBQTRCLHNCQUFZLFlBQVosQ0FBeUIsUUFBekIsQ0FBNUIsRUFERztLQUpMO0dBRDZDLEdBUTNDLElBUmEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmF0aXZlVXRpbHMgZnJvbSAnLi4vLi4vLi4vdXRpbHMvTmF0aXZlVXRpbHMnO1xuaW1wb3J0IHZlcnNpb25HdWFyZCBmcm9tICcuLi8uLi9WZXJzaW9uR3VhcmQnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vLi4vaTE4bic7XG5pbXBvcnQgR2xvYmFsU2hvcnRjdXQgZnJvbSAnLi4vLi4vR2xvYmFsU2hvcnRjdXQnO1xuaW1wb3J0IHtJbnB1dE1vZGVzLCBWb2ljZUNvbm5lY3Rpb25TdGF0ZXMsIFByb2Nlc3NQcmlvcml0eX0gZnJvbSAnLi4vLi4vLi4vQ29uc3RhbnRzJztcbmltcG9ydCBMb2dnZXIgZnJvbSAnLi4vLi4vTG9nZ2VyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge1xuICBFY2hvQ2FuY2VsbGF0aW9uLFxuICBBRUNNb2JpbGUsXG4gIEF1dG9tYXRpY0dhaW5Db250cm9sLFxuICBOb2lzZVN1cHByZXNzaW9uLFxuICBWQURBZ2dyZXNzaXZlbmVzcyxcbiAgTkFUSVZFX01PREVfVkFMVUVTXG59IGZyb20gJy4vQ29uc3RhbnRzJztcblxuY29uc3QgVm9pY2VFbmdpbmUgPSBOYXRpdmVVdGlscy5nZXRWb2ljZUVuZ2luZSgpO1xuXG5jb25zdCBsb2dnZXIgPSBMb2dnZXIuY3JlYXRlKCdWb2ljZUVuZ2luZScpO1xuXG4vLyBjaXRyb24gbm90ZTogdGhpcyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSBWb2ljZUVuZ2luZSB2ZXJzaW9uXG5sZXQgVkVSU0lPTl9SRVFfRlVMTF9QQVRIX1NPVU5EUyA9IGZhbHNlO1xubGV0IFZFUlNJT05fUkVRX1BUVF9SRUxFQVNFX0RFTEFZID0gZmFsc2U7XG5sZXQgVkVSU0lPTl9SRVFfQVVUT01BVElDX1ZBRCA9IGZhbHNlO1xuaWYgKE5hdGl2ZVV0aWxzLmlzV2luZG93cygpIHx8IE5hdGl2ZVV0aWxzLmlzT1NYKCkpIHtcbiAgVkVSU0lPTl9SRVFfRlVMTF9QQVRIX1NPVU5EUyA9IE5hdGl2ZVV0aWxzLmlzVmVyc2lvbkVxdWFsT3JOZXdlcih7XG4gICAgJ3N0YWJsZSc6IFsnMC4wLjI3NScsICcwLjAuMjE4J10sXG4gICAgJ2NhbmFyeSc6IFsnMC4wLjQxJywgJzAuMC40NyddLFxuICAgICdwdGInOiBbJzAuMC4xJywgJzAuMC4xJ11cbiAgfSk7XG4gIFZFUlNJT05fUkVRX1BUVF9SRUxFQVNFX0RFTEFZID0gTmF0aXZlVXRpbHMuaXNWZXJzaW9uRXF1YWxPck5ld2VyKHtcbiAgICAnc3RhYmxlJzogWycwLjAuMjc4JywgJzAuMC4yMjknXSxcbiAgICAnY2FuYXJ5JzogWycwLjAuNjcnLCAnMC4wLjU4J10sXG4gICAgJ3B0Yic6IFsnMC4wLjEnLCAnMC4wLjEnXVxuICB9KTtcbiAgVkVSU0lPTl9SRVFfQVVUT01BVElDX1ZBRCA9IE5hdGl2ZVV0aWxzLmlzVmVyc2lvbkVxdWFsT3JOZXdlcih7XG4gICAgJ3N0YWJsZSc6IFsnMC4wLjIzOScsICcwLjAuMjMxJ10sXG4gICAgJ2NhbmFyeSc6IFsnMC4wLjczJywgJzAuMC42MiddLFxuICAgICdwdGInOiBbJzAuMC4xJywgJzAuMC4xJ11cbiAgfSk7XG59XG5cbmNvbnN0IERFRkFVTFRfVk9MVU1FID0gMTAwO1xuXG5sZXQgY29ubmVjdGlvblN0YXRlID0gVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRDtcbmxldCBoYXNUcmFuc3BvcnQgPSBmYWxzZTtcbmxldCBzZWxmTXV0ZSA9IGZhbHNlO1xubGV0IGlucHV0Vm9sdW1lID0gREVGQVVMVF9WT0xVTUU7XG5sZXQgb3V0cHV0Vm9sdW1lID0gREVGQVVMVF9WT0xVTUU7XG5sZXQgaW5wdXREZXZpY2VJbmRleCA9IDA7XG5sZXQgb3V0cHV0RGV2aWNlSW5kZXggPSAwO1xubGV0IGxvY2FsTXV0ZXMgPSB7fTtcbmxldCBsb2NhbFZvbHVtZXMgPSB7fTtcbmxldCByZW1vdGVTU1JDcyA9IHt9O1xubGV0IGVuY3J5cHRpb25TZXR0aW5ncyA9IG51bGw7XG5sZXQgb25TcGVha2luZyA9ICgpID0+IG51bGw7XG5sZXQgb25EZXZpY2VzQ2hhbmdlZCA9IG51bGw7XG5sZXQgb25Db25uZWN0aW9uU3RhdGUgPSBudWxsO1xubGV0IG9uVm9pY2VBY3Rpdml0eSA9IG51bGw7XG5sZXQgaW5wdXRNb2RlID0gSW5wdXRNb2Rlcy5WT0lDRV9BQ1RJVklUWTtcbmxldCB2YWRUaHJlc2hvbGQgPSAtNDA7XG5sZXQgdmFkQXV0b1RocmVzaG9sZCA9IHRydWU7XG5sZXQgcHR0U2hvcnRjdXQ7XG5sZXQgcHR0RGVsYXkgPSAwO1xubGV0IGVjaG9DYW5jZWxsYXRpb24gPSBFY2hvQ2FuY2VsbGF0aW9uLkNPTkZFUkFOQ0U7XG5sZXQgbm9pc2VTdXBwcmVzc2lvbiA9IE5vaXNlU3VwcHJlc3Npb24uSElHSF9TVVBQUkVTU0lPTjtcbmxldCBhdXRvbWF0aWNHYWluQ29udHJvbCA9IEF1dG9tYXRpY0dhaW5Db250cm9sLkFEQVBUSVZFX0FOQUxPRztcbmxldCBhdHRlbnVhdGlvbkZhY3RvciA9IDAuNTtcblxuLy8gc2V0T25TcGVha2luZ0NhbGxiYWNrXG5mdW5jdGlvbiBvblVzZXJTcGVha2luZyh1c2VySWQsIHNwZWFraW5nKSB7XG4gIG9uU3BlYWtpbmcodXNlcklkLCBzcGVha2luZyk7XG59XG5pZiAoVm9pY2VFbmdpbmUuc2V0T25TcGVha2luZ0NhbGxiYWNrKSB7XG4gIFZvaWNlRW5naW5lLnNldE9uU3BlYWtpbmdDYWxsYmFjayhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQob25Vc2VyU3BlYWtpbmcsIGZhbHNlKSk7XG59XG5lbHNlIHtcbiAgTmF0aXZlVXRpbHMub24oJ3VzZXItc3BlYWtpbmcnLCAoe2lzU3BlYWtpbmcsIHVzZXJJZH0pID0+IG9uVXNlclNwZWFraW5nKHVzZXJJZCwgaXNTcGVha2luZykpO1xufVxuXG4vLyBzZXRPblZvaWNlQ2FsbGJhY2tcbmxldCBsYXN0T25Wb2ljZTtcbmZ1bmN0aW9uIG9uVm9pY2UobGV2ZWwpIHtcbiAgaWYgKG9uVm9pY2VBY3Rpdml0eSAhPSBudWxsKSB7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobGFzdE9uVm9pY2UgPT0gbnVsbCB8fCBEYXRlLm5vdygpIC0gbGFzdE9uVm9pY2UgPiAyMCkge1xuICAgICAgbGFzdE9uVm9pY2UgPSBub3c7XG4gICAgICBvblZvaWNlQWN0aXZpdHkobGV2ZWwpO1xuICAgIH1cbiAgfVxufVxuaWYgKFZvaWNlRW5naW5lLnNldE9uVm9pY2VDYWxsYmFjaykge1xuICBWb2ljZUVuZ2luZS5zZXRPblZvaWNlQ2FsbGJhY2soTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKG9uVm9pY2UpKTtcbn1cbmVsc2Uge1xuICBOYXRpdmVVdGlscy5vbignb24tdm9pY2UnLCAoe2xldmVsfSkgPT4gb25Wb2ljZShsZXZlbCkpO1xufVxuXG4vLyBzZXREZXZpY2VDaGFuZ2VDYWxsYmFja1xuZnVuY3Rpb24gb25EZXZpY2VDaGFuZ2UoaW5wdXREZXZpY2VzLCBvdXRwdXREZXZpY2VzKSB7XG4gIG9uRGV2aWNlc0NoYW5nZWQgJiYgb25EZXZpY2VzQ2hhbmdlZChpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpO1xufVxuaWYgKFZvaWNlRW5naW5lLnNldERldmljZUNoYW5nZUNhbGxiYWNrKSB7XG4gIFZvaWNlRW5naW5lLnNldERldmljZUNoYW5nZUNhbGxiYWNrKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZChvbkRldmljZUNoYW5nZSkpO1xufVxuZWxzZSB7XG4gIE5hdGl2ZVV0aWxzLm9uKCdkZXZpY2UtY2hhbmdlZCcsICh7aW5wdXREZXZpY2VzLCBvdXRwdXREZXZpY2VzfSkgPT4gb25EZXZpY2VDaGFuZ2UoaW5wdXREZXZpY2VzLCBvdXRwdXREZXZpY2VzKSk7XG59XG5cblZvaWNlRW5naW5lLnNldEVtaXRWQURMZXZlbChmYWxzZSk7XG5cbmZ1bmN0aW9uIGdldExvY2FsVm9sdW1lKHVzZXJJZCkge1xuICBjb25zdCB2b2x1bWUgPSBsb2NhbFZvbHVtZXNbdXNlcklkXTtcbiAgcmV0dXJuICh2b2x1bWUgIT0gbnVsbCA/IHZvbHVtZSA6IERFRkFVTFRfVk9MVU1FKSAvIERFRkFVTFRfVk9MVU1FO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhbE11dGUodXNlcklkKSB7XG4gIHJldHVybiBsb2NhbE11dGVzW3VzZXJJZF0gfHwgZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUlucHV0TW9kZU9wdGlvbnMoKSB7XG4gIGlmIChpbnB1dE1vZGUgPT09IElucHV0TW9kZXMuVk9JQ0VfQUNUSVZJVFkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmFkVGhyZXNob2xkLFxuICAgICAgdmFkQXV0b1RocmVzaG9sZDogdmFkQXV0b1RocmVzaG9sZCA/IFZBREFnZ3Jlc3NpdmVuZXNzLlZFUllfQUdHUkVTU0lWRSA6IC0xLFxuICAgICAgdmFkTGVhZGluZzogNSxcbiAgICAgIHZhZFRyYWlsaW5nOiAyNVxuICAgIH07XG4gIH1cbiAgZWxzZSBpZiAoaW5wdXRNb2RlID09PSBJbnB1dE1vZGVzLlBVU0hfVE9fVEFMSykge1xuICAgIHJldHVybiB7XG4gICAgICBwdHRTY2FuQ29kZUNvbWJvczogcHR0U2hvcnRjdXQgfHwgW10sXG4gICAgICBwdHRSZWxlYXNlRGVsYXk6IHB0dERlbGF5XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7fTtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemVEZXZpY2VzKGRldmljZXMpIHtcbiAgZGV2aWNlcyA9IGRldmljZXMubWFwKCh7aW5kZXgsIGd1aWQsIG5hbWUsIG5hbWU6IG9yaWdpbmFsTmFtZX0pID0+IHtcbiAgICBpZiAoL15kZWZhdWx0Ly50ZXN0KG5hbWUpKSB7XG4gICAgICBndWlkID0gJ2RlZmF1bHQnO1xuICAgICAgbmFtZSA9IGkxOG4uTWVzc2FnZXMuREVGQVVMVDtcbiAgICB9XG4gICAgZ3VpZCA9IGd1aWQgfHwgbmFtZTtcbiAgICByZXR1cm4ge2lkOiBndWlkLCBpbmRleCwgbmFtZSwgb3JpZ2luYWxOYW1lfTtcbiAgfSk7XG4gIGlmIChOYXRpdmVVdGlscy5pc1dpbmRvd3MoKSkge1xuICAgIGRldmljZXMudW5zaGlmdCh7aWQ6ICdkZWZhdWx0JywgaW5kZXg6IC0xLCBuYW1lOiBpMThuLk1lc3NhZ2VzLkRFRkFVTFR9KTtcbiAgfVxuICByZXR1cm4gZGV2aWNlcztcbn1cblxuZnVuY3Rpb24gc2V0Q29ubmVjdGlvblN0YXRlKHN0YXRlKSB7XG4gIGNvbm5lY3Rpb25TdGF0ZSA9IHN0YXRlO1xuICBvbkNvbm5lY3Rpb25TdGF0ZSAmJiBvbkNvbm5lY3Rpb25TdGF0ZShzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGlzQXR0ZW51YXRpbmcoKSB7XG4gIHJldHVybiBhdHRlbnVhdGlvbkZhY3RvciA8IDE7XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zcG9ydE9wdGlvbnMoaW5jbHVkZUVuY3J5cHRpb25TZXR0aW5ncyA9IGZhbHNlKSB7XG4gIGNvbnN0IHRyYW5zcG9ydE9wdGlvbnMgPSB7XG4gICAgYnVpbHRJbkVjaG9DYW5jZWxsYXRpb246IHRydWUsXG4gICAgZWNob0NhbmNlbGxhdGlvbjogZWNob0NhbmNlbGxhdGlvbixcbiAgICBub2lzZVN1cHByZXNzaW9uOiBub2lzZVN1cHByZXNzaW9uLFxuICAgIGF1dG9tYXRpY0dhaW5Db250cm9sOiBhdXRvbWF0aWNHYWluQ29udHJvbCxcbiAgICBpbnB1dERldmljZTogaW5wdXREZXZpY2VJbmRleCxcbiAgICBvdXRwdXREZXZpY2U6IG91dHB1dERldmljZUluZGV4LFxuICAgIGlucHV0Vm9sdW1lOiBpbnB1dFZvbHVtZSAvIERFRkFVTFRfVk9MVU1FLFxuICAgIG91dHB1dFZvbHVtZTogb3V0cHV0Vm9sdW1lIC8gREVGQVVMVF9WT0xVTUUsXG4gICAgaW5wdXRNb2RlOiBOQVRJVkVfTU9ERV9WQUxVRVNbaW5wdXRNb2RlXSxcbiAgICBpbnB1dE1vZGVPcHRpb25zOiBjcmVhdGVJbnB1dE1vZGVPcHRpb25zKCksXG4gICAgc2VsZk11dGU6IHNlbGZNdXRlLFxuICAgIGF0dGVudWF0aW9uOiBpc0F0dGVudWF0aW5nKCksXG4gICAgYXR0ZW51YXRpb25GYWN0b3I6IGF0dGVudWF0aW9uRmFjdG9yLFxuICAgIGR1Y2tpbmc6IGZhbHNlXG4gIH07XG5cbiAgaWYgKGluY2x1ZGVFbmNyeXB0aW9uU2V0dGluZ3MpIHtcbiAgICB0cmFuc3BvcnRPcHRpb25zLmVuY3J5cHRpb25TZXR0aW5ncyA9IGVuY3J5cHRpb25TZXR0aW5ncztcbiAgfVxuXG4gIHJldHVybiB0cmFuc3BvcnRPcHRpb25zO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyT3B0aW9ucygpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbW90ZVNTUkNzKS5tYXAodXNlcklkID0+ICh7XG4gICAgaWQ6IHVzZXJJZCxcbiAgICBzc3JjOiByZW1vdGVTU1JDc1t1c2VySWRdLFxuICAgIG11dGU6IGdldExvY2FsTXV0ZSh1c2VySWQpLFxuICAgIHZvbHVtZTogZ2V0TG9jYWxWb2x1bWUodXNlcklkKVxuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zcG9ydChzc3JjLCB1c2VySWQsIGFkZHJlc3MsIHBvcnQsIGNhbGxiYWNrKSB7XG4gIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICBsb2dnZXIud2FybignVHJhbnNwb3J0IGFscmVhZHkgZXhpc3RzJyk7XG4gIH1cblxuICBOYXRpdmVVdGlscy5zZXRQcm9jZXNzUHJpb3JpdHkoUHJvY2Vzc1ByaW9yaXR5LkhJR0gpO1xuICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0NPTk5FQ1RJTkcpO1xuXG4gIGxvZ2dlci5pbmZvKCdjcmVhdGVUcmFuc3BvcnQnLCBzc3JjLCB1c2VySWQsIGFkZHJlc3MsIHBvcnQpO1xuICBWb2ljZUVuZ2luZS5jcmVhdGVUcmFuc3BvcnQoc3NyYywgdXNlcklkLCBhZGRyZXNzLCBwb3J0LCBOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoKGVyciwgdHJhbnNwb3J0SW5mbykgPT4ge1xuICAgIGlmIChlcnIgIT0gbnVsbCAmJiBlcnIgIT09ICcnKSB7XG4gICAgICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLk5PX1JPVVRFKTtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9DT05ORUNURUQpO1xuICAgIGlmICh0eXBlb2YgdHJhbnNwb3J0SW5mbyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHRyYW5zcG9ydEluZm9bJ3Byb3RvY29sJ10sIHtcbiAgICAgICAgYWRkcmVzczogdHJhbnNwb3J0SW5mb1snYWRkcmVzcyddLFxuICAgICAgICBwb3J0OiB0cmFuc3BvcnRJbmZvWydwb3J0J10sXG4gICAgICAgIG1vZGU6ICd4c2Fsc2EyMF9wb2x5MTMwNSdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHRyYW5zcG9ydEluZm8gLyogcHJvdG9jb2wgKi8sIGFyZ3VtZW50c1syXSAvKiBwb3J0ICovKTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc3BvcnRPcHRpb25zID0gZ2V0VHJhbnNwb3J0T3B0aW9ucygpO1xuICAgIGxvZ2dlci5pbmZvKCdzZXRUcmFuc3BvcnRPcHRpb25zJywgdHJhbnNwb3J0T3B0aW9ucyk7XG4gICAgVm9pY2VFbmdpbmUuc2V0VHJhbnNwb3J0T3B0aW9ucyh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIGNvbnN0IHVzZXJzID0gZ2V0VXNlck9wdGlvbnMoKTtcbiAgICBsb2dnZXIuaW5mbygnbWVyZ2VVc2VycycsIHVzZXJzKTtcbiAgICBWb2ljZUVuZ2luZS5tZXJnZVVzZXJzKHVzZXJzKTtcbiAgfSkpO1xuXG4gIGhhc1RyYW5zcG9ydCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUcmFuc3BvcnQoKSB7XG4gIGxvZ2dlci5pbmZvKCdkZWxldGVUcmFuc3BvcnQnKTtcbiAgVm9pY2VFbmdpbmUuZGVzdHJveVRyYW5zcG9ydCgpO1xuXG4gIE5hdGl2ZVV0aWxzLnNldFByb2Nlc3NQcmlvcml0eShQcm9jZXNzUHJpb3JpdHkuTk9STUFMKTtcbiAgc2V0Q29ubmVjdGlvblN0YXRlKFZvaWNlQ29ubmVjdGlvblN0YXRlcy5WT0lDRV9ESVNDT05ORUNURUQpO1xuXG4gIGhhc1RyYW5zcG9ydCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBub29wKCkge1xufVxuXG5jb25zdCBpbnB1dERldGVjdGlvblZlcnNpb25HdWFyZCA9IHZlcnNpb25HdWFyZCh7XG4gICdzdGFibGUnOiBbJzAuMC4yODQnLCAnMC4wLjIzNCddLFxuICAnY2FuYXJ5JzogWycwLjAuODcnLCAnMC4wLjczJ10sXG4gICdwdGInOiBbJzAuMC4xJywgJzAuMC4xJ11cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHN1cHBvcnRlZDogdHJ1ZSxcblxuICBhdXRvRW5hYmxlOiB0cnVlLFxuXG4gIGVuYWJsZTogbm9vcCxcblxuICBzZXRJbnB1dE1vZGUobW9kZSwge3Nob3J0Y3V0LCB0aHJlc2hvbGQsIGF1dG9UaHJlc2hvbGQsIGRlbGF5fSkge1xuICAgIGlucHV0TW9kZSA9IG1vZGU7XG4gICAgdmFkVGhyZXNob2xkID0gdGhyZXNob2xkO1xuICAgIHZhZEF1dG9UaHJlc2hvbGQgPSBhdXRvVGhyZXNob2xkO1xuICAgIHB0dFNob3J0Y3V0ID0gc2hvcnRjdXQ7XG4gICAgcHR0RGVsYXkgPSBkZWxheTtcbiAgICBWb2ljZUVuZ2luZS5zZXRJbnB1dE1vZGUoTkFUSVZFX01PREVfVkFMVUVTW2lucHV0TW9kZV0sIGNyZWF0ZUlucHV0TW9kZU9wdGlvbnMoKSk7XG4gIH0sXG5cbiAgc2V0SW5wdXRWb2x1bWUodm9sdW1lKSB7XG4gICAgaW5wdXRWb2x1bWUgPSB2b2x1bWU7XG4gICAgVm9pY2VFbmdpbmUuc2V0SW5wdXRWb2x1bWUoaW5wdXRWb2x1bWUgLyBERUZBVUxUX1ZPTFVNRSk7XG4gIH0sXG5cbiAgc2V0T3V0cHV0Vm9sdW1lKHZvbHVtZSkge1xuICAgIG91dHB1dFZvbHVtZSA9IHZvbHVtZTtcbiAgICBWb2ljZUVuZ2luZS5zZXRPdXRwdXRWb2x1bWUob3V0cHV0Vm9sdW1lIC8gREVGQVVMVF9WT0xVTUUpO1xuICB9LFxuXG4gIHNldFZvbHVtZUNoYW5nZUNhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgaWYgKFZvaWNlRW5naW5lLnNldFZvbHVtZUNoYW5nZUNhbGxiYWNrKSB7XG4gICAgICBWb2ljZUVuZ2luZS5zZXRWb2x1bWVDaGFuZ2VDYWxsYmFjayhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoKGluVm9sMDEsIG91dFZvbDAxKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGluVm9sMDEgKiBERUZBVUxUX1ZPTFVNRSwgb3V0Vm9sMDEgKiBERUZBVUxUX1ZPTFVNRSk7XG4gICAgICB9KSk7XG4gICAgfVxuICB9LFxuXG4gIHNldFNlbGZNdXRlKG11dGUpIHtcbiAgICBzZWxmTXV0ZSA9IG11dGU7XG4gICAgaWYgKGhhc1RyYW5zcG9ydCkge1xuICAgICAgVm9pY2VFbmdpbmUuc2V0U2VsZk11dGUoc2VsZk11dGUpO1xuICAgIH1cbiAgfSxcblxuICBzZXRTZWxmRGVhZihkZWFmKSB7XG4gICAgVm9pY2VFbmdpbmUuc2V0U2VsZkRlYWZlbihkZWFmKTtcbiAgfSxcblxuICBzZXRMb2NhbE11dGUodXNlcklkLCBtdXRlKSB7XG4gICAgbG9jYWxNdXRlc1t1c2VySWRdID0gbXV0ZTtcbiAgICBpZiAoaGFzVHJhbnNwb3J0KSB7XG4gICAgICBWb2ljZUVuZ2luZS5zZXRMb2NhbE11dGUodXNlcklkLCBtdXRlKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0TG9jYWxWb2x1bWUodXNlcklkLCB2b2x1bWUpIHtcbiAgICBsb2NhbFZvbHVtZXNbdXNlcklkXSA9IHZvbHVtZTtcbiAgICBpZiAoaGFzVHJhbnNwb3J0KSB7XG4gICAgICBWb2ljZUVuZ2luZS5zZXRMb2NhbFZvbHVtZSh1c2VySWQsIGdldExvY2FsVm9sdW1lKHVzZXJJZCkpO1xuICAgIH1cbiAgfSxcblxuICBjcmVhdGVVc2VyKHVzZXJJZCwgc3NyYykge1xuICAgIGlmIChoYXNUcmFuc3BvcnQgJiYgcmVtb3RlU1NSQ3NbdXNlcklkXSAhPT0gc3NyYykge1xuICAgICAgY29uc3QgdXNlciA9IHtcbiAgICAgICAgaWQ6IHVzZXJJZCxcbiAgICAgICAgc3NyYzogc3NyYyxcbiAgICAgICAgbXV0ZTogZ2V0TG9jYWxNdXRlKHVzZXJJZCksXG4gICAgICAgIHZvbHVtZTogZ2V0TG9jYWxWb2x1bWUodXNlcklkKVxuICAgICAgfTtcbiAgICAgIGxvZ2dlci5pbmZvKCdtZXJnZVVzZXJzJywgW3VzZXJdKTtcbiAgICAgIFZvaWNlRW5naW5lLm1lcmdlVXNlcnMoW3VzZXJdKTtcbiAgICB9XG4gICAgcmVtb3RlU1NSQ3NbdXNlcklkXSA9IHNzcmM7XG4gIH0sXG5cbiAgZGVzdHJveVVzZXIodXNlcklkKSB7XG4gICAgaWYgKGhhc1RyYW5zcG9ydCkge1xuICAgICAgbG9nZ2VyLmluZm8oJ2Rlc3Ryb3lVc2VyJywgdXNlcklkKTtcbiAgICAgIFZvaWNlRW5naW5lLmRlc3Ryb3lVc2VyKHVzZXJJZCk7XG4gICAgfVxuICAgIGRlbGV0ZSByZW1vdGVTU1JDc1t1c2VySWRdO1xuICB9LFxuXG4gIG9uU3BlYWtpbmcoY2FsbGJhY2spIHtcbiAgICBvblNwZWFraW5nID0gY2FsbGJhY2s7XG4gIH0sXG5cbiAgb25Wb2ljZUFjdGl2aXR5KGNhbGxiYWNrKSB7XG4gICAgb25Wb2ljZUFjdGl2aXR5ID0gY2FsbGJhY2s7XG4gICAgVm9pY2VFbmdpbmUuc2V0RW1pdFZBRExldmVsKGNhbGxiYWNrICE9IG51bGwpO1xuICB9LFxuXG4gIG9uRGV2aWNlc0NoYW5nZWQoY2FsbGJhY2spIHtcbiAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgb25EZXZpY2VzQ2hhbmdlZCA9IChpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpID0+IHtcbiAgICAgICAgY2FsbGJhY2soc2FuaXRpemVEZXZpY2VzKGlucHV0RGV2aWNlcyksIHNhbml0aXplRGV2aWNlcyhvdXRwdXREZXZpY2VzKSk7XG4gICAgICB9O1xuXG4gICAgICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKGlucHV0RGV2aWNlcyA9PiB7XG4gICAgICAgIFZvaWNlRW5naW5lLmdldE91dHB1dERldmljZXMoTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKG91dHB1dERldmljZXMgPT4ge1xuICAgICAgICAgIG9uRGV2aWNlc0NoYW5nZWQoaW5wdXREZXZpY2VzLCBvdXRwdXREZXZpY2VzKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG9uRGV2aWNlc0NoYW5nZWQgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICBnZXRJbnB1dERldmljZXMoY2FsbGJhY2spIHtcbiAgICBWb2ljZUVuZ2luZS5nZXRJbnB1dERldmljZXMoTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKGRldmljZXMgPT4gY2FsbGJhY2soc2FuaXRpemVEZXZpY2VzKGRldmljZXMpKSkpO1xuICB9LFxuXG4gIGdldE91dHB1dERldmljZXMoY2FsbGJhY2spIHtcbiAgICBWb2ljZUVuZ2luZS5nZXRPdXRwdXREZXZpY2VzKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZChkZXZpY2VzID0+IGNhbGxiYWNrKHNhbml0aXplRGV2aWNlcyhkZXZpY2VzKSkpKTtcbiAgfSxcblxuICBzZXRFbmNvZGluZ0JpdFJhdGUoYml0c1BlclNlY29uZCkge1xuICAgIGlmIChWb2ljZUVuZ2luZS5zZXRFbmNvZGluZ0JpdFJhdGUpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldEVuY29kaW5nQml0UmF0ZShiaXRzUGVyU2Vjb25kKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0RWNob0NhbmNlbGxhdGlvbihlbmFibGVkKSB7XG4gICAgZWNob0NhbmNlbGxhdGlvbiA9IGVuYWJsZWQgPyBFY2hvQ2FuY2VsbGF0aW9uLkNPTkZFUkFOQ0UgOiBFY2hvQ2FuY2VsbGF0aW9uLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2VjaG9DYW5jZWxsYXRpb259KTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0Tm9pc2VTdXBwcmVzc2lvbihlbmFibGVkKSB7XG4gICAgbm9pc2VTdXBwcmVzc2lvbiA9IGVuYWJsZWQgPyBOb2lzZVN1cHByZXNzaW9uLkhJR0hfU1VQUFJFU1NJT04gOiBOb2lzZVN1cHByZXNzaW9uLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe25vaXNlU3VwcHJlc3Npb259KTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0QXV0b21hdGljR2FpbkNvbnRyb2woZW5hYmxlZCkge1xuICAgIGF1dG9tYXRpY0dhaW5Db250cm9sID0gZW5hYmxlZCA/IEF1dG9tYXRpY0dhaW5Db250cm9sLkFEQVBUSVZFX0FOQUxPRyA6IEF1dG9tYXRpY0dhaW5Db250cm9sLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2F1dG9tYXRpY0dhaW5Db250cm9sfSk7XG4gICAgfVxuICB9LFxuXG4gIHNldEF0dGVudWF0aW9uKGF0dGVudWF0aW9uKSB7XG4gICAgYXR0ZW51YXRpb25GYWN0b3IgPSAoMTAwIC0gYXR0ZW51YXRpb24pIC8gMTAwO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe1xuICAgICAgICBhdHRlbnVhdGlvbjogaXNBdHRlbnVhdGluZygpLFxuICAgICAgICBhdHRlbnVhdGlvbkZhY3RvcjogYXR0ZW51YXRpb25GYWN0b3JcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBpc0F0dGVudWF0aW9uRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gaXNBdHRlbnVhdGluZygpO1xuICB9LFxuXG4gIGNhblNldEF0dGVudWF0aW9uKCkge1xuICAgIHJldHVybiBOYXRpdmVVdGlscy5pc1dpbmRvd3MoKTtcbiAgfSxcblxuICBjYW5TZXRWb2ljZVByb2Nlc3NpbmcoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgY2FuU2V0SW5wdXREZXZpY2UoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgY2FuU2V0T3V0cHV0RGV2aWNlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIHNldElucHV0RGV2aWNlKGlkKSB7XG4gICAgdGhpcy5nZXRJbnB1dERldmljZXMoaW5wdXREZXZpY2VzID0+IHtcbiAgICAgIGxldCBpbnB1dERldmljZSA9IGlucHV0RGV2aWNlcy5maWx0ZXIoZGV2aWNlID0+IGRldmljZS5pZCA9PT0gaWQpWzBdIHx8IGlucHV0RGV2aWNlc1swXTtcbiAgICAgIGlucHV0RGV2aWNlSW5kZXggPSBpbnB1dERldmljZS5pbmRleDtcbiAgICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGlucHV0RGV2aWNlSW5kZXgpO1xuICAgIH0pO1xuICB9LFxuXG4gIHNldE91dHB1dERldmljZShpZCkge1xuICAgIHRoaXMuZ2V0T3V0cHV0RGV2aWNlcyhvdXRwdXREZXZpY2VzID0+IHtcbiAgICAgIGxldCBvdXRwdXREZXZpY2UgPSBvdXRwdXREZXZpY2VzLmZpbHRlcihkZXZpY2UgPT4gZGV2aWNlLmlkID09PSBpZClbMF0gfHwgb3V0cHV0RGV2aWNlc1swXTtcbiAgICAgIG91dHB1dERldmljZUluZGV4ID0gb3V0cHV0RGV2aWNlLmluZGV4O1xuICAgICAgVm9pY2VFbmdpbmUuc2V0T3V0cHV0RGV2aWNlKG91dHB1dERldmljZUluZGV4KTtcbiAgICB9KTtcbiAgfSxcblxuICBjb25uZWN0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gY3JlYXRlVHJhbnNwb3J0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spO1xuICB9LFxuXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgZGVzdHJveVRyYW5zcG9ydCgpO1xuICB9LFxuXG4gIGhhbmRsZVNwZWFraW5nOiBub29wLFxuXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihkZXNjKSB7XG4gICAgZW5jcnlwdGlvblNldHRpbmdzID0ge1xuICAgICAgbW9kZTogZGVzY1snbW9kZSddLFxuICAgICAgc2VjcmV0S2V5OiBkZXNjWydzZWNyZXRfa2V5J11cbiAgICB9O1xuICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2VuY3J5cHRpb25TZXR0aW5nc30pO1xuICB9LFxuXG4gIHBsYXlTb3VuZChuYW1lLCB2b2x1bWUgPSAxKSB7XG4gICAgaWYgKFZFUlNJT05fUkVRX0ZVTExfUEFUSF9TT1VORFMpIHtcbiAgICAgIGNvbnN0IHtyZXNvdXJjZXNQYXRofSA9IE5hdGl2ZVV0aWxzLnJlcXVpcmUoJ3Byb2Nlc3MnLCB0cnVlKTtcbiAgICAgIFZvaWNlRW5naW5lLnBsYXlTb3VuZChwYXRoLmpvaW4ocGF0aC5qb2luKHJlc291cmNlc1BhdGgsICdzb3VuZHMnKSwgYCR7bmFtZX0ud2F2YCksIHZvbHVtZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgVm9pY2VFbmdpbmUucGxheVNvdW5kKG5hbWUsIHZvbHVtZSk7XG4gICAgfVxuICB9LFxuXG4gIHN1cHBvcnRzQXV0b21hdGljVkFEKCkge1xuICAgIHJldHVybiBWRVJTSU9OX1JFUV9BVVRPTUFUSUNfVkFEO1xuICB9LFxuXG4gIHN1cHBvcnRzTXVsdGlwbGVQVFQoKSB7XG4gICAgcmV0dXJuIFZvaWNlRW5naW5lLnNldFBUVEFjdGl2ZSAhPSBudWxsO1xuICB9LFxuXG4gIHN1cHBvcnRzUFRUUmVsZWFzZURlbGF5KCkge1xuICAgIHJldHVybiBWRVJTSU9OX1JFUV9QVFRfUkVMRUFTRV9ERUxBWTtcbiAgfSxcblxuICBzZXRGb3JjZVNlbmQoc2VuZCkge1xuICAgIFZvaWNlRW5naW5lLnNldFBUVEFjdGl2ZSAmJiBWb2ljZUVuZ2luZS5zZXRQVFRBY3RpdmUoc2VuZCk7XG4gIH0sXG5cbiAgb25Db25uZWN0aW9uU3RhdGUoY2FsbGJhY2spIHtcbiAgICBvbkNvbm5lY3Rpb25TdGF0ZSA9IGNhbGxiYWNrO1xuICB9LFxuXG4gIGdldFRyYW5zcG9ydE9wdGlvbnMsXG4gIGdldFVzZXJPcHRpb25zLFxuXG4gIGRlYnVnRHVtcChjYWxsYmFjaykge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaW1wbGVtZW50YXRpb246ICduYXRpdmUnLFxuICAgICAgaGFzVHJhbnNwb3J0LFxuICAgICAgc2VsZk11dGUsXG4gICAgICBpbnB1dFZvbHVtZSxcbiAgICAgIG91dHB1dFZvbHVtZSxcbiAgICAgIGlucHV0RGV2aWNlSW5kZXgsXG4gICAgICBvdXRwdXREZXZpY2VJbmRleCxcbiAgICAgIGlucHV0TW9kZSxcbiAgICAgIHZhZFRocmVzaG9sZFxuICAgIH07XG4gICAgVm9pY2VFbmdpbmUuZGVidWdEdW1wKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZCgoe05hdGl2ZX0pID0+IHtcbiAgICAgIGRhdGEubmF0aXZlID0gTmF0aXZlO1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSkpO1xuICB9LFxuXG4gIGNvbGxlY3REaWFnbm9zdGljcyhjYWxsYmFjaykge1xuICAgIGlmIChWb2ljZUVuZ2luZS5jb2xsZWN0RGlhZ25vc3RpY3MpIHtcbiAgICAgIFZvaWNlRW5naW5lLmNvbGxlY3REaWFnbm9zdGljcyhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoY2FsbGJhY2spKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlhZ25vc3RpY3NFbmFibGVkOiBWb2ljZUVuZ2luZS5jb2xsZWN0RGlhZ25vc3RpY3MgIT0gbnVsbCxcblxuICBzZXROb0lucHV0VGhyZXNob2xkOiBpbnB1dERldGVjdGlvblZlcnNpb25HdWFyZChWb2ljZUVuZ2luZS5zZXROb0lucHV0VGhyZXNob2xkKSxcblxuICBzZXROb0lucHV0Q2FsbGJhY2s6IGlucHV0RGV0ZWN0aW9uVmVyc2lvbkd1YXJkKFZvaWNlRW5naW5lLnNldE5vSW5wdXRDYWxsYmFjayksXG5cbiAgLy8gTm90IGEgZmFuIG9mIGhvdyB0aGlzIGlzIGltcG9ydGVkLCBidXQgZG9pbmcgaXQgcXVpY2suXG4gIHJ1bkRpYWdub3N0aWNzOiByZXF1aXJlKCcuL0RpYWdub3N0aWNzJykucnVuRGlhZ25vc3RpY3MsXG4gIGdldERpYWdub3N0aWNJbmZvOiByZXF1aXJlKCcuL0RpYWdub3N0aWNzJykuZ2V0RGlhZ25vc3RpY0luZm8sXG4gIENvbnN0YW50czogcmVxdWlyZSgnLi9Db25zdGFudHMnKSxcbiAgc3VwcG9ydHNOYXRpdmVQaW5nOiBWb2ljZUVuZ2luZS5zZXRQaW5nQ2FsbGJhY2sgIT0gbnVsbCxcbiAgc2V0UGluZ0NhbGxiYWNrOiBWb2ljZUVuZ2luZS5zZXRQaW5nQ2FsbGJhY2sgPyAoY2FsbGJhY2spID0+IHtcbiAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuICAgICAgLy8gU2V0IHRvIG5vb3AsIGFzIG5hdGl2ZSBjb2RlIGRvZXNuJ3Qgc3VwcG9ydCBwYXNzaW5nIFwibnVsbFwiLlxuICAgICAgVm9pY2VFbmdpbmUuc2V0UGluZ0NhbGxiYWNrKG5vb3ApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFBpbmdDYWxsYmFjayhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoY2FsbGJhY2spKTtcbiAgICB9XG4gIH0gOiBub29wXG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL25hdGl2ZS9pbmRleC5qc1xuICoqLyJdfQ==