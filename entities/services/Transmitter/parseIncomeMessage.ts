
export enum MESSAGE_POSITIONS {
  functionNum,
  functionsArgs,
}

function parseDigitalOutput(data: Uint8Array): [number, boolean] {
  if (data.length !== 2) {
    throw new Error(`Function parseDigitalOutput: Invalid length of data passed`);
  }
  // TODO: может делать структурой ???
  // pin number, currentState
  return [data[0], !!data[1]];
}

const parseFunctions: {[index: string]: (data: Uint8Array) => any[]} = {
  12: parseDigitalOutput,
};


export default function parseIncomeMessage(
  messages: Uint8Array[]
): [number, any[]][] {
  const result: [number, any[]][] = [];

  for (let item of messages) {
    const functionNum: number = item[MESSAGE_POSITIONS.functionNum];
    // TODO: test
    const data: Uint8Array = item.slice(MESSAGE_POSITIONS.functionsArgs);

    if (!parseFunctions[functionNum]) {
      // TODO: better to do log.warn and just skip
      throw new Error(`Can't recognize the function handler: ${functionNum}`);
    }

    const args: any[] = parseFunctions[functionNum](data);

    result.push([functionNum, args]);
  }

  return result;
}
