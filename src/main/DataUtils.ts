import fs from 'fs';
import { Har } from 'har-format';
import { getHistoricalHarsStorage, getGeneratedRandomId } from './Storage';
import crypto from 'crypto';

function getHash(fileName: string, content: string){
  return crypto
    .createHash('md5')
    .update(fileName + content)
    .digest('hex');
}

export type HistoryHar = {
  id: string;
  filePath: string;
  created: number;
  updated: number;
  revisions: HarRevision[];
};

export type PartialHistoryHar = HistoryHar & {
  id?: string;
};

export type HarRevision = {
  revisionId: string;
  content: string;
};

const DataUtils = {
  getHarFromFile: async (filePath: string, revisionId: string = '') => {

    if(!revisionId){
      // get from live file
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Har;
    } else {
      // here we attempt to get the har content from our backup with the revision id
      try{
        const historicalHarStorage = await getHistoricalHarsStorage();
        const id = filePath;

        const historicalHarEntry = historicalHarStorage.get(id);
        return historicalHarEntry?.revisions?.find(
          (revision) => revision.revisionId === revisionId
        )?.content;
      } catch(err){
      }
    }

    return undefined;
  },
  getHarRevisions:async (filePath: string) => {
    try{
        const historicalHarStorage = await getHistoricalHarsStorage();
        const id = filePath;

        const historicalHarEntry = historicalHarStorage.get(id);
        return historicalHarEntry?.revisions || [];
      } catch(err){}

      return []
  },
  getHistoricalHars: async () => {
    try {
      const historicalHarStorage = await getHistoricalHarsStorage();
      const resp =  historicalHarStorage.list();
      return resp;
    } catch (err) {
      return [];
    }
  },
  addHistoricalHar: async (filePath: string, content: string) => {
    try {
      const historicalHarStorage = await getHistoricalHarsStorage();
      const id = filePath;

      let historicalHarEntry = historicalHarStorage.get(id);
      const revisionId = getHash(filePath, JSON.stringify(content));


      if (!historicalHarEntry) {
        historicalHarEntry ={
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
        for(const revision of historicalHarEntry.revisions){
          if(revision.revisionId === revisionId){
            return;
          }
        }

        // let's update the content
        historicalHarEntry.revisions.push({
          revisionId,
          content,
          created: Date.now(),
          updated: Date.now(),
        })

        historicalHarEntry.updated = Date.now();
      }

      await historicalHarStorage.update(historicalHarEntry);
    } catch (err) {
    }
  },
  deleteHistoricalHars: async (id: string) => {
    try {
      const historicalHarStorage = await getHistoricalHarsStorage();
      return historicalHarStorage.delete(id);
    } catch (err) {
    }
  },
};

export default DataUtils
