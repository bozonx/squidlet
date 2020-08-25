import hashSum from './hashSum';


let counter: number = Number.MIN_SAFE_INTEGER + Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
let instanceId: string | undefined;


function randomInt(): number {
  return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
}


/**
 * Generate unique number.
 * It increments a counter on each call.
 * Counter is initialized with a random value.
 */
export function makeUniqNumber(): number {
  counter++;

  if (counter === Number.MAX_SAFE_INTEGER) {
    counter = Number.MIN_SAFE_INTEGER;
  }

  return counter;
}

/**
 * It returns id of runtime. This id is generating on first call of this function.
 * This id will never changed while runtime.
 * It contains of 8 chars.
 */
export function getRuntimeId(): string {
  if (typeof instanceId === 'undefined') {
    instanceId = hashSum( String(randomInt()) + String(randomInt()) );
  }

  return instanceId as string;
}

/**
 * Make always a unique id which contains of 8 chars.
 */
// TODO: добавить задание числа байт
export function makeUniqId(): string {
  const str: string = getRuntimeId() + String(makeUniqNumber());

  return hashSum(str);
}
