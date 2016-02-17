var os = require('os');

var stubVersion = {
  supported: function() {
    return false;
  },
  setAppID: function() {
    return false;
  },
  show: function(junk) {
    console.error('unsupported');
  }
};

var correctType = (os.type() == 'Windows_NT');
var correctPlatform = (os.platform() == 'win32');

if (correctType && correctPlatform) {
  try {
    var toasterLib = require('./discord_toaster.node');
  } catch (e) {
    try {
      var toasterLib = require('./build/Release/discord_toaster');
    } catch (e) {
      toasterLib = stubVersion;
    }
  }
  module.exports = toasterLib;
}
else {
  module.exports = stubVersion;
}
