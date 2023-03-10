import fs from 'fs';
import { Har } from 'har-format';
import { getHistoricalHarsStorage, getGeneratedRandomId } from './Storage';

function getHash(content: string){
  return content.length; // let's do the hash here
}

export type HistoryHar = {
  id: string;
  filePath: string;
  created: number;
  updated: number;
  revisions: {
    revisionId: string;
    content: string;
  }[];
};

export type PartialHistoryHar = HistoryHar & {
  id?: string;
};

const DataUtils = {
  getHarFromFile: async (fileName: string) => {
    return JSON.parse(fs.readFileSync(fileName, 'utf8')) as Har;
  },
  getHistoricalHars: async () => {
    try {
      const sessionsStorage = await getHistoricalHarsStorage();
      const resp =  sessionsStorage.list();
      console.log('resp', resp);
      return resp;
    } catch (err) {
      return [];
    }
  },
  addHistoricalHars: async (filePath: string, content: string) => {
    try {
      const sessionsStorage = await getHistoricalHarsStorage();
      const id = filePath;

      let entry = sessionsStorage.get(id);
      const revisionId = getHash(content);

      if (!entry) {
        entry ={
          id,
          filePath,
          created: Date.now(),
          updated: Date.now(),
          revisions:[{
            revisionId,
            content,
            created: Date.now(),
            updated: Date.now(),
          }]
        };
      } else {
        for(const revision of entry.revisions){
          if(revision.revisionId === revisionId){
            return;
          }
        }

        // let's update the content
        entry.revisions.push({
          revisionId,
          content,
          created: Date.now(),
          updated: Date.now(),
        })

        entry.updated = Date.now();
      }

      await sessionsStorage.update(entry);
    } catch (err) {
      console.log('err', err)
    }
  },
  deleteHistoricalHars: async (id: string) => {
    try {
      const sessionsStorage = await getHistoricalHarsStorage();
      return sessionsStorage.delete(id);
    } catch (err) {
    }
  },
};

export default DataUtils
