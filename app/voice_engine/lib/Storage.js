'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Determine is localStorage can be used.
 */
function localStorageTest() {
  var test = 'test';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Store everything in local storage.
 */

var LocalStorage = function () {
  function LocalStorage() {
    _classCallCheck(this, LocalStorage);
  }

  _createClass(LocalStorage, [{
    key: 'get',

    /**
     * Get an item from the store.
     *
     * @param {String} key
     * @return {Object|null}
     */
    value: function get(key) {
      var value = localStorage.getItem(key);
      try {
        value = JSON.parse(value);
      } catch (e) {}
      return value;
    }

    /**
     * Set an item in the store.
     *
     * @param {String} key
     * @param {Object} value
     */

  }, {
    key: 'set',
    value: function set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Remove an item from the store.
     *
     * @param {String} key
     */

  }, {
    key: 'remove',
    value: function remove(key) {
      localStorage.removeItem(key);
    }

    /**
     * Clear all items at the store.
     */

  }, {
    key: 'clear',
    value: function clear() {
      localStorage.clear();
    }
  }]);

  return LocalStorage;
}();

/**
 * Mock store that puts everything in an object if localStorage is disabled.
 */


var ObjectStorage = function () {
  function ObjectStorage() {
    _classCallCheck(this, ObjectStorage);

    this.storage = {};
  }

  /**
   * Get an item from the store.
   *
   * @param {String} key
   * @return {Object|null}
   */


  _createClass(ObjectStorage, [{
    key: 'get',
    value: function get(key) {
      return this.storage[key];
    }

    /**
     * Set an item in the store.
     *
     * @param {String} key
     * @param {Object} value
     */

  }, {
    key: 'set',
    value: function set(key, value) {
      this.storage[key] = value;
    }

    /**
     * Remove an item from the store.
     *
     * @param {String} key
     */

  }, {
    key: 'remove',
    value: function remove(key) {
      delete this.storage[key];
    }

    /**
     * Clear all items at the store.
     */

  }, {
    key: 'clear',
    value: function clear() {
      this.storage = {};
    }
  }]);

  return ObjectStorage;
}();

exports.default = localStorageTest() ? new LocalStorage() : new ObjectStorage();

/** WEBPACK FOOTER **
 ** ./discord_app/lib/web/Storage.js
 **/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL1N0b3JhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUdBLFNBQVMsZ0JBQVQsR0FBNEI7QUFDMUIsTUFBTSxPQUFPLE1BQVAsQ0FEb0I7QUFFMUIsTUFBSTtBQUNGLGlCQUFhLE9BQWIsQ0FBcUIsSUFBckIsRUFBMkIsSUFBM0IsRUFERTtBQUVGLGlCQUFhLFVBQWIsQ0FBd0IsSUFBeEIsRUFGRTtBQUdGLFdBQU8sSUFBUCxDQUhFO0dBQUosQ0FLQSxPQUFPLENBQVAsRUFBVTtBQUNSLFdBQU8sS0FBUCxDQURRO0dBQVY7Q0FQRjs7Ozs7O0lBZU07Ozs7Ozs7Ozs7Ozs7O3dCQU9BLEtBQUs7QUFDUCxVQUFJLFFBQVEsYUFBYSxPQUFiLENBQXFCLEdBQXJCLENBQVIsQ0FERztBQUVQLFVBQUk7QUFDRixnQkFBUSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQVIsQ0FERTtPQUFKLENBR0EsT0FBTyxDQUFQLEVBQVUsRUFBVjtBQUNBLGFBQU8sS0FBUCxDQU5POzs7Ozs7Ozs7Ozs7d0JBZUwsS0FBSyxPQUFPO0FBQ2QsbUJBQWEsT0FBYixDQUFxQixHQUFyQixFQUEwQixLQUFLLFNBQUwsQ0FBZSxLQUFmLENBQTFCLEVBRGM7Ozs7Ozs7Ozs7OzJCQVNULEtBQUs7QUFDVixtQkFBYSxVQUFiLENBQXdCLEdBQXhCLEVBRFU7Ozs7Ozs7Ozs0QkFPSjtBQUNOLG1CQUFhLEtBQWIsR0FETTs7OztTQXRDSjs7Ozs7Ozs7SUE4Q0E7QUFDSixXQURJLGFBQ0osR0FBYzswQkFEVixlQUNVOztBQUNaLFNBQUssT0FBTCxHQUFlLEVBQWYsQ0FEWTtHQUFkOzs7Ozs7Ozs7O2VBREk7O3dCQVdBLEtBQUs7QUFDUCxhQUFPLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBUCxDQURPOzs7Ozs7Ozs7Ozs7d0JBVUwsS0FBSyxPQUFPO0FBQ2QsV0FBSyxPQUFMLENBQWEsR0FBYixJQUFvQixLQUFwQixDQURjOzs7Ozs7Ozs7OzsyQkFTVCxLQUFLO0FBQ1YsYUFBTyxLQUFLLE9BQUwsQ0FBYSxHQUFiLENBQVAsQ0FEVTs7Ozs7Ozs7OzRCQU9KO0FBQ04sV0FBSyxPQUFMLEdBQWUsRUFBZixDQURNOzs7O1NBckNKOzs7a0JBMENTLHFCQUFxQixJQUFJLFlBQUosRUFBckIsR0FBd0MsSUFBSSxhQUFKLEVBQXhDIiwiZmlsZSI6IlN0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERldGVybWluZSBpcyBsb2NhbFN0b3JhZ2UgY2FuIGJlIHVzZWQuXG4gKi9cbmZ1bmN0aW9uIGxvY2FsU3RvcmFnZVRlc3QoKSB7XG4gIGNvbnN0IHRlc3QgPSAndGVzdCc7XG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGVzdCwgdGVzdCk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGVzdCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZSBldmVyeXRoaW5nIGluIGxvY2FsIHN0b3JhZ2UuXG4gKi9cbmNsYXNzIExvY2FsU3RvcmFnZSB7XG4gIC8qKlxuICAgKiBHZXQgYW4gaXRlbSBmcm9tIHRoZSBzdG9yZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICAgKiBAcmV0dXJuIHtPYmplY3R8bnVsbH1cbiAgICovXG4gIGdldChrZXkpIHtcbiAgICBsZXQgdmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IEpTT04ucGFyc2UodmFsdWUpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGFuIGl0ZW0gaW4gdGhlIHN0b3JlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVxuICAgKi9cbiAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGl0ZW0gZnJvbSB0aGUgc3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICovXG4gIHJlbW92ZShrZXkpIHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGFsbCBpdGVtcyBhdCB0aGUgc3RvcmUuXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIE1vY2sgc3RvcmUgdGhhdCBwdXRzIGV2ZXJ5dGhpbmcgaW4gYW4gb2JqZWN0IGlmIGxvY2FsU3RvcmFnZSBpcyBkaXNhYmxlZC5cbiAqL1xuY2xhc3MgT2JqZWN0U3RvcmFnZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBpdGVtIGZyb20gdGhlIHN0b3JlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gICAqIEByZXR1cm4ge09iamVjdHxudWxsfVxuICAgKi9cbiAgZ2V0KGtleSkge1xuICAgIHJldHVybiB0aGlzLnN0b3JhZ2Vba2V5XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gaXRlbSBpbiB0aGUgc3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gICAqL1xuICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMuc3RvcmFnZVtrZXldID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGl0ZW0gZnJvbSB0aGUgc3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICovXG4gIHJlbW92ZShrZXkpIHtcbiAgICBkZWxldGUgdGhpcy5zdG9yYWdlW2tleV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgYWxsIGl0ZW1zIGF0IHRoZSBzdG9yZS5cbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHt9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGxvY2FsU3RvcmFnZVRlc3QoKSA/IG5ldyBMb2NhbFN0b3JhZ2UgOiBuZXcgT2JqZWN0U3RvcmFnZTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGlzY29yZF9hcHAvbGliL3dlYi9TdG9yYWdlLmpzXG4gKiovIl19