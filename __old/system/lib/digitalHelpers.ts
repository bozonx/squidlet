import {
  directionString,
  Edge,
  EdgeString,
  InputResistorMode,
  OutputResistorMode,
  PinDirection,
} from '../interfaces/gpioTypes';

/*
 * Helpers for digital drivers, devices and IOs.
 */


/**
 * Convert value like 'on', 'true', 1, true, ... to boolean
 */
export function resolveLevel(value: any): boolean {
  return value === true
    || value === 1
    || value === 'high'
    || value === 'true'
    || value === '1'
    || value === 'ON' || value === 'on' || value === 'On';
}

/**
 * Is actually inverted.
 * Pullup and open drain modes invert only if invertOnPullupOrOpenDrain is set.
 */
export function isDigitalPinInverted(
  invert?: boolean,
  invertOnPullupOrOpenDrain?: boolean,
  pullupOrOpenDrain?: boolean
): boolean {
  // twice inverting on pullup if allowed
  if (pullupOrOpenDrain && invertOnPullupOrOpenDrain) {
    return !invert;
  }

  // in other cases - use invert prop
  return Boolean(invert);
}

/**
 * It it needs to invert
 */
export function invertIfNeed(value?: boolean, invert?: boolean): boolean {
  if (invert) return !value;

  return Boolean(value);
}

// TODO: test with Edge as parameter
/**
 * Resolve inverted edge.
 */
export function resolveEdge(edge?: EdgeString | Edge, inverted?: boolean): Edge {
  if (typeof edge === 'undefined') {
    return Edge.both;
  }
  else if (inverted && (edge === 'rising' || edge === Edge.rising)) {
    return Edge.falling;
  }
  else if (inverted && (edge === 'falling' || edge === Edge.falling)) {
    return Edge.rising;
  }

  if (edge === 'rising' || edge === Edge.rising) {
    return Edge.rising;
  }
  else if (edge === 'falling' || edge === Edge.falling) {
    return Edge.falling;
  }
  else {
    return Edge.both;
  }
}

export function resolveInputResistorMode(pullup?: boolean, pulldown?: boolean): InputResistorMode {
  if (pullup) return InputResistorMode.pullup;
  else if (pulldown) return InputResistorMode.pulldown;

  return InputResistorMode.none;
}

export function resolveOutputResistorMode(openDrain?: boolean): OutputResistorMode {
  if (openDrain) return OutputResistorMode.opendrain;

  return OutputResistorMode.none;
}

export function stringifyPinMode(
  direction: PinDirection | undefined,
  mode: InputResistorMode | OutputResistorMode | undefined
): string {
  return `${stringifyPinDirection(direction)}_${stringifyResistorMode(direction, mode)}`;
}

export function stringifyPinDirection(direction: PinDirection | undefined): directionString | 'unset' {
  if (typeof direction === 'undefined') {
    return 'unset';
  }
  else if (direction === PinDirection.input) {
    return 'input';
  }

  return 'output';
}

export function stringifyResistorMode(
  direction: PinDirection | undefined,
  mode: InputResistorMode | OutputResistorMode | undefined
): string {
  if (typeof direction === 'undefined' || typeof mode === 'undefined') {
    return 'unset';
  }
  else if (mode === InputResistorMode.pulldown) {
    return 'pulldown';
  }
  else if (mode === InputResistorMode.pullup && direction === PinDirection.input) {
    return 'pullup';
  }
  else if (mode === OutputResistorMode.opendrain && direction === PinDirection.output) {
    return 'opendrain';
  }

  return 'none';
}
