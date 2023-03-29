export enum MobileLevels {
  desktop,
  // and other mini desktop
  netTop,
  // TV sets, TV dongle, or smart TV app
  tvSet,
  // microcontroller or smart home station and other devices with permanent power
  mcPermanent,
  laptop,
  microLaptop,
  tablet,
  mobilePhone,
  // smart watches
  wearable,
  // VR helmet and AR glasses
  vr,
  // microcontroller battery powered
  mcOnBattery,
}

export const OS_TYPE = {
  linux: 'linux',
  // BSD, mac os etc
  unixLike: 'unixLike',
  windows: 'windows',
  android: 'android',
  ios: 'ios',
  // microcontroller
  noOs: 'noOs',
}

export const OS_ARCH = {
  x86_64: 'x86_64',
  arm: 'arm',
  unknown: 'unknown',
}

export type OsArch = keyof typeof OS_ARCH

export const RUNTIME_ENV = {
  nodejs: 'nodejs',
}


export interface SysPermanentInfo {
  os: {
    type: keyof typeof OS_TYPE
    // name of OS as it gets from OS
    name: string
    version: string
    uptimeSec: number
  }
  system: {
    arch: OsArch
    // number of cpu threads
    cpuNum: number
    // RAM in megabytes
    ramTotalMb: number
  }

  runtimeEnv: keyof typeof RUNTIME_ENV
}


export interface SysVariableInfo {
  /////// WAS SET ON INSTALL STEP
  mobileLevel: MobileLevels
  hasScreen: boolean
  // has some user input devices for expample keyboard or touch screen
  hasUserInput: boolean
  // potentially has internet access
  hasInternetAccess: boolean
  // has battery inside
  hasBattery?: boolean
  // it is only for desktop. Is it defended by ups
  upsDefended?: boolean
  /////// VARIABLE
  // IO names
  io: string[]
  // speed of the internet access in Mb/s (Megabits per second)
  // -1 means it doesn't have access at the moment
  internetSpeedMbS?: boolean
  // is it working on battery right now
  workingOnBattery?: boolean
}


// connections: {
//   wifi: boolean
//   ethernetPort: boolean
//   bluetooth: boolean
//   serial: boolean
//   i2c: boolean
//   oneWire: boolean
//   gpio: boolean
//   hdmi: boolean
//   usb: boolean
//   memCard: boolean
//   sata: boolean
//   audioIn: boolean
//   audioOut: boolean
// }
