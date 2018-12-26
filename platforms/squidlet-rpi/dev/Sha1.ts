import * as crypto from 'crypto';


const shasum = crypto.createHash('sha1');


// TODO: remake to class

export default function (message: string) {
  shasum.update(message);

  return shasum.digest('hex');
}
