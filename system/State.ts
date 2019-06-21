import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {getDifferentKeys, mergeDeep} from './helpers/collections';
import {isEqual} from './helpers/lodashLike';
import {combineTopic} from './helpers/helpers';


export const STATE_SEPARATOR = '.';

type ChangeHandler = (category: number, stateName: string, changedParams: string[]) => void;
type CategoryChangeHandler = (category: number) => void;
export type StateObject = {[index: string]: JsonTypes};


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private readonly categoryChangeEvents = new IndexedEvents<CategoryChangeHandler>();
  // like { category: { stateName: { ... stateParams } } }
  private readonly state: {[index: string]: {[index: string]: StateObject}} = {};


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

    const changedParams: string[] = getDifferentKeys(this.state[category][stateName], newState);

    this.state[category][stateName] = newState;

    this.changeEvents.emit(category, stateName, changedParams);
    this.categoryChangeEvents.emit(category);
  }

  updateStateParam(category: number, stateName: string, paramName: string, value: JsonTypes) {
    const newState = mergeDeep({ [paramName]: value }, this.state[category][stateName]);

    // don't do anything if value isn't changed
    if (
      this.state[category]
      && this.state[category][stateName]
      && this.state[category][stateName][paramName] === value
    ) return;

    if (!this.state[category]) this.state[category] = {};

    const changedParams: string[] = [paramName];
    const fullStateName: string = combineTopic(STATE_SEPARATOR, stateName, paramName);

    this.state[category][stateName] = newState;

    this.changeEvents.emit(category, fullStateName, changedParams);
    this.changeEvents.emit(category, stateName, changedParams);
    this.categoryChangeEvents.emit(category);
  }

  onChange(cb: (category: number, stateName: string, changedParams: string[]) => void): number {
    return this.changeEvents.addListener(cb);
  }

  onChangeCategory(cb: (category: number) => void): number {
    return this.categoryChangeEvents.addListener(cb);
  }

  removeListener(category: number, stateName: string, handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  removeCategoryListener(category: number, handlerIndex: number) {
    this.categoryChangeEvents.removeListener(handlerIndex);
  }

}
