import {EdgeString, Edge, InputResistorMode, OutputResistorMode} from '../interfaces/gpioTypes';

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

/**
 * Resolve inverted edge.
 */
export function resolveEdge(edge?: EdgeString, inverted?: boolean): Edge {
  if (typeof edge === 'undefined') {
    return Edge.both;
  }
  else if (inverted && edge === 'rising') {
    return Edge.falling;
  }
  else if (inverted && edge === 'falling') {
    return Edge.rising;
  }

  if (edge === 'rising') {
    return Edge.rising;
  }
  else if (edge === 'falling') {
    return Edge.falling;
  }
  else {
    return Edge.both;
  }
}

// TODO: test
export function resolveInputResistorMode(pullup?: boolean, pulldown?: boolean): InputResistorMode {
  if (pullup) return InputResistorMode.pullup;
  else if (pulldown) return InputResistorMode.pulldown;

  return InputResistorMode.none;
}

// TODO: test
export function resolveOutputResistorMode(openDrain?: boolean): OutputResistorMode {
  if (openDrain) return OutputResistorMode.opendrain;

  return OutputResistorMode.none;
}
