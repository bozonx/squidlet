import IndexedEvents from '../IndexedEvents';


export function waitForResponse(
  events: IndexedEvents<any>,
  resolveSelfEventCb: (payload: any) => boolean,
  responseTimout: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    let wasFulfilled: boolean = false;
    let handlerIndex: number;
    const handler = (payload: {error?: string, result: any}) => {
      const isMyEvent: boolean = !resolveSelfEventCb(payload);

      if (!isMyEvent) return;

      wasFulfilled = true;
      events.removeListener(handlerIndex);

      if (payload.error) {
        return reject(new Error(payload.error));
      }

      resolve(payload.result);
    };

    handlerIndex = events.addListener(handler);

    setTimeout(() => {
      if (wasFulfilled) return;

      wasFulfilled = true;
      events.removeListener(handlerIndex);
      reject(`Remote dev set request timeout has been exceeded.`);
    }, responseTimout);
  });

}
