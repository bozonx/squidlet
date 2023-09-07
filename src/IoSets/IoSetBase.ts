import {IoBase} from '../system/Io/IoBase.js'
import {PackageContext} from '../system/package/PackageContext.js'
import {IoIndex} from '../types/types.js'


export abstract class IoSetBase {
  private ioCollection: {[index: string]: IoBase} = {}
  private ctx: PackageContext
  private wasInited: boolean = false


  constructor(ctx: PackageContext) {
    this.ctx = ctx
  }


  /**
   * It is called at the beginning of System initialization.
   * It is called only once.
   */
  async init() {
    this.wasInited = true

  }

  /**
   * It is called only once on system destroy
   */
  async destroy() {

  }


  /**
   * It is called before instantiating System if set.
   */
  prepare?(): Promise<void>

  /**
   * Register a new IO item.
   * If it will be called after Io set init then this item will be inited imediatelly
   */
  abstract registerIo(ioItem: IoIndex): Promise<void>

  /**
   * It returns the instance of IO which was created on initialization
   * @param ioName
   */
  getIo<T extends IoBase>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  /**
   * Get all the names of platforms items
   */
  getNames(): string[] {
    return Object.keys(this.ioCollection);
  }

}
