const esp = require("espruino");

const {stringify} = require('./helpers');


function configureEspruino(board, portSpeed) {
  Espruino.Config.BAUD_RATE = String(portSpeed);
  Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
  Espruino.Config.SET_TIME_ON_WRITE  = true;
  Espruino.Config.BOARD_JSON_URL = `http://www.espruino.com/json/${board}.json`;
}

function initEspruino() {
  return new Promise((resolve, reject) => {
    esp.init((err) => {
      if (err) return reject(err);

      resolve();
    });
  });
}

function sendBundle(port, bundleFile) {
  return new Promise((resolve, reject) => {
    esp.sendFile(port, bundleFile, function(err) {
      if (err) return reject(err);

      resolve();
    })
  });
}

function pushModule(port, moduleName, moduleContent) {
  return new Promise((resolve, reject) => {
    const stringedModule = stringify(moduleContent);

    // TODO: get root from config
    const rootDir = 'host';

    const expr = `global.__flashFile("${rootDir}", ${moduleName}", "${stringedModule}")`;

    // console.log(11111111, moduleName, moduleContent)
    //
    // // TODO: remove
    // resolve();
    // return;

    // ---- require('fs').readdir('/system')



    esp.expr(port, expr, function(err) {
      if (err) return reject(err);

      resolve();
    });
  });
}


/**
 * like ./node_modules/.bin/espruino --board ESP32 --port /dev/ttyUSB0 -b 115200 --no-ble -m -t ./build/starter/bundle.js
 */
exports.uploadBundle = async function (board, port, portSpeed, bundleFile) {
  await initEspruino();
  configureEspruino(board, portSpeed);
  await sendBundle(port, bundleFile);
};


exports.uploadProject = async function (board, port, portSpeed, modules) {
  await initEspruino();
  configureEspruino(board, portSpeed);

  for (let module of modules) {
    await pushModule(port, module[0], module[1]);
  }
};
