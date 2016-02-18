'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LogType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.runDiagnostics = runDiagnostics;
exports.getDiagnosticInfo = getDiagnosticInfo;

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _Constants = require('../../../Constants');

var _Constants2 = require('./Constants');

var _i18n = require('../../../i18n');

var _i18n2 = _interopRequireDefault(_i18n);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LogType = exports.LogType = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

var DiagnosticsContext = function () {
  function DiagnosticsContext() {
    _classCallCheck(this, DiagnosticsContext);

    this.logs = {};
    this.currentDiagnostic = null;
  }

  _createClass(DiagnosticsContext, [{
    key: 'popDiagnostic',
    value: function popDiagnostic() {
      this.currentDiagnostic = null;
    }
  }, {
    key: 'pushDiagnostic',
    value: function pushDiagnostic(name) {
      this.currentDiagnostic = name;
      this.logs[name] = [];
    }
  }, {
    key: 'diagnosticFailed',
    value: function diagnosticFailed(e) {
      this.logs[this.currentDiagnostic].push({ message: '' + e, type: LogType.ERROR });
      console.error(e);
      this.popDiagnostic();
    }
  }, {
    key: 'addError',
    value: function addError(message, data) {
      this.logs[this.currentDiagnostic].push({ message: message, data: data, type: LogType.ERROR });
    }
  }, {
    key: 'addWarning',
    value: function addWarning(message, data) {
      this.logs[this.currentDiagnostic].push({ message: message, data: data, type: LogType.WARNING });
    }
  }, {
    key: 'addSuccess',
    value: function addSuccess(message, data) {
      this.logs[this.currentDiagnostic].push({ message: message, data: data, type: LogType.SUCCESS });
    }
  }]);

  return DiagnosticsContext;
}();

var attrgetter = function attrgetter() {
  var k = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  return function (obj, _k) {
    return obj[k || _k];
  };
};
var floatAlmostEquals = function floatAlmostEquals(a, b) {
  return Math.abs(a - b) < 0.01;
};

var checkDevice = function checkDevice(diagDevice, storeDevice, context) {
  if (diagDevice.index == storeDevice.index) {
    context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DEVICE_SUCCESS_MATCHES, {
      key: 'index',
      value: diagDevice.index
    });
  } else {
    context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DEVICE_ERROR_MISMATCH, {
      key: 'index',
      expectedValue: storeDevice.index,
      nativeValue: diagDevice.index
    });
  }

  // Abort when device index is -1, it means we are using the default device,
  // and can't reliably compare device names, as the native diagnostics would return the name
  // of the default device rather than the literal string "Default".
  if (diagDevice.index === -1) return;

  var storeDeviceName = storeDevice.originalName || storeDevice.name;
  if (diagDevice.name == storeDeviceName) {
    context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DEVICE_SUCCESS_MATCHES, {
      key: 'name',
      value: diagDevice.name
    });
  } else {
    context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DEVICE_ERROR_MISMATCH, {
      key: 'name',
      expectedValue: storeDeviceName,
      nativeValue: diagDevice.name
    });
  }
};

function getChannelUserIds(_ref) {
  var SelectedChannelStore = _ref.SelectedChannelStore;
  var AuthenticationStore = _ref.AuthenticationStore;
  var ChannelVoiceStateStore = _ref.ChannelVoiceStateStore;

  var voiceChannelId = SelectedChannelStore.getVoiceChannelId();
  if (!voiceChannelId) {
    return false;
  }
  var voiceStates = ChannelVoiceStateStore.getVoiceStates(voiceChannelId);
  var myId = AuthenticationStore.getId();
  return new Set(voiceStates.map(function (_ref2) {
    var user = _ref2.user;
    return user.id;
  }).filter(function (userId) {
    return userId != myId;
  }));
}

var diagnostics = {
  ensureTransportOptionsMatchDiagnosticDataFlags: {
    name: _i18n2.default.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_DESCRIPTION,
    run: function run(collectedDiagnostics, context) {
      var transportOptions = _index2.default.getTransportOptions();
      var diagFlags = collectedDiagnostics.Native.flags;

      var flagsToCompare = {
        agc: attrgetter('automaticGainControl'),
        attenuation: attrgetter(),
        attenuationFactor: attrgetter(),
        ducking: attrgetter(),
        echoCancellation: attrgetter(),
        inputMode: attrgetter(),
        noiseSuppression: attrgetter(),
        speakerVolume: attrgetter('outputVolume'),
        micVolume: attrgetter('inputVolume')
      };
      var equalityOverrides = {
        speakerVolume: floatAlmostEquals,
        micVolume: floatAlmostEquals,
        attenuationFactor: floatAlmostEquals
      };
      var defaultEquality = function defaultEquality(a, b) {
        return a === b;
      };

      if (diagFlags.inputMode === _Constants.InputModes.VOICE_ACTIVITY) {
        flagsToCompare.vadAutoThreshold = function (o) {
          return o.inputModeOptions.vadAutoThreshold;
        };
        flagsToCompare.vadLeadin = function (o) {
          return o.inputModeOptions.vadLeadin;
        };
        flagsToCompare.vadThreshold = function (o) {
          return o.inputModeOptions.vadThreshold;
        };
        flagsToCompare.vadTrailin = function (o) {
          return o.inputModeOptions.vadTrailin;
        };
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(flagsToCompare)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          var diagValue = diagFlags[key];
          var optionsValue = flagsToCompare[key](transportOptions, key);
          var equalityFunction = equalityOverrides.hasOwnProperty(key) ? equalityOverrides[key] : defaultEquality;
          var isEqual = equalityFunction(diagValue, optionsValue);

          if (!isEqual) {
            context.addError(_i18n2.default.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_ERROR_MISMATCH, {
              key: key,
              diagValue: diagValue,
              optionsValue: optionsValue
            });
          } else {
            context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_SUCCESS_MATCHED, {
              key: key,
              diagValue: diagValue,
              optionsValue: optionsValue
            });
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
  },

  checkInputVolumeLevels: {
    name: _i18n2.default.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_DESCRIPTION,
    run: function run(collectedDiagnostics, context) {
      var recentVolumes = collectedDiagnostics.Native.localUser.volumeDbFS;
      if (recentVolumes.length) {
        var averageVolume = recentVolumes.reduce(function (a, b) {
          return a + b;
        }, 0) / recentVolumes.length;
        if (averageVolume < -99.0) {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_ERROR_VOLUME_LOOKS_LOW, {
            averageVolume: averageVolume,
            recentVolumes: recentVolumes
          });
        } else {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_DETECTED_AUDIO_INPUT, {
            averageVolume: averageVolume,
            recentVolumes: recentVolumes
          });
        }
      }
    }
  },

  checkPing: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_PING_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_PING_DESCRIPTION,
    run: function run(collectedDiagnostics, context) {
      var PING_THRESHOLD = 250;

      var recentPings = collectedDiagnostics.Native.localUser.ping;
      if (recentPings.length) {
        var _Math;

        var averagePing = recentPings.reduce(function (a, b) {
          return a + b;
        }, 0) / recentPings.length;
        var maxPing = (_Math = Math).max.apply(_Math, _toConsumableArray(recentPings));

        // Test 2 kinds of pings -- check to see if their average is high in general.
        if (averagePing >= PING_THRESHOLD) {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_PING_ERROR_HIGH_PING, {
            averagePing: averagePing,
            recentPings: recentPings
          });
        }
        // Or they had a spike recently.
        else if (maxPing >= PING_THRESHOLD) {
            context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_CHECK_PING_WARNING_SPIKE, {
              averagePing: averagePing,
              maxPing: maxPing,
              recentPings: recentPings
            });
          } else {
            context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_PING_NOMINAL, {
              averagePing: averagePing,
              recentPings: recentPings
            });
          }
      }
    }
  },

  checkInputDeviceMatches: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_INPUT_DEVICE_MATCHES_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_INPUT_DEVICE_MATCHES_DESCRIPTION,
    run: function run(diagnosticData, context, _ref3) {
      var VoiceEngineStore = _ref3.VoiceEngineStore;

      var inputDeviceId = VoiceEngineStore.getInputDeviceId();
      var inputDevices = VoiceEngineStore.getInputDevices();
      var inputDevice = inputDevices[inputDeviceId];
      var diagInputDevice = diagnosticData.Native.inputDevice;

      checkDevice(diagInputDevice, inputDevice, context);
    }
  },

  checkOutputDeviceMatches: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_OUTPUT_DEVICE_MATCHES_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_OUTPUT_DEVICE_MATCHES_DESCRIPTION,
    run: function run(diagnosticData, context, _ref4) {
      var VoiceEngineStore = _ref4.VoiceEngineStore;

      var outputDeviceId = VoiceEngineStore.getOutputDeviceId();
      var outputDevices = VoiceEngineStore.getOutputDevices();
      var outputDevice = outputDevices[outputDeviceId];
      var diagOutputDevice = diagnosticData.Native.outputDevice;

      checkDevice(diagOutputDevice, outputDevice, context);
    }
  },

  checkUserPackets: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_DESCRIPTION,
    run: function run(diagnosticData, context, _ref5) {
      var ChannelVoiceStateStore = _ref5.ChannelVoiceStateStore;
      var SelectedChannelStore = _ref5.SelectedChannelStore;
      var AuthenticationStore = _ref5.AuthenticationStore;

      var voiceChannelId = SelectedChannelStore.getVoiceChannelId();
      if (!voiceChannelId) {
        context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      var voiceStates = ChannelVoiceStateStore.getVoiceStates(voiceChannelId);
      var wasUserSeen = {};
      var unknownUsers = [];
      var myId = AuthenticationStore.getId();
      voiceStates.forEach(function (_ref6) {
        var user = _ref6.user;

        if (user.id !== myId) {
          wasUserSeen[user.id] = false;
        }
      });

      var diagnosticUsers = diagnosticData.Native.users;
      diagnosticUsers.forEach(function (_ref7) {
        var id = _ref7.id;

        if (wasUserSeen.hasOwnProperty(id)) {
          wasUserSeen[id] = true;
        } else {
          unknownUsers.push(id);
        }
      });
      Object.keys(wasUserSeen).forEach(function (userId) {
        var userWasSeen = wasUserSeen[userId];
        if (userWasSeen) {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_USER_WAS_SEEN, { userId: userId });
        } else {
          context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_WARNING_NO_PACKET_SEEN, {
            userId: userId
          });
        }
      });
      //for (let userId of unknownUsers) {
      //  context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_ERROR_UNKNOWN_USER, {userId});
      //}
    }
  },

  checkUserVolumesMatch: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_DESCRIPTION,
    run: function run(diagnosticData, context, stores) {
      var userIds = getChannelUserIds(stores);
      if (userIds === false) {
        context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      var VoiceEngineStore = stores.VoiceEngineStore;

      var diagnosticUsers = diagnosticData.Native.users;
      var audioSettings = VoiceEngineStore.getAudioSettings();

      diagnosticUsers.forEach(function (user) {
        // Ignore users that aren't in the channel.
        if (!userIds.has(user.id)) return;

        var userVolume = user.volume;
        // No overrides are present.
        if (!audioSettings.localVolumes.hasOwnProperty(user.id) && userVolume == 1) {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NOMINAL, {
            userVolume: userVolume,
            userId: user.id
          });
          return;
        }

        var localVolume = audioSettings.localVolumes[user.id] / 100;
        if (!floatAlmostEquals(localVolume, userVolume)) {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_ERROR_VOLUME_MISMATCH, {
            userVolume: userVolume,
            localVolume: localVolume,
            userId: user.id
          });
        } else {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NOMINAL, {
            userVolume: userVolume,
            userId: user.id
          });
        }
      });
    }
  },

  checkUserMutesMatch: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MUTES_MATCH_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MUTES_MATCH_DESCRIPTION,
    run: function run(diagnosticData, context, stores) {
      var userIds = getChannelUserIds(stores);
      if (userIds === false) {
        context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      var VoiceEngineStore = stores.VoiceEngineStore;

      var diagnosticUsers = diagnosticData.Native.users;
      var audioSettings = VoiceEngineStore.getAudioSettings();

      diagnosticUsers.forEach(function (user) {
        // Ignore users that aren't in the channel.
        if (!userIds.has(user.id)) return;

        var localMuted = !!audioSettings.localMutes[user.id];
        var userMuted = user.muted;
        if (localMuted !== userMuted) {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MUTES_ERROR_MISMATCH, {
            localMuted: localMuted,
            userMuted: userMuted,
            userId: user.id
          });
        } else {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MUTES_NOMINAL, {
            userMuted: userMuted,
            userId: user.id
          });
        }
      });
    }
  },

  checkLocalUser: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_DESCRIPTION,
    run: function run(diagnosticData, context, _ref8) {
      var AuthenticationStore = _ref8.AuthenticationStore;

      var diagnosticUserId = diagnosticData.Native.localUser.id;
      var userId = AuthenticationStore.getId();
      if (userId != diagnosticUserId) {
        context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NOMINAL, {
          diagnosticUserId: diagnosticUserId,
          userId: userId
        });
      } else {
        context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NOMINAL, {
          userId: userId
        });
      }
    }
  },

  checkUsersWhoHaveLowVolumes: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_DESCRIPTION,
    run: function run(diagnosticData, context, stores) {
      var userIds = getChannelUserIds(stores);
      if (!userIds) {
        context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      var audioSettings = stores.VoiceEngineStore.getAudioSettings();
      userIds.forEach(function (userId) {
        var localVolume = audioSettings.localVolumes[userId];
        if (localVolume === undefined) {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NOMINAL_NO_OVERRIDES, {
            userId: userId
          });
        } else if (localVolume >= 50) {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NOMINAL, {
            userId: userId,
            localVolume: localVolume | 0
          });
        } else if (localVolume >= 15) {
          context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_WARN_HARD_TO_HEAR, {
            userId: userId,
            localVolume: localVolume | 0
          });
        } else if (localVolume >= 5) {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_ERROR_HARD_TO_HEAR, {
            userId: userId,
            localVolume: localVolume | 0
          });
        } else {
          context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_ERROR_TURN_THEM_UP, {
            userId: userId,
            localVolume: localVolume | 0
          });
        }
      });
    }
  },

  checkUserMaybeMuted: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_DESCRIPTION,
    run: function run(diagnosticData, context, stores) {
      var userIds = getChannelUserIds(stores);
      if (!userIds) {
        context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      var audioSettings = stores.VoiceEngineStore.getAudioSettings();
      userIds.forEach(function (userId) {
        var localMuted = audioSettings.localMutes[userId];
        if (localMuted) {
          context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_WARN_USER_MUTED, {
            userId: userId
          });
        } else {
          context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_NOMINAL, {
            userId: userId
          });
        }
      });
    }
  },

  // jake: Shelved for now, I need to collect more info on acceptable values for these.
  //checkUserJitter: {
  //  run(diagnosticData, context) {
  //    // Check jitter.
  //  }
  //},
  //
  //checkUserPacketLoss: {
  //  run() {
  //    // Check user's packet loss rate.
  //  }
  //},
  //
  //checkUserPacketWaitingTimes: {
  //  run() {
  //    // Check whether packet waiting times exceed a given value.
  //  }
  //},

  checkUnknownSsrc: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_DESCRIPTION,
    run: function run(diagnosticData, context) {
      var unknownUsers = diagnosticData.Native.unknownUsers;
      var userOptions = _index2.default.getUserOptions();
      var knownSsrc = {};
      userOptions.forEach(function (user) {
        knownSsrc[user.ssrc] = user;
      });

      if (unknownUsers.length > 0) {
        unknownUsers.forEach(function (_ref9) {
          var ssrc = _ref9.ssrc;
          var bytesRx = _ref9.bytesRx;

          var userInfo = knownSsrc[ssrc];
          if (userInfo !== undefined) {
            context.addWarning(_i18n2.default.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_WARNING_FORMERLY_UNKNOWN, {
              userId: userInfo.id,
              ssrc: ssrc,
              bytesRx: bytesRx
            });
          } else {
            context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_ERROR_UNKNOWN_SSRC_PACKETS_RECEIVED, {
              ssrc: ssrc,
              bytesRx: bytesRx
            });
          }
        });
      } else {
        context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_NOMINAL);
      }
    }
  },

  checkDecryptionFailures: {
    name: _i18n2.default.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_NAME,
    description: _i18n2.default.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_DESCRIPTION,
    run: function run(diagnosticData, context) {
      var decryptionFailures = diagnosticData.Native.decryptionFailures;

      if (decryptionFailures > 0) {
        context.addError(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_ERROR_DETECTED_FAILURES, {
          decryptionFailures: decryptionFailures
        });
      } else {
        context.addSuccess(_i18n2.default.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_NOMINAL);
      }
    }
  }
};

var ALL_DIAGNOSTICS = Object.keys(diagnostics);

function runDiagnostics(collectedDiagnostics, _ref10) {
  var VoiceEngineStore = _ref10.VoiceEngineStore;
  var ChannelVoiceStateStore = _ref10.ChannelVoiceStateStore;
  var SelectedChannelStore = _ref10.SelectedChannelStore;
  var AuthenticationStore /* explicit about what stores we need */
  = _ref10.AuthenticationStore;
  var diagnosticsToRun = arguments.length <= 2 || arguments[2] === undefined ? ALL_DIAGNOSTICS : arguments[2];

  var context = new DiagnosticsContext();
  var stores = { VoiceEngineStore: VoiceEngineStore, ChannelVoiceStateStore: ChannelVoiceStateStore, SelectedChannelStore: SelectedChannelStore, AuthenticationStore: AuthenticationStore };

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = diagnosticsToRun[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var diagnosticKey = _step2.value;

      var diagnostic = diagnostics[diagnosticKey];
      context.pushDiagnostic(diagnosticKey);
      try {
        diagnostic.run(collectedDiagnostics, context, stores);
        context.popDiagnostic();
      } catch (e) {
        context.diagnosticFailed(e);
      }
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

  return { diagnosticsRan: diagnosticsToRun, logs: context.logs };
}

function getDiagnosticInfo(diagnosticKey) {
  var diagnostic = diagnostics[diagnosticKey];
  if (diagnostic === undefined) return null;

  return {
    name: diagnostic.name,
    description: diagnostic.description
  };
}

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/native/Diagnostics.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS9uYXRpdmUvRGlhZ25vc3RpY3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBcWhCZ0I7UUFtQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbmlCVCxJQUFNLDRCQUFVO0FBQ3JCLFdBQVMsU0FBVDtBQUNBLFdBQVMsU0FBVDtBQUNBLFNBQU8sT0FBUDtDQUhXOztJQU1QO0FBQ0osV0FESSxrQkFDSixHQUFjOzBCQURWLG9CQUNVOztBQUNaLFNBQUssSUFBTCxHQUFZLEVBQVosQ0FEWTtBQUVaLFNBQUssaUJBQUwsR0FBeUIsSUFBekIsQ0FGWTtHQUFkOztlQURJOztvQ0FNWTtBQUNkLFdBQUssaUJBQUwsR0FBeUIsSUFBekIsQ0FEYzs7OzttQ0FJRCxNQUFNO0FBQ25CLFdBQUssaUJBQUwsR0FBeUIsSUFBekIsQ0FEbUI7QUFFbkIsV0FBSyxJQUFMLENBQVUsSUFBVixJQUFrQixFQUFsQixDQUZtQjs7OztxQ0FLSixHQUFHO0FBQ2xCLFdBQUssSUFBTCxDQUFVLEtBQUssaUJBQUwsQ0FBVixDQUFrQyxJQUFsQyxDQUF1QyxFQUFDLGNBQVksQ0FBWixFQUFpQixNQUFNLFFBQVEsS0FBUixFQUEvRCxFQURrQjtBQUVsQixjQUFRLEtBQVIsQ0FBYyxDQUFkLEVBRmtCO0FBR2xCLFdBQUssYUFBTCxHQUhrQjs7Ozs2QkFNWCxTQUFTLE1BQU07QUFDdEIsV0FBSyxJQUFMLENBQVUsS0FBSyxpQkFBTCxDQUFWLENBQWtDLElBQWxDLENBQXVDLEVBQUMsZ0JBQUQsRUFBVSxVQUFWLEVBQWdCLE1BQU0sUUFBUSxLQUFSLEVBQTdELEVBRHNCOzs7OytCQUliLFNBQVMsTUFBTTtBQUN4QixXQUFLLElBQUwsQ0FBVSxLQUFLLGlCQUFMLENBQVYsQ0FBa0MsSUFBbEMsQ0FBdUMsRUFBQyxnQkFBRCxFQUFVLFVBQVYsRUFBZ0IsTUFBTSxRQUFRLE9BQVIsRUFBN0QsRUFE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QyxNQUFNLGFBQWEsWUFBWSxhQUFaLENBQWIsQ0FEeUM7QUFFL0MsTUFBSSxlQUFlLFNBQWYsRUFBMEIsT0FBTyxJQUFQLENBQTlCOztBQUVBLFNBQU87QUFDTCxVQUFNLFdBQVcsSUFBWDtBQUNOLGlCQUFhLFdBQVcsV0FBWDtHQUZmLENBSitDO0NBQTFDIiwiZmlsZSI6IkRpYWdub3N0aWNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZvaWNlRW5naW5lIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHtJbnB1dE1vZGVzfSBmcm9tICcuLi8uLi8uLi9Db25zdGFudHMnO1xuaW1wb3J0IHtOQVRJVkVfVE9fUkVHVUxBUn0gZnJvbSAnLi9Db25zdGFudHMnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vLi4vaTE4bic7XG5cbmV4cG9ydCBjb25zdCBMb2dUeXBlID0ge1xuICBTVUNDRVNTOiAnc3VjY2VzcycsXG4gIFdBUk5JTkc6ICd3YXJuaW5nJyxcbiAgRVJST1I6ICdlcnJvcidcbn07XG5cbmNsYXNzIERpYWdub3N0aWNzQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubG9ncyA9IHt9O1xuICAgIHRoaXMuY3VycmVudERpYWdub3N0aWMgPSBudWxsO1xuICB9XG5cbiAgcG9wRGlhZ25vc3RpYygpIHtcbiAgICB0aGlzLmN1cnJlbnREaWFnbm9zdGljID0gbnVsbDtcbiAgfVxuXG4gIHB1c2hEaWFnbm9zdGljKG5hbWUpIHtcbiAgICB0aGlzLmN1cnJlbnREaWFnbm9zdGljID0gbmFtZTtcbiAgICB0aGlzLmxvZ3NbbmFtZV0gPSBbXTtcbiAgfVxuXG4gIGRpYWdub3N0aWNGYWlsZWQoZSkge1xuICAgIHRoaXMubG9nc1t0aGlzLmN1cnJlbnREaWFnbm9zdGljXS5wdXNoKHttZXNzYWdlOiBgJHtlfWAsIHR5cGU6IExvZ1R5cGUuRVJST1J9KTtcbiAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIHRoaXMucG9wRGlhZ25vc3RpYygpO1xuICB9XG5cbiAgYWRkRXJyb3IobWVzc2FnZSwgZGF0YSkge1xuICAgIHRoaXMubG9nc1t0aGlzLmN1cnJlbnREaWFnbm9zdGljXS5wdXNoKHttZXNzYWdlLCBkYXRhLCB0eXBlOiBMb2dUeXBlLkVSUk9SfSk7XG4gIH1cblxuICBhZGRXYXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcbiAgICB0aGlzLmxvZ3NbdGhpcy5jdXJyZW50RGlhZ25vc3RpY10ucHVzaCh7bWVzc2FnZSwgZGF0YSwgdHlwZTogTG9nVHlwZS5XQVJOSU5HfSk7XG4gIH1cblxuICBhZGRTdWNjZXNzKG1lc3NhZ2UsIGRhdGEpIHtcbiAgICB0aGlzLmxvZ3NbdGhpcy5jdXJyZW50RGlhZ25vc3RpY10ucHVzaCh7bWVzc2FnZSwgZGF0YSwgdHlwZTogTG9nVHlwZS5TVUNDRVNTfSk7XG4gIH1cbn1cblxuY29uc3QgYXR0cmdldHRlciA9IChrID0gbnVsbCkgPT4gKG9iaiwgX2spID0+IG9ialtrIHx8IF9rXTtcbmNvbnN0IGZsb2F0QWxtb3N0RXF1YWxzID0gKGEsIGIpID0+IE1hdGguYWJzKGEgLSBiKSA8IDAuMDE7XG5cbmNvbnN0IGNoZWNrRGV2aWNlID0gKGRpYWdEZXZpY2UsIHN0b3JlRGV2aWNlLCBjb250ZXh0KSA9PiB7XG4gIGlmIChkaWFnRGV2aWNlLmluZGV4ID09IHN0b3JlRGV2aWNlLmluZGV4KSB7XG4gICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19ERVZJQ0VfU1VDQ0VTU19NQVRDSEVTLCB7XG4gICAgICAgIGtleTogJ2luZGV4JyxcbiAgICAgICAgdmFsdWU6IGRpYWdEZXZpY2UuaW5kZXhcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbnRleHQuYWRkRXJyb3IoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX0RFVklDRV9FUlJPUl9NSVNNQVRDSCwge1xuICAgICAga2V5OiAnaW5kZXgnLFxuICAgICAgZXhwZWN0ZWRWYWx1ZTogc3RvcmVEZXZpY2UuaW5kZXgsXG4gICAgICBuYXRpdmVWYWx1ZTogZGlhZ0RldmljZS5pbmRleFxuICAgIH0pO1xuICB9XG5cbiAgLy8gQWJvcnQgd2hlbiBkZXZpY2UgaW5kZXggaXMgLTEsIGl0IG1lYW5zIHdlIGFyZSB1c2luZyB0aGUgZGVmYXVsdCBkZXZpY2UsXG4gIC8vIGFuZCBjYW4ndCByZWxpYWJseSBjb21wYXJlIGRldmljZSBuYW1lcywgYXMgdGhlIG5hdGl2ZSBkaWFnbm9zdGljcyB3b3VsZCByZXR1cm4gdGhlIG5hbWVcbiAgLy8gb2YgdGhlIGRlZmF1bHQgZGV2aWNlIHJhdGhlciB0aGFuIHRoZSBsaXRlcmFsIHN0cmluZyBcIkRlZmF1bHRcIi5cbiAgaWYgKGRpYWdEZXZpY2UuaW5kZXggPT09IC0xKSByZXR1cm47XG5cbiAgY29uc3Qgc3RvcmVEZXZpY2VOYW1lID0gc3RvcmVEZXZpY2Uub3JpZ2luYWxOYW1lIHx8IHN0b3JlRGV2aWNlLm5hbWU7XG4gIGlmIChkaWFnRGV2aWNlLm5hbWUgPT0gc3RvcmVEZXZpY2VOYW1lKSB7XG4gICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19ERVZJQ0VfU1VDQ0VTU19NQVRDSEVTLCB7XG4gICAgICBrZXk6ICduYW1lJyxcbiAgICAgIHZhbHVlOiBkaWFnRGV2aWNlLm5hbWVcbiAgICB9KTtcbiAgfVxuICBlbHNlIHtcbiAgICBjb250ZXh0LmFkZEVycm9yKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19ERVZJQ0VfRVJST1JfTUlTTUFUQ0gsIHtcbiAgICAgIGtleTogJ25hbWUnLFxuICAgICAgZXhwZWN0ZWRWYWx1ZTogc3RvcmVEZXZpY2VOYW1lLFxuICAgICAgbmF0aXZlVmFsdWU6IGRpYWdEZXZpY2UubmFtZVxuICAgIH0pO1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXRDaGFubmVsVXNlcklkcyh7U2VsZWN0ZWRDaGFubmVsU3RvcmUsIEF1dGhlbnRpY2F0aW9uU3RvcmUsIENoYW5uZWxWb2ljZVN0YXRlU3RvcmV9KSB7XG4gIGNvbnN0IHZvaWNlQ2hhbm5lbElkID0gU2VsZWN0ZWRDaGFubmVsU3RvcmUuZ2V0Vm9pY2VDaGFubmVsSWQoKTtcbiAgaWYgKCF2b2ljZUNoYW5uZWxJZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB2b2ljZVN0YXRlcyA9IENoYW5uZWxWb2ljZVN0YXRlU3RvcmUuZ2V0Vm9pY2VTdGF0ZXModm9pY2VDaGFubmVsSWQpO1xuICBjb25zdCBteUlkID0gQXV0aGVudGljYXRpb25TdG9yZS5nZXRJZCgpO1xuICByZXR1cm4gbmV3IFNldCh2b2ljZVN0YXRlcy5tYXAoKHt1c2VyfSkgPT4gdXNlci5pZCkuZmlsdGVyKHVzZXJJZCA9PiB1c2VySWQgIT0gbXlJZCkpO1xufVxuXG5jb25zdCBkaWFnbm9zdGljcyA9IHtcbiAgZW5zdXJlVHJhbnNwb3J0T3B0aW9uc01hdGNoRGlhZ25vc3RpY0RhdGFGbGFnczoge1xuICAgIG5hbWU6IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19FTlNVUkVfVFJBTlNQT1JUX09QVElPTlNfTUFUQ0hfRElBR05PU1RJQ19EQVRBX0ZMQUdfTkFNRSxcbiAgICBkZXNjcmlwdGlvbjogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0VOU1VSRV9UUkFOU1BPUlRfT1BUSU9OU19NQVRDSF9ESUFHTk9TVElDX0RBVEFfRkxBR19ERVNDUklQVElPTixcbiAgICBydW4oY29sbGVjdGVkRGlhZ25vc3RpY3MsIGNvbnRleHQpIHtcbiAgICAgIGNvbnN0IHRyYW5zcG9ydE9wdGlvbnMgPSBWb2ljZUVuZ2luZS5nZXRUcmFuc3BvcnRPcHRpb25zKCk7XG4gICAgICBjb25zdCBkaWFnRmxhZ3MgPSBjb2xsZWN0ZWREaWFnbm9zdGljcy5OYXRpdmUuZmxhZ3M7XG5cbiAgICAgIGNvbnN0IGZsYWdzVG9Db21wYXJlID0ge1xuICAgICAgICBhZ2M6IGF0dHJnZXR0ZXIoJ2F1dG9tYXRpY0dhaW5Db250cm9sJyksXG4gICAgICAgIGF0dGVudWF0aW9uOiBhdHRyZ2V0dGVyKCksXG4gICAgICAgIGF0dGVudWF0aW9uRmFjdG9yOiBhdHRyZ2V0dGVyKCksXG4gICAgICAgIGR1Y2tpbmc6IGF0dHJnZXR0ZXIoKSxcbiAgICAgICAgZWNob0NhbmNlbGxhdGlvbjogYXR0cmdldHRlcigpLFxuICAgICAgICBpbnB1dE1vZGU6IGF0dHJnZXR0ZXIoKSxcbiAgICAgICAgbm9pc2VTdXBwcmVzc2lvbjogYXR0cmdldHRlcigpLFxuICAgICAgICBzcGVha2VyVm9sdW1lOiBhdHRyZ2V0dGVyKCdvdXRwdXRWb2x1bWUnKSxcbiAgICAgICAgbWljVm9sdW1lOiBhdHRyZ2V0dGVyKCdpbnB1dFZvbHVtZScpXG4gICAgICB9O1xuICAgICAgY29uc3QgZXF1YWxpdHlPdmVycmlkZXMgPSB7XG4gICAgICAgIHNwZWFrZXJWb2x1bWU6IGZsb2F0QWxtb3N0RXF1YWxzLFxuICAgICAgICBtaWNWb2x1bWU6IGZsb2F0QWxtb3N0RXF1YWxzLFxuICAgICAgICBhdHRlbnVhdGlvbkZhY3RvcjogZmxvYXRBbG1vc3RFcXVhbHNcbiAgICAgIH07XG4gICAgICBjb25zdCBkZWZhdWx0RXF1YWxpdHkgPSAoYSwgYikgPT4gYSA9PT0gYjtcblxuICAgICAgaWYgKGRpYWdGbGFncy5pbnB1dE1vZGUgPT09IElucHV0TW9kZXMuVk9JQ0VfQUNUSVZJVFkpIHtcbiAgICAgICAgZmxhZ3NUb0NvbXBhcmUudmFkQXV0b1RocmVzaG9sZCA9IChvKSA9PiBvLmlucHV0TW9kZU9wdGlvbnMudmFkQXV0b1RocmVzaG9sZDtcbiAgICAgICAgZmxhZ3NUb0NvbXBhcmUudmFkTGVhZGluID0gKG8pID0+IG8uaW5wdXRNb2RlT3B0aW9ucy52YWRMZWFkaW47XG4gICAgICAgIGZsYWdzVG9Db21wYXJlLnZhZFRocmVzaG9sZCA9IChvKSA9PiBvLmlucHV0TW9kZU9wdGlvbnMudmFkVGhyZXNob2xkO1xuICAgICAgICBmbGFnc1RvQ29tcGFyZS52YWRUcmFpbGluID0gKG8pID0+IG8uaW5wdXRNb2RlT3B0aW9ucy52YWRUcmFpbGluO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoZmxhZ3NUb0NvbXBhcmUpKSB7XG4gICAgICAgIGNvbnN0IGRpYWdWYWx1ZSA9IGRpYWdGbGFnc1trZXldO1xuICAgICAgICBjb25zdCBvcHRpb25zVmFsdWUgPSBmbGFnc1RvQ29tcGFyZVtrZXldKHRyYW5zcG9ydE9wdGlvbnMsIGtleSk7XG4gICAgICAgIGNvbnN0IGVxdWFsaXR5RnVuY3Rpb24gPSBlcXVhbGl0eU92ZXJyaWRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gZXF1YWxpdHlPdmVycmlkZXNba2V5XSA6IGRlZmF1bHRFcXVhbGl0eTtcbiAgICAgICAgY29uc3QgaXNFcXVhbCA9IGVxdWFsaXR5RnVuY3Rpb24oZGlhZ1ZhbHVlLCBvcHRpb25zVmFsdWUpO1xuXG4gICAgICAgIGlmICghaXNFcXVhbCkge1xuICAgICAgICAgIGNvbnRleHQuYWRkRXJyb3IoXG4gICAgICAgICAgICBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfRU5TVVJFX1RSQU5TUE9SVF9PUFRJT05TX01BVENIX0RJQUdOT1NUSUNfREFUQV9GTEFHX0VSUk9SX01JU01BVENILCB7XG4gICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgZGlhZ1ZhbHVlLFxuICAgICAgICAgICAgICBvcHRpb25zVmFsdWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuYWRkU3VjY2VzcyhcbiAgICAgICAgICAgIGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19FTlNVUkVfVFJBTlNQT1JUX09QVElPTlNfTUFUQ0hfRElBR05PU1RJQ19EQVRBX0ZMQUdfU1VDQ0VTU19NQVRDSEVELFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgIGRpYWdWYWx1ZSxcbiAgICAgICAgICAgICAgb3B0aW9uc1ZhbHVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjaGVja0lucHV0Vm9sdW1lTGV2ZWxzOiB7XG4gICAgbmFtZTogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0VOU1VSRV9DSEVDS19JTlBVVF9WT0xVTUVfTEVWRUxTX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19FTlNVUkVfQ0hFQ0tfSU5QVVRfVk9MVU1FX0xFVkVMU19ERVNDUklQVElPTixcbiAgICBydW4oY29sbGVjdGVkRGlhZ25vc3RpY3MsIGNvbnRleHQpIHtcbiAgICAgIGNvbnN0IHJlY2VudFZvbHVtZXMgPSBjb2xsZWN0ZWREaWFnbm9zdGljcy5OYXRpdmUubG9jYWxVc2VyLnZvbHVtZURiRlM7XG4gICAgICBpZiAocmVjZW50Vm9sdW1lcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXZlcmFnZVZvbHVtZSA9IHJlY2VudFZvbHVtZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyByZWNlbnRWb2x1bWVzLmxlbmd0aDtcbiAgICAgICAgaWYgKGF2ZXJhZ2VWb2x1bWUgPCAtOTkuMCkge1xuICAgICAgICAgIGNvbnRleHQuYWRkRXJyb3IoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0VOU1VSRV9DSEVDS19JTlBVVF9WT0xVTUVfTEVWRUxTX0VSUk9SX1ZPTFVNRV9MT09LU19MT1csIHtcbiAgICAgICAgICAgIGF2ZXJhZ2VWb2x1bWUsXG4gICAgICAgICAgICByZWNlbnRWb2x1bWVzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19FTlNVUkVfQ0hFQ0tfSU5QVVRfVk9MVU1FX0xFVkVMU19ERVRFQ1RFRF9BVURJT19JTlBVVCwge1xuICAgICAgICAgICAgYXZlcmFnZVZvbHVtZSxcbiAgICAgICAgICAgIHJlY2VudFZvbHVtZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjaGVja1Bpbmc6IHtcbiAgICBuYW1lOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfUElOR19OQU1FLFxuICAgIGRlc2NyaXB0aW9uOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfUElOR19ERVNDUklQVElPTixcbiAgICBydW4oY29sbGVjdGVkRGlhZ25vc3RpY3MsIGNvbnRleHQpIHtcbiAgICAgIGNvbnN0IFBJTkdfVEhSRVNIT0xEID0gMjUwO1xuXG4gICAgICBjb25zdCByZWNlbnRQaW5ncyA9IGNvbGxlY3RlZERpYWdub3N0aWNzLk5hdGl2ZS5sb2NhbFVzZXIucGluZztcbiAgICAgIGlmIChyZWNlbnRQaW5ncy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXZlcmFnZVBpbmcgPSByZWNlbnRQaW5ncy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIHJlY2VudFBpbmdzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgbWF4UGluZyA9IE1hdGgubWF4KC4uLnJlY2VudFBpbmdzKTtcblxuICAgICAgICAvLyBUZXN0IDIga2luZHMgb2YgcGluZ3MgLS0gY2hlY2sgdG8gc2VlIGlmIHRoZWlyIGF2ZXJhZ2UgaXMgaGlnaCBpbiBnZW5lcmFsLlxuICAgICAgICBpZiAoYXZlcmFnZVBpbmcgPj0gUElOR19USFJFU0hPTEQpIHtcbiAgICAgICAgICBjb250ZXh0LmFkZEVycm9yKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19QSU5HX0VSUk9SX0hJR0hfUElORywge1xuICAgICAgICAgICAgYXZlcmFnZVBpbmcsXG4gICAgICAgICAgICByZWNlbnRQaW5nc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIE9yIHRoZXkgaGFkIGEgc3Bpa2UgcmVjZW50bHkuXG4gICAgICAgIGVsc2UgaWYgKG1heFBpbmcgPj0gUElOR19USFJFU0hPTEQpIHtcbiAgICAgICAgICBjb250ZXh0LmFkZFdhcm5pbmcoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1BJTkdfV0FSTklOR19TUElLRSwge1xuICAgICAgICAgICAgYXZlcmFnZVBpbmcsXG4gICAgICAgICAgICBtYXhQaW5nLFxuICAgICAgICAgICAgcmVjZW50UGluZ3NcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmFkZFN1Y2Nlc3MoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1BJTkdfTk9NSU5BTCwge1xuICAgICAgICAgICAgYXZlcmFnZVBpbmcsXG4gICAgICAgICAgICByZWNlbnRQaW5nc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNoZWNrSW5wdXREZXZpY2VNYXRjaGVzOiB7XG4gICAgbmFtZTogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX0lOUFVUX0RFVklDRV9NQVRDSEVTX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19JTlBVVF9ERVZJQ0VfTUFUQ0hFU19ERVNDUklQVElPTixcbiAgICBydW4oZGlhZ25vc3RpY0RhdGEsIGNvbnRleHQsIHtWb2ljZUVuZ2luZVN0b3JlfSkge1xuICAgICAgY29uc3QgaW5wdXREZXZpY2VJZCA9IFZvaWNlRW5naW5lU3RvcmUuZ2V0SW5wdXREZXZpY2VJZCgpO1xuICAgICAgY29uc3QgaW5wdXREZXZpY2VzID0gVm9pY2VFbmdpbmVTdG9yZS5nZXRJbnB1dERldmljZXMoKTtcbiAgICAgIGNvbnN0IGlucHV0RGV2aWNlID0gaW5wdXREZXZpY2VzW2lucHV0RGV2aWNlSWRdO1xuICAgICAgY29uc3QgZGlhZ0lucHV0RGV2aWNlID0gZGlhZ25vc3RpY0RhdGEuTmF0aXZlLmlucHV0RGV2aWNlO1xuXG4gICAgICBjaGVja0RldmljZShkaWFnSW5wdXREZXZpY2UsIGlucHV0RGV2aWNlLCBjb250ZXh0KTtcbiAgICB9XG4gIH0sXG5cbiAgY2hlY2tPdXRwdXREZXZpY2VNYXRjaGVzOiB7XG4gICAgbmFtZTogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX09VVFBVVF9ERVZJQ0VfTUFUQ0hFU19OQU1FLFxuICAgIGRlc2NyaXB0aW9uOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfT1VUUFVUX0RFVklDRV9NQVRDSEVTX0RFU0NSSVBUSU9OLFxuICAgIHJ1bihkaWFnbm9zdGljRGF0YSwgY29udGV4dCwge1ZvaWNlRW5naW5lU3RvcmV9KSB7XG4gICAgICBjb25zdCBvdXRwdXREZXZpY2VJZCA9IFZvaWNlRW5naW5lU3RvcmUuZ2V0T3V0cHV0RGV2aWNlSWQoKTtcbiAgICAgIGNvbnN0IG91dHB1dERldmljZXMgPSBWb2ljZUVuZ2luZVN0b3JlLmdldE91dHB1dERldmljZXMoKTtcbiAgICAgIGNvbnN0IG91dHB1dERldmljZSA9IG91dHB1dERldmljZXNbb3V0cHV0RGV2aWNlSWRdO1xuICAgICAgY29uc3QgZGlhZ091dHB1dERldmljZSA9IGRpYWdub3N0aWNEYXRhLk5hdGl2ZS5vdXRwdXREZXZpY2U7XG5cbiAgICAgIGNoZWNrRGV2aWNlKGRpYWdPdXRwdXREZXZpY2UsIG91dHB1dERldmljZSwgY29udGV4dCk7XG4gICAgfVxuICB9LFxuXG4gIGNoZWNrVXNlclBhY2tldHM6IHtcbiAgICBuYW1lOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUl9QQUNLRVRTX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX1BBQ0tFVFNfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0LCB7Q2hhbm5lbFZvaWNlU3RhdGVTdG9yZSwgU2VsZWN0ZWRDaGFubmVsU3RvcmUsIEF1dGhlbnRpY2F0aW9uU3RvcmV9KSB7XG4gICAgICBjb25zdCB2b2ljZUNoYW5uZWxJZCA9IFNlbGVjdGVkQ2hhbm5lbFN0b3JlLmdldFZvaWNlQ2hhbm5lbElkKCk7XG4gICAgICBpZiAoIXZvaWNlQ2hhbm5lbElkKSB7XG4gICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfV0FSTklOR19OT19DSEFOTkVMKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgdm9pY2VTdGF0ZXMgPSBDaGFubmVsVm9pY2VTdGF0ZVN0b3JlLmdldFZvaWNlU3RhdGVzKHZvaWNlQ2hhbm5lbElkKTtcbiAgICAgIGNvbnN0IHdhc1VzZXJTZWVuID0ge307XG4gICAgICBjb25zdCB1bmtub3duVXNlcnMgPSBbXTtcbiAgICAgIGNvbnN0IG15SWQgPSBBdXRoZW50aWNhdGlvblN0b3JlLmdldElkKCk7XG4gICAgICB2b2ljZVN0YXRlcy5mb3JFYWNoKCh7dXNlcn0pID0+IHtcbiAgICAgICAgaWYgKHVzZXIuaWQgIT09IG15SWQpIHtcbiAgICAgICAgICB3YXNVc2VyU2Vlblt1c2VyLmlkXSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGlhZ25vc3RpY1VzZXJzID0gZGlhZ25vc3RpY0RhdGEuTmF0aXZlLnVzZXJzO1xuICAgICAgZGlhZ25vc3RpY1VzZXJzLmZvckVhY2goKHtpZH0pID0+IHtcbiAgICAgICAgaWYgKHdhc1VzZXJTZWVuLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgIHdhc1VzZXJTZWVuW2lkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdW5rbm93blVzZXJzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIE9iamVjdC5rZXlzKHdhc1VzZXJTZWVuKS5mb3JFYWNoKHVzZXJJZCA9PiB7XG4gICAgICAgIGNvbnN0IHVzZXJXYXNTZWVuID0gd2FzVXNlclNlZW5bdXNlcklkXTtcbiAgICAgICAgaWYgKHVzZXJXYXNTZWVuKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX1BBQ0tFVFNfVVNFUl9XQVNfU0VFTiwge3VzZXJJZH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUl9QQUNLRVRTX1dBUk5JTkdfTk9fUEFDS0VUX1NFRU4sIHtcbiAgICAgICAgICAgIHVzZXJJZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vZm9yIChsZXQgdXNlcklkIG9mIHVua25vd25Vc2Vycykge1xuICAgICAgLy8gIGNvbnRleHQuYWRkRXJyb3IoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfUEFDS0VUU19FUlJPUl9VTktOT1dOX1VTRVIsIHt1c2VySWR9KTtcbiAgICAgIC8vfVxuICAgIH1cbiAgfSxcblxuICBjaGVja1VzZXJWb2x1bWVzTWF0Y2g6IHtcbiAgICBuYW1lOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUl9WT0xVTUVTX01BVENIX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX1ZPTFVNRVNfTUFUQ0hfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0LCBzdG9yZXMpIHtcbiAgICAgIGNvbnN0IHVzZXJJZHMgPSBnZXRDaGFubmVsVXNlcklkcyhzdG9yZXMpO1xuICAgICAgaWYgKHVzZXJJZHMgPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfV0FSTklOR19OT19DSEFOTkVMKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qge1ZvaWNlRW5naW5lU3RvcmV9ID0gc3RvcmVzO1xuICAgICAgY29uc3QgZGlhZ25vc3RpY1VzZXJzID0gZGlhZ25vc3RpY0RhdGEuTmF0aXZlLnVzZXJzO1xuICAgICAgY29uc3QgYXVkaW9TZXR0aW5ncyA9IFZvaWNlRW5naW5lU3RvcmUuZ2V0QXVkaW9TZXR0aW5ncygpO1xuXG4gICAgICBkaWFnbm9zdGljVXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcbiAgICAgICAgLy8gSWdub3JlIHVzZXJzIHRoYXQgYXJlbid0IGluIHRoZSBjaGFubmVsLlxuICAgICAgICBpZiAoIXVzZXJJZHMuaGFzKHVzZXIuaWQpKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCB1c2VyVm9sdW1lID0gdXNlci52b2x1bWU7XG4gICAgICAgIC8vIE5vIG92ZXJyaWRlcyBhcmUgcHJlc2VudC5cbiAgICAgICAgaWYgKCFhdWRpb1NldHRpbmdzLmxvY2FsVm9sdW1lcy5oYXNPd25Qcm9wZXJ0eSh1c2VyLmlkKSAmJiB1c2VyVm9sdW1lID09IDEpIHtcbiAgICAgICAgICBjb250ZXh0LmFkZFN1Y2Nlc3MoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfVk9MVU1FU19NQVRDSF9OT01JTkFMLCB7XG4gICAgICAgICAgICB1c2VyVm9sdW1lLFxuICAgICAgICAgICAgdXNlcklkOiB1c2VyLmlkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9jYWxWb2x1bWUgPSBhdWRpb1NldHRpbmdzLmxvY2FsVm9sdW1lc1t1c2VyLmlkXSAvIDEwMDtcbiAgICAgICAgaWYgKCFmbG9hdEFsbW9zdEVxdWFscyhsb2NhbFZvbHVtZSwgdXNlclZvbHVtZSkpIHtcbiAgICAgICAgICBjb250ZXh0LmFkZEVycm9yKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX1ZPTFVNRVNfTUFUQ0hfRVJST1JfVk9MVU1FX01JU01BVENILCB7XG4gICAgICAgICAgICB1c2VyVm9sdW1lLFxuICAgICAgICAgICAgbG9jYWxWb2x1bWUsXG4gICAgICAgICAgICB1c2VySWQ6IHVzZXIuaWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmFkZFN1Y2Nlc3MoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfVk9MVU1FU19NQVRDSF9OT01JTkFMLCB7XG4gICAgICAgICAgICB1c2VyVm9sdW1lLFxuICAgICAgICAgICAgdXNlcklkOiB1c2VyLmlkXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBjaGVja1VzZXJNdXRlc01hdGNoOiB7XG4gICAgbmFtZTogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfTVVURVNfTUFUQ0hfTkFNRSxcbiAgICBkZXNjcmlwdGlvbjogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfTVVURVNfTUFUQ0hfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0LCBzdG9yZXMpIHtcbiAgICAgIGNvbnN0IHVzZXJJZHMgPSBnZXRDaGFubmVsVXNlcklkcyhzdG9yZXMpO1xuICAgICAgaWYgKHVzZXJJZHMgPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfV0FSTklOR19OT19DSEFOTkVMKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qge1ZvaWNlRW5naW5lU3RvcmV9ID0gc3RvcmVzO1xuICAgICAgY29uc3QgZGlhZ25vc3RpY1VzZXJzID0gZGlhZ25vc3RpY0RhdGEuTmF0aXZlLnVzZXJzO1xuICAgICAgY29uc3QgYXVkaW9TZXR0aW5ncyA9IFZvaWNlRW5naW5lU3RvcmUuZ2V0QXVkaW9TZXR0aW5ncygpO1xuXG4gICAgICBkaWFnbm9zdGljVXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcbiAgICAgICAgLy8gSWdub3JlIHVzZXJzIHRoYXQgYXJlbid0IGluIHRoZSBjaGFubmVsLlxuICAgICAgICBpZiAoIXVzZXJJZHMuaGFzKHVzZXIuaWQpKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCBsb2NhbE11dGVkID0gISFhdWRpb1NldHRpbmdzLmxvY2FsTXV0ZXNbdXNlci5pZF07XG4gICAgICAgIGNvbnN0IHVzZXJNdXRlZCA9IHVzZXIubXV0ZWQ7XG4gICAgICAgIGlmIChsb2NhbE11dGVkICE9PSB1c2VyTXV0ZWQpIHtcbiAgICAgICAgICBjb250ZXh0LmFkZEVycm9yKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX01VVEVTX0VSUk9SX01JU01BVENILCB7XG4gICAgICAgICAgICBsb2NhbE11dGVkLFxuICAgICAgICAgICAgdXNlck11dGVkLFxuICAgICAgICAgICAgdXNlcklkOiB1c2VyLmlkXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX01VVEVTX05PTUlOQUwsIHtcbiAgICAgICAgICAgIHVzZXJNdXRlZCxcbiAgICAgICAgICAgIHVzZXJJZDogdXNlci5pZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgY2hlY2tMb2NhbFVzZXI6IHtcbiAgICBuYW1lOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfTE9DQUxfVVNFUl9OQU1FLFxuICAgIGRlc2NyaXB0aW9uOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfTE9DQUxfVVNFUl9ERVNDUklQVElPTixcbiAgICBydW4oZGlhZ25vc3RpY0RhdGEsIGNvbnRleHQsIHtBdXRoZW50aWNhdGlvblN0b3JlfSkge1xuICAgICAgY29uc3QgZGlhZ25vc3RpY1VzZXJJZCA9IGRpYWdub3N0aWNEYXRhLk5hdGl2ZS5sb2NhbFVzZXIuaWQ7XG4gICAgICBjb25zdCB1c2VySWQgPSBBdXRoZW50aWNhdGlvblN0b3JlLmdldElkKCk7XG4gICAgICBpZiAodXNlcklkICE9IGRpYWdub3N0aWNVc2VySWQpIHtcbiAgICAgICAgY29udGV4dC5hZGRFcnJvcihpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfTE9DQUxfVVNFUl9OT01JTkFMLCB7XG4gICAgICAgICAgZGlhZ25vc3RpY1VzZXJJZCxcbiAgICAgICAgICB1c2VySWRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19MT0NBTF9VU0VSX05PTUlOQUwsIHtcbiAgICAgICAgICB1c2VySWRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNoZWNrVXNlcnNXaG9IYXZlTG93Vm9sdW1lczoge1xuICAgIG5hbWU6IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSU19XSE9fSEFWRV9MT1dfVk9MVU1FU19OQU1FLFxuICAgIGRlc2NyaXB0aW9uOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUlNfV0hPX0hBVkVfTE9XX1ZPTFVNRVNfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0LCBzdG9yZXMpIHtcbiAgICAgIGNvbnN0IHVzZXJJZHMgPSBnZXRDaGFubmVsVXNlcklkcyhzdG9yZXMpO1xuICAgICAgaWYgKCF1c2VySWRzKSB7XG4gICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfV0FSTklOR19OT19DSEFOTkVMKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgYXVkaW9TZXR0aW5ncyA9IHN0b3Jlcy5Wb2ljZUVuZ2luZVN0b3JlLmdldEF1ZGlvU2V0dGluZ3MoKTtcbiAgICAgIHVzZXJJZHMuZm9yRWFjaCh1c2VySWQgPT4ge1xuICAgICAgICBjb25zdCBsb2NhbFZvbHVtZSA9IGF1ZGlvU2V0dGluZ3MubG9jYWxWb2x1bWVzW3VzZXJJZF07XG4gICAgICAgIGlmIChsb2NhbFZvbHVtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSU19XSE9fSEFWRV9MT1dfVk9MVU1FU19OT01JTkFMX05PX09WRVJSSURFUywge1xuICAgICAgICAgICAgdXNlcklkXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobG9jYWxWb2x1bWUgPj0gNTApIHtcbiAgICAgICAgICBjb250ZXh0LmFkZFN1Y2Nlc3MoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJTX1dIT19IQVZFX0xPV19WT0xVTUVTX05PTUlOQUwsIHtcbiAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgIGxvY2FsVm9sdW1lOiBsb2NhbFZvbHVtZSB8IDBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsb2NhbFZvbHVtZSA+PSAxNSkge1xuICAgICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUlNfV0hPX0hBVkVfTE9XX1ZPTFVNRVNfV0FSTl9IQVJEX1RPX0hFQVIsIHtcbiAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgIGxvY2FsVm9sdW1lOiBsb2NhbFZvbHVtZSB8IDBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsb2NhbFZvbHVtZSA+PSA1KSB7XG4gICAgICAgICAgY29udGV4dC5hZGRFcnJvcihpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUlNfV0hPX0hBVkVfTE9XX1ZPTFVNRVNfRVJST1JfSEFSRF9UT19IRUFSLCB7XG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICBsb2NhbFZvbHVtZTogbG9jYWxWb2x1bWUgfCAwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5hZGRFcnJvcihpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVVNFUlNfV0hPX0hBVkVfTE9XX1ZPTFVNRVNfRVJST1JfVFVSTl9USEVNX1VQLCB7XG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICBsb2NhbFZvbHVtZTogbG9jYWxWb2x1bWUgfCAwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBjaGVja1VzZXJNYXliZU11dGVkOiB7XG4gICAgbmFtZTogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfTUFZQkVfTVVURURfTkFNRSxcbiAgICBkZXNjcmlwdGlvbjogaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VTRVJfTUFZQkVfTVVURURfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0LCBzdG9yZXMpIHtcbiAgICAgIGNvbnN0IHVzZXJJZHMgPSBnZXRDaGFubmVsVXNlcklkcyhzdG9yZXMpO1xuICAgICAgaWYgKCF1c2VySWRzKSB7XG4gICAgICAgIGNvbnRleHQuYWRkV2FybmluZyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfV0FSTklOR19OT19DSEFOTkVMKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgYXVkaW9TZXR0aW5ncyA9IHN0b3Jlcy5Wb2ljZUVuZ2luZVN0b3JlLmdldEF1ZGlvU2V0dGluZ3MoKTtcbiAgICAgIHVzZXJJZHMuZm9yRWFjaCh1c2VySWQgPT4ge1xuICAgICAgICBjb25zdCBsb2NhbE11dGVkID0gYXVkaW9TZXR0aW5ncy5sb2NhbE11dGVzW3VzZXJJZF07XG4gICAgICAgIGlmIChsb2NhbE11dGVkKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRXYXJuaW5nKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX01BWUJFX01VVEVEX1dBUk5fVVNFUl9NVVRFRCwge1xuICAgICAgICAgICAgdXNlcklkXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5hZGRTdWNjZXNzKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VU0VSX01BWUJFX01VVEVEX05PTUlOQUwsIHtcbiAgICAgICAgICAgIHVzZXJJZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gamFrZTogU2hlbHZlZCBmb3Igbm93LCBJIG5lZWQgdG8gY29sbGVjdCBtb3JlIGluZm8gb24gYWNjZXB0YWJsZSB2YWx1ZXMgZm9yIHRoZXNlLlxuICAvL2NoZWNrVXNlckppdHRlcjoge1xuICAvLyAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0KSB7XG4gIC8vICAgIC8vIENoZWNrIGppdHRlci5cbiAgLy8gIH1cbiAgLy99LFxuICAvL1xuICAvL2NoZWNrVXNlclBhY2tldExvc3M6IHtcbiAgLy8gIHJ1bigpIHtcbiAgLy8gICAgLy8gQ2hlY2sgdXNlcidzIHBhY2tldCBsb3NzIHJhdGUuXG4gIC8vICB9XG4gIC8vfSxcbiAgLy9cbiAgLy9jaGVja1VzZXJQYWNrZXRXYWl0aW5nVGltZXM6IHtcbiAgLy8gIHJ1bigpIHtcbiAgLy8gICAgLy8gQ2hlY2sgd2hldGhlciBwYWNrZXQgd2FpdGluZyB0aW1lcyBleGNlZWQgYSBnaXZlbiB2YWx1ZS5cbiAgLy8gIH1cbiAgLy99LFxuXG4gIGNoZWNrVW5rbm93blNzcmM6IHtcbiAgICBuYW1lOiBpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVU5LTk9XTl9TU1JDX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VTktOT1dOX1NTUkNfREVTQ1JJUFRJT04sXG4gICAgcnVuKGRpYWdub3N0aWNEYXRhLCBjb250ZXh0KSB7XG4gICAgICBjb25zdCB1bmtub3duVXNlcnMgPSBkaWFnbm9zdGljRGF0YS5OYXRpdmUudW5rbm93blVzZXJzO1xuICAgICAgY29uc3QgdXNlck9wdGlvbnMgPSBWb2ljZUVuZ2luZS5nZXRVc2VyT3B0aW9ucygpO1xuICAgICAgY29uc3Qga25vd25Tc3JjID0ge307XG4gICAgICB1c2VyT3B0aW9ucy5mb3JFYWNoKHVzZXIgPT4ge1xuICAgICAgICBrbm93blNzcmNbdXNlci5zc3JjXSA9IHVzZXI7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHVua25vd25Vc2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVua25vd25Vc2Vycy5mb3JFYWNoKCh7c3NyYywgYnl0ZXNSeH0pID0+IHtcbiAgICAgICAgICBjb25zdCB1c2VySW5mbyA9IGtub3duU3NyY1tzc3JjXTtcbiAgICAgICAgICBpZiAodXNlckluZm8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGV4dC5hZGRXYXJuaW5nKGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19VTktOT1dOX1NTUkNfV0FSTklOR19GT1JNRVJMWV9VTktOT1dOLCB7XG4gICAgICAgICAgICAgIHVzZXJJZDogdXNlckluZm8uaWQsXG4gICAgICAgICAgICAgIHNzcmMsXG4gICAgICAgICAgICAgIGJ5dGVzUnhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRleHQuYWRkRXJyb3IoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX1VOS05PV05fU1NSQ19FUlJPUl9VTktOT1dOX1NTUkNfUEFDS0VUU19SRUNFSVZFRCwge1xuICAgICAgICAgICAgICBzc3JjLFxuICAgICAgICAgICAgICBieXRlc1J4XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHQuYWRkU3VjY2VzcyhpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfVU5LTk9XTl9TU1JDX05PTUlOQUwpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjaGVja0RlY3J5cHRpb25GYWlsdXJlczoge1xuICAgIG5hbWU6IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19ERUNSWVBUSU9OX0ZBSUxVUkVTX05BTUUsXG4gICAgZGVzY3JpcHRpb246IGkxOG4uTWVzc2FnZXMuRElBR05PU1RJQ19DSEVDS19ERUNSWVBUSU9OX0ZBSUxVUkVTX0RFU0NSSVBUSU9OLFxuICAgIHJ1bihkaWFnbm9zdGljRGF0YSwgY29udGV4dCkge1xuICAgICAgY29uc3QgZGVjcnlwdGlvbkZhaWx1cmVzID0gZGlhZ25vc3RpY0RhdGEuTmF0aXZlLmRlY3J5cHRpb25GYWlsdXJlcztcblxuICAgICAgaWYgKGRlY3J5cHRpb25GYWlsdXJlcyA+IDApIHtcbiAgICAgICAgY29udGV4dC5hZGRFcnJvcihpMThuLk1lc3NhZ2VzLkRJQUdOT1NUSUNfQ0hFQ0tfREVDUllQVElPTl9GQUlMVVJFU19FUlJPUl9ERVRFQ1RFRF9GQUlMVVJFUywge1xuICAgICAgICAgIGRlY3J5cHRpb25GYWlsdXJlc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb250ZXh0LmFkZFN1Y2Nlc3MoaTE4bi5NZXNzYWdlcy5ESUFHTk9TVElDX0NIRUNLX0RFQ1JZUFRJT05fRkFJTFVSRVNfTk9NSU5BTCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBBTExfRElBR05PU1RJQ1MgPSBPYmplY3Qua2V5cyhkaWFnbm9zdGljcyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5EaWFnbm9zdGljcyhjb2xsZWN0ZWREaWFnbm9zdGljcywge1xuICBWb2ljZUVuZ2luZVN0b3JlLCBDaGFubmVsVm9pY2VTdGF0ZVN0b3JlLCBTZWxlY3RlZENoYW5uZWxTdG9yZSwgQXV0aGVudGljYXRpb25TdG9yZSAvKiBleHBsaWNpdCBhYm91dCB3aGF0IHN0b3JlcyB3ZSBuZWVkICovXG4gIH0sIGRpYWdub3N0aWNzVG9SdW4gPSBBTExfRElBR05PU1RJQ1MpIHtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBEaWFnbm9zdGljc0NvbnRleHQoKTtcbiAgY29uc3Qgc3RvcmVzID0ge1ZvaWNlRW5naW5lU3RvcmUsIENoYW5uZWxWb2ljZVN0YXRlU3RvcmUsIFNlbGVjdGVkQ2hhbm5lbFN0b3JlLCBBdXRoZW50aWNhdGlvblN0b3JlfTtcblxuICBmb3IgKGxldCBkaWFnbm9zdGljS2V5IG9mIGRpYWdub3N0aWNzVG9SdW4pIHtcbiAgICBjb25zdCBkaWFnbm9zdGljID0gZGlhZ25vc3RpY3NbZGlhZ25vc3RpY0tleV07XG4gICAgY29udGV4dC5wdXNoRGlhZ25vc3RpYyhkaWFnbm9zdGljS2V5KTtcbiAgICB0cnkge1xuICAgICAgZGlhZ25vc3RpYy5ydW4oY29sbGVjdGVkRGlhZ25vc3RpY3MsIGNvbnRleHQsIHN0b3Jlcyk7XG4gICAgICBjb250ZXh0LnBvcERpYWdub3N0aWMoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb250ZXh0LmRpYWdub3N0aWNGYWlsZWQoZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB7ZGlhZ25vc3RpY3NSYW46IGRpYWdub3N0aWNzVG9SdW4sIGxvZ3M6IGNvbnRleHQubG9nc307XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaWFnbm9zdGljSW5mbyhkaWFnbm9zdGljS2V5KSB7XG4gIGNvbnN0IGRpYWdub3N0aWMgPSBkaWFnbm9zdGljc1tkaWFnbm9zdGljS2V5XTtcbiAgaWYgKGRpYWdub3N0aWMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBkaWFnbm9zdGljLm5hbWUsXG4gICAgZGVzY3JpcHRpb246IGRpYWdub3N0aWMuZGVzY3JpcHRpb25cbiAgfTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3ZvaWNlX2VuZ2luZS9uYXRpdmUvRGlhZ25vc3RpY3MuanNcbiAqKi8iXX0=