export const allowedIoSetTypes = [
  'local',
  'nodejs-ws',
  'nodejs-developLocal',
  'nodejs-developWs',
  //'thread',
];

type IoSetTypes =
  'local' |
  'nodejs-ws' |
  'nodejs-developLocal' |
  'nodejs-developWs';
  //'thread' |

export default IoSetTypes;
