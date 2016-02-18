'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __MOBILE__ = false;

var STYLE = '\n  font-weight: bold;\n  color: purple;\n';

var Logger = function () {
  function Logger() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'default' : arguments[0];

    _classCallCheck(this, Logger);

    this.name = name;
    this.log = this.log.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.trace = this.trace.bind(this);
  }

  _createClass(Logger, [{
    key: 'log',
    value: function log(level) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (__MOBILE__) {
        var _console;

        (_console = console)[level || 'log'].apply(_console, ['[' + this.name + ']'].concat(args));
      } else {
        var _console2;

        (_console2 = console)[level || 'log'].apply(_console2, ['%c[' + this.name + ']', STYLE].concat(args));
      }
    }
  }, {
    key: 'info',
    value: function info() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this.log.apply(this, ['info'].concat(args));
    }
  }, {
    key: 'warn',
    value: function warn() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this.log.apply(this, ['warn'].concat(args));
    }
  }, {
    key: 'error',
    value: function error() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      this.log.apply(this, ['error'].concat(args));
    }
  }, {
    key: 'trace',
    value: function trace() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      this.log.apply(this, ['trace'].concat(args));
    }
  }]);

  return Logger;
}();

var defaultLogger = new Logger();

exports.default = {
  create: function create() {
    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    return new (Function.prototype.bind.apply(Logger, [null].concat(args)))();
  },
  log: defaultLogger.log,
  info: defaultLogger.info,
  warn: defaultLogger.warn,
  error: defaultLogger.error,
  trace: defaultLogger.trace
};

/** WEBPACK FOOTER **
 ** ./discord_app/lib/Logger.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL0xvZ2dlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBTSxhQUFhLEtBQWI7O0FBRU4sSUFBTSxvREFBTjs7SUFLTTtBQUNKLFdBREksTUFDSixHQUE0QjtRQUFoQiw2REFBSyx5QkFBVzs7MEJBRHhCLFFBQ3dCOztBQUMxQixTQUFLLElBQUwsR0FBWSxJQUFaLENBRDBCO0FBRTFCLFNBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBYyxJQUFkLENBQVgsQ0FGMEI7QUFHMUIsU0FBSyxJQUFMLEdBQVksS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBWixDQUgwQjtBQUkxQixTQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFaLENBSjBCO0FBSzFCLFNBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBYixDQUwwQjtBQU0xQixTQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCLENBQWIsQ0FOMEI7R0FBNUI7O2VBREk7O3dCQVVBLE9BQWdCO3dDQUFOOztPQUFNOztBQUNsQixVQUFJLFVBQUosRUFBZ0I7OztBQUNkLDZCQUFRLFNBQVMsS0FBVCxDQUFSLHdCQUE0QixLQUFLLElBQUwsZUFBaUIsS0FBN0MsRUFEYztPQUFoQixNQUdLOzs7QUFDSCw4QkFBUSxTQUFTLEtBQVQsQ0FBUiwyQkFBOEIsS0FBSyxJQUFMLFFBQWMsY0FBVSxLQUF0RCxFQURHO09BSEw7Ozs7MkJBUVk7eUNBQU47O09BQU07O0FBQ1osV0FBSyxHQUFMLGNBQVMsZUFBVyxLQUFwQixFQURZOzs7OzJCQUlBO3lDQUFOOztPQUFNOztBQUNaLFdBQUssR0FBTCxjQUFTLGVBQVcsS0FBcEIsRUFEWTs7Ozs0QkFJQzt5Q0FBTjs7T0FBTTs7QUFDYixXQUFLLEdBQUwsY0FBUyxnQkFBWSxLQUFyQixFQURhOzs7OzRCQUlBO3lDQUFOOztPQUFNOztBQUNiLFdBQUssR0FBTCxjQUFTLGdCQUFZLEtBQXJCLEVBRGE7Ozs7U0EvQlg7OztBQW9DTixJQUFNLGdCQUFnQixJQUFJLE1BQUosRUFBaEI7O2tCQUVTO0FBQ2IsVUFBUTt1Q0FBSTs7Ozs4Q0FBYSxzQkFBVTtHQUEzQjtBQUNSLE9BQUssY0FBYyxHQUFkO0FBQ0wsUUFBTSxjQUFjLElBQWQ7QUFDTixRQUFNLGNBQWMsSUFBZDtBQUNOLFNBQU8sY0FBYyxLQUFkO0FBQ1AsU0FBTyxjQUFjLEtBQWQiLCJmaWxlIjoiTG9nZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgX19NT0JJTEVfXyA9IGZhbHNlO1xuXG5jb25zdCBTVFlMRSA9IGBcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGNvbG9yOiBwdXJwbGU7XG5gO1xuXG5jbGFzcyBMb2dnZXIge1xuICBjb25zdHJ1Y3RvcihuYW1lPSdkZWZhdWx0Jykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5sb2cgPSB0aGlzLmxvZy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaW5mbyA9IHRoaXMuaW5mby5iaW5kKHRoaXMpO1xuICAgIHRoaXMud2FybiA9IHRoaXMud2Fybi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZXJyb3IgPSB0aGlzLmVycm9yLmJpbmQodGhpcyk7XG4gICAgdGhpcy50cmFjZSA9IHRoaXMudHJhY2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIGxvZyhsZXZlbCwgLi4uYXJncykge1xuICAgIGlmIChfX01PQklMRV9fKSB7XG4gICAgICBjb25zb2xlW2xldmVsIHx8ICdsb2cnXShgWyR7dGhpcy5uYW1lfV1gLCAuLi5hcmdzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlW2xldmVsIHx8ICdsb2cnXShgJWNbJHt0aGlzLm5hbWV9XWAsIFNUWUxFLCAuLi5hcmdzKTtcbiAgICB9XG4gIH1cblxuICBpbmZvKC4uLmFyZ3MpIHtcbiAgICB0aGlzLmxvZygnaW5mbycsIC4uLmFyZ3MpO1xuICB9XG5cbiAgd2FybiguLi5hcmdzKSB7XG4gICAgdGhpcy5sb2coJ3dhcm4nLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGVycm9yKC4uLmFyZ3MpIHtcbiAgICB0aGlzLmxvZygnZXJyb3InLCAuLi5hcmdzKTtcbiAgfVxuXG4gIHRyYWNlKC4uLmFyZ3MpIHtcbiAgICB0aGlzLmxvZygndHJhY2UnLCAuLi5hcmdzKTtcbiAgfVxufVxuXG5jb25zdCBkZWZhdWx0TG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNyZWF0ZTogKC4uLmFyZ3MpID0+IG5ldyBMb2dnZXIoLi4uYXJncyksXG4gIGxvZzogZGVmYXVsdExvZ2dlci5sb2csXG4gIGluZm86IGRlZmF1bHRMb2dnZXIuaW5mbyxcbiAgd2FybjogZGVmYXVsdExvZ2dlci53YXJuLFxuICBlcnJvcjogZGVmYXVsdExvZ2dlci5lcnJvcixcbiAgdHJhY2U6IGRlZmF1bHRMb2dnZXIudHJhY2Vcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2Rpc2NvcmRfYXBwL2xpYi9Mb2dnZXIuanNcbiAqKi9cbiJdfQ==