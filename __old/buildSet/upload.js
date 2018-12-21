const esp = require("espruino");
const fs = require('fs');
const path = require('path');
const {stringify} = require('./helpers');

const fsPromises = fs.promises;


function runExprs (port, exprs) {
  Espruino.Core.Serial.startListening(function(data) { });

  const sendExpression = (exp) => {
    return new Promise((resolve, reject) => {
      Espruino.Core.Utils.executeExpression(exp, function(result) {
        if (result) {
          setTimeout(function() {
            return resolve(result);
          }, 500);

          return;
        }

        reject(`No result of exp: ${exp}`);
      });
    });
  };

  return new Promise((resolve, reject) => {
    Espruino.Core.Serial.open(port, async function(status) {
      if (status === undefined) {
        return reject(new Error('Unable to connect!'));
      }

      for (let exp of exprs) {
        await sendExpression(exp);
      }

      Espruino.Core.Serial.close();
    },
    function() { // disconnected
      //if (callback) callback(exprResult);
      resolve();
    });
  });
}




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

function runExp(port, expr) {
  return new Promise((resolve, reject) => {
    esp.expr(port, expr, function(result, aa,ss) {
      if (!result) return reject(`Expression din't return any result. ${expr}`);

      setTimeout(() => {
        resolve(result);
      }, 300);
    });
  });
}

async function pushModule(port, relativeModulePath, moduleName, moduleContent) {
  const stringedModule = stringify(moduleContent);

  // TODO: get root from config
  const rootDir = 'host';

  const expr = `global.__flashFile("${rootDir}", "${relativeModulePath}", "${stringedModule}")`;

  // console.log(11111111, moduleName, moduleContent)
  //
  // // TODO: remove
  // resolve();
  // return;

  // ---- require('fs').readdir('/system')


  //await runExpr(port, expr);

  await runExp(port, expr);
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
    await pushModule(port, module[0], module[1], module[2]);
  }
};

exports.uploadToFlash = async function (board, port, portSpeed, flashDir) {
  await initEspruino();
  configureEspruino(board, portSpeed);

  const files = await fsPromises.readdir(flashDir);
  const exprs = [];

  for (let relFileName of files) {
    const fullFileName = path.resolve(flashDir, relFileName);
    const moduleContent = await fsPromises.readFile(fullFileName, {encoding: 'utf8'});
    const stringedModule = stringify(moduleContent);
    const expr = `require("Storage").write("${relFileName}", "${stringedModule}")`;

    //console.log(`-----> Writing file ${relFileName}`);

    //await runExp(port, expr);

    exprs.push(expr);
  }

  await runExprs(port, exprs);
};
