async function index () {
  const updaterConfig = global.__UPDATER_CONFIG;
  const UpdaterClass = global.__UPDATER_CLASS;

  const updater = new UpdaterClass(updaterConfig);

  // update if need
  await updater.start();

  // after that you have fresh system and config

  //const ConfigSetManagerClass = global.__HOST_CONFIG_SET_MANAGER;
  const SystemClass = await updater.loadSystemClass();
  // TODO: config set manager должен быть вбилжен в сборку system
  const system = new SystemClass();
  //const configSetManager = new ConfigSetManagerClass();

  //system.$registerConfigSetManager(configSetManager);

  system.start();
}

index()
  .catch((err) => {
    console.error(err.toString())
  });
