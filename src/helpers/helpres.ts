import _ from 'lodash';
import * as uniqid from 'uniqid';


export function generateUniqId(): string {
  return uniqid();
}
