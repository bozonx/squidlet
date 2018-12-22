const _isEmpty = require('lodash/isEmpty');
const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _capitalize = require('lodash/capitalize');
const _includes = require('lodash/includes');
const _omit = require('lodash/omit');
const _find = require('lodash/find');
const _isEqual = require('lodash/isEqual');
const _trim = require('lodash/trim');
const _padStart = require('lodash/padStart');
const _last = require('lodash/last');


export function isEmpty(...p: any[]) {
  return _isEmpty(...p);
}

export function defaultsDeep(...p: any[]) {
  return _defaultsDeep(...p);
}

export function cloneDeep(...p: any[]) {
  return _cloneDeep(...p);
}

export function capitalize(...p: any[]) {
  return _capitalize(...p);
}

export function includes(...p: any[]) {
  return _includes(...p);
}

export function omit(...p: any[]) {
  return _omit(...p);
}

export function find(...p: any[]) {
  return _find(...p);
}

export function isEqual(...p: any[]) {
  return _isEqual(...p);
}

export function trim(...p: any[]) {
  return _trim(...p);
}

export function padStart(...p: any[]) {
  return _padStart(...p);
}

export function last(...p: any[]) {
  return _last(...p);
}

export function trimEnd(stringToTrim: string, chars: string): string {
  const regex = new RegExp(`\\${chars}+$`);

  return stringToTrim.replace(regex, '');
}

