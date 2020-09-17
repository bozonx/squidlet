export interface DigitalOutputResult {
  pin: number;
  state: boolean;
}

// TODO: make it
export interface I2cResult {
  data: Uint8Array;
}


export type Results = DigitalOutputResult | I2cResult;


export const functionsParsers: {[index: string]: (data: Uint8Array) => Results} = {
  12: parseDigitalOutput,
};


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
