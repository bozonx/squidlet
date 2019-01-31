const SEP = '/';


export default function pathJoin (...paths: string[]): string {
  return paths.join(SEP);
}
