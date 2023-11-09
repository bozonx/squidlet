import {pathDirname, pathJoin} from 'squidlet-lib'
import type {LogLevel} from 'squidlet-lib'
import {FilesWrapper} from './FilesWrapper.js'


export class FilesLog extends FilesWrapper {
  // /**
  //  * Append to existent file or create it if doesn't exists
  //  */
  // async writeLog(pathToLog: string, data: string, logLevel: LogLevel) {
  //   const fullPath = pathJoin(this.rootDir, clearRelPathLeft(pathToLog))
  //   // TODO: add date and time and log level
  //   const fullLog = data
  //   // create dir if need
  //   await this.driver.mkDirP(pathDirname(fullPath))
  //
  //   try {
  //     await this.driver.appendFile(fullPath, fullLog)
  //   }
  //   catch (e) {
  //     // TODO: ошибка должна быть только связанна с тем что файл уже существует
  //     // TODO: а может appendFile уже подразумевает создание файла ????
  //     throw e
  //   }
  //
  //   // TODO: поддержка ротации
  // }
  //
  // async readLogFile(pathTo: string): Promise<string> {
  //   // TODO: файл может быть большой - считывать только указанное количество строк с конца
  //   return this.driver.readTextFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  // }

}
