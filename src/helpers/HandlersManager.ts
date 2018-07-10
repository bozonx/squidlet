import HandlerWrappers from './HandlerWrappers';

const HANDLER_POSITION = 0;
const WRAPPER_POSITION = 1;

// TODO: remove - remake to HandlerWrappers


export default class HandlersManager<HandlerType, WrapperType> {
  // item is [ handler, wrapper ]
  private readonly handlers: {[index: string]: Array<[ HandlerType, WrapperType ]>} = {};


  getWrapper(dataId: string, handler: HandlerType): WrapperType {
    const handlerIndex: number = this.handlers[dataId].findIndex((item) => {
      return item[HANDLER_POSITION] === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${dataId}"`);

    return this.handlers[dataId][handlerIndex][WRAPPER_POSITION];
  }

  removeByHandler(dataId: string, handler: HandlerType): void {
    const handlerIndex: number = this.handlers[dataId].findIndex((item) => {
      return item[HANDLER_POSITION] === handler;
    });
    // remove item
    this.handlers[dataId].splice(handlerIndex, 1);
    // remove container if it is an empty
    if (!this.handlers[dataId].length) {
      delete this.handlers[dataId];
    }
  }

  addHandler(dataId: string, handler: HandlerType, wrapper: WrapperType): void {
    if (!this.handlers[dataId]) this.handlers[dataId] = [];

    this.handlers[dataId].push([ handler, wrapper ]);
  }

}
