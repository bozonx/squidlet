import {AppBase} from '../../system/application/AppBase.js'


export class FilemanApp extends AppBase {
  myName = 'FileMan'


  constructor() {
    super()
  }


  async init() {
    this.ctx.registerAppUi(this.myName, [
      'main.js',
      'main.css',
    ])
  }

}