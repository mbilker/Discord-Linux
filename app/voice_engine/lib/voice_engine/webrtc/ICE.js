'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Constants = require('../../../Constants');

var _Storage = require('../../Storage');

var _Storage2 = _interopRequireDefault(_Storage);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

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
      _superagent2.default.get(_Constants.Endpoints.ICE).end(function (res) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvSUNFLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sVUFBVSxLQUFWO0FBQ04sSUFBTSxlQUFlLElBQWY7O0FBRU4sSUFBSSxVQUFVLENBQVY7QUFDSixJQUFJLFVBQVUsSUFBVjs7QUFFSixTQUFTLFdBQVQsR0FBdUI7QUFDckIsTUFBTSxNQUFNLGtCQUFRLEdBQVIsQ0FBWSxPQUFaLENBQU4sQ0FEZTtBQUVyQixTQUFPLE9BQU8sSUFBSSxPQUFKLEdBQWMsS0FBSyxHQUFMLEVBQWQsR0FBMkIsSUFBSSxPQUFKLEdBQWMsSUFBaEQsQ0FGYztDQUF2Qjs7QUFLQSxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsRUFBbUQ7TUFBbEIsNERBQUksS0FBSyxFQUFMLEdBQVUsRUFBVixnQkFBYzs7QUFDakQsb0JBQVEsR0FBUixDQUFZLE9BQVosRUFBcUI7QUFDbkIsb0JBRG1CO0FBRW5CLGFBQVMsS0FBSyxHQUFMLEtBQWMsTUFBTSxJQUFOLEdBQWMsWUFBNUI7R0FGWCxFQURpRDtDQUFuRDs7a0JBT2U7Ozs7Ozs7QUFNYixrQ0FBVyxVQUFVOzs7QUFDbkIsaUJBQWEsT0FBYixFQURtQjs7QUFHbkIsUUFBSSxVQUFVLGFBQVYsQ0FIZTtBQUluQixRQUFJLFdBQVcsSUFBWCxFQUFpQjs7QUFFbkIsZ0JBQVUsV0FBVztlQUFNLFNBQVMsT0FBVDtPQUFOLEVBQXlCLENBQXBDLENBQVYsQ0FGbUI7S0FBckIsTUFJSztBQUNILDJCQUNHLEdBREgsQ0FDTyxxQkFBVSxHQUFWLENBRFAsQ0FFRyxHQUZILENBRU8sZUFBTztBQUNWLFlBQUksSUFBSSxFQUFKLEVBQVE7QUFDVixvQkFBVSxJQUFJLElBQUosQ0FBUyxPQUFULENBREE7QUFFVix5QkFBZSxPQUFmLEVBQXdCLElBQUksSUFBSixDQUFTLEtBQVQsQ0FBeEIsRUFGVTtBQUdWLG1CQUFTLE9BQVQsRUFIVTtTQUFaLE1BS0s7QUFDSCxvQkFBVSxXQUFXO21CQUFNLE1BQUssVUFBTCxDQUFnQixRQUFoQjtXQUFOLEVBQWlDLE9BQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxPQUFGLEVBQVcsRUFBcEIsQ0FBUCxDQUF0RCxDQURHO1NBTEw7T0FERyxDQUZQLENBREc7S0FKTDtHQVZXOzs7Ozs7QUFpQ2Isd0JBQU87QUFDTCxpQkFBYSxPQUFiLEVBREs7R0FqQ00iLCJmaWxlIjoiSUNFLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbmRwb2ludHN9IGZyb20gJy4uLy4uLy4uL0NvbnN0YW50cyc7XG5pbXBvcnQgU3RvcmFnZSBmcm9tICcuLi8uLi9TdG9yYWdlJztcbmltcG9ydCByZXF1ZXN0IGZyb20gJ3N1cGVyYWdlbnQnO1xuXG5jb25zdCBJQ0VfS0VZID0gJ2ljZSc7XG5jb25zdCBTRVJWRVJfREVMQVkgPSA1MDAwO1xuXG5sZXQgcmV0cmllcyA9IDA7XG5sZXQgdGltZW91dCA9IG51bGw7XG5cbmZ1bmN0aW9uIGxvYWRTZXJ2ZXJzKCkge1xuICBjb25zdCBpY2UgPSBTdG9yYWdlLmdldChJQ0VfS0VZKTtcbiAgcmV0dXJuIGljZSAmJiBpY2UuZXhwaXJlcyA+IERhdGUubm93KCkgPyBpY2Uuc2VydmVycyA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHBlcnNpc3RTZXJ2ZXJzKHNlcnZlcnMsIHR0bD02MCAqIDYwICogMjQpIHtcbiAgU3RvcmFnZS5zZXQoSUNFX0tFWSwge1xuICAgIHNlcnZlcnMsXG4gICAgZXhwaXJlczogRGF0ZS5ub3coKSArICh0dGwgKiAxMDAwKSAtIFNFUlZFUl9ERUxBWVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBTVFVOIGFuZCBUVVJOIHNlcnZlcnMgdG8gdXNlIGZvciBhIFBlZXJDb25uZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgZ2V0U2VydmVycyhjYWxsYmFjaykge1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgIGxldCBzZXJ2ZXJzID0gbG9hZFNlcnZlcnMoKTtcbiAgICBpZiAoc2VydmVycyAhPSBudWxsKSB7XG4gICAgICAvLyBGb3JjZSB0aGlzIGFjdGlvbiB0byBhbHdheXMgYmUgYXN5bmMuXG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBjYWxsYmFjayhzZXJ2ZXJzKSwgMCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVxdWVzdFxuICAgICAgICAuZ2V0KEVuZHBvaW50cy5JQ0UpXG4gICAgICAgIC5lbmQocmVzID0+IHtcbiAgICAgICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgICAgICBzZXJ2ZXJzID0gcmVzLmJvZHkuc2VydmVycztcbiAgICAgICAgICAgIHBlcnNpc3RTZXJ2ZXJzKHNlcnZlcnMsIHJlcy5ib2R5Wyd0dGwnXSk7XG4gICAgICAgICAgICBjYWxsYmFjayhzZXJ2ZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmdldFNlcnZlcnMoY2FsbGJhY2spLCAxMDAwICogTWF0aC5taW4oKytyZXRyaWVzLCAzMCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0cy5cbiAgICovXG4gIHN0b3AoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICB9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9kaXNjb3JkX2FwcC9saWIvdm9pY2VfZW5naW5lL3dlYnJ0Yy9JQ0UuanNcbiAqKi8iXX0=