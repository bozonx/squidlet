import {DriverContext} from './DriverContext.js'


export class ServiceBase {
  private readonly context: DriverContext


  constructor(context: DriverContext) {
    this.context = context
  }
}
