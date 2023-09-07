import {IoBase} from '../system/Io/IoBase.js'
import {PackageContext} from '../system/package/PackageContext.js'
import {IoIndex} from '../types/types.js'
import {IoItem} from './IoItem.js'


export abstract class IoSetBase implements IoSetType {
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
  abstract getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of platforms items
   */
  abstract getNames(): string[];

}
