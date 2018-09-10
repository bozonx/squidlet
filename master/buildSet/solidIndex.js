var hostConfigSet = global.__HOST_CONFIG_SET;
var ConfigSetManagerClass = global.__HOST_CONFIG_SET_MANAGER;
var SystemClass = global.__SYSTEM_CLASS;
var system = new SystemClass();
var configSetManager = new ConfigSetManagerClass(hostConfigSet);
system.registerConfigSetManager(configSetManager);
system.start();
