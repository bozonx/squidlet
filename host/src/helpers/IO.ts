
// TODO: remove

import * as fs from 'fs';

import * as uniqid from 'uniqid';


export default class IO {

  generateUniqId(): string {
    return uniqid();
  }

}
