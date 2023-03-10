import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import {HistoryHar} from './DataUtils'
import crypto from 'crypto';

export function getGeneratedRandomId(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(
    Math.random() * 10000000000000000
  )}`;
}

export function getHash(fileName: string, content: string) {
  return crypto
    .createHash('md5')
    .update(fileName + content)
    .digest('hex');
}



const homedir = require('os').homedir();

// this section of the api is caches in memory
type StorageContent = {
  [index: string]: any;
};

type StorageEntry = {
  id: string;
  [index: string]: any;
};

let baseDir: string;
try {
  // electron path
  baseDir = path.join(app.getPath('appData'), 'har-visual-native');
  fs.mkdirSync(baseDir);
} catch (err) {}

export const storageDir = baseDir;

export class PersistentStorage<T extends StorageEntry> {
  instanceId: string;
  name: string;
  storageLocation: string;

  constructor(instanceId: string, name: string, storageLocation?: string) {
    this.instanceId = instanceId;
    this.name = name;
    if (storageLocation) {
      this.storageLocation = path.join(baseDir, `${storageLocation}.json`);
    } else {
      this.storageLocation = path.join(
        baseDir,
        `${this.instanceId}.${this.name}.json`
      );
    }
  }

  private getData(): StorageContent {
    try {
      return JSON.parse(
        fs
          .readFileSync(this.storageLocation, { encoding: 'utf8', flag: 'r' })
          .trim()
      );
    } catch (err) {
      return {};
    }
  }

  private setData(toSave: StorageContent) {
    fs.writeFileSync(this.storageLocation, JSON.stringify(toSave, null, 2));
  }

  add<K>(entry: K): T {
    const newId = getGeneratedRandomId(`${this.name}`);

    const caches = this.getData();
    caches[newId] = {
      id: newId,
      ...entry,
    };

    this.setData(caches);

    return caches[newId];
  }

  update(entry: T): T {
    const caches = this.getData();
    caches[entry.id] = {
      ...caches[entry.id],
      ...entry,
    };

    this.setData(caches);

    return caches[entry.id];
  }

  set(entries: T[]): T[] {
    const caches: StorageContent = {};

    for (const entry of entries) {
      caches[entry.id] = entry;
    }

    this.setData(caches);

    return entries;
  }

  list(): T[] {
    const caches = this.getData();
    return Object.values(caches);
  }

  get(id: string): T {
    const caches = this.getData();
    return caches[id];
  }

  delete(id: string) {
    const caches = this.getData();
    delete caches[id];
    this.setData(caches);
  }
}

export default PersistentStorage;

export async function getHistoricalHarsStorage() {
  return await new PersistentStorage<HistoryHar>('hars', 'historical');
}
