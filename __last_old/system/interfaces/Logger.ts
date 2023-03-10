export default interface Logger {
  debug: (message: string) => void;
  //verbose: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}
