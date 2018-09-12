
// /**
//  *
//  * @param hostId
//  */
// generateHostSet(hostId: string): HostsFilesSet {
//   // TODO: задать тип
//   // TODO: возвращает только пути файлов относительно хранилища
//   // TODO: !!!!
//   // TODO: конфиг должен валидироваться в том числе и имя платформы
//   // TODO: сгенерировать js объект с конфигами хоста и entitites
// }
// TODO: собрать конфиги и манифесты хоста в js объект
// TODO: сбилдить в память main файлв и записать в виде строки - лучше воткнуть в тело ф-и
// TODO: считать файлы сущности как есть и воткруть в объект в ??? виде строки или UInt8Array


var hostConfigSet = global.__HOST_CONFIG_SET;
var ConfigSetManagerClass = global.__HOST_CONFIG_SET_MANAGER;
var SystemClass = global.__SYSTEM_CLASS;
var system = new SystemClass();
var configSetManager = new ConfigSetManagerClass(hostConfigSet);
system.$registerConfigSetManager(configSetManager);
system.start();
