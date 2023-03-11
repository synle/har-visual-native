import { Har } from 'har-format';
import { type HistoryHar, type HarRevision } from '../main/DataUtils';

export async function browseHarFile() {
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-dialog-har-browse', []);

    window.electron.ipcRenderer.once('ipc-dialog-har-browse', (arg) => {
      console.log('ipc-dialog-har-browse', arg);

      if (arg) {
        resolve(arg as string);
      } else {
        reject();
      }
    });
  });
}

// har content
export async function getHarContent(fileName: string, revisionId = '') {
  return new Promise<Har>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-get-har-content', [
      fileName,
      revisionId,
    ]);

    window.electron.ipcRenderer.once('ipc-get-har-content', (arg) => {
      console.log('ipc-get-har-content', fileName, arg);

      if (arg) {
        resolve(arg as Har);
      } else {
        reject();
      }
    });
  });
}

export async function getHarRevisions(fileName: string) {
  return new Promise<HarRevision[]>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-get-har-revisions', [
      fileName,
    ]);

    window.electron.ipcRenderer.once('ipc-get-har-revisions', (arg) => {
      console.log('ipc-get-har-revisions', fileName, arg);

      if (arg) {
        resolve(arg as HarRevision[]);
      } else {
        reject();
      }
    });
  });
}

// historical api
export async function getHistoricalHars() {
  return new Promise<HistoryHar[]>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-get-historical-hars', []);

    window.electron.ipcRenderer.once('ipc-get-historical-hars', (arg) => {
      console.log('ipc-get-historical-hars', arg);

      if (arg) {
        resolve(arg as HistoryHar[]);
      } else {
        reject();
      }
    });
  });
}

export async function addHistoricalHar(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-add-historical-har', [
      filePath,
    ]);

    window.electron.ipcRenderer.once('ipc-add-historical-har', (arg) => {
      console.log('ipc-add-historical-har', arg);

      if (arg) {
        resolve();
      } else {
        reject();
      }
    });
  });
}


// reveal config path
export async function revealDefaultStorageFolder() {
  window.electron.ipcRenderer.sendMessage('ipc-reveal-config-folder', []);
}

export async function revealFolder(filePath: string) {
  window.electron.ipcRenderer.sendMessage('ipc-reveal-filepath', [filePath]);
}
