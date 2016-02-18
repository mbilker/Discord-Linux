'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Logger = require('../../Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AudioOutput = function () {
  function AudioOutput(id, stream) {
    _classCallCheck(this, AudioOutput);

    this.id = id;

    this.logger = _Logger2.default.create('AudioOutput(' + this.id + ')');

    this._speaking = false;
    this.onSpeaking = function () {};

    this._mute = false;
    this._volume = 100;

    var audio = document.createElement('audio');
    this._updateAudioElement(audio);
    audio.autoplay = true;
    audio.src = URL.createObjectURL(stream);
    this._audioElement = audio;

    this.logger.info('create');
  }

  /**
   * Destroys the AudioOutput.
   */


  _createClass(AudioOutput, [{
    key: 'destroy',
    value: function destroy() {
      this.logger.info('destroy');

      this._stream = null;

      this._audioElement.pause();
      this._audioElement = null;

      this.speaking = false;
      this.onSpeaking = null;
    }

    /**
     * Determine if this user is muted.
     *
     * @return {Boolean}
     */

  }, {
    key: '_updateAudioElement',
    value: function _updateAudioElement(audioElement) {
      audioElement = audioElement || this._audioElement;
      if (audioElement != null) {
        audioElement.muted = this._mute;
        audioElement.volume = this._volume / 100;
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
      this._mute = mute || false;
      this._updateAudioElement();
    }

    /**
     * Return the current volume.
     *
     * @return {Number}
     */

  }, {
    key: 'volume',
    get: function get() {
      return this._volume;
    }

    /**
     * Set the current volume.
     *
     * @param {Number} volume
     */
    ,
    set: function set(volume) {
      // Audio Element does not allow going past 100% volume.
      this._volume = Math.min(Math.round(volume), 100);
      this._updateAudioElement();
    }

    /**
     * Determine if user is currently speaking.
     *
     * @return {boolean}
     */

  }, {
    key: 'speaking',
    get: function get() {
      return this._speaking;
    }

    /**
     * Set whatever or not the user is currently speaking.
     *
     * @param {boolean} speaking
     */
    ,
    set: function set(speaking) {
      if (this._speaking === speaking) return;
      this._speaking = speaking;
      this.onSpeaking(speaking);
    }
  }]);

  return AudioOutput;
}();

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/AudioOutput.js
 **/


exports.default = AudioOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvQXVkaW9PdXRwdXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztJQUVxQjtBQUNuQixXQURtQixXQUNuQixDQUFZLEVBQVosRUFBZ0IsTUFBaEIsRUFBd0I7MEJBREwsYUFDSzs7QUFDdEIsU0FBSyxFQUFMLEdBQVUsRUFBVixDQURzQjs7QUFHdEIsU0FBSyxNQUFMLEdBQWMsaUJBQU8sTUFBUCxrQkFBNkIsS0FBSyxFQUFMLE1BQTdCLENBQWQsQ0FIc0I7O0FBS3RCLFNBQUssU0FBTCxHQUFpQixLQUFqQixDQUxzQjtBQU10QixTQUFLLFVBQUwsR0FBa0IsWUFBVyxFQUFYLENBTkk7O0FBUXRCLFNBQUssS0FBTCxHQUFhLEtBQWIsQ0FSc0I7QUFTdEIsU0FBSyxPQUFMLEdBQWUsR0FBZixDQVRzQjs7QUFXdEIsUUFBSSxRQUFRLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFSLENBWGtCO0FBWXRCLFNBQUssbUJBQUwsQ0FBeUIsS0FBekIsRUFac0I7QUFhdEIsVUFBTSxRQUFOLEdBQWlCLElBQWpCLENBYnNCO0FBY3RCLFVBQU0sR0FBTixHQUFZLElBQUksZUFBSixDQUFvQixNQUFwQixDQUFaLENBZHNCO0FBZXRCLFNBQUssYUFBTCxHQUFxQixLQUFyQixDQWZzQjs7QUFpQnRCLFNBQUssTUFBTCxDQUFZLElBQVosV0FqQnNCO0dBQXhCOzs7Ozs7O2VBRG1COzs4QkF3QlQ7QUFDUixXQUFLLE1BQUwsQ0FBWSxJQUFaLFlBRFE7O0FBR1IsV0FBSyxPQUFMLEdBQWUsSUFBZixDQUhROztBQUtSLFdBQUssYUFBTCxDQUFtQixLQUFuQixHQUxRO0FBTVIsV0FBSyxhQUFMLEdBQXFCLElBQXJCLENBTlE7O0FBUVIsV0FBSyxRQUFMLEdBQWdCLEtBQWhCLENBUlE7QUFTUixXQUFLLFVBQUwsR0FBa0IsSUFBbEIsQ0FUUTs7Ozs7Ozs7Ozs7d0NBdUVVLGNBQWM7QUFDaEMscUJBQWUsZ0JBQWdCLEtBQUssYUFBTCxDQURDO0FBRWhDLFVBQUksZ0JBQWdCLElBQWhCLEVBQXNCO0FBQ3hCLHFCQUFhLEtBQWIsR0FBcUIsS0FBSyxLQUFMLENBREc7QUFFeEIscUJBQWEsTUFBYixHQUFzQixLQUFLLE9BQUwsR0FBZSxHQUFmLENBRkU7T0FBMUI7Ozs7d0JBeERTO0FBQ1QsYUFBTyxLQUFLLEtBQUwsQ0FERTs7Ozs7Ozs7O3NCQVNGLE1BQU07QUFDYixXQUFLLEtBQUwsR0FBYSxRQUFRLEtBQVIsQ0FEQTtBQUViLFdBQUssbUJBQUwsR0FGYTs7Ozs7Ozs7Ozs7d0JBVUY7QUFDWCxhQUFPLEtBQUssT0FBTCxDQURJOzs7Ozs7Ozs7c0JBU0YsUUFBUTs7QUFFakIsV0FBSyxPQUFMLEdBQWUsS0FBSyxHQUFMLENBQVMsS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFULEVBQTZCLEdBQTdCLENBQWYsQ0FGaUI7QUFHakIsV0FBSyxtQkFBTCxHQUhpQjs7Ozs7Ozs7Ozs7d0JBV0o7QUFDYixhQUFPLEtBQUssU0FBTCxDQURNOzs7Ozs7Ozs7c0JBU0YsVUFBVTtBQUNyQixVQUFJLEtBQUssU0FBTCxLQUFtQixRQUFuQixFQUE2QixPQUFqQztBQUNBLFdBQUssU0FBTCxHQUFpQixRQUFqQixDQUZxQjtBQUdyQixXQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsRUFIcUI7Ozs7U0F6RkoiLCJmaWxlIjoiQXVkaW9PdXRwdXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTG9nZ2VyIGZyb20gJy4uLy4uL0xvZ2dlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1ZGlvT3V0cHV0IHtcbiAgY29uc3RydWN0b3IoaWQsIHN0cmVhbSkge1xuICAgIHRoaXMuaWQgPSBpZDtcblxuICAgIHRoaXMubG9nZ2VyID0gTG9nZ2VyLmNyZWF0ZShgQXVkaW9PdXRwdXQoJHt0aGlzLmlkfSlgKTtcblxuICAgIHRoaXMuX3NwZWFraW5nID0gZmFsc2U7XG4gICAgdGhpcy5vblNwZWFraW5nID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHRoaXMuX211dGUgPSBmYWxzZTtcbiAgICB0aGlzLl92b2x1bWUgPSAxMDA7XG5cbiAgICBsZXQgYXVkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgIHRoaXMuX3VwZGF0ZUF1ZGlvRWxlbWVudChhdWRpbyk7XG4gICAgYXVkaW8uYXV0b3BsYXkgPSB0cnVlO1xuICAgIGF1ZGlvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKTtcbiAgICB0aGlzLl9hdWRpb0VsZW1lbnQgPSBhdWRpbztcblxuICAgIHRoaXMubG9nZ2VyLmluZm8oYGNyZWF0ZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBBdWRpb091dHB1dC5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhgZGVzdHJveWApO1xuXG4gICAgdGhpcy5fc3RyZWFtID0gbnVsbDtcblxuICAgIHRoaXMuX2F1ZGlvRWxlbWVudC5wYXVzZSgpO1xuICAgIHRoaXMuX2F1ZGlvRWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLnNwZWFraW5nID0gZmFsc2U7XG4gICAgdGhpcy5vblNwZWFraW5nID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhpcyB1c2VyIGlzIG11dGVkLlxuICAgKlxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IG11dGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX211dGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGlmIHRoaXMgdXNlciBpcyBtdXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBtdXRlXG4gICAqL1xuICBzZXQgbXV0ZShtdXRlKSB7XG4gICAgdGhpcy5fbXV0ZSA9IG11dGUgfHwgZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQXVkaW9FbGVtZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjdXJyZW50IHZvbHVtZS5cbiAgICpcbiAgICogQHJldHVybiB7TnVtYmVyfVxuICAgKi9cbiAgZ2V0IHZvbHVtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY3VycmVudCB2b2x1bWUuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2b2x1bWVcbiAgICovXG4gIHNldCB2b2x1bWUodm9sdW1lKSB7XG4gICAgLy8gQXVkaW8gRWxlbWVudCBkb2VzIG5vdCBhbGxvdyBnb2luZyBwYXN0IDEwMCUgdm9sdW1lLlxuICAgIHRoaXMuX3ZvbHVtZSA9IE1hdGgubWluKE1hdGgucm91bmQodm9sdW1lKSwgMTAwKTtcbiAgICB0aGlzLl91cGRhdGVBdWRpb0VsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdXNlciBpcyBjdXJyZW50bHkgc3BlYWtpbmcuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBnZXQgc3BlYWtpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NwZWFraW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB3aGF0ZXZlciBvciBub3QgdGhlIHVzZXIgaXMgY3VycmVudGx5IHNwZWFraW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNwZWFraW5nXG4gICAqL1xuICBzZXQgc3BlYWtpbmcoc3BlYWtpbmcpIHtcbiAgICBpZiAodGhpcy5fc3BlYWtpbmcgPT09IHNwZWFraW5nKSByZXR1cm47XG4gICAgdGhpcy5fc3BlYWtpbmcgPSBzcGVha2luZztcbiAgICB0aGlzLm9uU3BlYWtpbmcoc3BlYWtpbmcpO1xuICB9XG5cbiAgX3VwZGF0ZUF1ZGlvRWxlbWVudChhdWRpb0VsZW1lbnQpIHtcbiAgICBhdWRpb0VsZW1lbnQgPSBhdWRpb0VsZW1lbnQgfHwgdGhpcy5fYXVkaW9FbGVtZW50O1xuICAgIGlmIChhdWRpb0VsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgYXVkaW9FbGVtZW50Lm11dGVkID0gdGhpcy5fbXV0ZTtcbiAgICAgIGF1ZGlvRWxlbWVudC52b2x1bWUgPSB0aGlzLl92b2x1bWUgLyAxMDA7XG4gICAgfVxuICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2Rpc2NvcmRfYXBwL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjL0F1ZGlvT3V0cHV0LmpzXG4gKiovIl19