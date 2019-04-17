export default interface Dev {
  init?: () => void;
  configure?: (params: {[index: string]: any}) => void;
  [index: string]: any;
}
