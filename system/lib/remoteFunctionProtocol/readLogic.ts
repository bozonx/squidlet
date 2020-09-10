export type AskDataCb = (register: number, count: number) => Promise<Uint8Array>;


enum READ_REGISTERS {
  readPackageLength,
  readPackage
}

const READ_PACKAGE_LENGTH_COUNT = 1;
const NEXT_PACKAGE_MARKER = 255;


export function parseResult(result: Uint8Array): [Uint8Array[], number] {
  const messages: Uint8Array[] = [];
  let nextPackageLength: number = 0;
  let pointerToNextMessage: number = 0;

  for (let i = 0; i < result.length; i++) {
    const messageLength: number = result[pointerToNextMessage];

    if (pointerToNextMessage >= result.length - 1) {
      break;
    }
    // the enf of data or no data
    if (messageLength === 0) {
      break;
    }
    else if (messageLength === NEXT_PACKAGE_MARKER) {
      nextPackageLength = result[pointerToNextMessage + 1];

      break;
    }

    const endOfMessage = pointerToNextMessage + 1 + messageLength;
    const message: Uint8Array = result.slice(pointerToNextMessage + 1, endOfMessage);

    messages.push(message);

    pointerToNextMessage = endOfMessage;
  }

  return [messages, nextPackageLength];
}

/**
 * It asks for data and return array of messages which has been received.
 * It use for poll.
 * Result is [Messages[], nextPackageLength]
 * An empty Messages array on result means no new data is available.
 * nextPackageLength is the length of the next package is available to be read.
 * @param askDataCb
 * @param packageLengthToRead
 */
export async function readOnce(
  askDataCb: AskDataCb,
  packageLengthToRead?: number
): Promise<[Uint8Array[], number]> {
  let packageLength: number = packageLengthToRead || 0;

  // TODO: если последними байтами указанна длина то можно ее сразу отчиплять
  //       и использовать спец хэлпер

  if (!packageLength) {
    // TODO: тут же будет разложен слово на байты !!!!
    const packageLengthResult: Uint8Array = await askDataCb(
      READ_REGISTERS.readPackageLength,
      READ_PACKAGE_LENGTH_COUNT
    );

    console.log(1111111, packageLengthResult)

    if (packageLengthResult.length !== READ_PACKAGE_LENGTH_COUNT) {
      throw new Error(
        `Invalid length of readPackageLength result: ${packageLengthResult.length}, ` +
        `Expected: ${READ_PACKAGE_LENGTH_COUNT}`
      );
    }

    packageLength = packageLengthResult[0];
  }

  if (!packageLength) return [[], 0];

  const packageResult: Uint8Array = await askDataCb(
    READ_REGISTERS.readPackage,
    packageLength
  );

  if (packageResult.length !== packageLength) {
    throw new Error(`Invalid length of package result`);
  }

  return parseResult(packageResult);
}


export default async function readLogic(
  askDataCb: AskDataCb,
  incomeMessageHandler: (messages: Uint8Array[]) => void
): Promise<void> {
  let packageLength: number = 0;
  // read while there no one packets remain
  while (true) {
    const [messages, nextPackageLength] = await readOnce(
      askDataCb,
      packageLength || undefined
    );

    if (!nextPackageLength) {
      // means the end
      break;
    }
    else {
      packageLength = nextPackageLength;
    }

    incomeMessageHandler(messages);
  }
}