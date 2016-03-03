'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _platform = require('platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var SENDRECV = 'sendrecv';
var RECVONLY = 'sendonly';

function concatSDP() {
  for (var _len = arguments.length, parts = Array(_len), _key = 0; _key < _len; _key++) {
    parts[_key] = arguments[_key];
  }

  return parts.join('\n').trim() + '\n';
}

function transformCandidates(sdp, payloadType) {
  return sdp.replace('ICE/SDP', 'RTP/SAVPF ' + payloadType).trim();
}

var generateSDP = undefined;
if (_platform2.default.name === 'Firefox') {
  (function () {
    var DEFAULT_STREAM = [0, 'default', true];

    generateSDP = function generateSDP(type, payloadType, candidates, mode, streams, bitrate) {
      candidates = transformCandidates(candidates, payloadType);

      streams = [DEFAULT_STREAM].concat(_toConsumableArray(streams));

      var bundles = streams.map(function (_, i) {
        return 'sdparta_' + i;
      }).join(' ');

      var mlines = streams.map(function (_ref, i) {
        var _ref2 = _slicedToArray(_ref, 3);

        var ssrc = _ref2[0];
        var cname = _ref2[1];
        var active = _ref2[2];

        if (active) {
          return candidates + '\na=' + (mode === SENDRECV && i === 0 ? 'sendrecv' : 'sendonly') + '\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\na=mid:sdparta_' + i + '\nb=AS:' + bitrate + '\na=msid:' + cname + '-' + ssrc + ' ' + cname + '-' + ssrc + '\na=rtcp-mux\na=rtpmap:' + payloadType + ' opus/48000/2\na=setup:actpass\na=ssrc:' + ssrc + ' cname:' + cname + '-' + ssrc;
        } else {
          return 'm=audio 0 RTP/SAVPF ' + payloadType + '\nc=IN IP4 0.0.0.0\na=inactive\na=rtpmap:' + payloadType + ' NULL/0';
        }
      });

      return concatSDP.apply(undefined, ['v=0\no=mozilla...THIS_IS_SDPARTA 6054093392514871408 0 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE ' + bundles + '\na=msid-semantic:WMS *'].concat(_toConsumableArray(mlines)));
    };
  })();
} else {
  generateSDP = function generateSDP(type, payloadType, candidates, mode, streams, bitrate) {
    var ssrcs = streams.filter(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 3);

      var ssrc = _ref4[0];
      var cname = _ref4[1];
      var active = _ref4[2];
      return active;
    }).map(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2);

      var ssrc = _ref6[0];
      var cname = _ref6[1];

      return 'a=ssrc:' + ssrc + ' cname:' + cname + '\na=ssrc:' + ssrc + ' msid:' + cname + ' ' + cname;
    });
    return concatSDP.apply(undefined, ['v=0\no=- 6054093392514871408 3 IN IP4 127.0.0.1\ns=-\nt=0 0\na=setup:' + (type === 'answer' ? 'passive' : 'actpass'), transformCandidates(candidates, payloadType), 'a=rtcp-mux\na=mid:audio\nb=AS:' + bitrate + '\na=' + (mode == SENDRECV ? 'sendrecv' : 'sendonly') + '\na=rtpmap:' + payloadType + ' opus/48000/2\na=fmtp:' + payloadType + ' minptime=10; useinbandfec=1\na=maxptime:60'].concat(_toConsumableArray(ssrcs)));
  };
}

exports.default = {
  SENDRECV: SENDRECV,
  RECVONLY: RECVONLY,

  /**
   * Get the Opus payload type from SDP.
   *
   * @param {String} sdp
   * @return {string}
   */
  getOpusPayloadType: function getOpusPayloadType(sdp) {
    return sdp.match(/a=rtpmap:(\d+) opus/)[1];
  },


  /**
   * Create custom session description.
   *
   * @param {String} type
   * @param {String} payloadType
   * @param {String} candidates
   * @param {String} mode
   * @param {Array<Array>} streams
   * @param {Number} bitrate
   * @return {RTCSessionDescription}
   */
  createSessionDescription: function createSessionDescription(type, payloadType, candidates, mode, streams, bitrate) {
    return new RTCSessionDescription({
      type: type,
      sdp: generateSDP(type, payloadType, candidates, mode, streams, (bitrate || 40000) / 1000)
    });
  },


  /**
   * Remove all TCP candidates from the SDP.
   *
   * @param {String} sdp
   * @return {String}
   */
  filterTCPCandidates: function filterTCPCandidates(sdp) {
    return sdp.replace(/\r/g, '').split('\n').map(function (line) {
      if (!/^a=candidate:/.test(line)) {
        return line;
      }

      var tokens = line.split(' ');
      tokens = tokens.slice(0, 2).concat([tokens[2].toUpperCase()].concat(_toConsumableArray(tokens.slice(3))));

      if (tokens[2] === 'TCP') {
        return null;
      }

      return tokens.join(' ');
    }).filter(function (line) {
      return line != null;
    }).join('\n');
  }
};

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/SDP.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvU0RQLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFNLFdBQVcsVUFBWDtBQUNOLElBQU0sV0FBVyxVQUFYOztBQUVOLFNBQVMsU0FBVCxHQUE2QjtvQ0FBUDs7R0FBTzs7QUFDM0IsU0FBTyxNQUFNLElBQU4sQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEtBQTBCLElBQTFCLENBRG9CO0NBQTdCOztBQUlBLFNBQVMsbUJBQVQsQ0FBNkIsR0FBN0IsRUFBa0MsV0FBbEMsRUFBK0M7QUFDN0MsU0FBTyxJQUFJLE9BQUosQ0FBWSxTQUFaLGlCQUFvQyxXQUFwQyxFQUFtRCxJQUFuRCxFQUFQLENBRDZDO0NBQS9DOztBQUlBLElBQUksdUJBQUo7QUFDQSxJQUFJLG1CQUFTLElBQVQsS0FBa0IsU0FBbEIsRUFBNkI7O0FBQy9CLFFBQU0saUJBQWlCLENBQUMsQ0FBRCxFQUFJLFNBQUosRUFBZSxJQUFmLENBQWpCOztBQUVOLGtCQUFjLHFCQUFDLElBQUQsRUFBTyxXQUFQLEVBQW9CLFVBQXBCLEVBQWdDLElBQWhDLEVBQXNDLE9BQXRDLEVBQStDLE9BQS9DLEVBQTJEO0FBQ3ZFLG1CQUFhLG9CQUFvQixVQUFwQixFQUFnQyxXQUFoQyxDQUFiLENBRHVFOztBQUd2RSxpQkFBVywwQ0FBbUIsU0FBOUIsQ0FIdUU7O0FBS3ZFLFVBQU0sVUFBVSxRQUFRLEdBQVIsQ0FBWSxVQUFDLENBQUQsRUFBSSxDQUFKOzRCQUFxQjtPQUFyQixDQUFaLENBQXNDLElBQXRDLENBQTJDLEdBQTNDLENBQVYsQ0FMaUU7O0FBT3ZFLFVBQU0sU0FBUyxRQUFRLEdBQVIsQ0FBWSxnQkFBd0IsQ0FBeEIsRUFBOEI7OztZQUE1QixnQkFBNEI7WUFBdEIsaUJBQXNCO1lBQWYsa0JBQWU7O0FBQ3ZELFlBQUksTUFBSixFQUFZO0FBQ1YsaUJBQVUsdUJBQ2QsU0FBUyxRQUFULElBQXFCLE1BQU0sQ0FBTixHQUFVLFVBQS9CLEdBQTRDLFVBQTVDLGlGQUVZLGdCQUNULHdCQUNFLGNBQVMsYUFBUSxjQUFTLG1DQUV4QiwwREFFRixtQkFBYyxjQUFTLElBVHhCLENBRFU7U0FBWixNQVlLO0FBQ0gsMENBQThCLDREQUczQix1QkFISCxDQURHO1NBWkw7T0FEeUIsQ0FBckIsQ0FQaUU7O0FBNEJ2RSxhQUFPLHFJQUtNLCtEQUVSLFFBUEUsQ0FBUCxDQTVCdUU7S0FBM0Q7T0FIaUI7Q0FBakMsTUEwQ0s7QUFDSCxnQkFBYyxxQkFBQyxJQUFELEVBQU8sV0FBUCxFQUFvQixVQUFwQixFQUFnQyxJQUFoQyxFQUFzQyxPQUF0QyxFQUErQyxPQUEvQyxFQUEyRDtBQUN2RSxRQUFJLFFBQVEsUUFDVCxNQURTLENBQ0Y7OztVQUFFO1VBQU07VUFBTzthQUFZO0tBQTNCLENBREUsQ0FFVCxHQUZTLENBRUwsaUJBQW1COzs7VUFBakIsZ0JBQWlCO1VBQVgsaUJBQVc7O0FBQ3RCLHlCQUFpQixtQkFBYyxzQkFDOUIsa0JBQWEsY0FBUyxLQUR2QixDQURzQjtLQUFuQixDQUZILENBRG1FO0FBT3ZFLFdBQU8sdUdBS0QsU0FBUyxRQUFULEdBQW9CLFNBQXBCLEdBQWdDLFNBQWhDLEdBQ0osb0JBQW9CLFVBQXBCLEVBQWdDLFdBQWhDLHNDQUdDLG9CQUNILFFBQVEsUUFBUixHQUFtQixVQUFuQixHQUFnQyxVQUFoQyxvQkFDTyx5Q0FDRix1RkFFQSxPQWRFLENBQVAsQ0FQdUU7R0FBM0QsQ0FEWDtDQTFDTDs7a0JBcUVlO0FBQ2IsWUFBVSxRQUFWO0FBQ0EsWUFBVSxRQUFWOzs7Ozs7OztBQVFBLGtEQUFtQixLQUFLO0FBQ3RCLFdBQU8sSUFBSSxLQUFKLENBQVUscUJBQVYsRUFBaUMsQ0FBakMsQ0FBUCxDQURzQjtHQVZYOzs7Ozs7Ozs7Ozs7OztBQXlCYiw4REFBeUIsTUFBTSxhQUFhLFlBQVksTUFBTSxTQUFTLFNBQVM7QUFDOUUsV0FBTyxJQUFJLHFCQUFKLENBQTBCO0FBQy9CLFlBQU0sSUFBTjtBQUNBLFdBQUssWUFBWSxJQUFaLEVBQWtCLFdBQWxCLEVBQStCLFVBQS9CLEVBQTJDLElBQTNDLEVBQWlELE9BQWpELEVBQTBELENBQUMsV0FBVyxLQUFYLENBQUQsR0FBcUIsSUFBckIsQ0FBL0Q7S0FGSyxDQUFQLENBRDhFO0dBekJuRTs7Ozs7Ozs7O0FBc0NiLG9EQUFvQixLQUFLO0FBQ3ZCLFdBQU8sSUFDSixPQURJLENBQ0ksS0FESixFQUNXLEVBRFgsRUFFSixLQUZJLENBRUUsSUFGRixFQUdKLEdBSEksQ0FHQSxnQkFBUTtBQUNYLFVBQUksQ0FBQyxnQkFBZ0IsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBRCxFQUE2QjtBQUMvQixlQUFPLElBQVAsQ0FEK0I7T0FBakM7O0FBSUEsVUFBSSxTQUFTLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBVCxDQUxPO0FBTVgsZUFBUyxPQUFPLEtBQVAsQ0FBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLE1BQW5CLEVBQTJCLE9BQU8sQ0FBUCxFQUFVLFdBQVYsOEJBQTRCLE9BQU8sS0FBUCxDQUFhLENBQWIsR0FBdkQsQ0FBVCxDQU5XOztBQVFYLFVBQUksT0FBTyxDQUFQLE1BQWMsS0FBZCxFQUFxQjtBQUN2QixlQUFPLElBQVAsQ0FEdUI7T0FBekI7O0FBSUEsYUFBTyxPQUFPLElBQVAsQ0FBWSxHQUFaLENBQVAsQ0FaVztLQUFSLENBSEEsQ0FpQkosTUFqQkksQ0FpQkc7YUFBUSxRQUFRLElBQVI7S0FBUixDQWpCSCxDQWtCSixJQWxCSSxDQWtCQyxJQWxCRCxDQUFQLENBRHVCO0dBdENaIiwiZmlsZSI6IlNEUC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwbGF0Zm9ybSBmcm9tICdwbGF0Zm9ybSc7XG5cbmNvbnN0IFNFTkRSRUNWID0gJ3NlbmRyZWN2JztcbmNvbnN0IFJFQ1ZPTkxZID0gJ3NlbmRvbmx5JztcblxuZnVuY3Rpb24gY29uY2F0U0RQKC4uLnBhcnRzKSB7XG4gIHJldHVybiBwYXJ0cy5qb2luKCdcXG4nKS50cmltKCkgKyAnXFxuJztcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtQ2FuZGlkYXRlcyhzZHAsIHBheWxvYWRUeXBlKSB7XG4gIHJldHVybiBzZHAucmVwbGFjZSgnSUNFL1NEUCcsIGBSVFAvU0FWUEYgJHtwYXlsb2FkVHlwZX1gKS50cmltKCk7XG59XG5cbmxldCBnZW5lcmF0ZVNEUDtcbmlmIChwbGF0Zm9ybS5uYW1lID09PSAnRmlyZWZveCcpIHtcbiAgY29uc3QgREVGQVVMVF9TVFJFQU0gPSBbMCwgJ2RlZmF1bHQnLCB0cnVlXTtcblxuICBnZW5lcmF0ZVNEUCA9ICh0eXBlLCBwYXlsb2FkVHlwZSwgY2FuZGlkYXRlcywgbW9kZSwgc3RyZWFtcywgYml0cmF0ZSkgPT4ge1xuICAgIGNhbmRpZGF0ZXMgPSB0cmFuc2Zvcm1DYW5kaWRhdGVzKGNhbmRpZGF0ZXMsIHBheWxvYWRUeXBlKTtcblxuICAgIHN0cmVhbXMgPSBbREVGQVVMVF9TVFJFQU0sIC4uLnN0cmVhbXNdO1xuXG4gICAgY29uc3QgYnVuZGxlcyA9IHN0cmVhbXMubWFwKChfLCBpKSA9PiBgc2RwYXJ0YV8ke2l9YCkuam9pbignICcpO1xuXG4gICAgY29uc3QgbWxpbmVzID0gc3RyZWFtcy5tYXAoKFtzc3JjLCBjbmFtZSwgYWN0aXZlXSwgaSkgPT4ge1xuICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gYCR7Y2FuZGlkYXRlc31cbmE9JHttb2RlID09PSBTRU5EUkVDViAmJiBpID09PSAwID8gJ3NlbmRyZWN2JyA6ICdzZW5kb25seSd9XG5hPWV4dG1hcDoxIHVybjppZXRmOnBhcmFtczpydHAtaGRyZXh0OnNzcmMtYXVkaW8tbGV2ZWxcbmE9bWlkOnNkcGFydGFfJHtpfVxuYj1BUzoke2JpdHJhdGV9XG5hPW1zaWQ6JHtjbmFtZX0tJHtzc3JjfSAke2NuYW1lfS0ke3NzcmN9XG5hPXJ0Y3AtbXV4XG5hPXJ0cG1hcDoke3BheWxvYWRUeXBlfSBvcHVzLzQ4MDAwLzJcbmE9c2V0dXA6YWN0cGFzc1xuYT1zc3JjOiR7c3NyY30gY25hbWU6JHtjbmFtZX0tJHtzc3JjfWA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGBtPWF1ZGlvIDAgUlRQL1NBVlBGICR7cGF5bG9hZFR5cGV9XG5jPUlOIElQNCAwLjAuMC4wXG5hPWluYWN0aXZlXG5hPXJ0cG1hcDoke3BheWxvYWRUeXBlfSBOVUxMLzBgO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbmNhdFNEUChcbiAgICAgIGB2PTBcbm89bW96aWxsYS4uLlRISVNfSVNfU0RQQVJUQSA2MDU0MDkzMzkyNTE0ODcxNDA4IDAgSU4gSVA0IDEyNy4wLjAuMVxucz0tXG50PTAgMFxuYT1ncm91cDpCVU5ETEUgJHtidW5kbGVzfVxuYT1tc2lkLXNlbWFudGljOldNUyAqYCxcbiAgICAgIC4uLm1saW5lc1xuICAgICk7XG4gIH07XG59XG5lbHNlIHtcbiAgZ2VuZXJhdGVTRFAgPSAodHlwZSwgcGF5bG9hZFR5cGUsIGNhbmRpZGF0ZXMsIG1vZGUsIHN0cmVhbXMsIGJpdHJhdGUpID0+IHtcbiAgICBsZXQgc3NyY3MgPSBzdHJlYW1zXG4gICAgICAuZmlsdGVyKChbc3NyYywgY25hbWUsIGFjdGl2ZV0pID0+IGFjdGl2ZSlcbiAgICAgIC5tYXAoKFtzc3JjLCBjbmFtZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGBhPXNzcmM6JHtzc3JjfSBjbmFtZToke2NuYW1lfVxuYT1zc3JjOiR7c3NyY30gbXNpZDoke2NuYW1lfSAke2NuYW1lfWA7XG4gICAgICB9KTtcbiAgICByZXR1cm4gY29uY2F0U0RQKFxuICAgICAgYHY9MFxubz0tIDYwNTQwOTMzOTI1MTQ4NzE0MDggMyBJTiBJUDQgMTI3LjAuMC4xXG5zPS1cbnQ9MCAwXG5hPXNldHVwOiR7dHlwZSA9PT0gJ2Fuc3dlcicgPyAncGFzc2l2ZScgOiAnYWN0cGFzcyd9YCxcbiAgICAgIHRyYW5zZm9ybUNhbmRpZGF0ZXMoY2FuZGlkYXRlcywgcGF5bG9hZFR5cGUpLFxuICAgICAgYGE9cnRjcC1tdXhcbmE9bWlkOmF1ZGlvXG5iPUFTOiR7Yml0cmF0ZX1cbmE9JHttb2RlID09IFNFTkRSRUNWID8gJ3NlbmRyZWN2JyA6ICdzZW5kb25seSd9XG5hPXJ0cG1hcDoke3BheWxvYWRUeXBlfSBvcHVzLzQ4MDAwLzJcbmE9Zm10cDoke3BheWxvYWRUeXBlfSBtaW5wdGltZT0xMDsgdXNlaW5iYW5kZmVjPTFcbmE9bWF4cHRpbWU6NjBgLFxuICAgICAgLi4uc3NyY3NcbiAgICApO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFNFTkRSRUNWOiBTRU5EUkVDVixcbiAgUkVDVk9OTFk6IFJFQ1ZPTkxZLFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIE9wdXMgcGF5bG9hZCB0eXBlIGZyb20gU0RQLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2RwXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIGdldE9wdXNQYXlsb2FkVHlwZShzZHApIHtcbiAgICByZXR1cm4gc2RwLm1hdGNoKC9hPXJ0cG1hcDooXFxkKykgb3B1cy8pWzFdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgY3VzdG9tIHNlc3Npb24gZGVzY3JpcHRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXlsb2FkVHlwZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY2FuZGlkYXRlc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kZVxuICAgKiBAcGFyYW0ge0FycmF5PEFycmF5Pn0gc3RyZWFtc1xuICAgKiBAcGFyYW0ge051bWJlcn0gYml0cmF0ZVxuICAgKiBAcmV0dXJuIHtSVENTZXNzaW9uRGVzY3JpcHRpb259XG4gICAqL1xuICBjcmVhdGVTZXNzaW9uRGVzY3JpcHRpb24odHlwZSwgcGF5bG9hZFR5cGUsIGNhbmRpZGF0ZXMsIG1vZGUsIHN0cmVhbXMsIGJpdHJhdGUpIHtcbiAgICByZXR1cm4gbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbih7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgc2RwOiBnZW5lcmF0ZVNEUCh0eXBlLCBwYXlsb2FkVHlwZSwgY2FuZGlkYXRlcywgbW9kZSwgc3RyZWFtcywgKGJpdHJhdGUgfHwgNDAwMDApIC8gMTAwMClcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGFsbCBUQ1AgY2FuZGlkYXRlcyBmcm9tIHRoZSBTRFAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZHBcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZmlsdGVyVENQQ2FuZGlkYXRlcyhzZHApIHtcbiAgICByZXR1cm4gc2RwXG4gICAgICAucmVwbGFjZSgvXFxyL2csICcnKVxuICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgLm1hcChsaW5lID0+IHtcbiAgICAgICAgaWYgKCEvXmE9Y2FuZGlkYXRlOi8udGVzdChsaW5lKSkge1xuICAgICAgICAgIHJldHVybiBsaW5lO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRva2VucyA9IGxpbmUuc3BsaXQoJyAnKTtcbiAgICAgICAgdG9rZW5zID0gdG9rZW5zLnNsaWNlKDAsIDIpLmNvbmNhdChbdG9rZW5zWzJdLnRvVXBwZXJDYXNlKCksIC4uLnRva2Vucy5zbGljZSgzKV0pO1xuXG4gICAgICAgIGlmICh0b2tlbnNbMl0gPT09ICdUQ1AnKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9rZW5zLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPSBudWxsKVxuICAgICAgLmpvaW4oJ1xcbicpO1xuICB9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL3dlYnJ0Yy9TRFAuanNcbiAqKi8iXX0=