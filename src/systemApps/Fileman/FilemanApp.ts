import {AppBase} from '../../system/application/AppBase.js'
import {fileManUi} from './ui/fileManUi.js'


export class FilemanApp extends AppBase {
  myName = 'FileMan'


  constructor() {
    super()
  }


  async init() {
    this.ctx.ui.registerRoot(fileManUi)
  }

}
