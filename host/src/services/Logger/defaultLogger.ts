export function debug(message: string) {
  console.info(message);
}

export function verbose(message: string) {
  console.log(message);
}

export function info(message: string) {
  console.info(message);
}

export function warn(message: string) {
  console.warn(message);
}

export function error(message: string) {
  console.error(message);
}

export function fatal(message: string) {
  console.error(message);
  process.exit(2);
}
