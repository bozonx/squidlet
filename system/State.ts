import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {getDifferentKeys, mergeDeep} from './helpers/collections';
import {isEqual} from './helpers/lodashLike';


type ChangeHandler = (category: number, stateName: string, changedParams: string[]) => void;
type ChangeParamHandler = (category: number, stateName: string, paramName: string, value: JsonTypes) => void;
export type StateObject = {[index: string]: JsonTypes};


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private readonly changeParamEvents = new IndexedEvents<ChangeParamHandler>();
  // like { category: { stateName: { ... stateParams } } }
  private readonly state: {[index: string]: {[index: string]: StateObject}} = {};


  destroy() {
    this.changeEvents.removeAll();
    this.changeParamEvents.removeAll();
  }


  getState(category: number, stateName: string): StateObject | undefined {
    if (!this.state[category]) return;

    return this.state[category][stateName];
  }

  getStateParam(category: number, stateName: string, paramName: string): JsonTypes {
    if (!this.state[category]) return;
    if (!this.state[category][stateName]) return;

    return this.state[category][stateName][paramName];
  }

  updateState(category: number, stateName: string, newPartialState: StateObject) {
    // TODO: как поступать с undefined - он должен затереть старое значение или ничего не делать???
    const newState: StateObject = mergeDeep(newPartialState, this.getState(category, stateName));

    // don't do anything if value isn't changed
    if (isEqual(newState, this.getState(category, stateName))) return;

    const changedParams: string[] = getDifferentKeys(this.getState(category, stateName), newState);

    if (!this.state[category]) this.state[category] = {};

    this.state[category][stateName] = newState;

    // emit all the params events
    for (let paramName of Object.keys(newPartialState)) {
      this.changeParamEvents.emit(category, stateName, paramName, newPartialState[paramName]);
    }

    this.changeEvents.emit(category, stateName, changedParams);
  }

  updateStateParam(category: number, stateName: string, paramName: string, value: JsonTypes) {
    // don't do anything if value isn't changed
    if (
      this.state[category]
      && this.state[category][stateName]
      && this.state[category][stateName][paramName] === value
    ) return;

    const newState = mergeDeep({ [paramName]: value }, this.getState(category, stateName));

    if (!this.state[category]) this.state[category] = {};

    const changedParams: string[] = [paramName];

    this.state[category][stateName] = newState;

    this.changeParamEvents.emit(category, stateName, paramName, value);
    this.changeEvents.emit(category, stateName, changedParams);
  }

  /**
   * Listen each change in each category and state
   */
  onChange(cb: ChangeHandler): number {
    return this.changeEvents.addListener(cb);
  }

  onChangeParam(cb: ChangeParamHandler): number {
    return this.changeParamEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  removeParamListener(handlerIndex: number) {
    this.changeParamEvents.removeListener(handlerIndex);
  }

}
