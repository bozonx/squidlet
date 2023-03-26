import {deserializeUint8Array} from '../../../../../squidlet-lib/src/serialize';
import {NEXT_PACKAGE_MARKER} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/remoteFunctionProtocol/constants.js';

export type ReadLengthCb = () => Promise<number>;
export type ReadPackageCb = (length: number) => Promise<Uint8Array>;


// export function parseResult(result: Uint8Array): [Uint8Array[], number] {
//   const messages: Uint8Array[] = [];
//   let nextPackageLength: number = 0;
//   let pointerToNextMessage: number = 0;
//
//   for (let i = 0; i < result.length; i++) {
//     const messageLength: number = result[pointerToNextMessage];
//
//     if (pointerToNextMessage >= result.length - 1) {
//       break;
//     }
//     // the enf of data or no data
//     if (messageLength === 0) {
//       break;
//     }
//     else if (messageLength === NEXT_PACKAGE_MARKER) {
//       nextPackageLength = result[pointerToNextMessage + 1];
//
//       break;
//     }
//
//     const endOfMessage = pointerToNextMessage + 1 + messageLength;
//     const message: Uint8Array = result.slice(pointerToNextMessage + 1, endOfMessage);
//
//     messages.push(message);
//
//     pointerToNextMessage = endOfMessage;
//   }
//
//   return [messages, nextPackageLength];
// }

/**
 * It asks for data and return array of messages which has been received.
 * It use for poll.
 * Result is [Messages[], nextPackageLength]
 * An empty Messages array on result means no new data is available.
 * nextPackageLength is the length of the next package is available to be read.
 */
export async function readOnce(
  readLength: ReadLengthCb,
  readPackage: ReadPackageCb,
  packageLengthToRead?: number
): Promise<{messages: Uint8Array[], nextPackageLength: number}> {
  const result: {messages: Uint8Array[], nextPackageLength: number} = {
    messages: [],
    nextPackageLength: 0
  };
  let packageLength: number = packageLengthToRead || 0;

  if (!packageLength) {
    packageLength = await readLength();
  }

  if (!packageLength) return result;

  const packageResult: Uint8Array = await readPackage(packageLength);

  if (packageResult[0] === NEXT_PACKAGE_MARKER) {
    result.nextPackageLength = packageResult[1];

    const {arrays} = deserializeUint8Array(packageResult, 2);

    result.messages = arrays;
  }
  else {
    const {arrays} = deserializeUint8Array(packageResult);

    result.messages = arrays;
  }

  return result;
}


export default async function readLogic(
  readLength: ReadLengthCb,
  readPackage: ReadPackageCb,
  incomeMessageHandler: (messages: Uint8Array[]) => void
): Promise<void> {
  let nextPackageLength: number = 0;
  // read while there no one packets remain
  while (true) {
    const result = await readOnce(
      readLength,
      readPackage,
      nextPackageLength || undefined
    );

    incomeMessageHandler(result.messages);

    if (result.nextPackageLength) {
      nextPackageLength = result.nextPackageLength;
    }
    else {
      // means the end
      break;
    }
  }
}
