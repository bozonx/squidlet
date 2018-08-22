import Configurator from '../Configurator';


export default interface Plugin {
  (configurator: Configurator): void;
}
