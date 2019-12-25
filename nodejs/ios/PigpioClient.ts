import IoItem from '../../system/interfaces/IoItem';


export default class PigpioClient extends IoItem {
  init?: (definition: any) => Promise<void>;
  destroy?: () => Promise<void>;
}
