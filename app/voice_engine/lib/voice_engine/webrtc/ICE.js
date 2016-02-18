'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Constants = require('../../../Constants');

var _Storage = require('../../Storage');

var _Storage2 = _interopRequireDefault(_Storage);

var _client = require('superagent/lib/client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ICE_KEY = 'ice';
var SERVER_DELAY = 5000;

var retries = 0;
var timeout = null;

function loadServers() {
  var ice = _Storage2.default.get(ICE_KEY);
  return ice && ice.expires > Date.now() ? ice.servers : null;
}

function persistServers(servers) {
  var ttl = arguments.length <= 1 || arguments[1] === undefined ? 60 * 60 * 24 : arguments[1];

  _Storage2.default.set(ICE_KEY, {
    servers: servers,
    expires: Date.now() + ttl * 1000 - SERVER_DELAY
  });
}

exports.default = {
  /**
   * Get a list of STUN and TURN servers to use for a PeerConnection.
   *
   * @param {Function} callback
   */

  getServers: function getServers(callback) {
    var _this = this;

    clearTimeout(timeout);

    var servers = loadServers();
    if (servers != null) {
      // Force this action to always be async.
      timeout = setTimeout(function () {
        return callback(servers);
      }, 0);
    } else {
      _client2.default.get(_Constants.Endpoints.ICE).end(function (err, res) {
        if (res.ok) {
          servers = res.body.servers;
          persistServers(servers, res.body['ttl']);
          callback(servers);
        } else {
          timeout = setTimeout(function () {
            return _this.getServers(callback);
          }, 1000 * Math.min(++retries, 30));
        }
      });
    }
  },


  /**
   * Clear any pending timeouts.
   */
  stop: function stop() {
    clearTimeout(timeout);
  }
};

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/ICE.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvSUNFLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sVUFBVSxLQUFWO0FBQ04sSUFBTSxlQUFlLElBQWY7O0FBRU4sSUFBSSxVQUFVLENBQVY7QUFDSixJQUFJLFVBQVUsSUFBVjs7QUFFSixTQUFTLFdBQVQsR0FBdUI7QUFDckIsTUFBTSxNQUFNLGtCQUFRLEdBQVIsQ0FBWSxPQUFaLENBQU4sQ0FEZTtBQUVyQixTQUFPLE9BQU8sSUFBSSxPQUFKLEdBQWMsS0FBSyxHQUFMLEVBQWQsR0FBMkIsSUFBSSxPQUFKLEdBQWMsSUFBaEQsQ0FGYztDQUF2Qjs7QUFLQSxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsRUFBbUQ7TUFBbEIsNERBQUksS0FBSyxFQUFMLEdBQVUsRUFBVixnQkFBYzs7QUFDakQsb0JBQVEsR0FBUixDQUFZLE9BQVosRUFBcUI7QUFDbkIsb0JBRG1CO0FBRW5CLGFBQVMsS0FBSyxHQUFMLEtBQWMsTUFBTSxJQUFOLEdBQWMsWUFBNUI7R0FGWCxFQURpRDtDQUFuRDs7a0JBT2U7Ozs7Ozs7QUFNYixrQ0FBVyxVQUFVOzs7QUFDbkIsaUJBQWEsT0FBYixFQURtQjs7QUFHbkIsUUFBSSxVQUFVLGFBQVYsQ0FIZTtBQUluQixRQUFJLFdBQVcsSUFBWCxFQUFpQjs7QUFFbkIsZ0JBQVUsV0FBVztlQUFNLFNBQVMsT0FBVDtPQUFOLEVBQXlCLENBQXBDLENBQVYsQ0FGbUI7S0FBckIsTUFJSztBQUNILHVCQUNHLEdBREgsQ0FDTyxxQkFBVSxHQUFWLENBRFAsQ0FFRyxHQUZILENBRU8sVUFBQyxHQUFELEVBQU0sR0FBTixFQUFjO0FBQ2pCLFlBQUksSUFBSSxFQUFKLEVBQVE7QUFDVixvQkFBVSxJQUFJLElBQUosQ0FBUyxPQUFULENBREE7QUFFVix5QkFBZSxPQUFmLEVBQXdCLElBQUksSUFBSixDQUFTLEtBQVQsQ0FBeEIsRUFGVTtBQUdWLG1CQUFTLE9BQVQsRUFIVTtTQUFaLE1BS0s7QUFDSCxvQkFBVSxXQUFXO21CQUFNLE1BQUssVUFBTCxDQUFnQixRQUFoQjtXQUFOLEVBQWlDLE9BQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxPQUFGLEVBQVcsRUFBcEIsQ0FBUCxDQUF0RCxDQURHO1NBTEw7T0FERyxDQUZQLENBREc7S0FKTDtHQVZXOzs7Ozs7QUFpQ2Isd0JBQU87QUFDTCxpQkFBYSxPQUFiLEVBREs7R0FqQ00iLCJmaWxlIjoiSUNFLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbmRwb2ludHN9IGZyb20gJy4uLy4uLy4uL0NvbnN0YW50cyc7XG5pbXBvcnQgU3RvcmFnZSBmcm9tICcuLi8uLi9TdG9yYWdlJztcbmltcG9ydCByZXF1ZXN0IGZyb20gJ3N1cGVyYWdlbnQvbGliL2NsaWVudCc7XG5cbmNvbnN0IElDRV9LRVkgPSAnaWNlJztcbmNvbnN0IFNFUlZFUl9ERUxBWSA9IDUwMDA7XG5cbmxldCByZXRyaWVzID0gMDtcbmxldCB0aW1lb3V0ID0gbnVsbDtcblxuZnVuY3Rpb24gbG9hZFNlcnZlcnMoKSB7XG4gIGNvbnN0IGljZSA9IFN0b3JhZ2UuZ2V0KElDRV9LRVkpO1xuICByZXR1cm4gaWNlICYmIGljZS5leHBpcmVzID4gRGF0ZS5ub3coKSA/IGljZS5zZXJ2ZXJzIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gcGVyc2lzdFNlcnZlcnMoc2VydmVycywgdHRsPTYwICogNjAgKiAyNCkge1xuICBTdG9yYWdlLnNldChJQ0VfS0VZLCB7XG4gICAgc2VydmVycyxcbiAgICBleHBpcmVzOiBEYXRlLm5vdygpICsgKHR0bCAqIDEwMDApIC0gU0VSVkVSX0RFTEFZXG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIFNUVU4gYW5kIFRVUk4gc2VydmVycyB0byB1c2UgZm9yIGEgUGVlckNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBnZXRTZXJ2ZXJzKGNhbGxiYWNrKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgbGV0IHNlcnZlcnMgPSBsb2FkU2VydmVycygpO1xuICAgIGlmIChzZXJ2ZXJzICE9IG51bGwpIHtcbiAgICAgIC8vIEZvcmNlIHRoaXMgYWN0aW9uIHRvIGFsd2F5cyBiZSBhc3luYy5cbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IGNhbGxiYWNrKHNlcnZlcnMpLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXF1ZXN0XG4gICAgICAgIC5nZXQoRW5kcG9pbnRzLklDRSlcbiAgICAgICAgLmVuZCgoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgICAgICBzZXJ2ZXJzID0gcmVzLmJvZHkuc2VydmVycztcbiAgICAgICAgICAgIHBlcnNpc3RTZXJ2ZXJzKHNlcnZlcnMsIHJlcy5ib2R5Wyd0dGwnXSk7XG4gICAgICAgICAgICBjYWxsYmFjayhzZXJ2ZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmdldFNlcnZlcnMoY2FsbGJhY2spLCAxMDAwICogTWF0aC5taW4oKytyZXRyaWVzLCAzMCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0cy5cbiAgICovXG4gIHN0b3AoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICB9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL3dlYnJ0Yy9JQ0UuanNcbiAqKi9cbiJdfQ==