export function debug(message) {
  console.info(message);
}

export function verbose(message) {
  console.log(message);
}

export function info(message) {
  console.info(message);
}

export function warn(message) {
  console.warn(message);
}

export function error(message) {
  console.error(`ERROR: ${message}`);
}

export function fatal(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}
