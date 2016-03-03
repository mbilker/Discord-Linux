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
  setEncodingBitRate: function setEncodingBitRate(bitrate) {
    if (VoiceEngine.setEncodingBitRate) {
      VoiceEngine.setEncodingBitRate(bitrate);
    }
  },
  supportsEncodingBitRate: function supportsEncodingBitRate() {
    return VoiceEngine.setEncodingBitRate != null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS9uYXRpdmUvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBTSxjQUFjLHNCQUFZLGNBQVosRUFBZDs7QUFFTixJQUFNLFNBQVMsaUJBQU8sTUFBUCxDQUFjLGFBQWQsQ0FBVDs7O0FBR04sSUFBSSwrQkFBK0IsS0FBL0I7QUFDSixJQUFJLGdDQUFnQyxLQUFoQztBQUNKLElBQUksNEJBQTRCLEtBQTVCO0FBQ0osSUFBSSxzQkFBWSxTQUFaLE1BQTJCLHNCQUFZLEtBQVosRUFBM0IsRUFBZ0Q7QUFDbEQsaUNBQStCLHNCQUFZLHFCQUFaLENBQWtDO0FBQy9ELGNBQVUsQ0FBQyxTQUFELEVBQVksU0FBWixDQUFWO0FBQ0EsY0FBVSxDQUFDLFFBQUQsRUFBVyxRQUFYLENBQVY7QUFDQSxXQUFPLENBQUMsT0FBRCxFQUFVLE9BQVYsQ0FBUDtHQUg2QixDQUEvQixDQURrRDtBQU1sRCxrQ0FBZ0Msc0JBQVkscUJBQVosQ0FBa0M7QUFDaEUsY0FBVSxDQUFDLFNBQUQsRUFBWSxTQUFaLENBQVY7QUFDQSxjQUFVLENBQUMsUUFBRCxFQUFXLFFBQVgsQ0FBVjtBQUNBLFdBQU8sQ0FBQyxPQUFELEVBQVUsT0FBVixDQUFQO0dBSDhCLENBQWhDLENBTmtEO0FBV2xELDhCQUE0QixzQkFBWSxxQkFBWixDQUFrQztBQUM1RCxjQUFVLENBQUMsU0FBRCxFQUFZLFNBQVosQ0FBVjtBQUNBLGNBQVUsQ0FBQyxRQUFELEVBQVcsUUFBWCxDQUFWO0FBQ0EsV0FBTyxDQUFDLE9BQUQsRUFBVSxPQUFWLENBQVA7R0FIMEIsQ0FBNUIsQ0FYa0Q7Q0FBcEQ7O0FBa0JBLElBQU0saUJBQWlCLEdBQWpCOztBQUVOLElBQUksa0JBQWtCLGlDQUFzQixrQkFBdEI7QUFDdEIsSUFBSSxlQUFlLEtBQWY7QUFDSixJ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VTtBQUMzQixRQUFJLFlBQVksa0JBQVosRUFBZ0M7QUFDbEMsa0JBQVksa0JBQVosQ0FBK0Isc0JBQVksWUFBWixDQUF5QixRQUF6QixDQUEvQixFQURrQztLQUFwQyxNQUdLO0FBQ0gsZUFBUyxJQUFULEVBREc7S0FITDtHQXRRVzs7O0FBOFFiLHNCQUFvQixZQUFZLGtCQUFaLElBQWtDLElBQWxDOztBQUVwQix1QkFBcUIsMkJBQTJCLFlBQVksbUJBQVosQ0FBaEQ7O0FBRUEsc0JBQW9CLDJCQUEyQixZQUFZLGtCQUFaLENBQS9DOzs7QUFHQSxrQkFBZ0IsUUFBUSxlQUFSLEVBQXlCLGNBQXpCO0FBQ2hCLHFCQUFtQixRQUFRLGVBQVIsRUFBeUIsaUJBQXpCO0FBQ25CLGFBQVcsUUFBUSxhQUFSLENBQVg7QUFDQSxzQkFBb0IsWUFBWSxlQUFaLElBQStCLElBQS9CO0FBQ3BCLG1CQUFpQixZQUFZLGVBQVosR0FBOEIsVUFBQyxRQUFELEVBQWM7QUFDM0QsUUFBSSxZQUFZLElBQVosRUFBa0I7O0FBRXBCLGtCQUFZLGVBQVosQ0FBNEIsSUFBNUIsRUFGb0I7S0FBdEIsTUFJSztBQUNILGtCQUFZLGVBQVosQ0FBNEIsc0JBQVksWUFBWixDQUF5QixRQUF6QixDQUE1QixFQURHO0tBSkw7R0FENkMsR0FRM0MsSUFSYSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOYXRpdmVVdGlscyBmcm9tICcuLi8uLi8uLi91dGlscy9OYXRpdmVVdGlscyc7XG5pbXBvcnQgdmVyc2lvbkd1YXJkIGZyb20gJy4uLy4uL1ZlcnNpb25HdWFyZCc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi9pMThuJztcbmltcG9ydCBHbG9iYWxTaG9ydGN1dCBmcm9tICcuLi8uLi9HbG9iYWxTaG9ydGN1dCc7XG5pbXBvcnQge0lucHV0TW9kZXMsIFZvaWNlQ29ubmVjdGlvblN0YXRlcywgUHJvY2Vzc1ByaW9yaXR5fSBmcm9tICcuLi8uLi8uLi9Db25zdGFudHMnO1xuaW1wb3J0IExvZ2dlciBmcm9tICcuLi8uLi9Mb2dnZXInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7XG4gIEVjaG9DYW5jZWxsYXRpb24sXG4gIEFFQ01vYmlsZSxcbiAgQXV0b21hdGljR2FpbkNvbnRyb2wsXG4gIE5vaXNlU3VwcHJlc3Npb24sXG4gIFZBREFnZ3Jlc3NpdmVuZXNzLFxuICBOQVRJVkVfTU9ERV9WQUxVRVNcbn0gZnJvbSAnLi9Db25zdGFudHMnO1xuXG5jb25zdCBWb2ljZUVuZ2luZSA9IE5hdGl2ZVV0aWxzLmdldFZvaWNlRW5naW5lKCk7XG5cbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5jcmVhdGUoJ1ZvaWNlRW5naW5lJyk7XG5cbi8vIGNpdHJvbiBub3RlOiB0aGlzIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhIFZvaWNlRW5naW5lIHZlcnNpb25cbmxldCBWRVJTSU9OX1JFUV9GVUxMX1BBVEhfU09VTkRTID0gZmFsc2U7XG5sZXQgVkVSU0lPTl9SRVFfUFRUX1JFTEVBU0VfREVMQVkgPSBmYWxzZTtcbmxldCBWRVJTSU9OX1JFUV9BVVRPTUFUSUNfVkFEID0gZmFsc2U7XG5pZiAoTmF0aXZlVXRpbHMuaXNXaW5kb3dzKCkgfHwgTmF0aXZlVXRpbHMuaXNPU1goKSkge1xuICBWRVJTSU9OX1JFUV9GVUxMX1BBVEhfU09VTkRTID0gTmF0aXZlVXRpbHMuaXNWZXJzaW9uRXF1YWxPck5ld2VyKHtcbiAgICAnc3RhYmxlJzogWycwLjAuMjc1JywgJzAuMC4yMTgnXSxcbiAgICAnY2FuYXJ5JzogWycwLjAuNDEnLCAnMC4wLjQ3J10sXG4gICAgJ3B0Yic6IFsnMC4wLjEnLCAnMC4wLjEnXVxuICB9KTtcbiAgVkVSU0lPTl9SRVFfUFRUX1JFTEVBU0VfREVMQVkgPSBOYXRpdmVVdGlscy5pc1ZlcnNpb25FcXVhbE9yTmV3ZXIoe1xuICAgICdzdGFibGUnOiBbJzAuMC4yNzgnLCAnMC4wLjIyOSddLFxuICAgICdjYW5hcnknOiBbJzAuMC42NycsICcwLjAuNTgnXSxcbiAgICAncHRiJzogWycwLjAuMScsICcwLjAuMSddXG4gIH0pO1xuICBWRVJTSU9OX1JFUV9BVVRPTUFUSUNfVkFEID0gTmF0aXZlVXRpbHMuaXNWZXJzaW9uRXF1YWxPck5ld2VyKHtcbiAgICAnc3RhYmxlJzogWycwLjAuMjM5JywgJzAuMC4yMzEnXSxcbiAgICAnY2FuYXJ5JzogWycwLjAuNzMnLCAnMC4wLjYyJ10sXG4gICAgJ3B0Yic6IFsnMC4wLjEnLCAnMC4wLjEnXVxuICB9KTtcbn1cblxuY29uc3QgREVGQVVMVF9WT0xVTUUgPSAxMDA7XG5cbmxldCBjb25uZWN0aW9uU3RhdGUgPSBWb2ljZUNvbm5lY3Rpb25TdGF0ZXMuVk9JQ0VfRElTQ09OTkVDVEVEO1xubGV0IGhhc1RyYW5zcG9ydCA9IGZhbHNlO1xubGV0IHNlbGZNdXRlID0gZmFsc2U7XG5sZXQgaW5wdXRWb2x1bWUgPSBERUZBVUxUX1ZPTFVNRTtcbmxldCBvdXRwdXRWb2x1bWUgPSBERUZBVUxUX1ZPTFVNRTtcbmxldCBpbnB1dERldmljZUluZGV4ID0gMDtcbmxldCBvdXRwdXREZXZpY2VJbmRleCA9IDA7XG5sZXQgbG9jYWxNdXRlcyA9IHt9O1xubGV0IGxvY2FsVm9sdW1lcyA9IHt9O1xubGV0IHJlbW90ZVNTUkNzID0ge307XG5sZXQgZW5jcnlwdGlvblNldHRpbmdzID0gbnVsbDtcbmxldCBvblNwZWFraW5nID0gKCkgPT4gbnVsbDtcbmxldCBvbkRldmljZXNDaGFuZ2VkID0gbnVsbDtcbmxldCBvbkNvbm5lY3Rpb25TdGF0ZSA9IG51bGw7XG5sZXQgb25Wb2ljZUFjdGl2aXR5ID0gbnVsbDtcbmxldCBpbnB1dE1vZGUgPSBJbnB1dE1vZGVzLlZPSUNFX0FDVElWSVRZO1xubGV0IHZhZFRocmVzaG9sZCA9IC00MDtcbmxldCB2YWRBdXRvVGhyZXNob2xkID0gdHJ1ZTtcbmxldCBwdHRTaG9ydGN1dDtcbmxldCBwdHREZWxheSA9IDA7XG5sZXQgZWNob0NhbmNlbGxhdGlvbiA9IEVjaG9DYW5jZWxsYXRpb24uQ09ORkVSQU5DRTtcbmxldCBub2lzZVN1cHByZXNzaW9uID0gTm9pc2VTdXBwcmVzc2lvbi5ISUdIX1NVUFBSRVNTSU9OO1xubGV0IGF1dG9tYXRpY0dhaW5Db250cm9sID0gQXV0b21hdGljR2FpbkNvbnRyb2wuQURBUFRJVkVfQU5BTE9HO1xubGV0IGF0dGVudWF0aW9uRmFjdG9yID0gMC41O1xuXG4vLyBzZXRPblNwZWFraW5nQ2FsbGJhY2tcbmZ1bmN0aW9uIG9uVXNlclNwZWFraW5nKHVzZXJJZCwgc3BlYWtpbmcpIHtcbiAgb25TcGVha2luZyh1c2VySWQsIHNwZWFraW5nKTtcbn1cbmlmIChWb2ljZUVuZ2luZS5zZXRPblNwZWFraW5nQ2FsbGJhY2spIHtcbiAgVm9pY2VFbmdpbmUuc2V0T25TcGVha2luZ0NhbGxiYWNrKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZChvblVzZXJTcGVha2luZywgZmFsc2UpKTtcbn1cbmVsc2Uge1xuICBOYXRpdmVVdGlscy5vbigndXNlci1zcGVha2luZycsICh7aXNTcGVha2luZywgdXNlcklkfSkgPT4gb25Vc2VyU3BlYWtpbmcodXNlcklkLCBpc1NwZWFraW5nKSk7XG59XG5cbi8vIHNldE9uVm9pY2VDYWxsYmFja1xubGV0IGxhc3RPblZvaWNlO1xuZnVuY3Rpb24gb25Wb2ljZShsZXZlbCkge1xuICBpZiAob25Wb2ljZUFjdGl2aXR5ICE9IG51bGwpIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChsYXN0T25Wb2ljZSA9PSBudWxsIHx8IERhdGUubm93KCkgLSBsYXN0T25Wb2ljZSA+IDIwKSB7XG4gICAgICBsYXN0T25Wb2ljZSA9IG5vdztcbiAgICAgIG9uVm9pY2VBY3Rpdml0eShsZXZlbCk7XG4gICAgfVxuICB9XG59XG5pZiAoVm9pY2VFbmdpbmUuc2V0T25Wb2ljZUNhbGxiYWNrKSB7XG4gIFZvaWNlRW5naW5lLnNldE9uVm9pY2VDYWxsYmFjayhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQob25Wb2ljZSkpO1xufVxuZWxzZSB7XG4gIE5hdGl2ZVV0aWxzLm9uKCdvbi12b2ljZScsICh7bGV2ZWx9KSA9PiBvblZvaWNlKGxldmVsKSk7XG59XG5cbi8vIHNldERldmljZUNoYW5nZUNhbGxiYWNrXG5mdW5jdGlvbiBvbkRldmljZUNoYW5nZShpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpIHtcbiAgb25EZXZpY2VzQ2hhbmdlZCAmJiBvbkRldmljZXNDaGFuZ2VkKGlucHV0RGV2aWNlcywgb3V0cHV0RGV2aWNlcyk7XG59XG5pZiAoVm9pY2VFbmdpbmUuc2V0RGV2aWNlQ2hhbmdlQ2FsbGJhY2spIHtcbiAgVm9pY2VFbmdpbmUuc2V0RGV2aWNlQ2hhbmdlQ2FsbGJhY2soTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKG9uRGV2aWNlQ2hhbmdlKSk7XG59XG5lbHNlIHtcbiAgTmF0aXZlVXRpbHMub24oJ2RldmljZS1jaGFuZ2VkJywgKHtpbnB1dERldmljZXMsIG91dHB1dERldmljZXN9KSA9PiBvbkRldmljZUNoYW5nZShpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpKTtcbn1cblxuVm9pY2VFbmdpbmUuc2V0RW1pdFZBRExldmVsKGZhbHNlKTtcblxuZnVuY3Rpb24gZ2V0TG9jYWxWb2x1bWUodXNlcklkKSB7XG4gIGNvbnN0IHZvbHVtZSA9IGxvY2FsVm9sdW1lc1t1c2VySWRdO1xuICByZXR1cm4gKHZvbHVtZSAhPSBudWxsID8gdm9sdW1lIDogREVGQVVMVF9WT0xVTUUpIC8gREVGQVVMVF9WT0xVTUU7XG59XG5cbmZ1bmN0aW9uIGdldExvY2FsTXV0ZSh1c2VySWQpIHtcbiAgcmV0dXJuIGxvY2FsTXV0ZXNbdXNlcklkXSB8fCBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5wdXRNb2RlT3B0aW9ucygpIHtcbiAgaWYgKGlucHV0TW9kZSA9PT0gSW5wdXRNb2Rlcy5WT0lDRV9BQ1RJVklUWSkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWRUaHJlc2hvbGQsXG4gICAgICB2YWRBdXRvVGhyZXNob2xkOiB2YWRBdXRvVGhyZXNob2xkID8gVkFEQWdncmVzc2l2ZW5lc3MuVkVSWV9BR0dSRVNTSVZFIDogLTEsXG4gICAgICB2YWRMZWFkaW5nOiA1LFxuICAgICAgdmFkVHJhaWxpbmc6IDI1XG4gICAgfTtcbiAgfVxuICBlbHNlIGlmIChpbnB1dE1vZGUgPT09IElucHV0TW9kZXMuUFVTSF9UT19UQUxLKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHB0dFNjYW5Db2RlQ29tYm9zOiBwdHRTaG9ydGN1dCB8fCBbXSxcbiAgICAgIHB0dFJlbGVhc2VEZWxheTogcHR0RGVsYXlcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHt9O1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZURldmljZXMoZGV2aWNlcykge1xuICBkZXZpY2VzID0gZGV2aWNlcy5tYXAoKHtpbmRleCwgZ3VpZCwgbmFtZSwgbmFtZTogb3JpZ2luYWxOYW1lfSkgPT4ge1xuICAgIGlmICgvXmRlZmF1bHQvLnRlc3QobmFtZSkpIHtcbiAgICAgIGd1aWQgPSAnZGVmYXVsdCc7XG4gICAgICBuYW1lID0gaTE4bi5NZXNzYWdlcy5ERUZBVUxUO1xuICAgIH1cbiAgICBndWlkID0gZ3VpZCB8fCBuYW1lO1xuICAgIHJldHVybiB7aWQ6IGd1aWQsIGluZGV4LCBuYW1lLCBvcmlnaW5hbE5hbWV9O1xuICB9KTtcbiAgaWYgKE5hdGl2ZVV0aWxzLmlzV2luZG93cygpKSB7XG4gICAgZGV2aWNlcy51bnNoaWZ0KHtpZDogJ2RlZmF1bHQnLCBpbmRleDogLTEsIG5hbWU6IGkxOG4uTWVzc2FnZXMuREVGQVVMVH0pO1xuICB9XG4gIHJldHVybiBkZXZpY2VzO1xufVxuXG5mdW5jdGlvbiBzZXRDb25uZWN0aW9uU3RhdGUoc3RhdGUpIHtcbiAgY29ubmVjdGlvblN0YXRlID0gc3RhdGU7XG4gIG9uQ29ubmVjdGlvblN0YXRlICYmIG9uQ29ubmVjdGlvblN0YXRlKHN0YXRlKTtcbn1cblxuZnVuY3Rpb24gaXNBdHRlbnVhdGluZygpIHtcbiAgcmV0dXJuIGF0dGVudWF0aW9uRmFjdG9yIDwgMTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNwb3J0T3B0aW9ucyhpbmNsdWRlRW5jcnlwdGlvblNldHRpbmdzID0gZmFsc2UpIHtcbiAgY29uc3QgdHJhbnNwb3J0T3B0aW9ucyA9IHtcbiAgICBidWlsdEluRWNob0NhbmNlbGxhdGlvbjogdHJ1ZSxcbiAgICBlY2hvQ2FuY2VsbGF0aW9uOiBlY2hvQ2FuY2VsbGF0aW9uLFxuICAgIG5vaXNlU3VwcHJlc3Npb246IG5vaXNlU3VwcHJlc3Npb24sXG4gICAgYXV0b21hdGljR2FpbkNvbnRyb2w6IGF1dG9tYXRpY0dhaW5Db250cm9sLFxuICAgIGlucHV0RGV2aWNlOiBpbnB1dERldmljZUluZGV4LFxuICAgIG91dHB1dERldmljZTogb3V0cHV0RGV2aWNlSW5kZXgsXG4gICAgaW5wdXRWb2x1bWU6IGlucHV0Vm9sdW1lIC8gREVGQVVMVF9WT0xVTUUsXG4gICAgb3V0cHV0Vm9sdW1lOiBvdXRwdXRWb2x1bWUgLyBERUZBVUxUX1ZPTFVNRSxcbiAgICBpbnB1dE1vZGU6IE5BVElWRV9NT0RFX1ZBTFVFU1tpbnB1dE1vZGVdLFxuICAgIGlucHV0TW9kZU9wdGlvbnM6IGNyZWF0ZUlucHV0TW9kZU9wdGlvbnMoKSxcbiAgICBzZWxmTXV0ZTogc2VsZk11dGUsXG4gICAgYXR0ZW51YXRpb246IGlzQXR0ZW51YXRpbmcoKSxcbiAgICBhdHRlbnVhdGlvbkZhY3RvcjogYXR0ZW51YXRpb25GYWN0b3IsXG4gICAgZHVja2luZzogZmFsc2VcbiAgfTtcblxuICBpZiAoaW5jbHVkZUVuY3J5cHRpb25TZXR0aW5ncykge1xuICAgIHRyYW5zcG9ydE9wdGlvbnMuZW5jcnlwdGlvblNldHRpbmdzID0gZW5jcnlwdGlvblNldHRpbmdzO1xuICB9XG5cbiAgcmV0dXJuIHRyYW5zcG9ydE9wdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGdldFVzZXJPcHRpb25zKCkge1xuICByZXR1cm4gT2JqZWN0LmtleXMocmVtb3RlU1NSQ3MpLm1hcCh1c2VySWQgPT4gKHtcbiAgICBpZDogdXNlcklkLFxuICAgIHNzcmM6IHJlbW90ZVNTUkNzW3VzZXJJZF0sXG4gICAgbXV0ZTogZ2V0TG9jYWxNdXRlKHVzZXJJZCksXG4gICAgdm9sdW1lOiBnZXRMb2NhbFZvbHVtZSh1c2VySWQpXG4gIH0pKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVHJhbnNwb3J0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spIHtcbiAgaWYgKGhhc1RyYW5zcG9ydCkge1xuICAgIGxvZ2dlci53YXJuKCdUcmFuc3BvcnQgYWxyZWFkeSBleGlzdHMnKTtcbiAgfVxuXG4gIE5hdGl2ZVV0aWxzLnNldFByb2Nlc3NQcmlvcml0eShQcm9jZXNzUHJpb3JpdHkuSElHSCk7XG4gIHNldENvbm5lY3Rpb25TdGF0ZShWb2ljZUNvbm5lY3Rpb25TdGF0ZXMuVk9JQ0VfQ09OTkVDVElORyk7XG5cbiAgbG9nZ2VyLmluZm8oJ2NyZWF0ZVRyYW5zcG9ydCcsIHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCk7XG4gIFZvaWNlRW5naW5lLmNyZWF0ZVRyYW5zcG9ydChzc3JjLCB1c2VySWQsIGFkZHJlc3MsIHBvcnQsIE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZCgoZXJyLCB0cmFuc3BvcnRJbmZvKSA9PiB7XG4gICAgaWYgKGVyciAhPSBudWxsICYmIGVyciAhPT0gJycpIHtcbiAgICAgIHNldENvbm5lY3Rpb25TdGF0ZShWb2ljZUNvbm5lY3Rpb25TdGF0ZXMuTk9fUk9VVEUpO1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0NPTk5FQ1RFRCk7XG4gICAgaWYgKHR5cGVvZiB0cmFuc3BvcnRJbmZvID09PSAnb2JqZWN0Jykge1xuICAgICAgY2FsbGJhY2sobnVsbCwgdHJhbnNwb3J0SW5mb1sncHJvdG9jb2wnXSwge1xuICAgICAgICBhZGRyZXNzOiB0cmFuc3BvcnRJbmZvWydhZGRyZXNzJ10sXG4gICAgICAgIHBvcnQ6IHRyYW5zcG9ydEluZm9bJ3BvcnQnXSxcbiAgICAgICAgbW9kZTogJ3hzYWxzYTIwX3BvbHkxMzA1J1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY2FsbGJhY2sobnVsbCwgdHJhbnNwb3J0SW5mbyAvKiBwcm90b2NvbCAqLywgYXJndW1lbnRzWzJdIC8qIHBvcnQgKi8pO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zcG9ydE9wdGlvbnMgPSBnZXRUcmFuc3BvcnRPcHRpb25zKCk7XG4gICAgbG9nZ2VyLmluZm8oJ3NldFRyYW5zcG9ydE9wdGlvbnMnLCB0cmFuc3BvcnRPcHRpb25zKTtcbiAgICBWb2ljZUVuZ2luZS5zZXRUcmFuc3BvcnRPcHRpb25zKHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgY29uc3QgdXNlcnMgPSBnZXRVc2VyT3B0aW9ucygpO1xuICAgIGxvZ2dlci5pbmZvKCdtZXJnZVVzZXJzJywgdXNlcnMpO1xuICAgIFZvaWNlRW5naW5lLm1lcmdlVXNlcnModXNlcnMpO1xuICB9KSk7XG5cbiAgaGFzVHJhbnNwb3J0ID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveVRyYW5zcG9ydCgpIHtcbiAgbG9nZ2VyLmluZm8oJ2RlbGV0ZVRyYW5zcG9ydCcpO1xuICBWb2ljZUVuZ2luZS5kZXN0cm95VHJhbnNwb3J0KCk7XG5cbiAgTmF0aXZlVXRpbHMuc2V0UHJvY2Vzc1ByaW9yaXR5KFByb2Nlc3NQcmlvcml0eS5OT1JNQUwpO1xuICBzZXRDb25uZWN0aW9uU3RhdGUoVm9pY2VDb25uZWN0aW9uU3RhdGVzLlZPSUNFX0RJU0NPTk5FQ1RFRCk7XG5cbiAgaGFzVHJhbnNwb3J0ID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7XG59XG5cbmNvbnN0IGlucHV0RGV0ZWN0aW9uVmVyc2lvbkd1YXJkID0gdmVyc2lvbkd1YXJkKHtcbiAgJ3N0YWJsZSc6IFsnMC4wLjI4NCcsICcwLjAuMjM0J10sXG4gICdjYW5hcnknOiBbJzAuMC44NycsICcwLjAuNzMnXSxcbiAgJ3B0Yic6IFsnMC4wLjEnLCAnMC4wLjEnXVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3VwcG9ydGVkOiB0cnVlLFxuXG4gIGF1dG9FbmFibGU6IHRydWUsXG5cbiAgZW5hYmxlOiBub29wLFxuXG4gIHNldElucHV0TW9kZShtb2RlLCB7c2hvcnRjdXQsIHRocmVzaG9sZCwgYXV0b1RocmVzaG9sZCwgZGVsYXl9KSB7XG4gICAgaW5wdXRNb2RlID0gbW9kZTtcbiAgICB2YWRUaHJlc2hvbGQgPSB0aHJlc2hvbGQ7XG4gICAgdmFkQXV0b1RocmVzaG9sZCA9IGF1dG9UaHJlc2hvbGQ7XG4gICAgcHR0U2hvcnRjdXQgPSBzaG9ydGN1dDtcbiAgICBwdHREZWxheSA9IGRlbGF5O1xuICAgIFZvaWNlRW5naW5lLnNldElucHV0TW9kZShOQVRJVkVfTU9ERV9WQUxVRVNbaW5wdXRNb2RlXSwgY3JlYXRlSW5wdXRNb2RlT3B0aW9ucygpKTtcbiAgfSxcblxuICBzZXRJbnB1dFZvbHVtZSh2b2x1bWUpIHtcbiAgICBpbnB1dFZvbHVtZSA9IHZvbHVtZTtcbiAgICBWb2ljZUVuZ2luZS5zZXRJbnB1dFZvbHVtZShpbnB1dFZvbHVtZSAvIERFRkFVTFRfVk9MVU1FKTtcbiAgfSxcblxuICBzZXRPdXRwdXRWb2x1bWUodm9sdW1lKSB7XG4gICAgb3V0cHV0Vm9sdW1lID0gdm9sdW1lO1xuICAgIFZvaWNlRW5naW5lLnNldE91dHB1dFZvbHVtZShvdXRwdXRWb2x1bWUgLyBERUZBVUxUX1ZPTFVNRSk7XG4gIH0sXG5cbiAgc2V0Vm9sdW1lQ2hhbmdlQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICBpZiAoVm9pY2VFbmdpbmUuc2V0Vm9sdW1lQ2hhbmdlQ2FsbGJhY2spIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFZvbHVtZUNoYW5nZUNhbGxiYWNrKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZCgoaW5Wb2wwMSwgb3V0Vm9sMDEpID0+IHtcbiAgICAgICAgY2FsbGJhY2soaW5Wb2wwMSAqIERFRkFVTFRfVk9MVU1FLCBvdXRWb2wwMSAqIERFRkFVTFRfVk9MVU1FKTtcbiAgICAgIH0pKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0U2VsZk11dGUobXV0ZSkge1xuICAgIHNlbGZNdXRlID0gbXV0ZTtcbiAgICBpZiAoaGFzVHJhbnNwb3J0KSB7XG4gICAgICBWb2ljZUVuZ2luZS5zZXRTZWxmTXV0ZShzZWxmTXV0ZSk7XG4gICAgfVxuICB9LFxuXG4gIHNldFNlbGZEZWFmKGRlYWYpIHtcbiAgICBWb2ljZUVuZ2luZS5zZXRTZWxmRGVhZmVuKGRlYWYpO1xuICB9LFxuXG4gIHNldExvY2FsTXV0ZSh1c2VySWQsIG11dGUpIHtcbiAgICBsb2NhbE11dGVzW3VzZXJJZF0gPSBtdXRlO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldExvY2FsTXV0ZSh1c2VySWQsIG11dGUpO1xuICAgIH1cbiAgfSxcblxuICBzZXRMb2NhbFZvbHVtZSh1c2VySWQsIHZvbHVtZSkge1xuICAgIGxvY2FsVm9sdW1lc1t1c2VySWRdID0gdm9sdW1lO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldExvY2FsVm9sdW1lKHVzZXJJZCwgZ2V0TG9jYWxWb2x1bWUodXNlcklkKSk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZVVzZXIodXNlcklkLCBzc3JjKSB7XG4gICAgaWYgKGhhc1RyYW5zcG9ydCAmJiByZW1vdGVTU1JDc1t1c2VySWRdICE9PSBzc3JjKSB7XG4gICAgICBjb25zdCB1c2VyID0ge1xuICAgICAgICBpZDogdXNlcklkLFxuICAgICAgICBzc3JjOiBzc3JjLFxuICAgICAgICBtdXRlOiBnZXRMb2NhbE11dGUodXNlcklkKSxcbiAgICAgICAgdm9sdW1lOiBnZXRMb2NhbFZvbHVtZSh1c2VySWQpXG4gICAgICB9O1xuICAgICAgbG9nZ2VyLmluZm8oJ21lcmdlVXNlcnMnLCBbdXNlcl0pO1xuICAgICAgVm9pY2VFbmdpbmUubWVyZ2VVc2VycyhbdXNlcl0pO1xuICAgIH1cbiAgICByZW1vdGVTU1JDc1t1c2VySWRdID0gc3NyYztcbiAgfSxcblxuICBkZXN0cm95VXNlcih1c2VySWQpIHtcbiAgICBpZiAoaGFzVHJhbnNwb3J0KSB7XG4gICAgICBsb2dnZXIuaW5mbygnZGVzdHJveVVzZXInLCB1c2VySWQpO1xuICAgICAgVm9pY2VFbmdpbmUuZGVzdHJveVVzZXIodXNlcklkKTtcbiAgICB9XG4gICAgZGVsZXRlIHJlbW90ZVNTUkNzW3VzZXJJZF07XG4gIH0sXG5cbiAgb25TcGVha2luZyhjYWxsYmFjaykge1xuICAgIG9uU3BlYWtpbmcgPSBjYWxsYmFjaztcbiAgfSxcblxuICBvblZvaWNlQWN0aXZpdHkoY2FsbGJhY2spIHtcbiAgICBvblZvaWNlQWN0aXZpdHkgPSBjYWxsYmFjaztcbiAgICBWb2ljZUVuZ2luZS5zZXRFbWl0VkFETGV2ZWwoY2FsbGJhY2sgIT0gbnVsbCk7XG4gIH0sXG5cbiAgb25EZXZpY2VzQ2hhbmdlZChjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICBvbkRldmljZXNDaGFuZ2VkID0gKGlucHV0RGV2aWNlcywgb3V0cHV0RGV2aWNlcykgPT4ge1xuICAgICAgICBjYWxsYmFjayhzYW5pdGl6ZURldmljZXMoaW5wdXREZXZpY2VzKSwgc2FuaXRpemVEZXZpY2VzKG91dHB1dERldmljZXMpKTtcbiAgICAgIH07XG5cbiAgICAgIFZvaWNlRW5naW5lLmdldElucHV0RGV2aWNlcyhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoaW5wdXREZXZpY2VzID0+IHtcbiAgICAgICAgVm9pY2VFbmdpbmUuZ2V0T3V0cHV0RGV2aWNlcyhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQob3V0cHV0RGV2aWNlcyA9PiB7XG4gICAgICAgICAgb25EZXZpY2VzQ2hhbmdlZChpbnB1dERldmljZXMsIG91dHB1dERldmljZXMpO1xuICAgICAgICB9KSk7XG4gICAgICB9KSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgb25EZXZpY2VzQ2hhbmdlZCA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIGdldElucHV0RGV2aWNlcyhjYWxsYmFjaykge1xuICAgIFZvaWNlRW5naW5lLmdldElucHV0RGV2aWNlcyhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoZGV2aWNlcyA9PiBjYWxsYmFjayhzYW5pdGl6ZURldmljZXMoZGV2aWNlcykpKSk7XG4gIH0sXG5cbiAgZ2V0T3V0cHV0RGV2aWNlcyhjYWxsYmFjaykge1xuICAgIFZvaWNlRW5naW5lLmdldE91dHB1dERldmljZXMoTmF0aXZlVXRpbHMubWFrZURlZmVycmVkKGRldmljZXMgPT4gY2FsbGJhY2soc2FuaXRpemVEZXZpY2VzKGRldmljZXMpKSkpO1xuICB9LFxuXG4gIHNldEVuY29kaW5nQml0UmF0ZShiaXRyYXRlKSB7XG4gICAgaWYgKFZvaWNlRW5naW5lLnNldEVuY29kaW5nQml0UmF0ZSkge1xuICAgICAgVm9pY2VFbmdpbmUuc2V0RW5jb2RpbmdCaXRSYXRlKGJpdHJhdGUpO1xuICAgIH1cbiAgfSxcblxuICBzdXBwb3J0c0VuY29kaW5nQml0UmF0ZSgpIHtcbiAgICByZXR1cm4gVm9pY2VFbmdpbmUuc2V0RW5jb2RpbmdCaXRSYXRlICE9IG51bGw7XG4gIH0sXG5cbiAgc2V0RWNob0NhbmNlbGxhdGlvbihlbmFibGVkKSB7XG4gICAgZWNob0NhbmNlbGxhdGlvbiA9IGVuYWJsZWQgPyBFY2hvQ2FuY2VsbGF0aW9uLkNPTkZFUkFOQ0UgOiBFY2hvQ2FuY2VsbGF0aW9uLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2VjaG9DYW5jZWxsYXRpb259KTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0Tm9pc2VTdXBwcmVzc2lvbihlbmFibGVkKSB7XG4gICAgbm9pc2VTdXBwcmVzc2lvbiA9IGVuYWJsZWQgPyBOb2lzZVN1cHByZXNzaW9uLkhJR0hfU1VQUFJFU1NJT04gOiBOb2lzZVN1cHByZXNzaW9uLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe25vaXNlU3VwcHJlc3Npb259KTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0QXV0b21hdGljR2FpbkNvbnRyb2woZW5hYmxlZCkge1xuICAgIGF1dG9tYXRpY0dhaW5Db250cm9sID0gZW5hYmxlZCA/IEF1dG9tYXRpY0dhaW5Db250cm9sLkFEQVBUSVZFX0FOQUxPRyA6IEF1dG9tYXRpY0dhaW5Db250cm9sLkRJU0FCTEVEO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2F1dG9tYXRpY0dhaW5Db250cm9sfSk7XG4gICAgfVxuICB9LFxuXG4gIHNldEF0dGVudWF0aW9uKGF0dGVudWF0aW9uKSB7XG4gICAgYXR0ZW51YXRpb25GYWN0b3IgPSAoMTAwIC0gYXR0ZW51YXRpb24pIC8gMTAwO1xuICAgIGlmIChoYXNUcmFuc3BvcnQpIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe1xuICAgICAgICBhdHRlbnVhdGlvbjogaXNBdHRlbnVhdGluZygpLFxuICAgICAgICBhdHRlbnVhdGlvbkZhY3RvcjogYXR0ZW51YXRpb25GYWN0b3JcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBpc0F0dGVudWF0aW9uRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gaXNBdHRlbnVhdGluZygpO1xuICB9LFxuXG4gIGNhblNldEF0dGVudWF0aW9uKCkge1xuICAgIHJldHVybiBOYXRpdmVVdGlscy5pc1dpbmRvd3MoKTtcbiAgfSxcblxuICBjYW5TZXRWb2ljZVByb2Nlc3NpbmcoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgY2FuU2V0SW5wdXREZXZpY2UoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgY2FuU2V0T3V0cHV0RGV2aWNlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIHNldElucHV0RGV2aWNlKGlkKSB7XG4gICAgdGhpcy5nZXRJbnB1dERldmljZXMoaW5wdXREZXZpY2VzID0+IHtcbiAgICAgIGxldCBpbnB1dERldmljZSA9IGlucHV0RGV2aWNlcy5maWx0ZXIoZGV2aWNlID0+IGRldmljZS5pZCA9PT0gaWQpWzBdIHx8IGlucHV0RGV2aWNlc1swXTtcbiAgICAgIGlucHV0RGV2aWNlSW5kZXggPSBpbnB1dERldmljZS5pbmRleDtcbiAgICAgIFZvaWNlRW5naW5lLnNldElucHV0RGV2aWNlKGlucHV0RGV2aWNlSW5kZXgpO1xuICAgIH0pO1xuICB9LFxuXG4gIHNldE91dHB1dERldmljZShpZCkge1xuICAgIHRoaXMuZ2V0T3V0cHV0RGV2aWNlcyhvdXRwdXREZXZpY2VzID0+IHtcbiAgICAgIGxldCBvdXRwdXREZXZpY2UgPSBvdXRwdXREZXZpY2VzLmZpbHRlcihkZXZpY2UgPT4gZGV2aWNlLmlkID09PSBpZClbMF0gfHwgb3V0cHV0RGV2aWNlc1swXTtcbiAgICAgIG91dHB1dERldmljZUluZGV4ID0gb3V0cHV0RGV2aWNlLmluZGV4O1xuICAgICAgVm9pY2VFbmdpbmUuc2V0T3V0cHV0RGV2aWNlKG91dHB1dERldmljZUluZGV4KTtcbiAgICB9KTtcbiAgfSxcblxuICBjb25uZWN0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gY3JlYXRlVHJhbnNwb3J0KHNzcmMsIHVzZXJJZCwgYWRkcmVzcywgcG9ydCwgY2FsbGJhY2spO1xuICB9LFxuXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgZGVzdHJveVRyYW5zcG9ydCgpO1xuICB9LFxuXG4gIGhhbmRsZVNwZWFraW5nOiBub29wLFxuXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihkZXNjKSB7XG4gICAgZW5jcnlwdGlvblNldHRpbmdzID0ge1xuICAgICAgbW9kZTogZGVzY1snbW9kZSddLFxuICAgICAgc2VjcmV0S2V5OiBkZXNjWydzZWNyZXRfa2V5J11cbiAgICB9O1xuICAgIFZvaWNlRW5naW5lLnNldFRyYW5zcG9ydE9wdGlvbnMoe2VuY3J5cHRpb25TZXR0aW5nc30pO1xuICB9LFxuXG4gIHBsYXlTb3VuZChuYW1lLCB2b2x1bWUgPSAxKSB7XG4gICAgaWYgKFZFUlNJT05fUkVRX0ZVTExfUEFUSF9TT1VORFMpIHtcbiAgICAgIGNvbnN0IHtyZXNvdXJjZXNQYXRofSA9IE5hdGl2ZVV0aWxzLnJlcXVpcmUoJ3Byb2Nlc3MnLCB0cnVlKTtcbiAgICAgIFZvaWNlRW5naW5lLnBsYXlTb3VuZChwYXRoLmpvaW4ocGF0aC5qb2luKHJlc291cmNlc1BhdGgsICdzb3VuZHMnKSwgYCR7bmFtZX0ud2F2YCksIHZvbHVtZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgVm9pY2VFbmdpbmUucGxheVNvdW5kKG5hbWUsIHZvbHVtZSk7XG4gICAgfVxuICB9LFxuXG4gIHN1cHBvcnRzQXV0b21hdGljVkFEKCkge1xuICAgIHJldHVybiBWRVJTSU9OX1JFUV9BVVRPTUFUSUNfVkFEO1xuICB9LFxuXG4gIHN1cHBvcnRzTXVsdGlwbGVQVFQoKSB7XG4gICAgcmV0dXJuIFZvaWNlRW5naW5lLnNldFBUVEFjdGl2ZSAhPSBudWxsO1xuICB9LFxuXG4gIHN1cHBvcnRzUFRUUmVsZWFzZURlbGF5KCkge1xuICAgIHJldHVybiBWRVJTSU9OX1JFUV9QVFRfUkVMRUFTRV9ERUxBWTtcbiAgfSxcblxuICBzZXRGb3JjZVNlbmQoc2VuZCkge1xuICAgIFZvaWNlRW5naW5lLnNldFBUVEFjdGl2ZSAmJiBWb2ljZUVuZ2luZS5zZXRQVFRBY3RpdmUoc2VuZCk7XG4gIH0sXG5cbiAgb25Db25uZWN0aW9uU3RhdGUoY2FsbGJhY2spIHtcbiAgICBvbkNvbm5lY3Rpb25TdGF0ZSA9IGNhbGxiYWNrO1xuICB9LFxuXG4gIGdldFRyYW5zcG9ydE9wdGlvbnMsXG4gIGdldFVzZXJPcHRpb25zLFxuXG4gIGRlYnVnRHVtcChjYWxsYmFjaykge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaW1wbGVtZW50YXRpb246ICduYXRpdmUnLFxuICAgICAgaGFzVHJhbnNwb3J0LFxuICAgICAgc2VsZk11dGUsXG4gICAgICBpbnB1dFZvbHVtZSxcbiAgICAgIG91dHB1dFZvbHVtZSxcbiAgICAgIGlucHV0RGV2aWNlSW5kZXgsXG4gICAgICBvdXRwdXREZXZpY2VJbmRleCxcbiAgICAgIGlucHV0TW9kZSxcbiAgICAgIHZhZFRocmVzaG9sZFxuICAgIH07XG4gICAgVm9pY2VFbmdpbmUuZGVidWdEdW1wKE5hdGl2ZVV0aWxzLm1ha2VEZWZlcnJlZCgoe05hdGl2ZX0pID0+IHtcbiAgICAgIGRhdGEubmF0aXZlID0gTmF0aXZlO1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSkpO1xuICB9LFxuXG4gIGNvbGxlY3REaWFnbm9zdGljcyhjYWxsYmFjaykge1xuICAgIGlmIChWb2ljZUVuZ2luZS5jb2xsZWN0RGlhZ25vc3RpY3MpIHtcbiAgICAgIFZvaWNlRW5naW5lLmNvbGxlY3REaWFnbm9zdGljcyhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoY2FsbGJhY2spKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlhZ25vc3RpY3NFbmFibGVkOiBWb2ljZUVuZ2luZS5jb2xsZWN0RGlhZ25vc3RpY3MgIT0gbnVsbCxcblxuICBzZXROb0lucHV0VGhyZXNob2xkOiBpbnB1dERldGVjdGlvblZlcnNpb25HdWFyZChWb2ljZUVuZ2luZS5zZXROb0lucHV0VGhyZXNob2xkKSxcblxuICBzZXROb0lucHV0Q2FsbGJhY2s6IGlucHV0RGV0ZWN0aW9uVmVyc2lvbkd1YXJkKFZvaWNlRW5naW5lLnNldE5vSW5wdXRDYWxsYmFjayksXG5cbiAgLy8gTm90IGEgZmFuIG9mIGhvdyB0aGlzIGlzIGltcG9ydGVkLCBidXQgZG9pbmcgaXQgcXVpY2suXG4gIHJ1bkRpYWdub3N0aWNzOiByZXF1aXJlKCcuL0RpYWdub3N0aWNzJykucnVuRGlhZ25vc3RpY3MsXG4gIGdldERpYWdub3N0aWNJbmZvOiByZXF1aXJlKCcuL0RpYWdub3N0aWNzJykuZ2V0RGlhZ25vc3RpY0luZm8sXG4gIENvbnN0YW50czogcmVxdWlyZSgnLi9Db25zdGFudHMnKSxcbiAgc3VwcG9ydHNOYXRpdmVQaW5nOiBWb2ljZUVuZ2luZS5zZXRQaW5nQ2FsbGJhY2sgIT0gbnVsbCxcbiAgc2V0UGluZ0NhbGxiYWNrOiBWb2ljZUVuZ2luZS5zZXRQaW5nQ2FsbGJhY2sgPyAoY2FsbGJhY2spID0+IHtcbiAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuICAgICAgLy8gU2V0IHRvIG5vb3AsIGFzIG5hdGl2ZSBjb2RlIGRvZXNuJ3Qgc3VwcG9ydCBwYXNzaW5nIFwibnVsbFwiLlxuICAgICAgVm9pY2VFbmdpbmUuc2V0UGluZ0NhbGxiYWNrKG5vb3ApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIFZvaWNlRW5naW5lLnNldFBpbmdDYWxsYmFjayhOYXRpdmVVdGlscy5tYWtlRGVmZXJyZWQoY2FsbGJhY2spKTtcbiAgICB9XG4gIH0gOiBub29wXG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL25hdGl2ZS9pbmRleC5qc1xuICoqLyJdfQ==