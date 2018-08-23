import Manager from '../Manager';


export default interface Plugin {
  (manager: Manager): void;
}
