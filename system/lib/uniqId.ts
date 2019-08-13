import hashSum from './hashSum';


let counter: number = Number.MIN_SAFE_INTEGER + Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
let instanceId: string | undefined;


export function makeUniqNumber(): number {
  counter++;

  if (counter === Number.MAX_SAFE_INTEGER) counter = Number.MIN_SAFE_INTEGER;

  return counter;
}

export function getInstanceId(): string {
  if (typeof instanceId === 'undefined') {
    instanceId = hashSum(makeUniqNumber());
  }

  return instanceId;
}

export function makeUniqId (): string {
  const str = Date.now().toString() + makeUniqNumber();

  return hashSum(str);
}
