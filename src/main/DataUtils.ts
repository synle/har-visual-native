import fs from 'fs';
import { Har } from 'har-format';

export type HistoryHar = {
  filePath: string;
  content: string;
};

let _cache: Record<string, HistoryHar> = {};// TODO: move this into a file based

const DataUtils = {
  getHarFromFile: async (fileName: string) => {
    return JSON.parse(fs.readFileSync(fileName, 'utf8')) as Har;
  },
  getHistoricalHars: async () => {
    return Object.values(_cache);
  },
  addHistoricalHars: async (filePath: string, content: string) => {
    _cache[filePath] = [
      {
        filePath,
        content, // here we keep the latest backup
      },
    ];
  },
  deleteHistoricalHars: async (id: string) => {
    delete _cache[fileName];
  },
};

export default DataUtils
