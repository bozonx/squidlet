

// TODO: test


import {fill} from '../../../../squidlet-lib/src/arrays';

export default class BinaryState {
  // Bit mask representing the current state
  private readonly state: Uint8Array;

  constructor(itemsCount: number, initialState?: Uint8Array) {
    // TODO: calculate bytesCount
    // TODO: use initialState

    this.state = new Uint8Array(fill(new Array(bytesCount), 0));
  }


  getState(): Uint8Array {
    return this.state;
  }

  getObjectState(): {[index: string]: boolean} {
    // TODO: add
    //return this.state;

    // for (let pin in new Array(state.getItemsCount())) {
    //
    // }
  }

  getItemsCount(): number {
    // TODO: add
  }

  getItemState(itemNum: number): boolean {
    // TODO: add
  }

  setState(newState: Uint8Array) {
    // TODO: add
  }

  setObjState(newState: {[index: string]: boolean}) {
    // TODO: add
  }

  updateItemState(itemNum: number, state: boolean) {
    // TODO: add
  }

}
