import PreEntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreEntityDefinition.js';


export default interface PreEntities {
  // devices definitions by deviceId
  devices: {[index: string]: PreEntityDefinition};
  // drivers definitions by driver name
  drivers: {[index: string]: PreEntityDefinition};
  // services definitions by service id
  services: {[index: string]: PreEntityDefinition};
}
