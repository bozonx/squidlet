import {IoBase} from './IoBase.js'
import {PackageContext} from '../package/PackageContext.js'


export abstract class IoSetBase {
  private readonly ioCollection: {[index: string]: IoBase} = {}
  private readonly pkgCtx: PackageContext
  private wasInited: boolean = false


  constructor(pkgCtx: PackageContext) {
    this.pkgCtx = pkgCtx
  }


  /**
   * It is called at the beginning of System initialization.
   * It is called only once.
   */
  async init() {
    this.wasInited = true

    // TODO: сначала выбрать файловый io

    this.ctx.log.debug(`IoManager: initializing IO "${ioName}"`)


    for (const ioName of Object.keys(this.ioSets)) {
      const ioItem = this.ios[ioName]
      const ioCfg: Record<string, any> | undefined = await this.system.configs
        .loadIoConfig(ioName)

      if (ioItem.init) {
        this.ctx.log.debug(`IoManager: initializing IO "${ioName}"`)
        await ioItem.init(ioCfg)
      }
    }
  }

  // useIo(ioIndex: IoIndex) {
  //   const io = ioIndex(this.ctx)
  //   const ioName: string = io.myName || io.constructor.name
  //
  //   if (this.ios[ioName]) {
  //     throw new Error(`The same IO "${ioName} is already in use"`)
  //   }
  //
  //   this.ios[ioName] = io
  // }


  /**
   * It is called only once on system destroy
   */
  async destroy() {
    // destroy of ios
    const ioNames: string[] = this.getNames()

    for (let ioName of ioNames) {
      const ioItem = this.ioCollection[ioName]

      // TODO: таймаут ожидания

      this.ctx.log.debug(`IoSetBase: destroying IO "${ioName}"`)

      if (ioItem.destroy) await ioItem.destroy()

      delete this.ioCollection[ioName]
    }
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
