import * as yargs from 'yargs';


// TODO: может не host config а какой-то свой
export type PlatformIndex = (hostConfig: {[index: string]: any}) => void;


export function checkPlatform() {
  if (!yargs.argv.platform) {
    throw new Error(`You have to specify a "platform" params`);
  }

  // TODO: проверить что это одна из зарегистрированны платформ
}

export function getPlatformIndex(): PlatformIndex {
  try {
    checkPlatform();
  }
  catch (err) {
    throw new Error(err);
  }

  const platformName: string = yargs.argv.platform;

  // TODO: загрузить индексный файл платформы
}
