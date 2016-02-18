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

    generateSDP = function generateSDP(type, payloadType, candidates, mode, streams) {
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
          return candidates + '\na=' + (mode === SENDRECV && i === 0 ? 'sendrecv' : 'sendonly') + '\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\na=mid:sdparta_' + i + '\na=msid:' + cname + '-' + ssrc + ' ' + cname + '-' + ssrc + '\na=rtcp-mux\na=rtpmap:' + payloadType + ' opus/48000/2\na=setup:actpass\na=ssrc:' + ssrc + ' cname:' + cname + '-' + ssrc;
        } else {
          return 'm=audio 0 RTP/SAVPF ' + payloadType + '\nc=IN IP4 0.0.0.0\na=inactive\na=rtpmap:' + payloadType + ' NULL/0';
        }
      });

      return concatSDP.apply(undefined, ['v=0\no=mozilla...THIS_IS_SDPARTA 6054093392514871408 0 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE ' + bundles + '\na=msid-semantic:WMS *'].concat(_toConsumableArray(mlines)));
    };
  })();
} else {
  generateSDP = function generateSDP(type, payloadType, candidates, mode, streams) {
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
    return concatSDP.apply(undefined, ['v=0\no=- 6054093392514871408 3 IN IP4 127.0.0.1\ns=-\nt=0 0\na=setup:' + (type === 'answer' ? 'passive' : 'actpass'), transformCandidates(candidates, payloadType), 'a=rtcp-mux\na=mid:audio\na=' + (mode == SENDRECV ? 'sendrecv' : 'sendonly') + '\na=rtpmap:' + payloadType + ' opus/48000/2\na=fmtp:' + payloadType + ' minptime=10; useinbandfec=1\na=maxptime:60'].concat(_toConsumableArray(ssrcs)));
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
   * @return {RTCSessionDescription}
   */
  createSessionDescription: function createSessionDescription(type, payloadType, candidates, mode, streams) {
    return new RTCSessionDescription({
      type: type,
      sdp: generateSDP(type, payloadType, candidates, mode, streams)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvU0RQLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFNLFdBQVcsVUFBWDtBQUNOLElBQU0sV0FBVyxVQUFYOztBQUVOLFNBQVMsU0FBVCxHQUE2QjtvQ0FBUDs7R0FBTzs7QUFDM0IsU0FBTyxNQUFNLElBQU4sQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEtBQTBCLElBQTFCLENBRG9CO0NBQTdCOztBQUlBLFNBQVMsbUJBQVQsQ0FBNkIsR0FBN0IsRUFBa0MsV0FBbEMsRUFBK0M7QUFDN0MsU0FBTyxJQUFJLE9BQUosQ0FBWSxTQUFaLGlCQUFvQyxXQUFwQyxFQUFtRCxJQUFuRCxFQUFQLENBRDZDO0NBQS9DOztBQUlBLElBQUksdUJBQUo7QUFDQSxJQUFJLG1CQUFTLElBQVQsS0FBa0IsU0FBbEIsRUFBNkI7O0FBQy9CLFFBQU0saUJBQWlCLENBQUMsQ0FBRCxFQUFJLFNBQUosRUFBZSxJQUFmLENBQWpCOztBQUVOLGtCQUFjLHFCQUFDLElBQUQsRUFBTyxXQUFQLEVBQW9CLFVBQXBCLEVBQWdDLElBQWhDLEVBQXNDLE9BQXRDLEVBQWtEO0FBQzlELG1CQUFhLG9CQUFvQixVQUFwQixFQUFnQyxXQUFoQyxDQUFiLENBRDhEOztBQUc5RCxpQkFBVywwQ0FBbUIsU0FBOUIsQ0FIOEQ7O0FBSzlELFVBQU0sVUFBVSxRQUFRLEdBQVIsQ0FBWSxVQUFDLENBQUQsRUFBSSxDQUFKOzRCQUFxQjtPQUFyQixDQUFaLENBQXNDLElBQXRDLENBQTJDLEdBQTNDLENBQVYsQ0FMd0Q7O0FBTzlELFVBQU0sU0FBUyxRQUFRLEdBQVIsQ0FBWSxnQkFBd0IsQ0FBeEIsRUFBOEI7OztZQUE1QixnQkFBNEI7WUFBdEIsaUJBQXNCO1lBQWYsa0JBQWU7O0FBQ3ZELFlBQUksTUFBSixFQUFZO0FBQ1YsaUJBQVUsdUJBQ2QsU0FBUyxRQUFULElBQXFCLE1BQU0sQ0FBTixHQUFVLFVBQS9CLEdBQTRDLFVBQTVDLGlGQUVZLGtCQUNQLGNBQVMsYUFBUSxjQUFTLG1DQUV4QiwwREFFRixtQkFBYyxjQUFTLElBUnhCLENBRFU7U0FBWixNQVdLO0FBQ0gsMENBQThCLDREQUczQix1QkFISCxDQURHO1NBWEw7T0FEeUIsQ0FBckIsQ0FQd0Q7O0FBMkI5RCxhQUFPLHFJQUtNLCtEQUVSLFFBUEUsQ0FBUCxDQTNCOEQ7S0FBbEQ7T0FIaUI7Q0FBakMsTUF5Q0s7QUFDSCxnQkFBYyxxQkFBQyxJQUFELEVBQU8sV0FBUCxFQUFvQixVQUFwQixFQUFnQyxJQUFoQyxFQUFzQyxPQUF0QyxFQUFrRDtBQUM5RCxRQUFJLFFBQVEsUUFDVCxNQURTLENBQ0Y7OztVQUFFO1VBQU07VUFBTzthQUFZO0tBQTNCLENBREUsQ0FFVCxHQUZTLENBRUwsaUJBQW1COzs7VUFBakIsZ0JBQWlCO1VBQVgsaUJBQVc7O0FBQ3RCLHlCQUFpQixtQkFBYyxzQkFDOUIsa0JBQWEsY0FBUyxLQUR2QixDQURzQjtLQUFuQixDQUZILENBRDBEO0FBTzlELFdBQU8sdUdBS0QsU0FBUyxRQUFULEdBQW9CLFNBQXBCLEdBQWdDLFNBQWhDLEdBQ0osb0JBQW9CLFVBQXBCLEVBQWdDLFdBQWhDLG9DQUdGLFFBQVEsUUFBUixHQUFtQixVQUFuQixHQUFnQyxVQUFoQyxvQkFDTyx5Q0FDRix1RkFFQSxPQWJFLENBQVAsQ0FQOEQ7R0FBbEQsQ0FEWDtDQXpDTDs7a0JBbUVlO0FBQ2IsWUFBVSxRQUFWO0FBQ0EsWUFBVSxRQUFWOzs7Ozs7OztBQVFBLGtEQUFtQixLQUFLO0FBQ3RCLFdBQU8sSUFBSSxLQUFKLENBQVUscUJBQVYsRUFBaUMsQ0FBakMsQ0FBUCxDQURzQjtHQVZYOzs7Ozs7Ozs7Ozs7O0FBd0JiLDhEQUF5QixNQUFNLGFBQWEsWUFBWSxNQUFNLFNBQVM7QUFDckUsV0FBTyxJQUFJLHFCQUFKLENBQTBCO0FBQy9CLFlBQU0sSUFBTjtBQUNBLFdBQUssWUFBWSxJQUFaLEVBQWtCLFdBQWxCLEVBQStCLFVBQS9CLEVBQTJDLElBQTNDLEVBQWlELE9BQWpELENBQUw7S0FGSyxDQUFQLENBRHFFO0dBeEIxRDs7Ozs7Ozs7O0FBcUNiLG9EQUFvQixLQUFLO0FBQ3ZCLFdBQU8sSUFDSixPQURJLENBQ0ksS0FESixFQUNXLEVBRFgsRUFFSixLQUZJLENBRUUsSUFGRixFQUdKLEdBSEksQ0FHQSxnQkFBUTtBQUNYLFVBQUksQ0FBQyxnQkFBZ0IsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBRCxFQUE2QjtBQUMvQixlQUFPLElBQVAsQ0FEK0I7T0FBakM7O0FBSUEsVUFBSSxTQUFTLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBVCxDQUxPO0FBTVgsZUFBUyxPQUFPLEtBQVAsQ0FBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLE1BQW5CLEVBQTJCLE9BQU8sQ0FBUCxFQUFVLFdBQVYsOEJBQTRCLE9BQU8sS0FBUCxDQUFhLENBQWIsR0FBdkQsQ0FBVCxDQU5XOztBQVFYLFVBQUksT0FBTyxDQUFQLE1BQWMsS0FBZCxFQUFxQjtBQUN2QixlQUFPLElBQVAsQ0FEdUI7T0FBekI7O0FBSUEsYUFBTyxPQUFPLElBQVAsQ0FBWSxHQUFaLENBQVAsQ0FaVztLQUFSLENBSEEsQ0FpQkosTUFqQkksQ0FpQkc7YUFBUSxRQUFRLElBQVI7S0FBUixDQWpCSCxDQWtCSixJQWxCSSxDQWtCQyxJQWxCRCxDQUFQLENBRHVCO0dBckNaIiwiZmlsZSI6IlNEUC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwbGF0Zm9ybSBmcm9tICdwbGF0Zm9ybSc7XG5cbmNvbnN0IFNFTkRSRUNWID0gJ3NlbmRyZWN2JztcbmNvbnN0IFJFQ1ZPTkxZID0gJ3NlbmRvbmx5JztcblxuZnVuY3Rpb24gY29uY2F0U0RQKC4uLnBhcnRzKSB7XG4gIHJldHVybiBwYXJ0cy5qb2luKCdcXG4nKS50cmltKCkgKyAnXFxuJztcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtQ2FuZGlkYXRlcyhzZHAsIHBheWxvYWRUeXBlKSB7XG4gIHJldHVybiBzZHAucmVwbGFjZSgnSUNFL1NEUCcsIGBSVFAvU0FWUEYgJHtwYXlsb2FkVHlwZX1gKS50cmltKCk7XG59XG5cbmxldCBnZW5lcmF0ZVNEUDtcbmlmIChwbGF0Zm9ybS5uYW1lID09PSAnRmlyZWZveCcpIHtcbiAgY29uc3QgREVGQVVMVF9TVFJFQU0gPSBbMCwgJ2RlZmF1bHQnLCB0cnVlXTtcblxuICBnZW5lcmF0ZVNEUCA9ICh0eXBlLCBwYXlsb2FkVHlwZSwgY2FuZGlkYXRlcywgbW9kZSwgc3RyZWFtcykgPT4ge1xuICAgIGNhbmRpZGF0ZXMgPSB0cmFuc2Zvcm1DYW5kaWRhdGVzKGNhbmRpZGF0ZXMsIHBheWxvYWRUeXBlKTtcblxuICAgIHN0cmVhbXMgPSBbREVGQVVMVF9TVFJFQU0sIC4uLnN0cmVhbXNdO1xuXG4gICAgY29uc3QgYnVuZGxlcyA9IHN0cmVhbXMubWFwKChfLCBpKSA9PiBgc2RwYXJ0YV8ke2l9YCkuam9pbignICcpO1xuXG4gICAgY29uc3QgbWxpbmVzID0gc3RyZWFtcy5tYXAoKFtzc3JjLCBjbmFtZSwgYWN0aXZlXSwgaSkgPT4ge1xuICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gYCR7Y2FuZGlkYXRlc31cbmE9JHttb2RlID09PSBTRU5EUkVDViAmJiBpID09PSAwID8gJ3NlbmRyZWN2JyA6ICdzZW5kb25seSd9XG5hPWV4dG1hcDoxIHVybjppZXRmOnBhcmFtczpydHAtaGRyZXh0OnNzcmMtYXVkaW8tbGV2ZWxcbmE9bWlkOnNkcGFydGFfJHtpfVxuYT1tc2lkOiR7Y25hbWV9LSR7c3NyY30gJHtjbmFtZX0tJHtzc3JjfVxuYT1ydGNwLW11eFxuYT1ydHBtYXA6JHtwYXlsb2FkVHlwZX0gb3B1cy80ODAwMC8yXG5hPXNldHVwOmFjdHBhc3NcbmE9c3NyYzoke3NzcmN9IGNuYW1lOiR7Y25hbWV9LSR7c3NyY31gO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBgbT1hdWRpbyAwIFJUUC9TQVZQRiAke3BheWxvYWRUeXBlfVxuYz1JTiBJUDQgMC4wLjAuMFxuYT1pbmFjdGl2ZVxuYT1ydHBtYXA6JHtwYXlsb2FkVHlwZX0gTlVMTC8wYDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjb25jYXRTRFAoXG4gICAgICBgdj0wXG5vPW1vemlsbGEuLi5USElTX0lTX1NEUEFSVEEgNjA1NDA5MzM5MjUxNDg3MTQwOCAwIElOIElQNCAxMjcuMC4wLjFcbnM9LVxudD0wIDBcbmE9Z3JvdXA6QlVORExFICR7YnVuZGxlc31cbmE9bXNpZC1zZW1hbnRpYzpXTVMgKmAsXG4gICAgICAuLi5tbGluZXNcbiAgICApO1xuICB9O1xufVxuZWxzZSB7XG4gIGdlbmVyYXRlU0RQID0gKHR5cGUsIHBheWxvYWRUeXBlLCBjYW5kaWRhdGVzLCBtb2RlLCBzdHJlYW1zKSA9PiB7XG4gICAgbGV0IHNzcmNzID0gc3RyZWFtc1xuICAgICAgLmZpbHRlcigoW3NzcmMsIGNuYW1lLCBhY3RpdmVdKSA9PiBhY3RpdmUpXG4gICAgICAubWFwKChbc3NyYywgY25hbWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgYT1zc3JjOiR7c3NyY30gY25hbWU6JHtjbmFtZX1cbmE9c3NyYzoke3NzcmN9IG1zaWQ6JHtjbmFtZX0gJHtjbmFtZX1gO1xuICAgICAgfSk7XG4gICAgcmV0dXJuIGNvbmNhdFNEUChcbiAgICAgIGB2PTBcbm89LSA2MDU0MDkzMzkyNTE0ODcxNDA4IDMgSU4gSVA0IDEyNy4wLjAuMVxucz0tXG50PTAgMFxuYT1zZXR1cDoke3R5cGUgPT09ICdhbnN3ZXInID8gJ3Bhc3NpdmUnIDogJ2FjdHBhc3MnfWAsXG4gICAgICB0cmFuc2Zvcm1DYW5kaWRhdGVzKGNhbmRpZGF0ZXMsIHBheWxvYWRUeXBlKSxcbiAgICAgIGBhPXJ0Y3AtbXV4XG5hPW1pZDphdWRpb1xuYT0ke21vZGUgPT0gU0VORFJFQ1YgPyAnc2VuZHJlY3YnIDogJ3NlbmRvbmx5J31cbmE9cnRwbWFwOiR7cGF5bG9hZFR5cGV9IG9wdXMvNDgwMDAvMlxuYT1mbXRwOiR7cGF5bG9hZFR5cGV9IG1pbnB0aW1lPTEwOyB1c2VpbmJhbmRmZWM9MVxuYT1tYXhwdGltZTo2MGAsXG4gICAgICAuLi5zc3Jjc1xuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgU0VORFJFQ1Y6IFNFTkRSRUNWLFxuICBSRUNWT05MWTogUkVDVk9OTFksXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgT3B1cyBwYXlsb2FkIHR5cGUgZnJvbSBTRFAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZHBcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0T3B1c1BheWxvYWRUeXBlKHNkcCkge1xuICAgIHJldHVybiBzZHAubWF0Y2goL2E9cnRwbWFwOihcXGQrKSBvcHVzLylbMV07XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBjdXN0b20gc2Vzc2lvbiBkZXNjcmlwdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBheWxvYWRUeXBlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjYW5kaWRhdGVzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtb2RlXG4gICAqIEBwYXJhbSB7QXJyYXk8QXJyYXk+fSBzdHJlYW1zXG4gICAqIEByZXR1cm4ge1JUQ1Nlc3Npb25EZXNjcmlwdGlvbn1cbiAgICovXG4gIGNyZWF0ZVNlc3Npb25EZXNjcmlwdGlvbih0eXBlLCBwYXlsb2FkVHlwZSwgY2FuZGlkYXRlcywgbW9kZSwgc3RyZWFtcykge1xuICAgIHJldHVybiBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBzZHA6IGdlbmVyYXRlU0RQKHR5cGUsIHBheWxvYWRUeXBlLCBjYW5kaWRhdGVzLCBtb2RlLCBzdHJlYW1zKVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYWxsIFRDUCBjYW5kaWRhdGVzIGZyb20gdGhlIFNEUC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNkcFxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBmaWx0ZXJUQ1BDYW5kaWRhdGVzKHNkcCkge1xuICAgIHJldHVybiBzZHBcbiAgICAgIC5yZXBsYWNlKC9cXHIvZywgJycpXG4gICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAubWFwKGxpbmUgPT4ge1xuICAgICAgICBpZiAoIS9eYT1jYW5kaWRhdGU6Ly50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdG9rZW5zID0gbGluZS5zcGxpdCgnICcpO1xuICAgICAgICB0b2tlbnMgPSB0b2tlbnMuc2xpY2UoMCwgMikuY29uY2F0KFt0b2tlbnNbMl0udG9VcHBlckNhc2UoKSwgLi4udG9rZW5zLnNsaWNlKDMpXSk7XG5cbiAgICAgICAgaWYgKHRva2Vuc1syXSA9PT0gJ1RDUCcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b2tlbnMuam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9IG51bGwpXG4gICAgICAuam9pbignXFxuJyk7XG4gIH1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2Rpc2NvcmRfYXBwL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjL1NEUC5qc1xuICoqLyJdfQ==