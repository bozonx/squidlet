export function isAbsoluteFileName(fileName: string): boolean {
  return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
}

export function sortByIncludeInList(items: string[], searchList: string[]): [string[], string[]] {
  const included: string[] = [];
  const notIncluded: string[] = [];

  for (let serviceName of searchList) {
    if (items.indexOf(serviceName) >= 0) {
      included.push(serviceName);
    }
    else {
      notIncluded.push(serviceName);
    }
  }

  return [
    included,
    notIncluded,
  ];
}
