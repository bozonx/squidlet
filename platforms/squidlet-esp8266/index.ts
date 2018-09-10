import System from '../../host/src/app/System';


export default async function (): Promise<System> {
  const system: System = new System();

  // TODO: add devs
  await system.$registerDevs({});

  return system;
}
