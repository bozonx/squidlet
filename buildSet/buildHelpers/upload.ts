import * as fs from 'fs';
import * as path from 'path';
const esp = require('espruino');

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


export default async function (board: string, port: string, portSpeed: number, flashDir: string) {
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
}
