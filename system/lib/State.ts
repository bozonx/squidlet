import {Dictionary} from '../interfaces/Types';
import IndexedEvents from './IndexedEvents';
import {mergeDeepObjects} from './objects';
import {isEqual} from './helpers';


type ChangeHandler = (category: number, stateName: string, changedParams: string[]) => void;
//type ChangeParamHandler = (category: number, stateName: string, paramName: string, value: JsonTypes) => void;


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  //private readonly changeParamEvents = new IndexedEvents<ChangeParamHandler>();
  // TODO: better to use immutable
  // like { category: { stateName: { ... stateParams } } }
  private readonly state: {[index: string]: {[index: string]: Dictionary}} = {};


  destroy() {
    this.changeEvents.removeAll();
    //this.changeParamEvents.removeAll();
  }


  /**
   * Get state of category and stateName
   * WARNING! please do not modify the result!
   */
  getState(category: number, stateName: string): Dictionary | undefined {
    if (!this.state[category]) return;

    return this.state[category][stateName];
  }

  updateState(category: number, stateName: string, newPartialState?: Dictionary) {
    const oldState: Dictionary | undefined = this.getState(category, stateName);
    const changedParams: string[] = this.generateChangedParams(oldState, newPartialState);

    // don't do anything if value isn't changed
    if (!changedParams.length) return;

    if (!this.state[category]) this.state[category] = {};

    this.state[category][stateName] = this.mergeState(oldState, newPartialState);

    // // emit all the params events
    // for (let paramName of Object.keys(newPartialState)) {
    //   this.changeParamEvents.emit(category, stateName, paramName, newPartialState[paramName]);
    // }

    this.changeEvents.emit(category, stateName, changedParams);
  }

  /**
   * Listen each change in each category and state
   */
  onChange(cb: ChangeHandler): number {
    return this.changeEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }


  private generateChangedParams(oldState?: Dictionary, partialState?: Dictionary): string[] {
    const result: string[] = [];

    if (!partialState) {
      return [];
    }
    else if (!oldState) {
      return Object.keys(partialState);
    }

    for (let name of Object.keys(partialState)) {
      if (!isEqual(partialState[name], oldState[name])) result.push(name);
    }

    return result;
  }

  private mergeState(oldState?: Dictionary, newPartialState?: Dictionary): Dictionary {
    return mergeDeepObjects(
      newPartialState,
      oldState
    );
  }


  // getStateParam(category: number, stateName: string, paramName: string): JsonTypes {
  //   if (!this.state[category]) return;
  //   if (!this.state[category][stateName]) return;
  //
  //   return this.state[category][stateName][paramName];
  // }

  // updateStateParam(category: number, stateName: string, paramName: string, value?: JsonTypes) {
  //   // don't do anything if value isn't changed
  //   if (
  //     this.state[category]
  //     && this.state[category][stateName]
  //     && this.state[category][stateName][paramName] === value
  //   ) return;
  //
  //   const newState = {
  //     ...this.getState(category, stateName),
  //     [paramName]: value,
  //   };
  //
  //   if (!this.state[category]) this.state[category] = {};
  //
  //   const changedParams: string[] = [paramName];
  //
  //   this.state[category][stateName] = newState;
  //
  //   this.changeParamEvents.emit(category, stateName, paramName, value);
  //   this.changeEvents.emit(category, stateName, changedParams);
  // }

  // onChangeParam(cb: ChangeParamHandler): number {
  //   return this.changeParamEvents.addListener(cb);
  // }

  // removeParamListener(handlerIndex: number) {
  //   this.changeParamEvents.removeListener(handlerIndex);
  // }

}
