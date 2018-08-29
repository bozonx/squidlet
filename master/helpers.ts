
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
