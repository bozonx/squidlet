import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';


export function waitForResponse(
  events: IndexedEvents<any>,
  isMyEventCb: (payload: any) => boolean,
  responseTimoutSec: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    let wasFulfilled: boolean = false;
    let handlerIndex: number;

    const timeout = setTimeout(() => {
      if (wasFulfilled) return;

      wasFulfilled = true;
      events.removeListener(handlerIndex);
      reject(`RemoteCall: waitForResponse timeout has been exceeded.`);
    }, responseTimoutSec * 1000);

    const handler = (payload: {error?: string, result: any} | undefined) => {
      if (!payload) return ;

      const isMyEvent: boolean = isMyEventCb(payload);

      if (!isMyEvent) return;

      clearTimeout(timeout);
      wasFulfilled = true;
      events.removeListener(handlerIndex);

      if (payload.error) {
        return reject(new Error(payload.error));
      }

      resolve(payload.result);
    };

    handlerIndex = events.addListener(handler);
  });

}
