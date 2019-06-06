import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {mergeDeep} from './helpers/collections';


// TODO: задать наверное тип категории deviceStatus, deviceConfig, etc ???

type ChangeHandler = (category: string, stateName: string) => void;
type StateObject = {[index: string]: JsonTypes};


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  // like { category: { stateName: { ... stateParams } } }
  private readonly state: {[index: string]: {[index: string]: StateObject}} = {};


  constructor() {
  }

  destroy() {
    this.changeEvents.removeAll();
  }


  getState(category: string, stateName: string): StateObject | undefined {
    if (!this.state[category]) return;

    return this.state[category][stateName];
  }

  updateState(category: string, stateName: string, newPartialState: StateObject) {
    if (!this.state[category]) this.state[category] = {};

    this.state[category][stateName] = mergeDeep(newPartialState, this.state[category][stateName]);

    this.changeEvents.emit(category, stateName);
  }

  onChange(stateName: string, cb: (category: string, stateName: string, isRepublish?: true) => void): number {
    return this.changeEvents.addListener(cb);
  }

}
