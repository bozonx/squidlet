export type IoItemClass = new () => IoItem;


export default interface IoItem {
  init?: () => Promise<void>;
  configure?: (params: {[index: string]: any}) => Promise<void>;
  [index: string]: any;
}
