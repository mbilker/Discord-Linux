'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _Logger = require('../../Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _SDP = require('./SDP');

var _SDP2 = _interopRequireDefault(_SDP);

var _ICE = require('./ICE');

var _ICE2 = _interopRequireDefault(_ICE);

var _platform = require('platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var logger = _Logger2.default.create('WebRTC');

var constraints = undefined;
if (_platform2.default.name === 'Firefox') {
  constraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false
  };
} else {
  constraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: false
    },
    optional: [{ VoiceActivityDetection: true }]
  };
}

var PeerConnection = function (_EventEmitter) {
  _inherits(PeerConnection, _EventEmitter);

  function PeerConnection(ssrc, address, port) {
    _classCallCheck(this, PeerConnection);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PeerConnection).call(this));

    _this.pc = null;

    _this.address = address;
    _this.port = port;

    _this.ssrc = ssrc;
    _this.remoteStreamHistory = [];
    _this.remoteStreams = {};

    _this.negotiationNeeded = false;
    _this.negotiating = false;

    _this.payloadType = null;

    _this._stream = null;
    _this._remoteSDP = null;

    _this._safeExecuting = false;
    _this._safeQueue = [];
    return _this;
  }

  /**
   * Initialize a RTCPeerConnection, gather ICE candidates and create an offer.
   */


  _createClass(PeerConnection, [{
    key: 'connect',
    value: function connect() {
      var _this2 = this;

      if (this.pc != null) return;

      _ICE2.default.getServers(function (iceServers) {
        var pc = new RTCPeerConnection({ iceServers: iceServers }, {
          optional: [{ DtlsSrtpKeyAgreement: true }]
        });
        pc.onicecandidate = _this2._handleIceCandidate.bind(_this2);
        pc.onnegotiationneeded = _this2._handleNegotiationNeeded.bind(_this2);
        pc.oniceconnectionstatechange = _this2._handleIceConnectionStateChange.bind(_this2);
        pc.onsignalingstatechange = _this2._handleSignalingStateChange.bind(_this2);
        pc.onaddstream = _this2._handleAddStream.bind(_this2);
        pc.onremovestream = _this2._handleRemoveStream.bind(_this2);
        _this2.pc = pc;
        if (_this2.stream) {
          pc.addStream(_this2.stream);
        }
        _this2._createLocalOffer(function (mode, streams) {
          // Store this so when the remote SDP arrives the variables when it was
          // created are used to generate the remote description args.
          _this2._answerRemoteDescriptionArgs = ['answer', mode, streams];
        });
        _this2._iceGatheringTimeout = setTimeout(_this2._handleIceGatheringTimeout.bind(_this2), 5000);
      });
    }

    /**
     * Close a RTCPeerConnection.
     */

  }, {
    key: 'close',
    value: function close() {
      clearTimeout(this._iceGatheringTimeout);

      if (this.pc != null) {
        var _pc = this.pc;
        if (this.signalingState !== 'closed') {
          _pc.close();
        }
        _pc.onicecandidate = null;
        _pc.onnegotiationneeded = null;
        _pc.oniceconnectionstatechange = null;
        _pc.onsignalingstatechange = null;
        _pc.onaddstream = null;
        _pc.onremovestream = null;
        this.pc = null;
      } else {
        _ICE2.default.stop();
      }
      this.removeAllListeners();
    }

    /**
     * Get ICE gathering state.
     *
     * @return {String}
     */

  }, {
    key: 'setRemoteStream',


    /**
     * Set a new remote stream to the RTCPeerConnection.
     *
     * @param {String} cname
     * @param {Number} ssrc
     */
    value: function setRemoteStream(cname, ssrc) {
      if (!this.remoteStreamHistory.some(function (stream) {
        return stream.ssrc === ssrc;
      })) {
        this.remoteStreamHistory.push({ ssrc: ssrc, cname: cname });
      }
      if (this.remoteStreams[cname] !== ssrc) {
        this.remoteStreams = _extends({}, this.remoteStreams, _defineProperty({}, cname, ssrc));
        this._fakeRemoteOffer();
      }
    }

    /**
     * Remove a new remote stream from the RTCPeerConnection.
     *
     * @param {String} cname
     */

  }, {
    key: 'removeRemoteStream',
    value: function removeRemoteStream(cname) {
      if (this.remoteStreams[cname] != null) {
        this.remoteStreams = _extends({}, this.remoteStreams);
        delete this.remoteStreams[cname];
        this._fakeRemoteOffer();
      }
    }

    /**
     * Get the currently set remote SDP on the connection.
     *
     * @return {String}
     */

  }, {
    key: '_safeExecute',


    // Private

    /**
     * Execute function if ICE connection is connected and singal state is stable.
     * Otherwise enqueue it.
     *
     * @param {Function} [func]
     */
    value: function _safeExecute(func) {
      if (this.iceConnectionState === 'closed') {
        logger.info('safeExecute: ICE connection closed');
        return;
      }

      if (this._safeExecuting) {
        logger.info('safeExecute: currently executing');
        this._safeQueue.push(func);
      } else if (this.remoteSDP == null) {
        logger.info('safeExecute: awaiting remote SDP');
        this._safeQueue.push(func);
      } else if (this.signalingState !== 'stable') {
        logger.info('safeExecute: signaling state', this.signalingState);
        this._safeQueue.push(func);
      } else {
        this._safeExecuting = true;
        func();
      }
    }

    /**
     * Update the local description with an offer.
     *
     * @param {Function} [callback]
     */

  }, {
    key: '_createLocalOffer',
    value: function _createLocalOffer(callback) {
      var _this3 = this;

      var mode = this.stream != null ? _SDP2.default.SENDRECV : _SDP2.default.RECVONLY;
      var streams = this.remoteSDP != null ? this._getRemoteStreams() : [];
      this.pc.createOffer(function (offer) {
        _this3.payloadType = _SDP2.default.getOpusPayloadType(offer.sdp);
        _this3.pc.setLocalDescription(offer, function () {
          logger.info('createOffer+setLocalDescription success');
          callback && callback(mode, streams);
        }, function (err) {
          throw err;
        });
      }, function (err) {
        throw err;
      }, constraints);
    }

    /**
     * Update the local description with an answer.
     *
     * @param {Function} [callback]
     */

  }, {
    key: '_createLocalAnswer',
    value: function _createLocalAnswer(callback) {
      var _this4 = this;

      this.pc.createAnswer(function (answer) {
        _this4.pc.setLocalDescription(answer, function () {
          logger.info('createAnswer+setLocalDescription success');
          callback && callback();
        }, function (err) {
          throw err;
        });
      }, function (err) {
        throw err;
      }, constraints);
    }

    /**
     * Update the remote description with a custom answer that merges all the remote streams.
     *
     * @param {String} type
     * @param {String} mode
     * @param {Array} streams
     * @param {Function} [callback]
     */

  }, {
    key: '_updateRemoteDescription',
    value: function _updateRemoteDescription(type, mode, streams, callback) {
      this.pc.setRemoteDescription(_SDP2.default.createSessionDescription(type, this.payloadType, this.remoteSDP, mode, streams), function () {
        logger.info('setRemoteDescription success');
        callback && callback();
      }, function (err) {
        throw err;
      });
    }

    /**
     * Simulate a remote server offering new SSRCs.
     */

  }, {
    key: '_fakeRemoteOffer',
    value: function _fakeRemoteOffer() {
      var _this5 = this;

      var streams = this._getRemoteStreams();

      // Bail if no streams, no reason to attempt it.
      if (streams.length === 0) return;

      this._safeExecute(function () {
        _this5._updateRemoteDescription('offer', _this5.stream != null ? _SDP2.default.SENDRECV : _SDP2.default.RECVONLY, streams, function () {
          _this5._createLocalAnswer();
        });
      });
    }

    /**
     * Get a copy of all the streams for the next remote description.
     *
     * @return {Array}
     */

  }, {
    key: '_getRemoteStreams',
    value: function _getRemoteStreams() {
      var _this6 = this;

      return this.remoteStreamHistory.map(function (_ref) {
        var cname = _ref.cname;
        var ssrc = _ref.ssrc;
        return [ssrc, cname, _this6.remoteStreams[cname] === ssrc];
      });
    }

    // RTCPeerConnection Event Handlers

  }, {
    key: '_handleNegotiationNeeded',
    value: function _handleNegotiationNeeded() {
      var _this7 = this;

      logger.info('negotiationNeeded');
      this._safeExecute(function () {
        _this7._createLocalOffer(function (mode, streams) {
          _this7._updateRemoteDescription('answer', mode, streams);
        });
      });
    }
  }, {
    key: '_handleIceConnectionStateChange',
    value: function _handleIceConnectionStateChange() {
      var connectionState = this.pc.iceConnectionState;
      logger.info('iceConnectionState =>', connectionState);
      if (connectionState === 'completed') {
        connectionState = 'connected';
      }
      this.emit(connectionState);
    }
  }, {
    key: '_handleSignalingStateChange',
    value: function _handleSignalingStateChange() {
      logger.info('signalingState =>', this.pc.signalingState);
      if (this.pc.signalingState === 'stable') {
        this._safeExecuting = false;
        var func = this._safeQueue.shift();
        if (func != null) {
          logger.info('safeExecute: running queued function');
          this._safeExecute(func);
        }
      }
    }
  }, {
    key: '_handleAddStream',
    value: function _handleAddStream(e) {
      if (!/^default/.test(e.stream.id)) {
        this.emit('addstream', e.stream.id.split('-')[0], e.stream);
      }
    }
  }, {
    key: '_handleRemoveStream',
    value: function _handleRemoveStream(e) {
      if (!/^default/.test(e.stream.id)) {
        this.emit('removestream', e.stream.id.split('-')[0], e.stream);
      }
    }
  }, {
    key: '_handleIceGatheringTimeout',
    value: function _handleIceGatheringTimeout() {
      if (this.pc.iceGatheringState !== 'complete') {
        logger.warn('ICE gathering never completed,');
        this._handleIceCandidate({ candidate: null });
      }
    }
  }, {
    key: '_handleIceCandidate',
    value: function _handleIceCandidate(e) {
      if (e.candidate == null && this._remoteSDP == null) {
        logger.info('ICE Ready');
        clearTimeout(this._iceGatheringTimeout);
        this.emit('offer', _SDP2.default.filterTCPCandidates(this.pc.localDescription.sdp));
      }
    }
  }, {
    key: 'iceGatheringState',
    get: function get() {
      return this.pc && this.pc.iceGatheringState;
    }

    /**
     * Get ICE connection state.
     *
     * @return {String}
     */

  }, {
    key: 'iceConnectionState',
    get: function get() {
      return this.pc && this.pc.iceConnectionState;
    }

    /**
     * Get signaling state.
     *
     * @return {String}
     */

  }, {
    key: 'signalingState',
    get: function get() {
      try {
        return this.pc && this.pc.signalingState;
      } catch (e) {
        // For some reason this throws `InvalidStateError` when you disconnect on Firefox.
        // Catch it and return "closed" to match what Chrome does.
        return 'closed';
      }
    }

    /**
     * Determine if RTCPeerConnection is successfully connected over ICE.
     *
     * @return {Boolean}
     */

  }, {
    key: 'connected',
    get: function get() {
      return pc != null && /connected|completed/.test(this.pc.iceConnectionState);
    }

    //noinspection JSValidateJSDoc
    /**
     * Return the currently set local media stream. This can be not set if the connection
     * is receiving only.
     *
     * @return {MediaStream|null}
     */

  }, {
    key: 'stream',
    get: function get() {
      return this._stream;
    }

    //noinspection JSValidateJSDoc
    /**
     * Set a MediaStream or unset the MediaStream.
     *
     * @param {MediaStream|null} stream
     */
    ,
    set: function set(stream) {
      var isClosed = this.pc == null || this.signalingState === 'closed';

      if (this._stream != null && !isClosed) {
        this.pc.removeStream(this._stream);
      }

      this._stream = stream;

      if (stream != null && !isClosed) {
        this.pc.addStream(stream);
      }
    }
  }, {
    key: 'remoteSDP',
    get: function get() {
      return this._remoteSDP;
    }

    /**
     * Set an remote SDP on the connection. This has side-effects.
     *
     * @param {String} sdp
     */
    ,
    set: function set(sdp) {
      this._remoteSDP = sdp;
      var args = this._answerRemoteDescriptionArgs;
      delete this._answerRemoteDescriptionArgs;
      this._updateRemoteDescription.apply(this, _toConsumableArray(args));
    }
  }]);

  return PeerConnection;
}(_events.EventEmitter);

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/PeerConnection.js
 **/


exports.default = PeerConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvUGVlckNvbm5lY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLElBQU0sU0FBUyxpQkFBTyxNQUFQLENBQWMsUUFBZCxDQUFUOztBQUVOLElBQUksdUJBQUo7QUFDQSxJQUFJLG1CQUFTLElBQVQsS0FBa0IsU0FBbEIsRUFBNkI7QUFDL0IsZ0JBQWM7QUFDWix5QkFBcUIsSUFBckI7QUFDQSx5QkFBcUIsS0FBckI7R0FGRixDQUQrQjtDQUFqQyxNQU1LO0FBQ0gsZ0JBQWM7QUFDWixlQUFXO0FBQ1QsMkJBQXFCLElBQXJCO0FBQ0EsMkJBQXFCLEtBQXJCO0tBRkY7QUFJQSxjQUFVLENBQ1IsRUFBQyx3QkFBd0IsSUFBeEIsRUFETyxDQUFWO0dBTEYsQ0FERztDQU5MOztJQWtCcUI7OztBQUNuQixXQURtQixjQUNuQixDQUFZLElBQVosRUFBa0IsT0FBbEIsRUFBMkIsSUFBM0IsRUFBaUM7MEJBRGQsZ0JBQ2M7O3VFQURkLDRCQUNjOztBQUcvQixVQUFLLEVBQUwsR0FBVSxJQUFWLENBSCtCOztBQUsvQixVQUFLLE9BQUwsR0FBZSxPQUFmLENBTCtCO0FBTS9CLFVBQUssSUFBTCxHQUFZLElBQVosQ0FOK0I7O0FBUS9CLFVBQUssSUFBTCxHQUFZLElBQVosQ0FSK0I7QUFTL0IsVUFBSyxtQkFBTCxHQUEyQixFQUEzQixDQVQrQjtBQVUvQixVQUFLLGFBQUwsR0FBcUIsRUFBckIsQ0FWK0I7O0FBWS9CLFVBQUssaUJBQUwsR0FBeUIsS0FBekIsQ0FaK0I7QUFhL0IsVUFBSyxXQUFMLEdBQW1CLEtBQW5CLENBYitCOztBQWUvQixVQUFLLFdBQUwsR0FBbUIsSUFBbkIsQ0FmK0I7O0FBaUIvQixVQUFLLE9BQUwsR0FBZSxJQUFmLENBakIrQjtBQWtCL0IsVUFBSyxVQUFMLEdB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LENBRE87Ozs7Ozs7OztzQkFTRixLQUFLO0FBQ2pCLFdBQUssVUFBTCxHQUFrQixHQUFsQixDQURpQjtBQUVqQixVQUFNLE9BQU8sS0FBSyw0QkFBTCxDQUZJO0FBR2pCLGFBQU8sS0FBSyw0QkFBTCxDQUhVO0FBSWpCLFdBQUssd0JBQUwsZ0NBQWlDLEtBQWpDLEVBSmlCOzs7O1NBdE1BIiwiZmlsZSI6IlBlZXJDb25uZWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgTG9nZ2VyIGZyb20gJy4uLy4uL0xvZ2dlcic7XG5pbXBvcnQgU0RQIGZyb20gJy4vU0RQJztcbmltcG9ydCBJQ0UgZnJvbSAnLi9JQ0UnO1xuaW1wb3J0IHBsYXRmb3JtIGZyb20gJ3BsYXRmb3JtJztcblxuY29uc3QgbG9nZ2VyID0gTG9nZ2VyLmNyZWF0ZSgnV2ViUlRDJyk7XG5cbmxldCBjb25zdHJhaW50cztcbmlmIChwbGF0Zm9ybS5uYW1lID09PSAnRmlyZWZveCcpIHtcbiAgY29uc3RyYWludHMgPSB7XG4gICAgb2ZmZXJUb1JlY2VpdmVBdWRpbzogdHJ1ZSxcbiAgICBvZmZlclRvUmVjZWl2ZVZpZGVvOiBmYWxzZVxuICB9O1xufVxuZWxzZSB7XG4gIGNvbnN0cmFpbnRzID0ge1xuICAgIG1hbmRhdG9yeToge1xuICAgICAgT2ZmZXJUb1JlY2VpdmVBdWRpbzogdHJ1ZSxcbiAgICAgIE9mZmVyVG9SZWNlaXZlVmlkZW86IGZhbHNlXG4gICAgfSxcbiAgICBvcHRpb25hbDogW1xuICAgICAge1ZvaWNlQWN0aXZpdHlEZXRlY3Rpb246IHRydWV9XG4gICAgXVxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQZWVyQ29ubmVjdGlvbiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKHNzcmMsIGFkZHJlc3MsIHBvcnQpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5wYyA9IG51bGw7XG5cbiAgICB0aGlzLmFkZHJlc3MgPSBhZGRyZXNzO1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG5cbiAgICB0aGlzLnNzcmMgPSBzc3JjO1xuICAgIHRoaXMucmVtb3RlU3RyZWFtSGlzdG9yeSA9IFtdO1xuICAgIHRoaXMucmVtb3RlU3RyZWFtcyA9IHt9O1xuXG4gICAgdGhpcy5uZWdvdGlhdGlvbk5lZWRlZCA9IGZhbHNlO1xuICAgIHRoaXMubmVnb3RpYXRpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMucGF5bG9hZFR5cGUgPSBudWxsO1xuXG4gICAgdGhpcy5fc3RyZWFtID0gbnVsbDtcbiAgICB0aGlzLl9yZW1vdGVTRFAgPSBudWxsO1xuXG4gICAgdGhpcy5fc2FmZUV4ZWN1dGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3NhZmVRdWV1ZSA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBSVENQZWVyQ29ubmVjdGlvbiwgZ2F0aGVyIElDRSBjYW5kaWRhdGVzIGFuZCBjcmVhdGUgYW4gb2ZmZXIuXG4gICAqL1xuICBjb25uZWN0KCkge1xuICAgIGlmICh0aGlzLnBjICE9IG51bGwpIHJldHVybjtcblxuICAgIElDRS5nZXRTZXJ2ZXJzKGljZVNlcnZlcnMgPT4ge1xuICAgICAgbGV0IHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHtpY2VTZXJ2ZXJzfSwge1xuICAgICAgICBvcHRpb25hbDogW1xuICAgICAgICAgIHtEdGxzU3J0cEtleUFncmVlbWVudDogdHJ1ZX1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IHRoaXMuX2hhbmRsZUljZUNhbmRpZGF0ZS5iaW5kKHRoaXMpO1xuICAgICAgcGMub25uZWdvdGlhdGlvbm5lZWRlZCA9IHRoaXMuX2hhbmRsZU5lZ290aWF0aW9uTmVlZGVkLmJpbmQodGhpcyk7XG4gICAgICBwYy5vbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9IHRoaXMuX2hhbmRsZUljZUNvbm5lY3Rpb25TdGF0ZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgcGMub25zaWduYWxpbmdzdGF0ZWNoYW5nZSA9IHRoaXMuX2hhbmRsZVNpZ25hbGluZ1N0YXRlQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICBwYy5vbmFkZHN0cmVhbSA9IHRoaXMuX2hhbmRsZUFkZFN0cmVhbS5iaW5kKHRoaXMpO1xuICAgICAgcGMub25yZW1vdmVzdHJlYW0gPSB0aGlzLl9oYW5kbGVSZW1vdmVTdHJlYW0uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMucGMgPSBwYztcbiAgICAgIGlmICh0aGlzLnN0cmVhbSkge1xuICAgICAgICBwYy5hZGRTdHJlYW0odGhpcy5zdHJlYW0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fY3JlYXRlTG9jYWxPZmZlcigobW9kZSwgc3RyZWFtcykgPT4ge1xuICAgICAgICAvLyBTdG9yZSB0aGlzIHNvIHdoZW4gdGhlIHJlbW90ZSBTRFAgYXJyaXZlcyB0aGUgdmFyaWFibGVzIHdoZW4gaXQgd2FzXG4gICAgICAgIC8vIGNyZWF0ZWQgYXJlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIHJlbW90ZSBkZXNjcmlwdGlvbiBhcmdzLlxuICAgICAgICB0aGlzLl9hbnN3ZXJSZW1vdGVEZXNjcmlwdGlvbkFyZ3MgPSBbJ2Fuc3dlcicsIG1vZGUsIHN0cmVhbXNdO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9pY2VHYXRoZXJpbmdUaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLl9oYW5kbGVJY2VHYXRoZXJpbmdUaW1lb3V0LmJpbmQodGhpcyksIDUwMDApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIGEgUlRDUGVlckNvbm5lY3Rpb24uXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWNlR2F0aGVyaW5nVGltZW91dCk7XG5cbiAgICBpZiAodGhpcy5wYyAhPSBudWxsKSB7XG4gICAgICBsZXQgcGMgPSB0aGlzLnBjO1xuICAgICAgaWYgKHRoaXMuc2lnbmFsaW5nU3RhdGUgIT09ICdjbG9zZWQnKSB7XG4gICAgICAgIHBjLmNsb3NlKCk7XG4gICAgICB9XG4gICAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IG51bGw7XG4gICAgICBwYy5vbm5lZ290aWF0aW9ubmVlZGVkID0gbnVsbDtcbiAgICAgIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgIHBjLm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgcGMub25hZGRzdHJlYW0gPSBudWxsO1xuICAgICAgcGMub25yZW1vdmVzdHJlYW0gPSBudWxsO1xuICAgICAgdGhpcy5wYyA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgSUNFLnN0b3AoKTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgSUNFIGdhdGhlcmluZyBzdGF0ZS5cbiAgICpcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IGljZUdhdGhlcmluZ1N0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLnBjICYmIHRoaXMucGMuaWNlR2F0aGVyaW5nU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IElDRSBjb25uZWN0aW9uIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgaWNlQ29ubmVjdGlvblN0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLnBjICYmIHRoaXMucGMuaWNlQ29ubmVjdGlvblN0YXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzaWduYWxpbmcgc3RhdGUuXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBzaWduYWxpbmdTdGF0ZSgpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMucGMgJiYgdGhpcy5wYy5zaWduYWxpbmdTdGF0ZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIC8vIEZvciBzb21lIHJlYXNvbiB0aGlzIHRocm93cyBgSW52YWxpZFN0YXRlRXJyb3JgIHdoZW4geW91IGRpc2Nvbm5lY3Qgb24gRmlyZWZveC5cbiAgICAgIC8vIENhdGNoIGl0IGFuZCByZXR1cm4gXCJjbG9zZWRcIiB0byBtYXRjaCB3aGF0IENocm9tZSBkb2VzLlxuICAgICAgcmV0dXJuICdjbG9zZWQnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgUlRDUGVlckNvbm5lY3Rpb24gaXMgc3VjY2Vzc2Z1bGx5IGNvbm5lY3RlZCBvdmVyIElDRS5cbiAgICpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBjb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHBjICE9IG51bGwgJiYgL2Nvbm5lY3RlZHxjb21wbGV0ZWQvLnRlc3QodGhpcy5wYy5pY2VDb25uZWN0aW9uU3RhdGUpO1xuICB9XG5cbiAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZUpTRG9jXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnRseSBzZXQgbG9jYWwgbWVkaWEgc3RyZWFtLiBUaGlzIGNhbiBiZSBub3Qgc2V0IGlmIHRoZSBjb25uZWN0aW9uXG4gICAqIGlzIHJlY2VpdmluZyBvbmx5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZWRpYVN0cmVhbXxudWxsfVxuICAgKi9cbiAgZ2V0IHN0cmVhbSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RyZWFtO1xuICB9XG5cbiAgLy9ub2luc3BlY3Rpb24gSlNWYWxpZGF0ZUpTRG9jXG4gIC8qKlxuICAgKiBTZXQgYSBNZWRpYVN0cmVhbSBvciB1bnNldCB0aGUgTWVkaWFTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TWVkaWFTdHJlYW18bnVsbH0gc3RyZWFtXG4gICAqL1xuICBzZXQgc3RyZWFtKHN0cmVhbSkge1xuICAgIGNvbnN0IGlzQ2xvc2VkID0gdGhpcy5wYyA9PSBudWxsIHx8IHRoaXMuc2lnbmFsaW5nU3RhdGUgPT09ICdjbG9zZWQnO1xuXG4gICAgaWYgKHRoaXMuX3N0cmVhbSAhPSBudWxsICYmICFpc0Nsb3NlZCkge1xuICAgICAgdGhpcy5wYy5yZW1vdmVTdHJlYW0odGhpcy5fc3RyZWFtKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zdHJlYW0gPSBzdHJlYW07XG5cbiAgICBpZiAoc3RyZWFtICE9IG51bGwgJiYgIWlzQ2xvc2VkKSB7XG4gICAgICB0aGlzLnBjLmFkZFN0cmVhbShzdHJlYW0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgcmVtb3RlIHN0cmVhbSB0byB0aGUgUlRDUGVlckNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbmFtZVxuICAgKiBAcGFyYW0ge051bWJlcn0gc3NyY1xuICAgKi9cbiAgc2V0UmVtb3RlU3RyZWFtKGNuYW1lLCBzc3JjKSB7XG4gICAgaWYgKCF0aGlzLnJlbW90ZVN0cmVhbUhpc3Rvcnkuc29tZShzdHJlYW0gPT4gc3RyZWFtLnNzcmMgPT09IHNzcmMpKSB7XG4gICAgICB0aGlzLnJlbW90ZVN0cmVhbUhpc3RvcnkucHVzaCh7c3NyYywgY25hbWV9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmVtb3RlU3RyZWFtc1tjbmFtZV0gIT09IHNzcmMpIHtcbiAgICAgIHRoaXMucmVtb3RlU3RyZWFtcyA9IHsuLi50aGlzLnJlbW90ZVN0cmVhbXMsIFtjbmFtZV06IHNzcmN9O1xuICAgICAgdGhpcy5fZmFrZVJlbW90ZU9mZmVyKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIG5ldyByZW1vdGUgc3RyZWFtIGZyb20gdGhlIFJUQ1BlZXJDb25uZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY25hbWVcbiAgICovXG4gIHJlbW92ZVJlbW90ZVN0cmVhbShjbmFtZSkge1xuICAgIGlmICh0aGlzLnJlbW90ZVN0cmVhbXNbY25hbWVdICE9IG51bGwpIHtcbiAgICAgIHRoaXMucmVtb3RlU3RyZWFtcyA9IHsuLi50aGlzLnJlbW90ZVN0cmVhbXN9O1xuICAgICAgZGVsZXRlIHRoaXMucmVtb3RlU3RyZWFtc1tjbmFtZV07XG4gICAgICB0aGlzLl9mYWtlUmVtb3RlT2ZmZXIoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50bHkgc2V0IHJlbW90ZSBTRFAgb24gdGhlIGNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCByZW1vdGVTRFAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbW90ZVNEUDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gcmVtb3RlIFNEUCBvbiB0aGUgY29ubmVjdGlvbi4gVGhpcyBoYXMgc2lkZS1lZmZlY3RzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2RwXG4gICAqL1xuICBzZXQgcmVtb3RlU0RQKHNkcCkge1xuICAgIHRoaXMuX3JlbW90ZVNEUCA9IHNkcDtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5fYW5zd2VyUmVtb3RlRGVzY3JpcHRpb25BcmdzO1xuICAgIGRlbGV0ZSB0aGlzLl9hbnN3ZXJSZW1vdGVEZXNjcmlwdGlvbkFyZ3M7XG4gICAgdGhpcy5fdXBkYXRlUmVtb3RlRGVzY3JpcHRpb24oLi4uYXJncyk7XG4gIH1cblxuICAvLyBQcml2YXRlXG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgZnVuY3Rpb24gaWYgSUNFIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkIGFuZCBzaW5nYWwgc3RhdGUgaXMgc3RhYmxlLlxuICAgKiBPdGhlcndpc2UgZW5xdWV1ZSBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2Z1bmNdXG4gICAqL1xuICBfc2FmZUV4ZWN1dGUoZnVuYykge1xuICAgIGlmICh0aGlzLmljZUNvbm5lY3Rpb25TdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgIGxvZ2dlci5pbmZvKCdzYWZlRXhlY3V0ZTogSUNFIGNvbm5lY3Rpb24gY2xvc2VkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3NhZmVFeGVjdXRpbmcpIHtcbiAgICAgIGxvZ2dlci5pbmZvKCdzYWZlRXhlY3V0ZTogY3VycmVudGx5IGV4ZWN1dGluZycpO1xuICAgICAgdGhpcy5fc2FmZVF1ZXVlLnB1c2goZnVuYyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMucmVtb3RlU0RQID09IG51bGwpIHtcbiAgICAgIGxvZ2dlci5pbmZvKCdzYWZlRXhlY3V0ZTogYXdhaXRpbmcgcmVtb3RlIFNEUCcpO1xuICAgICAgdGhpcy5fc2FmZVF1ZXVlLnB1c2goZnVuYyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuc2lnbmFsaW5nU3RhdGUgIT09ICdzdGFibGUnKSB7XG4gICAgICBsb2dnZXIuaW5mbygnc2FmZUV4ZWN1dGU6IHNpZ25hbGluZyBzdGF0ZScsIHRoaXMuc2lnbmFsaW5nU3RhdGUpO1xuICAgICAgdGhpcy5fc2FmZVF1ZXVlLnB1c2goZnVuYyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5fc2FmZUV4ZWN1dGluZyA9IHRydWU7XG4gICAgICBmdW5jKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgbG9jYWwgZGVzY3JpcHRpb24gd2l0aCBhbiBvZmZlci5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKi9cbiAgX2NyZWF0ZUxvY2FsT2ZmZXIoY2FsbGJhY2spIHtcbiAgICBjb25zdCBtb2RlID0gdGhpcy5zdHJlYW0gIT0gbnVsbCA/IFNEUC5TRU5EUkVDViA6IFNEUC5SRUNWT05MWTtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5yZW1vdGVTRFAgIT0gbnVsbCA/IHRoaXMuX2dldFJlbW90ZVN0cmVhbXMoKSA6IFtdO1xuICAgIHRoaXMucGMuY3JlYXRlT2ZmZXIoXG4gICAgICBvZmZlciA9PiB7XG4gICAgICAgIHRoaXMucGF5bG9hZFR5cGUgPSBTRFAuZ2V0T3B1c1BheWxvYWRUeXBlKG9mZmVyLnNkcCk7XG4gICAgICAgIHRoaXMucGMuc2V0TG9jYWxEZXNjcmlwdGlvbihcbiAgICAgICAgICBvZmZlcixcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnY3JlYXRlT2ZmZXIrc2V0TG9jYWxEZXNjcmlwdGlvbiBzdWNjZXNzJyk7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhtb2RlLCBzdHJlYW1zKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVyciA9PiB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIGVyciA9PiB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0sXG4gICAgICBjb25zdHJhaW50c1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBsb2NhbCBkZXNjcmlwdGlvbiB3aXRoIGFuIGFuc3dlci5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKi9cbiAgX2NyZWF0ZUxvY2FsQW5zd2VyKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wYy5jcmVhdGVBbnN3ZXIoXG4gICAgICBhbnN3ZXIgPT4ge1xuICAgICAgICB0aGlzLnBjLnNldExvY2FsRGVzY3JpcHRpb24oXG4gICAgICAgICAgYW5zd2VyLFxuICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdjcmVhdGVBbnN3ZXIrc2V0TG9jYWxEZXNjcmlwdGlvbiBzdWNjZXNzJyk7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyID0+IHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZXJyID0+IHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfSxcbiAgICAgIGNvbnN0cmFpbnRzXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJlbW90ZSBkZXNjcmlwdGlvbiB3aXRoIGEgY3VzdG9tIGFuc3dlciB0aGF0IG1lcmdlcyBhbGwgdGhlIHJlbW90ZSBzdHJlYW1zLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kZVxuICAgKiBAcGFyYW0ge0FycmF5fSBzdHJlYW1zXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja11cbiAgICovXG4gIF91cGRhdGVSZW1vdGVEZXNjcmlwdGlvbih0eXBlLCBtb2RlLCBzdHJlYW1zLCBjYWxsYmFjaykge1xuICAgIHRoaXMucGMuc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICBTRFAuY3JlYXRlU2Vzc2lvbkRlc2NyaXB0aW9uKHR5cGUsIHRoaXMucGF5bG9hZFR5cGUsIHRoaXMucmVtb3RlU0RQLCBtb2RlLCBzdHJlYW1zKSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ3NldFJlbW90ZURlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICAgIH0sXG4gICAgICBlcnIgPT4ge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaW11bGF0ZSBhIHJlbW90ZSBzZXJ2ZXIgb2ZmZXJpbmcgbmV3IFNTUkNzLlxuICAgKi9cbiAgX2Zha2VSZW1vdGVPZmZlcigpIHtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5fZ2V0UmVtb3RlU3RyZWFtcygpO1xuXG4gICAgLy8gQmFpbCBpZiBubyBzdHJlYW1zLCBubyByZWFzb24gdG8gYXR0ZW1wdCBpdC5cbiAgICBpZiAoc3RyZWFtcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIHRoaXMuX3NhZmVFeGVjdXRlKCgpID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZVJlbW90ZURlc2NyaXB0aW9uKCdvZmZlcicsIHRoaXMuc3RyZWFtICE9IG51bGwgPyBTRFAuU0VORFJFQ1YgOiBTRFAuUkVDVk9OTFksIHN0cmVhbXMsICgpID0+IHtcbiAgICAgICAgdGhpcy5fY3JlYXRlTG9jYWxBbnN3ZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvcHkgb2YgYWxsIHRoZSBzdHJlYW1zIGZvciB0aGUgbmV4dCByZW1vdGUgZGVzY3JpcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgX2dldFJlbW90ZVN0cmVhbXMoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlU3RyZWFtSGlzdG9yeS5tYXAoKHtjbmFtZSwgc3NyY30pID0+IFtzc3JjLCBjbmFtZSwgdGhpcy5yZW1vdGVTdHJlYW1zW2NuYW1lXSA9PT0gc3NyY10pO1xuICB9XG5cbiAgLy8gUlRDUGVlckNvbm5lY3Rpb24gRXZlbnQgSGFuZGxlcnNcblxuICBfaGFuZGxlTmVnb3RpYXRpb25OZWVkZWQoKSB7XG4gICAgbG9nZ2VyLmluZm8oJ25lZ290aWF0aW9uTmVlZGVkJyk7XG4gICAgdGhpcy5fc2FmZUV4ZWN1dGUoKCkgPT4ge1xuICAgICAgdGhpcy5fY3JlYXRlTG9jYWxPZmZlcigobW9kZSwgc3RyZWFtcykgPT4ge1xuICAgICAgICB0aGlzLl91cGRhdGVSZW1vdGVEZXNjcmlwdGlvbignYW5zd2VyJywgbW9kZSwgc3RyZWFtcyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9oYW5kbGVJY2VDb25uZWN0aW9uU3RhdGVDaGFuZ2UoKSB7XG4gICAgbGV0IGNvbm5lY3Rpb25TdGF0ZSA9IHRoaXMucGMuaWNlQ29ubmVjdGlvblN0YXRlO1xuICAgIGxvZ2dlci5pbmZvKCdpY2VDb25uZWN0aW9uU3RhdGUgPT4nLCBjb25uZWN0aW9uU3RhdGUpO1xuICAgIGlmIChjb25uZWN0aW9uU3RhdGUgPT09ICdjb21wbGV0ZWQnKSB7XG4gICAgICBjb25uZWN0aW9uU3RhdGUgPSAnY29ubmVjdGVkJztcbiAgICB9XG4gICAgdGhpcy5lbWl0KGNvbm5lY3Rpb25TdGF0ZSk7XG4gIH1cblxuICBfaGFuZGxlU2lnbmFsaW5nU3RhdGVDaGFuZ2UoKSB7XG4gICAgbG9nZ2VyLmluZm8oJ3NpZ25hbGluZ1N0YXRlID0+JywgdGhpcy5wYy5zaWduYWxpbmdTdGF0ZSk7XG4gICAgaWYgKHRoaXMucGMuc2lnbmFsaW5nU3RhdGUgPT09ICdzdGFibGUnKSB7XG4gICAgICB0aGlzLl9zYWZlRXhlY3V0aW5nID0gZmFsc2U7XG4gICAgICBsZXQgZnVuYyA9IHRoaXMuX3NhZmVRdWV1ZS5zaGlmdCgpO1xuICAgICAgaWYgKGZ1bmMgIT0gbnVsbCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnc2FmZUV4ZWN1dGU6IHJ1bm5pbmcgcXVldWVkIGZ1bmN0aW9uJyk7XG4gICAgICAgIHRoaXMuX3NhZmVFeGVjdXRlKGZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9oYW5kbGVBZGRTdHJlYW0oZSkge1xuICAgIGlmICghL15kZWZhdWx0Ly50ZXN0KGUuc3RyZWFtLmlkKSkge1xuICAgICAgdGhpcy5lbWl0KCdhZGRzdHJlYW0nLCBlLnN0cmVhbS5pZC5zcGxpdCgnLScpWzBdLCBlLnN0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgX2hhbmRsZVJlbW92ZVN0cmVhbShlKSB7XG4gICAgaWYgKCEvXmRlZmF1bHQvLnRlc3QoZS5zdHJlYW0uaWQpKSB7XG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZXN0cmVhbScsIGUuc3RyZWFtLmlkLnNwbGl0KCctJylbMF0sIGUuc3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICBfaGFuZGxlSWNlR2F0aGVyaW5nVGltZW91dCgpIHtcbiAgICBpZiAodGhpcy5wYy5pY2VHYXRoZXJpbmdTdGF0ZSAhPT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9nZ2VyLndhcm4oJ0lDRSBnYXRoZXJpbmcgbmV2ZXIgY29tcGxldGVkLCcpO1xuICAgICAgdGhpcy5faGFuZGxlSWNlQ2FuZGlkYXRlKHtjYW5kaWRhdGU6IG51bGx9KTtcbiAgICB9XG4gIH1cblxuICBfaGFuZGxlSWNlQ2FuZGlkYXRlKGUpIHtcbiAgICBpZiAoZS5jYW5kaWRhdGUgPT0gbnVsbCAmJiB0aGlzLl9yZW1vdGVTRFAgPT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmluZm8oJ0lDRSBSZWFkeScpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2ljZUdhdGhlcmluZ1RpbWVvdXQpO1xuICAgICAgdGhpcy5lbWl0KCdvZmZlcicsIFNEUC5maWx0ZXJUQ1BDYW5kaWRhdGVzKHRoaXMucGMubG9jYWxEZXNjcmlwdGlvbi5zZHApKTtcbiAgICB9XG4gIH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvUGVlckNvbm5lY3Rpb24uanNcbiAqKi8iXX0=