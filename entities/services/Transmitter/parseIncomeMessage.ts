export interface DigitalOutputResult {
  pin: number;
  state: boolean;
}

// TODO: make it
export interface I2cResult {
  data: Uint8Array;
}


export type Results = DigitalOutputResult | I2cResult;

export enum MESSAGE_POSITIONS {
  functionNum,
  functionsArgs,
}

function parseDigitalOutput(data: Uint8Array): DigitalOutputResult {
  if (data.length !== 2) {
    throw new Error(`Function parseDigitalOutput: Invalid length of data passed`);
  }
  // TODO: может делать структурой ???
  // pin number, currentState
  return {
    pin: data[0],
    state: Boolean(data[1]),
  };
}


const parseFunctions: {[index: string]: (data: Uint8Array) => Results} = {
  12: parseDigitalOutput,
};


export default function parseIncomeMessage(
  messages: Uint8Array[]
): [number, Results][] {
  const result: [number, Results][] = [];

  for (let item of messages) {
    const functionNum: number = item[MESSAGE_POSITIONS.functionNum];
    // TODO: test
    const data: Uint8Array = item.slice(MESSAGE_POSITIONS.functionsArgs);

    if (!parseFunctions[functionNum]) {
      // TODO: better to do log.warn and just skip
      throw new Error(`Can't recognize the function handler: ${functionNum}`);
    }

    const args: Results = parseFunctions[functionNum](data);

    result.push([functionNum, args]);
  }

  return result;
}
