import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {mergeDeep} from './helpers/collections';


// TODO: задать наверное тип категории deviceStatus, deviceConfig, etc ???

type ChangeHandler = (category: string, stateName: string, isRepublish?: true) => void;
type CategoryChangeHandler = (category: string, isRepublish?: true) => void;
type StateObject = {[index: string]: JsonTypes};


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private readonly categoryChangeEvents = new IndexedEvents<CategoryChangeHandler>();
  // like { category: { stateName: { ... stateParams } } }
  private readonly state: {[index: string]: {[index: string]: StateObject}} = {};


  constructor() {
  }

  destroy() {
    this.changeEvents.removeAll();
    this.categoryChangeEvents.removeAll();
  }


  getState(category: string, stateName: string): StateObject | undefined {
    if (!this.state[category]) return;

    return this.state[category][stateName];
  }

  updateState(category: string, stateName: string, newPartialState: StateObject) {
    if (!this.state[category]) this.state[category] = {};

    this.state[category][stateName] = mergeDeep(newPartialState, this.state[category][stateName]);

    this.changeEvents.emit(category, stateName);
    this.categoryChangeEvents.emit(category);
  }

  onChange(cb: (category: string, stateName: string, isRepublish?: true) => void): number {
    return this.changeEvents.addListener(cb);
  }

  onChangeCategory(cb: (category: string, isRepublish?: true) => void): number {
    return this.categoryChangeEvents.addListener(cb);
  }

  removeListener(category: string, stateName: string, handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  removeCategoryListener(category: string, handlerIndex: number) {
    this.categoryChangeEvents.removeListener(handlerIndex);
  }

}
