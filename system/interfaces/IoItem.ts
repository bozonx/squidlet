import IoManager from '../managers/IoManager';


export interface IoDefinitions {
  [index: string]: {[index: string]: any};
}


export default interface IoItem {
  /**
   * Initialize io Item. It isn't allowed to call it more than once.
   */
  init?: (ioManager: IoManager, definition?: any) => Promise<void>;
  destroy?: () => Promise<void>;
}
