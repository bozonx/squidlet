import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import {mergeDeep} from './helpers/collections';


// TODO: add republish - общий интервал

type ChangeHandler = (stateName: string) => void;


export default class State {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private readonly state: {[index: string]: {[index: string]: JsonTypes}} = {};


  constructor(republishInterval: string) {
  }

  destroy() {
    this.changeEvents.removeAll();
  }


  getState(stateName: string): JsonTypes {
    return this.state[stateName];
  }

  updateState(stateName: string, newPartialState: {[index: string]: JsonTypes}) {
    this.state[stateName] = mergeDeep(newPartialState, this.state[stateName]);

    this.changeEvents.emit(stateName);
  }

  onChange(stateName: string, cb: (stateName: string, isRepublish?: true) => void): number {
    return this.changeEvents.addListener(cb);
  }

}
