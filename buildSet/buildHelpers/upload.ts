declare const Espruino: {[index: string]: any};

import * as fs from 'fs';
import * as path from 'path';
const esp = require('espruino');

const {stringify} = require('./helpers');


const fsPromises = fs.promises;


class Upload {
  private readonly board: string;
  private readonly port: string;
  private readonly portSpeed: number;
  private readonly flashDir: string;


  constructor(board: string, port: string, portSpeed: number, flashDir: string) {
    this.board = board;
    this.port = port;
    this.portSpeed = portSpeed;
    this.flashDir = flashDir;
  }

  async start() {
    await this.initEspruino();
    this.configureEspruino();

    const uploadExpressions = await this.collectUploadExpressions();

    await this.runExprs(uploadExpressions);
  }

  private async collectUploadExpressions(): Promise<string[]> {
    const filesInFlashDir: string[] = await fsPromises.readdir(this.flashDir);
    const exprs: string[] = [];

    for (let relFileName of filesInFlashDir) {
      const fullFileName = path.resolve(this.flashDir, relFileName);
      const moduleContent: string = await fsPromises.readFile(fullFileName, {encoding: 'utf8'});
      const stringedModule = stringify(moduleContent);
      const expr = `require("Storage").write("${relFileName}", "${stringedModule}")`;

      exprs.push(expr);
    }

    return exprs;
  }

  private runExprs (uploadExpressions: string[]) {
    Espruino.Core.Serial.startListening(() => {});

    return new Promise((resolve, reject) => {
      Espruino.Core.Serial.open(this.port, async (status?: string) => {
          if (status === undefined) {
            return reject(new Error('Unable to connect!'));
          }

          for (let exp of uploadExpressions) {
            await this.sendExpression(exp);
          }

          Espruino.Core.Serial.close();
        },
        () => { // disconnected
          //if (callback) callback(exprResult);
          resolve();
        });
    });
  }

  sendExpression(expression: string) {
    return new Promise((resolve, reject) => {
      Espruino.Core.Utils.executeExpression(expression, (result?: string) => {
        if (result) {
          setTimeout(() => {
            return resolve(result);
          }, 500);

          return;
        }

        reject(`No result of expression: ${expression}`);
      });
    });
  }

  private configureEspruino() {
    Espruino.Config.BAUD_RATE = String(this.portSpeed);
    Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
    Espruino.Config.SET_TIME_ON_WRITE  = true;
    Espruino.Config.BOARD_JSON_URL = `http://www.espruino.com/json/${this.board}.json`;
  }

  private initEspruino() {
    return new Promise((resolve, reject) => {
      esp.init((err?: string) => {
        if (err) return reject(new Error(err));

        resolve();
      });
    });
  }

}


export default async function (board: string, port: string, portSpeed: number, flashDir: string) {
  const upload = new Upload(board, port, portSpeed, flashDir);

  await upload.start();
}
