// index file of solid build


function index () {
  const hostConfigSet = global.__HOST_CONFIG_SET;
  const ConfigSetManagerClass = global.__HOST_CONFIG_SET_MANAGER;
  const SystemClass = global.__SYSTEM_CLASS;
  const system = new SystemClass();
  const configSetManager = new ConfigSetManagerClass(hostConfigSet);

  system.registerConfigSetManager(configSetManager);

  system.start();
}

index()
  .catch((err) => {
    console.error(err.toString())
  });
