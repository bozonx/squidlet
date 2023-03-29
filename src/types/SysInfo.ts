export const DEVICE_TYPE = {
  // full desktop
  desktop: 'desktop',
  // and other mini desktop
  netTop: 'netTop',
  // some kiosk with permanent power and UPS
  kiosk: 'kiosk',
  // TV sets, TV dongle
  tvSet: 'tvSet',
  // an application on smart TV
  smartTvApp: 'smartTvApp',
  // raspberry Pi, smart home station or router Linux powered and so on
  board: 'board',
  // microcontroller or smart home station and other devices
  // with permanent power and without OS
  mcPermanent: 'mcPermanent',
  // microcontroller battery powered
  mcOnBattery: 'mcOnBattery',
  laptop: 'laptop',
  microLaptop: 'microLaptop',
  tablet: 'tablet',
  // book reader with e-ink screen
  reader: 'reader',
  mobilePhone: 'mobilePhone',
  // smartwatch or band
  smartwatch: 'smartwatch',
  // VR helmet
  vrHelmet: 'vrHelmet',
  // AR glasses
  glasses: 'glasses',
}

export type DeviceType = keyof typeof DEVICE_TYPE

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

export type OsType = keyof typeof OS_TYPE

export const OS_ARCH = {
  x86_64: 'x86_64',
  arm: 'arm',
  unknown: 'unknown',
}

export type OsArch = keyof typeof OS_ARCH

export const RUNTIME_ENV = {
  nodejs: 'nodejs',
  pwa: 'pwa',
}

export type RuntimeEnv = keyof typeof RUNTIME_ENV


export interface SysPermanentInfo {
  os: {
    type: keyof typeof OS_TYPE
    // name of OS as it gets from OS
    name: string
    version: string
  }
  system: {
    arch: OsArch
    // number of cpu threads
    cpuNum: number
    // RAM in megabytes
    ramTotalMb: number
  }

  runtimeEnv: RuntimeEnv
}


export interface SysVariableInfo {
  /////// WAS SET ON INSTALL STEP
  deviceType: DeviceType
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
