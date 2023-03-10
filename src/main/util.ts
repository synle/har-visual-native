/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';

export type HistoryHar = {
  filePath: string;
  content: string;
};

let _cache: Record<string, HistoryHar> = {};// TODO: move this into a file based

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

