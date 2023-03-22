import {PackageContext} from '../system/package/PackageContext.js'

// TODO: переделать в просто фу-ю
// TODO: у пакета должно быть состояния и события его смены
// TODO: пакеты могут инициализироваться друг за другом в заданном порядке
// TODO: тоже с дестроем

export interface Package {

  // It is called right after it is set to system via use()
  install: (ctx: PackageContext) => Promise<void>
  // It is called before system destroy and in reverse order of install method called
  destroy?: (ctx: PackageContext) => Promise<void>
}
