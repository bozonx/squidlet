declare const Espruino: {[index: string]: any};

import * as fs from 'fs';
import * as path from 'path';
const esp = require('espruino');

const {stringify} = require('./helpers');


const fsPromises = fs.promises;


class Upload {
  private readonly port: string;
  private readonly portSpeed: number;
  private readonly flashDir: string;


  constructor(port: string, portSpeed: number, flashDir: string) {
    this.port = port;
    this.portSpeed = portSpeed;
    this.flashDir = flashDir;
  }

  async start() {
    await this.initEspruino();
    this.configureEspruino();

    const filesInFlashDir: string[] = await fsPromises.readdir(this.flashDir);
    const fileWriteExprs: string[] = await this.collectUploadExpressions(filesInFlashDir);

    let uploadExpressions: string[] = [
      this.geFilesRemoveExp(filesInFlashDir),
      ...fileWriteExprs,
    ];

    await this.runExprs(uploadExpressions);
  }

  private geFilesRemoveExp(filesInFlashDir: string[]): string {
    return `(function(){for(let f of ${JSON.stringify(filesInFlashDir)}){try{require("Storage").erase(f)}catch(e){}}})()`;
  }

  private async collectUploadExpressions(filesInFlashDir: string[]): Promise<string[]> {
    const exprs: string[] = [];

    for (let relFileName of filesInFlashDir) {
      const fullFileName = path.resolve(this.flashDir, relFileName);
      const moduleContent: string = await fsPromises.readFile(fullFileName, {encoding: 'utf8'});
      const stringedModule = stringify(moduleContent);

      const expr = `require("Storage").write("${relFileName}", "${stringedModule}")`;
      //const expr = `console.log("${relFileName}", "${stringedModule}")`;

      exprs.push(expr);
    }

    return exprs;
  }

  private async runExprs (uploadExpressions: string[]) {
    Espruino.Core.Serial.startListening(() => {});

    await this.connectToMc();

    try {
      for (let exp of uploadExpressions) {
        await this.sendExpression(exp);
      }
    }
    catch (err) {
      Espruino.Core.Serial.close();

      throw new Error(err);
    }

    Espruino.Core.Serial.close();
  }

  sendExpression(expression: string) {
    return new Promise((resolve, reject) => {
      Espruino.Core.Utils.executeExpression(expression, (result?: string) => {
        if (result) {
          setTimeout(() => {
            return resolve(result);
          }, 15000);

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
  }

  private initEspruino() {
    return new Promise((resolve, reject) => {
      esp.init((err?: string) => {
        if (err) return reject(new Error(err));

        resolve();
      });
    });
  }

  private connectToMc(): Promise<string> {
    return new Promise((resolve, reject) => {
      Espruino.Core.Serial.open(
        this.port,
        (status?: string) => {
          if (status === undefined) {
            return reject(new Error('Unable to connect!'));
          }

          resolve(status);
        },
        () => { // disconnected
          console.log('===> Disconnected');
        }
      );
    });
  }

}


export default async function (port: string, portSpeed: number, flashDir: string) {
  const upload = new Upload(port, portSpeed, flashDir);

  await upload.start();
}
