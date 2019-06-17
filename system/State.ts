import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {getDifferentKeys, mergeDeep} from './helpers/collections';
import {isEqual} from './helpers/lodashLike';


type ChangeHandler = (category: number, stateName: string, changedParams: string[], isRepublish?: true) => void;
type CategoryChangeHandler = (category: number, isRepublish?: true) => void;
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


  getState(category: number, stateName: string): StateObject | undefined {
    if (!this.state[category]) return;

    return this.state[category][stateName];
  }

  updateState(category: number, stateName: string, newPartialState: StateObject) {
    const newState = mergeDeep(newPartialState, this.state[category][stateName]);

    // don't do anything if value isn't changed
    if (isEqual(newState, this.state[category][stateName])) return;

    if (!this.state[category]) this.state[category] = {};

    const updatedParams: string[] = getDifferentKeys(this.state[category][stateName], newState);

    this.state[category][stateName] = newState;

    this.changeEvents.emit(category, stateName, updatedParams);
    this.categoryChangeEvents.emit(category);
  }

  onChange(cb: (category: number, stateName: string, changedParams: string[], isRepublish?: true) => void): number {
    return this.changeEvents.addListener(cb);
  }

  onChangeCategory(cb: (category: number, isRepublish?: true) => void): number {
    return this.categoryChangeEvents.addListener(cb);
  }

  removeListener(category: number, stateName: string, handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  removeCategoryListener(category: number, handlerIndex: number) {
    this.categoryChangeEvents.removeListener(handlerIndex);
  }

}
