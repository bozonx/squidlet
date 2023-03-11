import {ServiceContext} from '../Service/ServiceContext.js'

export class ServiceBase {
  private readonly context: ServiceContext


  constructor(context: ServiceContext) {
    this.context = context
  }
}
