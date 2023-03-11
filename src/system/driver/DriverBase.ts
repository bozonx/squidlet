import {DriverContext} from './DriverContext.js'


export class DriverBase {
  private readonly context: DriverContext


  constructor(context: DriverContext) {
    this.context = context
  }
}
