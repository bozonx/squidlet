export enum PORT_EXPANDER_INPUT_RESISTOR_MODE {
  none,
  pullup,
  // arduino doesn't support the pulldown resistors ???
}

export enum PORT_EXPANDER_FUNCTIONS {
  digitalOutputSetup = 10,
  digitalOutputWrite,
  digitalInputSetup,
  digitalReadForce,
}

export enum PORT_EXPANDER_FEEDBACK {
  digitalInputRead = 14,
}
