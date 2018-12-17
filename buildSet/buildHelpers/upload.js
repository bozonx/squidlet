const esp = require("espruino");

/**
 * like ./node_modules/.bin/espruino --board ESP32 --port /dev/ttyUSB0 -b 115200 --no-ble -m -t ./build/starter/bundle.js
 */
module.exports = function () {
  return new Promise((resolve, reject) => {
    esp.init(() => {
      Espruino.Config.BAUD_RATE = String(envConfig.port_speed);
      Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
      Espruino.Config.SET_TIME_ON_WRITE  = true;
      Espruino.Config.BOARD_JSON_URL = `http://www.espruino.com/json/${envConfig.board}.json`;
      // Espruino.Config.MINIFICATION_LEVEL = 'ESPRIMA';
      // Espruino.Config.MODULE_MINIFICATION_LEVEL = 'ESPRIMA';

      esp.sendFile(envConfig.port, espReadyBundleFileName, function(err) {
        cb(err);
      })
    });
  });
};
