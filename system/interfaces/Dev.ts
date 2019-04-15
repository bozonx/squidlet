export default interface Dev {
  init?: () => void;
  [index: string]: any;
}
