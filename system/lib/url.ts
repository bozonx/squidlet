import {JsonTypes} from '../interfaces/Types';


export interface ParsedUrl {
  protocol: string;
  host: string;
  port: number;
  // relative part of url e.g / or /page/
  url: string;
  search: {[index: string]: JsonTypes};
}


export function parseUrl(rawUrl: string): ParsedUrl {
  // TODO: make it
}
