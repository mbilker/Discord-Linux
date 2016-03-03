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

  function PeerConnection(ssrc, address, port, bitrate) {
    _classCallCheck(this, PeerConnection);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PeerConnection).call(this));

    _this.pc = null;

    _this.address = address;
    _this.port = port;

    _this.bitrate = bitrate;

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
     * Update the encoding bit rate.
     *
     * @param {Number} bitrate
     */

  }, {
    key: 'setBitRate',
    value: function setBitRate(bitrate) {
      this.bitrate = bitrate;
      this._fakeRemoteOffer();
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
      this.pc.setRemoteDescription(_SDP2.default.createSessionDescription(type, this.payloadType, this.remoteSDP, mode, streams, this.bitrate), function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvUGVlckNvbm5lY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLElBQU0sU0FBUyxpQkFBTyxNQUFQLENBQWMsUUFBZCxDQUFUOztBQUVOLElBQUksdUJBQUo7QUFDQSxJQUFJLG1CQUFTLElBQVQsS0FBa0IsU0FBbEIsRUFBNkI7QUFDL0IsZ0JBQWM7QUFDWix5QkFBcUIsSUFBckI7QUFDQSx5QkFBcUIsS0FBckI7R0FGRixDQUQrQjtDQUFqQyxNQU1LO0FBQ0gsZ0JBQWM7QUFDWixlQUFXO0FBQ1QsMkJBQXFCLElBQXJCO0FBQ0EsMkJBQXFCLEtBQXJCO0tBRkY7QUFJQSxjQUFVLENBQ1IsRUFBQyx3QkFBd0IsSUFBeEIsRUFETyxDQUFWO0dBTEYsQ0FERztDQU5MOztJQWtCcUI7OztBQUNuQixXQURtQixjQUNuQixDQUFZLElBQVosRUFBa0IsT0FBbEIsRUFBMkIsSUFBM0IsRUFBaUMsT0FBakMsRUFBMEM7MEJBRHZCLGdCQUN1Qjs7dUVBRHZCLDRCQUN1Qjs7QUFHeEMsVUFBSyxFQUFMLEdBQVUsSUFBVixDQUh3Qzs7QUFLeEMsVUFBSyxPQUFMLEdBQWUsT0FBZixDQUx3QztBQU14QyxVQUFLLElBQUwsR0FBWSxJQUFaLENBTndDOztBQVF4QyxVQUFLLE9BQUwsR0FBZSxPQUFmLENBUndDOztBQVV4QyxVQUFLLElBQUwsR0FBWSxJQUFaLENBVndDO0FBV3hDLFVBQUssbUJBQUwsR0FBMkIsRUFBM0IsQ0FYd0M7QUFZeEMsVUFBSyxhQUFMLEdBQXFCLEVBQXJCLENBWndDOztBQWN4QyxVQUFLLGlCQUFMLEdBQXlCLEtBQXpCLENBZHdDO0FBZXhDLFVBQUssV0FBTCxHQUFtQixLQUFuQixDQWZ3Qzs7QUFpQnhDLFVBQUssV0FBTCxHQUFtQixJQUFuQixDQWpCd0M7O0FB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QVYsSUFBa0IsQ0FBQyxRQUFELEVBQVc7QUFDL0IsYUFBSyxFQUFMLENBQVEsU0FBUixDQUFrQixNQUFsQixFQUQrQjtPQUFqQzs7Ozt3QkF1Q2M7QUFDZCxhQUFPLEtBQUssVUFBTCxDQURPOzs7Ozs7Ozs7c0JBU0YsS0FBSztBQUNqQixXQUFLLFVBQUwsR0FBa0IsR0FBbEIsQ0FEaUI7QUFFakIsVUFBTSxPQUFPLEtBQUssNEJBQUwsQ0FGSTtBQUdqQixhQUFPLEtBQUssNEJBQUwsQ0FIVTtBQUlqQixXQUFLLHdCQUFMLGdDQUFpQyxLQUFqQyxFQUppQjs7OztTQWxOQSIsImZpbGUiOiJQZWVyQ29ubmVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IExvZ2dlciBmcm9tICcuLi8uLi9Mb2dnZXInO1xuaW1wb3J0IFNEUCBmcm9tICcuL1NEUCc7XG5pbXBvcnQgSUNFIGZyb20gJy4vSUNFJztcbmltcG9ydCBwbGF0Zm9ybSBmcm9tICdwbGF0Zm9ybSc7XG5cbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5jcmVhdGUoJ1dlYlJUQycpO1xuXG5sZXQgY29uc3RyYWludHM7XG5pZiAocGxhdGZvcm0ubmFtZSA9PT0gJ0ZpcmVmb3gnKSB7XG4gIGNvbnN0cmFpbnRzID0ge1xuICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWUsXG4gICAgb2ZmZXJUb1JlY2VpdmVWaWRlbzogZmFsc2VcbiAgfTtcbn1cbmVsc2Uge1xuICBjb25zdHJhaW50cyA9IHtcbiAgICBtYW5kYXRvcnk6IHtcbiAgICAgIE9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWUsXG4gICAgICBPZmZlclRvUmVjZWl2ZVZpZGVvOiBmYWxzZVxuICAgIH0sXG4gICAgb3B0aW9uYWw6IFtcbiAgICAgIHtWb2ljZUFjdGl2aXR5RGV0ZWN0aW9uOiB0cnVlfVxuICAgIF1cbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGVlckNvbm5lY3Rpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3Rvcihzc3JjLCBhZGRyZXNzLCBwb3J0LCBiaXRyYXRlKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMucGMgPSBudWxsO1xuXG4gICAgdGhpcy5hZGRyZXNzID0gYWRkcmVzcztcbiAgICB0aGlzLnBvcnQgPSBwb3J0O1xuXG4gICAgdGhpcy5iaXRyYXRlID0gYml0cmF0ZTtcblxuICAgIHRoaXMuc3NyYyA9IHNzcmM7XG4gICAgdGhpcy5yZW1vdGVTdHJlYW1IaXN0b3J5ID0gW107XG4gICAgdGhpcy5yZW1vdGVTdHJlYW1zID0ge307XG5cbiAgICB0aGlzLm5lZ290aWF0aW9uTmVlZGVkID0gZmFsc2U7XG4gICAgdGhpcy5uZWdvdGlhdGluZyA9IGZhbHNlO1xuXG4gICAgdGhpcy5wYXlsb2FkVHlwZSA9IG51bGw7XG5cbiAgICB0aGlzLl9zdHJlYW0gPSBudWxsO1xuICAgIHRoaXMuX3JlbW90ZVNEUCA9IG51bGw7XG5cbiAgICB0aGlzLl9zYWZlRXhlY3V0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5fc2FmZVF1ZXVlID0gW107XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIFJUQ1BlZXJDb25uZWN0aW9uLCBnYXRoZXIgSUNFIGNhbmRpZGF0ZXMgYW5kIGNyZWF0ZSBhbiBvZmZlci5cbiAgICovXG4gIGNvbm5lY3QoKSB7XG4gICAgaWYgKHRoaXMucGMgIT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgSUNFLmdldFNlcnZlcnMoaWNlU2VydmVycyA9PiB7XG4gICAgICBsZXQgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oe2ljZVNlcnZlcnN9LCB7XG4gICAgICAgIG9wdGlvbmFsOiBbXG4gICAgICAgICAge0R0bHNTcnRwS2V5QWdyZWVtZW50OiB0cnVlfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gdGhpcy5faGFuZGxlSWNlQ2FuZGlkYXRlLmJpbmQodGhpcyk7XG4gICAgICBwYy5vbm5lZ290aWF0aW9ubmVlZGVkID0gdGhpcy5faGFuZGxlTmVnb3RpYXRpb25OZWVkZWQuYmluZCh0aGlzKTtcbiAgICAgIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gdGhpcy5faGFuZGxlSWNlQ29ubmVjdGlvblN0YXRlQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICBwYy5vbnNpZ25hbGluZ3N0YXRlY2hhbmdlID0gdGhpcy5faGFuZGxlU2lnbmFsaW5nU3RhdGVDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgIHBjLm9uYWRkc3RyZWFtID0gdGhpcy5faGFuZGxlQWRkU3RyZWFtLmJpbmQodGhpcyk7XG4gICAgICBwYy5vbnJlbW92ZXN0cmVhbSA9IHRoaXMuX2hhbmRsZVJlbW92ZVN0cmVhbS5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5wYyA9IHBjO1xuICAgICAgaWYgKHRoaXMuc3RyZWFtKSB7XG4gICAgICAgIHBjLmFkZFN0cmVhbSh0aGlzLnN0cmVhbSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9jcmVhdGVMb2NhbE9mZmVyKChtb2RlLCBzdHJlYW1zKSA9PiB7XG4gICAgICAgIC8vIFN0b3JlIHRoaXMgc28gd2hlbiB0aGUgcmVtb3RlIFNEUCBhcnJpdmVzIHRoZSB2YXJpYWJsZXMgd2hlbiBpdCB3YXNcbiAgICAgICAgLy8gY3JlYXRlZCBhcmUgdXNlZCB0byBnZW5lcmF0ZSB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uIGFyZ3MuXG4gICAgICAgIHRoaXMuX2Fuc3dlclJlbW90ZURlc2NyaXB0aW9uQXJncyA9IFsnYW5zd2VyJywgbW9kZSwgc3RyZWFtc107XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2ljZUdhdGhlcmluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuX2hhbmRsZUljZUdhdGhlcmluZ1RpbWVvdXQuYmluZCh0aGlzKSwgNTAwMCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBlbmNvZGluZyBiaXQgcmF0ZS5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJpdHJhdGVcbiAgICovXG4gIHNldEJpdFJhdGUoYml0cmF0ZSkge1xuICAgIHRoaXMuYml0cmF0ZSA9IGJpdHJhdGU7XG4gICAgdGhpcy5fZmFrZVJlbW90ZU9mZmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2UgYSBSVENQZWVyQ29ubmVjdGlvbi5cbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pY2VHYXRoZXJpbmdUaW1lb3V0KTtcblxuICAgIGlmICh0aGlzLnBjICE9IG51bGwpIHtcbiAgICAgIGxldCBwYyA9IHRoaXMucGM7XG4gICAgICBpZiAodGhpcy5zaWduYWxpbmdTdGF0ZSAhPT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgcGMuY2xvc2UoKTtcbiAgICAgIH1cbiAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gbnVsbDtcbiAgICAgIHBjLm9ubmVnb3RpYXRpb25uZWVkZWQgPSBudWxsO1xuICAgICAgcGMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgcGMub25zaWduYWxpbmdzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICBwYy5vbmFkZHN0cmVhbSA9IG51bGw7XG4gICAgICBwYy5vbnJlbW92ZXN0cmVhbSA9IG51bGw7XG4gICAgICB0aGlzLnBjID0gbnVsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBJQ0Uuc3RvcCgpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBJQ0UgZ2F0aGVyaW5nIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgaWNlR2F0aGVyaW5nU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGMgJiYgdGhpcy5wYy5pY2VHYXRoZXJpbmdTdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgSUNFIGNvbm5lY3Rpb24gc3RhdGUuXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBpY2VDb25uZWN0aW9uU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGMgJiYgdGhpcy5wYy5pY2VDb25uZWN0aW9uU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHNpZ25hbGluZyBzdGF0ZS5cbiAgICpcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IHNpZ25hbGluZ1N0YXRlKCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5wYyAmJiB0aGlzLnBjLnNpZ25hbGluZ1N0YXRlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgLy8gRm9yIHNvbWUgcmVhc29uIHRoaXMgdGhyb3dzIGBJbnZhbGlkU3RhdGVFcnJvcmAgd2hlbiB5b3UgZGlzY29ubmVjdCBvbiBGaXJlZm94LlxuICAgICAgLy8gQ2F0Y2ggaXQgYW5kIHJldHVybiBcImNsb3NlZFwiIHRvIG1hdGNoIHdoYXQgQ2hyb21lIGRvZXMuXG4gICAgICByZXR1cm4gJ2Nsb3NlZCc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiBSVENQZWVyQ29ubmVjdGlvbiBpcyBzdWNjZXNzZnVsbHkgY29ubmVjdGVkIG92ZXIgSUNFLlxuICAgKlxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IGNvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gcGMgIT0gbnVsbCAmJiAvY29ubmVjdGVkfGNvbXBsZXRlZC8udGVzdCh0aGlzLnBjLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gIH1cblxuICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlSlNEb2NcbiAgLyoqXG4gICAqIFJldHVybiB0aGUgY3VycmVudGx5IHNldCBsb2NhbCBtZWRpYSBzdHJlYW0uIFRoaXMgY2FuIGJlIG5vdCBzZXQgaWYgdGhlIGNvbm5lY3Rpb25cbiAgICogaXMgcmVjZWl2aW5nIG9ubHkuXG4gICAqXG4gICAqIEByZXR1cm4ge01lZGlhU3RyZWFtfG51bGx9XG4gICAqL1xuICBnZXQgc3RyZWFtKCkge1xuICAgIHJldHVybiB0aGlzLl9zdHJlYW07XG4gIH1cblxuICAvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlSlNEb2NcbiAgLyoqXG4gICAqIFNldCBhIE1lZGlhU3RyZWFtIG9yIHVuc2V0IHRoZSBNZWRpYVN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtNZWRpYVN0cmVhbXxudWxsfSBzdHJlYW1cbiAgICovXG4gIHNldCBzdHJlYW0oc3RyZWFtKSB7XG4gICAgY29uc3QgaXNDbG9zZWQgPSB0aGlzLnBjID09IG51bGwgfHwgdGhpcy5zaWduYWxpbmdTdGF0ZSA9PT0gJ2Nsb3NlZCc7XG5cbiAgICBpZiAodGhpcy5fc3RyZWFtICE9IG51bGwgJiYgIWlzQ2xvc2VkKSB7XG4gICAgICB0aGlzLnBjLnJlbW92ZVN0cmVhbSh0aGlzLl9zdHJlYW0pO1xuICAgIH1cblxuICAgIHRoaXMuX3N0cmVhbSA9IHN0cmVhbTtcblxuICAgIGlmIChzdHJlYW0gIT0gbnVsbCAmJiAhaXNDbG9zZWQpIHtcbiAgICAgIHRoaXMucGMuYWRkU3RyZWFtKHN0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyByZW1vdGUgc3RyZWFtIHRvIHRoZSBSVENQZWVyQ29ubmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNuYW1lXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzc3JjXG4gICAqL1xuICBzZXRSZW1vdGVTdHJlYW0oY25hbWUsIHNzcmMpIHtcbiAgICBpZiAoIXRoaXMucmVtb3RlU3RyZWFtSGlzdG9yeS5zb21lKHN0cmVhbSA9PiBzdHJlYW0uc3NyYyA9PT0gc3NyYykpIHtcbiAgICAgIHRoaXMucmVtb3RlU3RyZWFtSGlzdG9yeS5wdXNoKHtzc3JjLCBjbmFtZX0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5yZW1vdGVTdHJlYW1zW2NuYW1lXSAhPT0gc3NyYykge1xuICAgICAgdGhpcy5yZW1vdGVTdHJlYW1zID0gey4uLnRoaXMucmVtb3RlU3RyZWFtcywgW2NuYW1lXTogc3NyY307XG4gICAgICB0aGlzLl9mYWtlUmVtb3RlT2ZmZXIoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgbmV3IHJlbW90ZSBzdHJlYW0gZnJvbSB0aGUgUlRDUGVlckNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbmFtZVxuICAgKi9cbiAgcmVtb3ZlUmVtb3RlU3RyZWFtKGNuYW1lKSB7XG4gICAgaWYgKHRoaXMucmVtb3RlU3RyZWFtc1tjbmFtZV0gIT0gbnVsbCkge1xuICAgICAgdGhpcy5yZW1vdGVTdHJlYW1zID0gey4uLnRoaXMucmVtb3RlU3RyZWFtc307XG4gICAgICBkZWxldGUgdGhpcy5yZW1vdGVTdHJlYW1zW2NuYW1lXTtcbiAgICAgIHRoaXMuX2Zha2VSZW1vdGVPZmZlcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnRseSBzZXQgcmVtb3RlIFNEUCBvbiB0aGUgY29ubmVjdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IHJlbW90ZVNEUCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVtb3RlU0RQO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhbiByZW1vdGUgU0RQIG9uIHRoZSBjb25uZWN0aW9uLiBUaGlzIGhhcyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZHBcbiAgICovXG4gIHNldCByZW1vdGVTRFAoc2RwKSB7XG4gICAgdGhpcy5fcmVtb3RlU0RQID0gc2RwO1xuICAgIGNvbnN0IGFyZ3MgPSB0aGlzLl9hbnN3ZXJSZW1vdGVEZXNjcmlwdGlvbkFyZ3M7XG4gICAgZGVsZXRlIHRoaXMuX2Fuc3dlclJlbW90ZURlc2NyaXB0aW9uQXJncztcbiAgICB0aGlzLl91cGRhdGVSZW1vdGVEZXNjcmlwdGlvbiguLi5hcmdzKTtcbiAgfVxuXG4gIC8vIFByaXZhdGVcblxuICAvKipcbiAgICogRXhlY3V0ZSBmdW5jdGlvbiBpZiBJQ0UgY29ubmVjdGlvbiBpcyBjb25uZWN0ZWQgYW5kIHNpbmdhbCBzdGF0ZSBpcyBzdGFibGUuXG4gICAqIE90aGVyd2lzZSBlbnF1ZXVlIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZnVuY11cbiAgICovXG4gIF9zYWZlRXhlY3V0ZShmdW5jKSB7XG4gICAgaWYgKHRoaXMuaWNlQ29ubmVjdGlvblN0YXRlID09PSAnY2xvc2VkJykge1xuICAgICAgbG9nZ2VyLmluZm8oJ3NhZmVFeGVjdXRlOiBJQ0UgY29ubmVjdGlvbiBjbG9zZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc2FmZUV4ZWN1dGluZykge1xuICAgICAgbG9nZ2VyLmluZm8oJ3NhZmVFeGVjdXRlOiBjdXJyZW50bHkgZXhlY3V0aW5nJyk7XG4gICAgICB0aGlzLl9zYWZlUXVldWUucHVzaChmdW5jKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5yZW1vdGVTRFAgPT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmluZm8oJ3NhZmVFeGVjdXRlOiBhd2FpdGluZyByZW1vdGUgU0RQJyk7XG4gICAgICB0aGlzLl9zYWZlUXVldWUucHVzaChmdW5jKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5zaWduYWxpbmdTdGF0ZSAhPT0gJ3N0YWJsZScpIHtcbiAgICAgIGxvZ2dlci5pbmZvKCdzYWZlRXhlY3V0ZTogc2lnbmFsaW5nIHN0YXRlJywgdGhpcy5zaWduYWxpbmdTdGF0ZSk7XG4gICAgICB0aGlzLl9zYWZlUXVldWUucHVzaChmdW5jKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLl9zYWZlRXhlY3V0aW5nID0gdHJ1ZTtcbiAgICAgIGZ1bmMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBsb2NhbCBkZXNjcmlwdGlvbiB3aXRoIGFuIG9mZmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdXG4gICAqL1xuICBfY3JlYXRlTG9jYWxPZmZlcihjYWxsYmFjaykge1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLnN0cmVhbSAhPSBudWxsID8gU0RQLlNFTkRSRUNWIDogU0RQLlJFQ1ZPTkxZO1xuICAgIGNvbnN0IHN0cmVhbXMgPSB0aGlzLnJlbW90ZVNEUCAhPSBudWxsID8gdGhpcy5fZ2V0UmVtb3RlU3RyZWFtcygpIDogW107XG4gICAgdGhpcy5wYy5jcmVhdGVPZmZlcihcbiAgICAgIG9mZmVyID0+IHtcbiAgICAgICAgdGhpcy5wYXlsb2FkVHlwZSA9IFNEUC5nZXRPcHVzUGF5bG9hZFR5cGUob2ZmZXIuc2RwKTtcbiAgICAgICAgdGhpcy5wYy5zZXRMb2NhbERlc2NyaXB0aW9uKFxuICAgICAgICAgIG9mZmVyLFxuICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdjcmVhdGVPZmZlcitzZXRMb2NhbERlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG1vZGUsIHN0cmVhbXMpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyID0+IHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZXJyID0+IHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfSxcbiAgICAgIGNvbnN0cmFpbnRzXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGxvY2FsIGRlc2NyaXB0aW9uIHdpdGggYW4gYW5zd2VyLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdXG4gICAqL1xuICBfY3JlYXRlTG9jYWxBbnN3ZXIoY2FsbGJhY2spIHtcbiAgICB0aGlzLnBjLmNyZWF0ZUFuc3dlcihcbiAgICAgIGFuc3dlciA9PiB7XG4gICAgICAgIHRoaXMucGMuc2V0TG9jYWxEZXNjcmlwdGlvbihcbiAgICAgICAgICBhbnN3ZXIsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ2NyZWF0ZUFuc3dlcitzZXRMb2NhbERlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnIgPT4ge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBlcnIgPT4ge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9LFxuICAgICAgY29uc3RyYWludHNcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uIHdpdGggYSBjdXN0b20gYW5zd2VyIHRoYXQgbWVyZ2VzIGFsbCB0aGUgcmVtb3RlIHN0cmVhbXMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtb2RlXG4gICAqIEBwYXJhbSB7QXJyYXl9IHN0cmVhbXNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKi9cbiAgX3VwZGF0ZVJlbW90ZURlc2NyaXB0aW9uKHR5cGUsIG1vZGUsIHN0cmVhbXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihcbiAgICAgIFNEUC5jcmVhdGVTZXNzaW9uRGVzY3JpcHRpb24odHlwZSwgdGhpcy5wYXlsb2FkVHlwZSwgdGhpcy5yZW1vdGVTRFAsIG1vZGUsIHN0cmVhbXMsIHRoaXMuYml0cmF0ZSksXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdzZXRSZW1vdGVEZXNjcmlwdGlvbiBzdWNjZXNzJyk7XG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgICB9LFxuICAgICAgZXJyID0+IHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU2ltdWxhdGUgYSByZW1vdGUgc2VydmVyIG9mZmVyaW5nIG5ldyBTU1JDcy5cbiAgICovXG4gIF9mYWtlUmVtb3RlT2ZmZXIoKSB7XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuX2dldFJlbW90ZVN0cmVhbXMoKTtcblxuICAgIHRoaXMuX3NhZmVFeGVjdXRlKCgpID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZVJlbW90ZURlc2NyaXB0aW9uKCdvZmZlcicsIHRoaXMuc3RyZWFtICE9IG51bGwgPyBTRFAuU0VORFJFQ1YgOiBTRFAuUkVDVk9OTFksIHN0cmVhbXMsICgpID0+IHtcbiAgICAgICAgdGhpcy5fY3JlYXRlTG9jYWxBbnN3ZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvcHkgb2YgYWxsIHRoZSBzdHJlYW1zIGZvciB0aGUgbmV4dCByZW1vdGUgZGVzY3JpcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgX2dldFJlbW90ZVN0cmVhbXMoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlU3RyZWFtSGlzdG9yeS5tYXAoKHtjbmFtZSwgc3NyY30pID0+IFtzc3JjLCBjbmFtZSwgdGhpcy5yZW1vdGVTdHJlYW1zW2NuYW1lXSA9PT0gc3NyY10pO1xuICB9XG5cbiAgLy8gUlRDUGVlckNvbm5lY3Rpb24gRXZlbnQgSGFuZGxlcnNcblxuICBfaGFuZGxlTmVnb3RpYXRpb25OZWVkZWQoKSB7XG4gICAgbG9nZ2VyLmluZm8oJ25lZ290aWF0aW9uTmVlZGVkJyk7XG4gICAgdGhpcy5fc2FmZUV4ZWN1dGUoKCkgPT4ge1xuICAgICAgdGhpcy5fY3JlYXRlTG9jYWxPZmZlcigobW9kZSwgc3RyZWFtcykgPT4ge1xuICAgICAgICB0aGlzLl91cGRhdGVSZW1vdGVEZXNjcmlwdGlvbignYW5zd2VyJywgbW9kZSwgc3RyZWFtcyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9oYW5kbGVJY2VDb25uZWN0aW9uU3RhdGVDaGFuZ2UoKSB7XG4gICAgbGV0IGNvbm5lY3Rpb25TdGF0ZSA9IHRoaXMucGMuaWNlQ29ubmVjdGlvblN0YXRlO1xuICAgIGxvZ2dlci5pbmZvKCdpY2VDb25uZWN0aW9uU3RhdGUgPT4nLCBjb25uZWN0aW9uU3RhdGUpO1xuICAgIGlmIChjb25uZWN0aW9uU3RhdGUgPT09ICdjb21wbGV0ZWQnKSB7XG4gICAgICBjb25uZWN0aW9uU3RhdGUgPSAnY29ubmVjdGVkJztcbiAgICB9XG4gICAgdGhpcy5lbWl0KGNvbm5lY3Rpb25TdGF0ZSk7XG4gIH1cblxuICBfaGFuZGxlU2lnbmFsaW5nU3RhdGVDaGFuZ2UoKSB7XG4gICAgbG9nZ2VyLmluZm8oJ3NpZ25hbGluZ1N0YXRlID0+JywgdGhpcy5wYy5zaWduYWxpbmdTdGF0ZSk7XG4gICAgaWYgKHRoaXMucGMuc2lnbmFsaW5nU3RhdGUgPT09ICdzdGFibGUnKSB7XG4gICAgICB0aGlzLl9zYWZlRXhlY3V0aW5nID0gZmFsc2U7XG4gICAgICBsZXQgZnVuYyA9IHRoaXMuX3NhZmVRdWV1ZS5zaGlmdCgpO1xuICAgICAgaWYgKGZ1bmMgIT0gbnVsbCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnc2FmZUV4ZWN1dGU6IHJ1bm5pbmcgcXVldWVkIGZ1bmN0aW9uJyk7XG4gICAgICAgIHRoaXMuX3NhZmVFeGVjdXRlKGZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9oYW5kbGVBZGRTdHJlYW0oZSkge1xuICAgIGlmICghL15kZWZhdWx0Ly50ZXN0KGUuc3RyZWFtLmlkKSkge1xuICAgICAgdGhpcy5lbWl0KCdhZGRzdHJlYW0nLCBlLnN0cmVhbS5pZC5zcGxpdCgnLScpWzBdLCBlLnN0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgX2hhbmRsZVJlbW92ZVN0cmVhbShlKSB7XG4gICAgaWYgKCEvXmRlZmF1bHQvLnRlc3QoZS5zdHJlYW0uaWQpKSB7XG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZXN0cmVhbScsIGUuc3RyZWFtLmlkLnNwbGl0KCctJylbMF0sIGUuc3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICBfaGFuZGxlSWNlR2F0aGVyaW5nVGltZW91dCgpIHtcbiAgICBpZiAodGhpcy5wYy5pY2VHYXRoZXJpbmdTdGF0ZSAhPT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9nZ2VyLndhcm4oJ0lDRSBnYXRoZXJpbmcgbmV2ZXIgY29tcGxldGVkLCcpO1xuICAgICAgdGhpcy5faGFuZGxlSWNlQ2FuZGlkYXRlKHtjYW5kaWRhdGU6IG51bGx9KTtcbiAgICB9XG4gIH1cblxuICBfaGFuZGxlSWNlQ2FuZGlkYXRlKGUpIHtcbiAgICBpZiAoZS5jYW5kaWRhdGUgPT0gbnVsbCAmJiB0aGlzLl9yZW1vdGVTRFAgPT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmluZm8oJ0lDRSBSZWFkeScpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2ljZUdhdGhlcmluZ1RpbWVvdXQpO1xuICAgICAgdGhpcy5lbWl0KCdvZmZlcicsIFNEUC5maWx0ZXJUQ1BDYW5kaWRhdGVzKHRoaXMucGMubG9jYWxEZXNjcmlwdGlvbi5zZHApKTtcbiAgICB9XG4gIH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvUGVlckNvbm5lY3Rpb24uanNcbiAqKi8iXX0=