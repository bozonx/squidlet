import hashSum from './hashSum';


let counter = Number.MIN_SAFE_INTEGER + Math.floor(Math.random() * 1000000);


export default function (): string {
  counter++;

  if (counter === Number.MAX_SAFE_INTEGER) counter = Number.MIN_SAFE_INTEGER;

  const str = Date.now().toString() + counter;

  return hashSum(str);
}
