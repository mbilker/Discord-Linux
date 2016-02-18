"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//noinspection JSValidateJSDoc
/**
 * Determine max volume in the history.
 *
 * @param {AnalyserNode} analyser
 * @param {Float32Array} fftBins
 * @return {Number}
 */
function getMaxVolume(analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);
  for (var i = 4; i < fftBins.length; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  }
  return maxVolume;
}

var VAD = function () {
  function VAD(context, stream) {
    var threshold = arguments.length <= 2 || arguments[2] === undefined ? -40 : arguments[2];

    var _this = this;

    var smoothing = arguments.length <= 3 || arguments[3] === undefined ? 0.1 : arguments[3];
    var history = arguments.length <= 4 || arguments[4] === undefined ? 10 : arguments[4];

    _classCallCheck(this, VAD);

    var analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothing;

    var source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    var speakingHistory = [];
    for (var i = 0; i < history; i++) {
      speakingHistory.push(false);
    }

    var processor = context.createScriptProcessor(1024, 0, 1);
    processor.onaudioprocess = function () {
      _this.update();
      if (_this.onProcess) {
        _this.onProcess(_this.speaking, _this.currentVolume);
      }
    };
    processor.connect(context.destination);

    this.threshold = threshold;
    this.analyser = analyser;
    this.processor = processor;
    this.fftBins = new Float32Array(analyser.fftSize);
    this.source = source;
    this.currentVolume = 0;
    this.speakingHistory = speakingHistory;
    this.speakingHistoryIndex = 0;
    this.speakingCounter = 0;

    this.silenceThreshold = this.speakingHistory.length * 4;
    this.silentFrames = this.silenceThreshold;

    this.onProcess = null;
  }

  /**
   * Whether or not the stream currently has speech.
   *
   * @return {Boolean}
   */


  _createClass(VAD, [{
    key: "update",


    /**
     * Updates the speaking history.
     */
    value: function update() {
      this.currentVolume = getMaxVolume(this.analyser, this.fftBins);

      // Reduce speaking counter.
      if (this.speakingHistory[this.speakingHistoryIndex]) {
        this.speakingCounter--;
      }

      // Increase speaking counter if frame has speech.
      var hasSpeech = this.currentVolume > this.threshold;
      this.speakingHistory[this.speakingHistoryIndex] = hasSpeech;
      if (hasSpeech) {
        this.speakingCounter++;
      }

      // Loop around...
      if (++this.speakingHistoryIndex === this.speakingHistory.length) {
        this.speakingHistoryIndex = 0;
      }

      if (this.speakingCounter > 0) {
        this.silentFrames = 0;
      } else {
        this.silentFrames++;
      }
    }

    /**
     * Disconnect nodes and perform cleanup.
     */

  }, {
    key: "stop",
    value: function stop() {
      this.source.disconnect();
      this.processor.disconnect();
      this.speakingCounter = 0;
    }
  }, {
    key: "speaking",
    get: function get() {
      return this.speakingCounter > 0 ? true : this.silentFrames < this.silenceThreshold;
    }
  }]);

  return VAD;
}();

/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/VAD.js
 **/


exports.default = VAD;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3ZvaWNlX2VuZ2luZS1zcmMvbGliL3ZvaWNlX2VuZ2luZS93ZWJydGMvVkFELmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVFBLFNBQVMsWUFBVCxDQUFzQixRQUF0QixFQUFnQyxPQUFoQyxFQUF5QztBQUN2QyxNQUFJLFlBQVksQ0FBQyxRQUFELENBRHVCO0FBRXZDLFdBQVMscUJBQVQsQ0FBK0IsT0FBL0IsRUFGdUM7QUFHdkMsT0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksUUFBUSxNQUFSLEVBQWdCLEdBQXBDLEVBQXlDO0FBQ3ZDLFFBQUksUUFBUSxDQUFSLElBQWEsU0FBYixJQUEwQixRQUFRLENBQVIsSUFBYSxDQUFiLEVBQWdCO0FBQzVDLGtCQUFZLFFBQVEsQ0FBUixDQUFaLENBRDRDO0tBQTlDO0dBREY7QUFLQSxTQUFPLFNBQVAsQ0FSdUM7Q0FBekM7O0lBV3FCO0FBQ25CLFdBRG1CLEdBQ25CLENBQVksT0FBWixFQUFxQixNQUFyQixFQUF1RTtRQUExQyxrRUFBVSxDQUFDLEVBQUQsZ0JBQWdDOzs7O1FBQTNCLGtFQUFVLG1CQUFpQjtRQUFaLGdFQUFRLGtCQUFJOzswQkFEcEQsS0FDb0Q7O0FBQ3JFLFFBQUksV0FBVyxRQUFRLGNBQVIsRUFBWCxDQURpRTtBQUVyRSxhQUFTLE9BQVQsR0FBbUIsR0FBbkIsQ0FGcUU7QUFHckUsYUFBUyxxQkFBVCxHQUFpQyxTQUFqQyxDQUhxRTs7QUFLckUsUUFBSSxTQUFTLFFBQVEsdUJBQVIsQ0FBZ0MsTUFBaEMsQ0FBVCxDQUxpRTtBQU1yRSxXQUFPLE9BQVAsQ0FBZSxRQUFmLEVBTnFFOztBQVFyRSxRQUFJLGtCQUFrQixFQUFsQixDQVJpRTtBQVNyRSxTQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxPQUFKLEVBQWEsR0FBN0IsRUFBa0M7QUFDaEMsc0JBQWdCLElBQWhCLENBQXFCLEtBQXJCLEVBRGdDO0tBQWxDOztBQUlBLFFBQUksWUFBWSxRQUFRLHFCQUFSLENBQThCLElBQTlCLEVBQW9DLENBQXBDLEVBQXVDLENBQXZDLENBQVosQ0FiaUU7QUFjckUsY0FBVSxjQUFWLEdBQTJCLFlBQU07QUFDL0IsWUFBSyxNQUFMLEdBRCtCO0FBRS9CLFVBQUksTUFBSyxTQUFMLEVBQWdCO0FBQ2xCLGNBQUssU0FBTCxDQUFlLE1BQUssUUFBTCxFQUFlLE1BQUssYUFBTCxDQUE5QixDQURrQjtPQUFwQjtLQUZ5QixDQWQwQztBQW9CckUsY0FBVSxPQUFWLENBQWtCLFFBQVEsV0FBUixDQUFsQixDQXBCcUU7O0FBc0JyRSxTQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0F0QnFFO0FBdUJyRSxTQUFLLFFBQUwsR0FBZ0IsUUFBaEIsQ0F2QnFFO0FBd0JyRSxTQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0F4QnFFO0FBeUJyRSxTQUFLLE9BQUwsR0FBZSxJQUFJLFlBQUosQ0FBaUIsU0FBUyxPQUFULENBQWhDLENBekJxRTtBQTBCckUsU0FBSyxNQUFMLEdBQWMsTUFBZCxDQTFCcUU7QUEyQnJFLFNBQUssYUFBTCxHQUFxQixDQUFyQixDQTNCcUU7QUE0QnJFLFNBQUssZUFBTCxHQUF1QixlQUF2QixDQTVCcUU7QUE2QnJFLFNBQUssb0JBQUwsR0FBNEIsQ0FBNUIsQ0E3QnFFO0FBOEJyRSxTQUFLLGVBQUwsR0FBdUIsQ0FBdkIsQ0E5QnFFOztBQWdDckUsU0FBSyxnQkFBTCxHQUF3QixLQUFLLGVBQUwsQ0FBcUIsTUFBckIsR0FBOEIsQ0FBOUIsQ0FoQzZDO0FBaUNyRSxTQUFLLFlBQUwsR0FBb0IsS0FBSyxnQkFBTCxDQWpDaUQ7O0FBbUNyRSxTQUFLLFNBQUwsR0FBaUIsSUFBakIsQ0FuQ3FFO0dBQXZFOzs7Ozs7Ozs7ZUFEbUI7Ozs7Ozs7NkJBbURWO0FBQ1AsV0FBSyxhQUFMLEdBQXFCLGFBQWEsS0FBSyxRQUFMLEVBQWUsS0FBSyxPQUFMLENBQWpEOzs7QUFETyxVQUlILEtBQUssZUFBTCxDQUFxQixLQUFLLG9CQUFMLENBQXpCLEVBQXFEO0FBQ25ELGFBQUssZUFBTCxHQURtRDtPQUFyRDs7O0FBSk8sVUFTRCxZQUFZLEtBQUssYUFBTCxHQUFxQixLQUFLLFNBQUwsQ0FUaEM7QUFVUCxXQUFLLGVBQUwsQ0FBcUIsS0FBSyxvQkFBTCxDQUFyQixHQUFrRCxTQUFsRCxDQVZPO0FBV1AsVUFBSSxTQUFKLEVBQWU7QUFDYixhQUFLLGVBQUwsR0FEYTtPQUFmOzs7QUFYTyxVQWdCSCxFQUFFLEtBQUssb0JBQUwsS0FBOEIsS0FBSyxlQUFMLENBQXFCLE1BQXJCLEVBQTZCO0FBQy9ELGFBQUssb0JBQUwsR0FBNEIsQ0FBNUIsQ0FEK0Q7T0FBakU7O0FBSUEsVUFBSSxLQUFLLGVBQUwsR0FBdUIsQ0FBdkIsRUFBMEI7QUFDNUIsYUFBSyxZQUFMLEdBQW9CLENBQXBCLENBRDRCO09BQTlCLE1BR0s7QUFDSCxhQUFLLFlBQUwsR0FERztPQUhMOzs7Ozs7Ozs7MkJBV0s7QUFDTCxXQUFLLE1BQUwsQ0FBWSxVQUFaLEdBREs7QUFFTCxXQUFLLFNBQUwsQ0FBZSxVQUFmLEdBRks7QUFHTCxXQUFLLGVBQUwsR0FBdUIsQ0FBdkIsQ0FISzs7Ozt3QkF0Q1E7QUFDYixhQUFPLEtBQUssZUFBTCxHQUF1QixDQUF2QixHQUEyQixJQUEzQixHQUFrQyxLQUFLLFlBQUwsR0FBb0IsS0FBSyxnQkFBTCxDQURoRDs7OztTQTVDSSIsImZpbGUiOiJWQUQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvL25vaW5zcGVjdGlvbiBKU1ZhbGlkYXRlSlNEb2Ncbi8qKlxuICogRGV0ZXJtaW5lIG1heCB2b2x1bWUgaW4gdGhlIGhpc3RvcnkuXG4gKlxuICogQHBhcmFtIHtBbmFseXNlck5vZGV9IGFuYWx5c2VyXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gZmZ0Qmluc1xuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5mdW5jdGlvbiBnZXRNYXhWb2x1bWUoYW5hbHlzZXIsIGZmdEJpbnMpIHtcbiAgbGV0IG1heFZvbHVtZSA9IC1JbmZpbml0eTtcbiAgYW5hbHlzZXIuZ2V0RmxvYXRGcmVxdWVuY3lEYXRhKGZmdEJpbnMpO1xuICBmb3IgKGxldCBpID0gNDsgaSA8IGZmdEJpbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZmZ0Qmluc1tpXSA+IG1heFZvbHVtZSAmJiBmZnRCaW5zW2ldIDwgMCkge1xuICAgICAgbWF4Vm9sdW1lID0gZmZ0Qmluc1tpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1heFZvbHVtZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVkFEIHtcbiAgY29uc3RydWN0b3IoY29udGV4dCwgc3RyZWFtLCB0aHJlc2hvbGQ9LTQwLCBzbW9vdGhpbmc9MC4xLCBoaXN0b3J5PTEwKSB7XG4gICAgbGV0IGFuYWx5c2VyID0gY29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgIGFuYWx5c2VyLmZmdFNpemUgPSA1MTI7XG4gICAgYW5hbHlzZXIuc21vb3RoaW5nVGltZUNvbnN0YW50ID0gc21vb3RoaW5nO1xuXG4gICAgbGV0IHNvdXJjZSA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICBzb3VyY2UuY29ubmVjdChhbmFseXNlcik7XG5cbiAgICBsZXQgc3BlYWtpbmdIaXN0b3J5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoaXN0b3J5OyBpKyspIHtcbiAgICAgIHNwZWFraW5nSGlzdG9yeS5wdXNoKGZhbHNlKTtcbiAgICB9XG5cbiAgICBsZXQgcHJvY2Vzc29yID0gY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoMTAyNCwgMCwgMSk7XG4gICAgcHJvY2Vzc29yLm9uYXVkaW9wcm9jZXNzID0gKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgIGlmICh0aGlzLm9uUHJvY2Vzcykge1xuICAgICAgICB0aGlzLm9uUHJvY2Vzcyh0aGlzLnNwZWFraW5nLCB0aGlzLmN1cnJlbnRWb2x1bWUpO1xuICAgICAgfVxuICAgIH07XG4gICAgcHJvY2Vzc29yLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICB0aGlzLnRocmVzaG9sZCA9IHRocmVzaG9sZDtcbiAgICB0aGlzLmFuYWx5c2VyID0gYW5hbHlzZXI7XG4gICAgdGhpcy5wcm9jZXNzb3IgPSBwcm9jZXNzb3I7XG4gICAgdGhpcy5mZnRCaW5zID0gbmV3IEZsb2F0MzJBcnJheShhbmFseXNlci5mZnRTaXplKTtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLmN1cnJlbnRWb2x1bWUgPSAwO1xuICAgIHRoaXMuc3BlYWtpbmdIaXN0b3J5ID0gc3BlYWtpbmdIaXN0b3J5O1xuICAgIHRoaXMuc3BlYWtpbmdIaXN0b3J5SW5kZXggPSAwO1xuICAgIHRoaXMuc3BlYWtpbmdDb3VudGVyID0gMDtcblxuICAgIHRoaXMuc2lsZW5jZVRocmVzaG9sZCA9IHRoaXMuc3BlYWtpbmdIaXN0b3J5Lmxlbmd0aCAqIDQ7XG4gICAgdGhpcy5zaWxlbnRGcmFtZXMgPSB0aGlzLnNpbGVuY2VUaHJlc2hvbGQ7XG5cbiAgICB0aGlzLm9uUHJvY2VzcyA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHN0cmVhbSBjdXJyZW50bHkgaGFzIHNwZWVjaC5cbiAgICpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBzcGVha2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVha2luZ0NvdW50ZXIgPiAwID8gdHJ1ZSA6IHRoaXMuc2lsZW50RnJhbWVzIDwgdGhpcy5zaWxlbmNlVGhyZXNob2xkO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHNwZWFraW5nIGhpc3RvcnkuXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5jdXJyZW50Vm9sdW1lID0gZ2V0TWF4Vm9sdW1lKHRoaXMuYW5hbHlzZXIsIHRoaXMuZmZ0Qmlucyk7XG5cbiAgICAvLyBSZWR1Y2Ugc3BlYWtpbmcgY291bnRlci5cbiAgICBpZiAodGhpcy5zcGVha2luZ0hpc3RvcnlbdGhpcy5zcGVha2luZ0hpc3RvcnlJbmRleF0pIHtcbiAgICAgIHRoaXMuc3BlYWtpbmdDb3VudGVyLS07XG4gICAgfVxuXG4gICAgLy8gSW5jcmVhc2Ugc3BlYWtpbmcgY291bnRlciBpZiBmcmFtZSBoYXMgc3BlZWNoLlxuICAgIGNvbnN0IGhhc1NwZWVjaCA9IHRoaXMuY3VycmVudFZvbHVtZSA+IHRoaXMudGhyZXNob2xkO1xuICAgIHRoaXMuc3BlYWtpbmdIaXN0b3J5W3RoaXMuc3BlYWtpbmdIaXN0b3J5SW5kZXhdID0gaGFzU3BlZWNoO1xuICAgIGlmIChoYXNTcGVlY2gpIHtcbiAgICAgIHRoaXMuc3BlYWtpbmdDb3VudGVyKys7XG4gICAgfVxuXG4gICAgLy8gTG9vcCBhcm91bmQuLi5cbiAgICBpZiAoKyt0aGlzLnNwZWFraW5nSGlzdG9yeUluZGV4ID09PSB0aGlzLnNwZWFraW5nSGlzdG9yeS5sZW5ndGgpIHtcbiAgICAgIHRoaXMuc3BlYWtpbmdIaXN0b3J5SW5kZXggPSAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNwZWFraW5nQ291bnRlciA+IDApIHtcbiAgICAgIHRoaXMuc2lsZW50RnJhbWVzID0gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNpbGVudEZyYW1lcysrO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNjb25uZWN0IG5vZGVzIGFuZCBwZXJmb3JtIGNsZWFudXAuXG4gICAqL1xuICBzdG9wKCkge1xuICAgIHRoaXMuc291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLnByb2Nlc3Nvci5kaXNjb25uZWN0KCk7XG4gICAgdGhpcy5zcGVha2luZ0NvdW50ZXIgPSAwO1xuICB9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2Rpc2NvcmRfYXBwL2xpYi92b2ljZV9lbmdpbmUvd2VicnRjL1ZBRC5qc1xuICoqLyJdfQ==