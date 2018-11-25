const HANDLER_POSITION = 0;
const WRAPPER_POSITION = 1;


export default class HandlerWrappers<HandlerType, WrapperType> {
  // item is [ handler, wrapper ]
  private readonly handlers: Array<[ HandlerType, WrapperType ]> = [];


  /**
   * Get wrapper by handler
   */
  getWrapper(handler: HandlerType): WrapperType {
    const handlerIndex: number = this.handlers.findIndex((item) => {
      return item[HANDLER_POSITION] === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler "${handler}"`);

    return this.handlers[handlerIndex][WRAPPER_POSITION];
  }

  /**
   * Remove pair of hanler and wrapper by handler
   */
  removeByHandler(handler: HandlerType): void {
    const handlerIndex: number = this.handlers.findIndex((item) => {
      return item[HANDLER_POSITION] === handler;
    });

    // do nothing if it hasn't found
    if (handlerIndex < 0) return;

    // remove item
    this.handlers.splice(handlerIndex, 1);
  }

  addHandler(handler: HandlerType, wrapper: WrapperType): void {
    this.handlers.push([ handler, wrapper ]);
  }

}
