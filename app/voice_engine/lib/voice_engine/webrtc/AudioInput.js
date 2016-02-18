'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
//import i18n from '../../../i18n';


var _combokeys = require('combokeys');

var _combokeys2 = _interopRequireDefault(_combokeys);

var _globalBind = require('combokeys/plugins/global-bind');

var _globalBind2 = _interopRequireDefault(_globalBind);

var _VAD = require('./VAD');

var _VAD2 = _interopRequireDefault(_VAD);

var _Constants = require('../../../Constants');

var _Logger = require('../../Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _platform = require('platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AudioInput = function () {
  function AudioInput() {
    _classCallCheck(this, AudioInput);

    this.context = new AudioContext();

    this.logger = _Logger2.default.create('AudioInput');

    this._mute = false;
    this._echoCancellation = true;
    this._noiseSuppression = true;
    this._automaticGainControl = true;

    this._sourceId = null;

    this.stream = null;

    this.speaking = false;
    this.onSpeaking = function () {};
    this.onPacket = function () {};
    this.onVoiceActivity = null;

    this.mode = _Constants.InputModes.VOICE_ACTIVITY;
    this.modeOptions = {};

    this.cleanup = null;
  }

  /**
   * Reset anything that might be useful on a new connection.
   */


  _createClass(AudioInput, [{
    key: 'reset',
    value: function reset() {
      this._setSpeaking(false);
    }

    /**
     * Determine if this user is muted.
     *
     * @return {Boolean}
     */

  }, {
    key: 'enable',


    /**
     * Request Audio input from the user.
     *
     * @param {Function} [callback]
     */
    value: function enable(callback) {
      var _this = this;

      if (this.cleanup) {
        this.cleanup();
        this.cleanup = null;
        this.stream = null;
      }

      this.getInputDevices(function (sources) {
        var constraints = [{ googEchoCancellation: _this.echoCancellation }, { googEchoCancellation2: _this.echoCancellation }, { googNoiseSuppression: _this.noiseSuppression }, { googNoiseSuppression2: _this.noiseSuppression }, { googAutoGainControl: _this.automaticGainControl }, { googAutoGainControl2: _this.automaticGainControl }, { googHighpassFilter: true }, { googTypingNoiseDetection: true }];

        if (sources.some(function (source) {
          return source.id === _this._sourceId;
        })) {
          constraints.push({ sourceId: _this._sourceId });
        }

        navigator.getUserMedia({ audio: { optional: constraints } }, function (stream) {
          _this.stream = stream;
          _this._updateAudioTracks();

          if (_this.mode) {
            _this.setMode(_this.mode, _this.modeOptions);
          }

          callback && callback(null, stream);
        }, function (err) {
          // Normalize errors between Firefox and Chrome.
          if (typeof err !== 'string') {
            switch (err.name) {
              case 'PermissionDeniedError':
                err = 'PERMISSION_DENIED';
                break;
              case 'PermissionDismissedError':
                err = 'PERMISSION_DISMISSED';
                break;
              case 'DevicesNotFoundError':
                err = 'NO_DEVICES_FOUND';
                break;
              default:
                err = 'UNKNOWN';
            }
          }
          callback && callback(err);
        });
      });
    }

    /**
     * Set the current input device.
     *
     * @param {Number} sourceId
     * @param {Function} [callback]
     */

  }, {
    key: 'setSource',
    value: function setSource(sourceId) {
      var callback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      this._sourceId = sourceId;
      if (this.stream != null) {
        this.enable(callback);
      } else {
        if (callback != null) {
          callback('NO_STREAM');
        }
      }
    }

    /**
     * Get list of input devices.
     *
     * @param {Function} callback
     */

  }, {
    key: 'getInputDevices',
    value: function getInputDevices(callback) {
      if (MediaStreamTrack.getSources != null) {
        MediaStreamTrack.getSources(function (sources) {
          var inputDevices = sources.filter(function (source) {
            return source.kind === 'audio';
          }).map(function (source, i) {
            return {
              id: source.id,
              index: i,
              name: source.label || 'Source ' + i
            };
          });
          callback(inputDevices);
        });
      } else {
        process.nextTick(function () {
          callback([{ id: 'default', index: 0, name: 'Default' }]);
        });
      }
    }

    /**
     * Get all the output devices.
     *
     * @param {Function} callback
     */

  }, {
    key: 'getOutputDevices',
    value: function getOutputDevices(callback) {
      process.nextTick(function () {
        callback([{ id: 'default', index: 0, name: 'Default' }]);
      });
    }

    /**
     * Set input mode for the microphone and cleanup previous mode.
     *
     * @param {String} mode
     * @param {Object} options
     */

  }, {
    key: 'setMode',
    value: function setMode(mode) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (this.cleanup) {
        this.cleanup();
      }

      this.mode = mode;
      this.modeOptions = options;

      if (this.stream == null) {
        return;
      }

      switch (mode) {
        case _Constants.InputModes.PUSH_TO_TALK:
          this.cleanup = this._setupPushToTalk(options);
          break;
        case _Constants.InputModes.VOICE_ACTIVITY:
          this.cleanup = this._setupVoiceActivity(options);
          break;
      }
    }

    /**
     * Enable speaking. Intended to be used when PTT is active.
     *
     */

  }, {
    key: 'setPTTActive',
    value: function setPTTActive(active) {
      var _this2 = this;

      if (this.mute) {
        return;
      }

      if (this.speaking === active) {
        return;
      }

      if (this._pttDelayTimeout) {
        window.clearTimeout(this._pttDelayTimeout);
        this._pttDelayTimeout = null;
      }

      if (!active) {
        this._pttDelayTimeout = window.setTimeout(function () {
          _this2._setSpeaking(false);
          _this2._pttDelayTimeout = null;
        }, this.modeOptions.delay);
      } else {
        this._setSpeaking(active);
      }
    }

    // Private

    /**
     * Enable voice capture by detecting voice activity on the microphone.
     *
     * @param {Object} options
     * @return {Function}
     */

  }, {
    key: '_setupVoiceActivity',
    value: function _setupVoiceActivity(options) {
      var _this3 = this;

      var vad = new _VAD2.default(this.context, this.stream, options.threshold);
      vad.onProcess = function (speaking, currentVolume) {
        if (!_this3.mute) {
          _this3._setSpeaking(speaking);
        }
        if (_this3.onVoiceActivity) {
          _this3.onVoiceActivity(currentVolume);
        }
      };

      return function () {
        vad.stop();
        vad = null;

        _this3._setSpeaking(false);
      };
    }

    /**
     * Enable voice capture while holding down a specific hotkey.
     *
     * @param {Object} options
     * @return {Function}
     */

  }, {
    key: '_setupPushToTalk',
    value: function _setupPushToTalk(options) {
      var _this4 = this;

      var shortcut = options['shortcut'];

      if (shortcut == null) return null;

      var combokeys = (0, _globalBind2.default)(new _combokeys2.default(document));
      combokeys.bindGlobal(shortcut, function (e) {
        if (e.target === document.body) {
          e.preventDefault();
        }
        if (e.target.parentNode.classList.contains('shortcut-recorder')) {
          return;
        }
        _this4.setPTTActive(true);
      }, 'keydown');
      combokeys.bindGlobal(shortcut, function (e) {
        if (e.target === document.body) {
          e.preventDefault();
        }
        if (e.target.parentNode.classList.contains('shortcut-recorder')) {
          return;
        }
        _this4.setPTTActive(false);
      }, 'keyup');

      return function () {
        combokeys.reset();
        combokeys = null;

        _this4._setSpeaking(false);
      };
    }

    /**
     * Update whether speech is currently being played.
     *
     * @param {boolean} speaking
     */

  }, {
    key: '_setSpeaking',
    value: function _setSpeaking(speaking) {
      if (this.speaking === speaking) return;
      this.speaking = speaking;
      this._updateAudioTracks();
      this.onSpeaking(speaking);
    }

    /**
     * Enables or disables all autio tracks based on current speaking status.
     */

  }, {
    key: '_updateAudioTracks',
    value: function _updateAudioTracks() {
      if (_platform2.default.name === 'Chrome') {
        var speaking = this.mode === _Constants.InputModes.VOICE_ACTIVITY ? !this.mute : this.speaking;
        if (this.stream != null) {
          var audioTracks = this.stream.getAudioTracks();
          for (var i = 0, l = audioTracks.length; i < l; i++) {
            audioTracks[i].enabled = speaking;
          }
        }
      }
    }
  }, {
    key: 'mute',
    get: function get() {
      return this._mute;
    }

    /**
     * Set if this user is muted.
     *
     * @param {Boolean} mute
     */
    ,
    set: function set(mute) {
      this._mute = mute;
      this._setSpeaking(false);
    }

    /**
     * Determine if echo cancellation is enabled.
     *
     * @return {Boolean}
     */

  }, {
    key: 'echoCancellation',
    get: function get() {
      return this._echoCancellation;
    }

    /**
     * Set if echo cancellation is enabled.
     *
     * @param {Boolean} enabled
     */
    ,
    set: function set(enabled) {
      this._echoCancellation = enabled;
      this.stream && this.enable();
    }

    /**
     * Determine if noise suppression is enabled.
     *
     * @return {Boolean}
     */

  }, {
    key: 'noiseSuppression',
    get: function get() {
      return this._noiseSuppression;
    }

    /**
     * Set if noise suppression is enabled.
     *
     * @param {Boolean} enabled
     */
    ,
    set: function set(enabled) {
      this._noiseSuppression = enabled;
      this.stream && this.enable();
    }

    /**
     * Determine if automatic gain control is enabled.
     *
     * @return {Boolean}
     */

  }, {
    key: 'automaticGainControl',
    get: function get() {
      return this._automaticGainControl;
    }

    /**
     * Set if automatic gain control is enabled.
     *
     * @param {Boolean} enabled
     */
    ,
    set: function set(enabled) {
      this._automaticGainControl = enabled;
      this.stream && this.enable();
    }
  }]);

  return AudioInput;
}();

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/AudioInput.js
 **/


exports.default = AudioInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvQXVkaW9JbnB1dC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFRcUI7QUFDbkIsV0FEbUIsVUFDbkIsR0FBYzswQkFESyxZQUNMOztBQUNaLFNBQUssT0FBTCxHQUFlLElBQUksWUFBSixFQUFmLENBRFk7O0FBR1osU0FBSyxNQUFMLEdBQWMsaUJBQU8sTUFBUCxjQUFkLENBSFk7O0FBS1osU0FBSyxLQUFMLEdBQWEsS0FBYixDQUxZO0FBTVosU0FBSyxpQkFBTCxHQUF5QixJQUF6QixDQU5ZO0FBT1osU0FBSyxpQkFBTCxHQUF5QixJQUF6QixDQVBZO0FBUVosU0FBSyxxQkFBTCxHQUE2QixJQUE3QixDQVJZOztBQVVaLFNBQUssU0FBTCxHQUFpQixJQUFqQixDQVZZOztBQVlaLFNBQUssTUFBTCxHQUFjLElBQWQsQ0FaWTs7QUFjWixTQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0FkWTtBQWVaLFNBQUssVUFBTCxHQUFrQixZQUFXLEVBQVgsQ0FmTjtBQWdCWixTQUFLLFFBQUwsR0FBZ0IsWUFBVyxFQUFYLENBaEJKO0FBaUJaLFNBQUssZUFBTCxHQUF1QixJQUF2QixDQWpCWTs7QUFtQlosU0FBSyxJQUFMLEdBQVksc0JBQVcsY0FBWCxDQW5CQTtBQW9CWixTQUFLLFdBQUwsR0FBbUIsRUFBbkIsQ0FwQlk7O0FBc0JaLFNBQUssT0FBTCxHQUFlLElBQWYsQ0F0Qlk7R0FBZDs7Ozs7OztlQURtQjs7NEJBNkJYO0FBQ04sV0FBSyxZQUFMLENBQWtCLEtBQWxCLEVBRE07Ozs7Ozs7Ozs7Ozs7Ozs7OzsyQkFxRkQsVUFBVTs7O0FBQ2YsVUFBSSxLQUFLLE9BQUwsRUFBYztBQUNoQixhQUFLLE9BQUwsR0FEZ0I7QUFFaEIsYUFBSyxPQUFMLEdBQWUsSUFBZixDQUZnQjtBQUdoQixhQUFLLE1BQUws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QkF4VVM7QUFDVCxhQUFPLEtBQUssS0FBTCxDQURFOzs7Ozs7Ozs7c0JBU0YsTUFBTTtBQUNiLFdBQUssS0FBTCxHQUFhLElBQWIsQ0FEYTtBQUViLFdBQUssWUFBTCxDQUFrQixLQUFsQixFQUZhOzs7Ozs7Ozs7Ozt3QkFVUTtBQUNyQixhQUFPLEtBQUssaUJBQUwsQ0FEYzs7Ozs7Ozs7O3NCQVNGLFNBQVM7QUFDNUIsV0FBSyxpQkFBTCxHQUF5QixPQUF6QixDQUQ0QjtBQUU1QixXQUFLLE1BQUwsSUFBZSxLQUFLLE1BQUwsRUFBZixDQUY0Qjs7Ozs7Ozs7Ozs7d0JBVVA7QUFDckIsYUFBTyxLQUFLLGlCQUFMLENBRGM7Ozs7Ozs7OztzQkFTRixTQUFTO0FBQzVCLFdBQUssaUJBQUwsR0FBeUIsT0FBekIsQ0FENEI7QUFFNUIsV0FBSyxNQUFMLElBQWUsS0FBSyxNQUFMLEVBQWYsQ0FGNEI7Ozs7Ozs7Ozs7O3dCQVVIO0FBQ3pCLGFBQU8sS0FBSyxxQkFBTCxDQURrQjs7Ozs7Ozs7O3NCQVNGLFNBQVM7QUFDaEMsV0FBSyxxQkFBTCxHQUE2QixPQUE3QixDQURnQztBQUVoQyxXQUFLLE1BQUwsSUFBZSxLQUFLLE1BQUwsRUFBZixDQUZnQzs7OztTQXhHZiIsImZpbGUiOiJBdWRpb0lucHV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENvbWJva2V5cyBmcm9tICdjb21ib2tleXMnO1xuaW1wb3J0IGJpbmRHbG9iYWwgZnJvbSAnY29tYm9rZXlzL3BsdWdpbnMvZ2xvYmFsLWJpbmQnO1xuaW1wb3J0IFZBRCBmcm9tICcuL1ZBRCc7XG5pbXBvcnQge0lucHV0TW9kZXN9IGZyb20gJy4uLy4uLy4uL0NvbnN0YW50cyc7XG5pbXBvcnQgTG9nZ2VyIGZyb20gJy4uLy4uL0xvZ2dlcic7XG4vL2ltcG9ydCBpMThuIGZyb20gJy4uLy4uLy4uL2kxOG4nO1xuaW1wb3J0IHBsYXRmb3JtIGZyb20gJ3BsYXRmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXVkaW9JbnB1dCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgIHRoaXMubG9nZ2VyID0gTG9nZ2VyLmNyZWF0ZShgQXVkaW9JbnB1dGApO1xuXG4gICAgdGhpcy5fbXV0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2VjaG9DYW5jZWxsYXRpb24gPSB0cnVlO1xuICAgIHRoaXMuX25vaXNlU3VwcHJlc3Npb24gPSB0cnVlO1xuICAgIHRoaXMuX2F1dG9tYXRpY0dhaW5Db250cm9sID0gdHJ1ZTtcblxuICAgIHRoaXMuX3NvdXJjZUlkID0gbnVsbDtcblxuICAgIHRoaXMuc3RyZWFtID0gbnVsbDtcblxuICAgIHRoaXMuc3BlYWtpbmcgPSBmYWxzZTtcbiAgICB0aGlzLm9uU3BlYWtpbmcgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMub25QYWNrZXQgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMub25Wb2ljZUFjdGl2aXR5ID0gbnVsbDtcblxuICAgIHRoaXMubW9kZSA9IElucHV0TW9kZXMuVk9JQ0VfQUNUSVZJVFk7XG4gICAgdGhpcy5tb2RlT3B0aW9ucyA9IHt9O1xuXG4gICAgdGhpcy5jbGVhbnVwID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhbnl0aGluZyB0aGF0IG1pZ2h0IGJlIHVzZWZ1bCBvbiBhIG5ldyBjb25uZWN0aW9uLlxuICAgKi9cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5fc2V0U3BlYWtpbmcoZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGlzIHVzZXIgaXMgbXV0ZWQuXG4gICAqXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgbXV0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbXV0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaWYgdGhpcyB1c2VyIGlzIG11dGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG11dGVcbiAgICovXG4gIHNldCBtdXRlKG11dGUpIHtcbiAgICB0aGlzLl9tdXRlID0gbXV0ZTtcbiAgICB0aGlzLl9zZXRTcGVha2luZyhmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIGVjaG8gY2FuY2VsbGF0aW9uIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgZWNob0NhbmNlbGxhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZWNob0NhbmNlbGxhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaWYgZWNobyBjYW5jZWxsYXRpb24gaXMgZW5hYmxlZC5cbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBlbmFibGVkXG4gICAqL1xuICBzZXQgZWNob0NhbmNlbGxhdGlvbihlbmFibGVkKSB7XG4gICAgdGhpcy5fZWNob0NhbmNlbGxhdGlvbiA9IGVuYWJsZWQ7XG4gICAgdGhpcy5zdHJlYW0gJiYgdGhpcy5lbmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgbm9pc2Ugc3VwcHJlc3Npb24gaXMgZW5hYmxlZC5cbiAgICpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBub2lzZVN1cHByZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9ub2lzZVN1cHByZXNzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBpZiBub2lzZSBzdXBwcmVzc2lvbiBpcyBlbmFibGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGVuYWJsZWRcbiAgICovXG4gIHNldCBub2lzZVN1cHByZXNzaW9uKGVuYWJsZWQpIHtcbiAgICB0aGlzLl9ub2lzZVN1cHByZXNzaW9uID0gZW5hYmxlZDtcbiAgICB0aGlzLnN0cmVhbSAmJiB0aGlzLmVuYWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiBhdXRvbWF0aWMgZ2FpbiBjb250cm9sIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgYXV0b21hdGljR2FpbkNvbnRyb2woKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F1dG9tYXRpY0dhaW5Db250cm9sO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBpZiBhdXRvbWF0aWMgZ2FpbiBjb250cm9sIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZW5hYmxlZFxuICAgKi9cbiAgc2V0IGF1dG9tYXRpY0dhaW5Db250cm9sKGVuYWJsZWQpIHtcbiAgICB0aGlzLl9hdXRvbWF0aWNHYWluQ29udHJvbCA9IGVuYWJsZWQ7XG4gICAgdGhpcy5zdHJlYW0gJiYgdGhpcy5lbmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IEF1ZGlvIGlucHV0IGZyb20gdGhlIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja11cbiAgICovXG4gIGVuYWJsZShjYWxsYmFjaykge1xuICAgIGlmICh0aGlzLmNsZWFudXApIHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgdGhpcy5jbGVhbnVwID0gbnVsbDtcbiAgICAgIHRoaXMuc3RyZWFtID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmdldElucHV0RGV2aWNlcyhzb3VyY2VzID0+IHtcbiAgICAgIGxldCBjb25zdHJhaW50cyA9IFtcbiAgICAgICAge2dvb2dFY2hvQ2FuY2VsbGF0aW9uOiB0aGlzLmVjaG9DYW5jZWxsYXRpb259LFxuICAgICAgICB7Z29vZ0VjaG9DYW5jZWxsYXRpb24yOiB0aGlzLmVjaG9DYW5jZWxsYXRpb259LFxuICAgICAgICB7Z29vZ05vaXNlU3VwcHJlc3Npb246IHRoaXMubm9pc2VTdXBwcmVzc2lvbn0sXG4gICAgICAgIHtnb29nTm9pc2VTdXBwcmVzc2lvbjI6IHRoaXMubm9pc2VTdXBwcmVzc2lvbn0sXG4gICAgICAgIHtnb29nQXV0b0dhaW5Db250cm9sOiB0aGlzLmF1dG9tYXRpY0dhaW5Db250cm9sfSxcbiAgICAgICAge2dvb2dBdXRvR2FpbkNvbnRyb2wyOiB0aGlzLmF1dG9tYXRpY0dhaW5Db250cm9sfSxcbiAgICAgICAge2dvb2dIaWdocGFzc0ZpbHRlcjogdHJ1ZX0sXG4gICAgICAgIHtnb29nVHlwaW5nTm9pc2VEZXRlY3Rpb246IHRydWV9XG4gICAgICBdO1xuXG4gICAgICBpZiAoc291cmNlcy5zb21lKHNvdXJjZSA9PiBzb3VyY2UuaWQgPT09IHRoaXMuX3NvdXJjZUlkKSkge1xuICAgICAgICBjb25zdHJhaW50cy5wdXNoKHtzb3VyY2VJZDogdGhpcy5fc291cmNlSWR9KTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHtvcHRpb25hbDogY29uc3RyYWludHN9fSxcbiAgICAgICAgc3RyZWFtID0+IHtcbiAgICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcbiAgICAgICAgICB0aGlzLl91cGRhdGVBdWRpb1RyYWNrcygpO1xuXG4gICAgICAgICAgaWYgKHRoaXMubW9kZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRNb2RlKHRoaXMubW9kZSwgdGhpcy5tb2RlT3B0aW9ucyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgc3RyZWFtKTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyID0+IHtcbiAgICAgICAgICAvLyBOb3JtYWxpemUgZXJyb3JzIGJldHdlZW4gRmlyZWZveCBhbmQgQ2hyb21lLlxuICAgICAgICAgIGlmICh0eXBlb2YgZXJyICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc3dpdGNoIChlcnIubmFtZSkge1xuICAgICAgICAgICAgICBjYXNlICdQZXJtaXNzaW9uRGVuaWVkRXJyb3InOlxuICAgICAgICAgICAgICAgIGVyciA9ICdQRVJNSVNTSU9OX0RFTklFRCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ1Blcm1pc3Npb25EaXNtaXNzZWRFcnJvcic6XG4gICAgICAgICAgICAgICAgZXJyID0gJ1BFUk1JU1NJT05fRElTTUlTU0VEJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnRGV2aWNlc05vdEZvdW5kRXJyb3InOlxuICAgICAgICAgICAgICAgIGVyciA9ICdOT19ERVZJQ0VTX0ZPVU5EJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBlcnIgPSAnVU5LTk9XTic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjdXJyZW50IGlucHV0IGRldmljZS5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNvdXJjZUlkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja11cbiAgICovXG4gIHNldFNvdXJjZShzb3VyY2VJZCwgY2FsbGJhY2s9bnVsbCkge1xuICAgIHRoaXMuX3NvdXJjZUlkID0gc291cmNlSWQ7XG4gICAgaWYgKHRoaXMuc3RyZWFtICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZW5hYmxlKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICBjYWxsYmFjaygnTk9fU1RSRUFNJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBsaXN0IG9mIGlucHV0IGRldmljZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBnZXRJbnB1dERldmljZXMoY2FsbGJhY2spIHtcbiAgICBpZiAoTWVkaWFTdHJlYW1UcmFjay5nZXRTb3VyY2VzICE9IG51bGwpIHtcbiAgICAgIE1lZGlhU3RyZWFtVHJhY2suZ2V0U291cmNlcyhzb3VyY2VzID0+IHtcbiAgICAgICAgY29uc3QgaW5wdXREZXZpY2VzID0gc291cmNlc1xuICAgICAgICAgIC5maWx0ZXIoc291cmNlID0+IHNvdXJjZS5raW5kID09PSAnYXVkaW8nKVxuICAgICAgICAgIC5tYXAoKHNvdXJjZSwgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgaWQ6IHNvdXJjZS5pZCxcbiAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgIG5hbWU6IHNvdXJjZS5sYWJlbCB8fCBgU291cmNlICR7aX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgICBjYWxsYmFjayhpbnB1dERldmljZXMpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKFt7aWQ6ICdkZWZhdWx0JywgaW5kZXg6IDAsIG5hbWU6ICdEZWZhdWx0J31dKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRoZSBvdXRwdXQgZGV2aWNlcy5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIGdldE91dHB1dERldmljZXMoY2FsbGJhY2spIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgIGNhbGxiYWNrKFt7aWQ6ICdkZWZhdWx0JywgaW5kZXg6IDAsIG5hbWU6ICdEZWZhdWx0J31dKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaW5wdXQgbW9kZSBmb3IgdGhlIG1pY3JvcGhvbmUgYW5kIGNsZWFudXAgcHJldmlvdXMgbW9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1vZGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICovXG4gIHNldE1vZGUobW9kZSwgb3B0aW9ucz17fSkge1xuICAgIGlmICh0aGlzLmNsZWFudXApIHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cblxuICAgIHRoaXMubW9kZSA9IG1vZGU7XG4gICAgdGhpcy5tb2RlT3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBpZiAodGhpcy5zdHJlYW0gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgY2FzZSBJbnB1dE1vZGVzLlBVU0hfVE9fVEFMSzpcbiAgICAgICAgdGhpcy5jbGVhbnVwID0gdGhpcy5fc2V0dXBQdXNoVG9UYWxrKG9wdGlvbnMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSW5wdXRNb2Rlcy5WT0lDRV9BQ1RJVklUWTpcbiAgICAgICAgdGhpcy5jbGVhbnVwID0gdGhpcy5fc2V0dXBWb2ljZUFjdGl2aXR5KG9wdGlvbnMpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHNwZWFraW5nLiBJbnRlbmRlZCB0byBiZSB1c2VkIHdoZW4gUFRUIGlzIGFjdGl2ZS5cbiAgICpcbiAgICovXG4gIHNldFBUVEFjdGl2ZShhY3RpdmUpIHtcbiAgICBpZiAodGhpcy5tdXRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3BlYWtpbmcgPT09IGFjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wdHREZWxheVRpbWVvdXQpIHtcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcHR0RGVsYXlUaW1lb3V0KTtcbiAgICAgIHRoaXMuX3B0dERlbGF5VGltZW91dCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFhY3RpdmUpIHtcbiAgICAgIHRoaXMuX3B0dERlbGF5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fc2V0U3BlYWtpbmcoZmFsc2UpO1xuICAgICAgICB0aGlzLl9wdHREZWxheVRpbWVvdXQgPSBudWxsO1xuICAgICAgfSwgdGhpcy5tb2RlT3B0aW9ucy5kZWxheSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5fc2V0U3BlYWtpbmcoYWN0aXZlKTtcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlXG5cbiAgLyoqXG4gICAqIEVuYWJsZSB2b2ljZSBjYXB0dXJlIGJ5IGRldGVjdGluZyB2b2ljZSBhY3Rpdml0eSBvbiB0aGUgbWljcm9waG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqL1xuICBfc2V0dXBWb2ljZUFjdGl2aXR5KG9wdGlvbnMpIHtcbiAgICBsZXQgdmFkID0gbmV3IFZBRCh0aGlzLmNvbnRleHQsIHRoaXMuc3RyZWFtLCBvcHRpb25zLnRocmVzaG9sZCk7XG4gICAgdmFkLm9uUHJvY2VzcyA9IChzcGVha2luZywgY3VycmVudFZvbHVtZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLm11dGUpIHtcbiAgICAgICAgdGhpcy5fc2V0U3BlYWtpbmcoc3BlYWtpbmcpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub25Wb2ljZUFjdGl2aXR5KSB7XG4gICAgICAgIHRoaXMub25Wb2ljZUFjdGl2aXR5KGN1cnJlbnRWb2x1bWUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdmFkLnN0b3AoKTtcbiAgICAgIHZhZCA9IG51bGw7XG5cbiAgICAgIHRoaXMuX3NldFNwZWFraW5nKGZhbHNlKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSB2b2ljZSBjYXB0dXJlIHdoaWxlIGhvbGRpbmcgZG93biBhIHNwZWNpZmljIGhvdGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqL1xuICBfc2V0dXBQdXNoVG9UYWxrKG9wdGlvbnMpIHtcbiAgICBjb25zdCBzaG9ydGN1dCA9IG9wdGlvbnNbJ3Nob3J0Y3V0J107XG5cbiAgICBpZiAoc2hvcnRjdXQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICBsZXQgY29tYm9rZXlzID0gYmluZEdsb2JhbChuZXcgQ29tYm9rZXlzKGRvY3VtZW50KSk7XG4gICAgY29tYm9rZXlzLmJpbmRHbG9iYWwoc2hvcnRjdXQsIGUgPT4ge1xuICAgICAgaWYgKGUudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5jb250YWlucygnc2hvcnRjdXQtcmVjb3JkZXInKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnNldFBUVEFjdGl2ZSh0cnVlKTtcbiAgICB9LCAna2V5ZG93bicpO1xuICAgIGNvbWJva2V5cy5iaW5kR2xvYmFsKHNob3J0Y3V0LCBlID0+IHtcbiAgICAgIGlmIChlLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgICBpZiAoZS50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ3Nob3J0Y3V0LXJlY29yZGVyJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXRQVFRBY3RpdmUoZmFsc2UpO1xuICAgIH0sICdrZXl1cCcpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbWJva2V5cy5yZXNldCgpO1xuICAgICAgY29tYm9rZXlzID0gbnVsbDtcblxuICAgICAgdGhpcy5fc2V0U3BlYWtpbmcoZmFsc2UpO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHdoZXRoZXIgc3BlZWNoIGlzIGN1cnJlbnRseSBiZWluZyBwbGF5ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BlYWtpbmdcbiAgICovXG4gIF9zZXRTcGVha2luZyhzcGVha2luZykge1xuICAgIGlmICh0aGlzLnNwZWFraW5nID09PSBzcGVha2luZykgcmV0dXJuO1xuICAgIHRoaXMuc3BlYWtpbmcgPSBzcGVha2luZztcbiAgICB0aGlzLl91cGRhdGVBdWRpb1RyYWNrcygpO1xuICAgIHRoaXMub25TcGVha2luZyhzcGVha2luZyk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyBhbGwgYXV0aW8gdHJhY2tzIGJhc2VkIG9uIGN1cnJlbnQgc3BlYWtpbmcgc3RhdHVzLlxuICAgKi9cbiAgX3VwZGF0ZUF1ZGlvVHJhY2tzKCkge1xuICAgIGlmIChwbGF0Zm9ybS5uYW1lID09PSAnQ2hyb21lJykge1xuICAgICAgbGV0IHNwZWFraW5nID0gdGhpcy5tb2RlID09PSBJbnB1dE1vZGVzLlZPSUNFX0FDVElWSVRZID8gIXRoaXMubXV0ZSA6IHRoaXMuc3BlYWtpbmc7XG4gICAgICBpZiAodGhpcy5zdHJlYW0gIT0gbnVsbCkge1xuICAgICAgICBsZXQgYXVkaW9UcmFja3MgPSB0aGlzLnN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGF1ZGlvVHJhY2tzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGF1ZGlvVHJhY2tzW2ldLmVuYWJsZWQgPSBzcGVha2luZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL3dlYnJ0Yy9BdWRpb0lucHV0LmpzXG4gKiovXG4iXX0=