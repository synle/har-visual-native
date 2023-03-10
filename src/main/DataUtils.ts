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
  getHarFromFile: async (filePath: string, revisionId: string = '') => {
    if(!revisionId){
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Har;
    } else {
      try{
        const historicalHarStorage = await getHistoricalHarsStorage();
        const id = filePath;

        const historicalHarEntry = historicalHarStorage.get(id);
        return historicalHarEntry?.revisions?.find(revision => revision.id === revisionId)?.content;
      } catch(err){}
    }
  },
  getHarRevisions:(filePath: string) => {
    try{
        const historicalHarStorage = await getHistoricalHarsStorage();
        const id = filePath;

        const historicalHarEntry = historicalHarStorage.get(id);
        return historicalHarEntry?.revisions?.map(revision => revision.id) || [];
      } catch(err){}

      return []
  },
  getHistoricalHars: async () => {
    try {
      const historicalHarStorage = await getHistoricalHarsStorage();
      const resp =  historicalHarStorage.list();
      console.log('resp', resp);
      return resp;
    } catch (err) {
      return [];
    }
  },
  addHistoricalHars: async (filePath: string, content: string) => {
    try {
      const historicalHarStorage = await getHistoricalHarsStorage();
      const id = filePath;

      let historicalHarEntry = historicalHarStorage.get(id);
      const revisionId = getHash(content);

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
      console.log('err', err)
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
