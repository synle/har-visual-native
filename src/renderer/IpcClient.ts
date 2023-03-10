import { Har } from 'har-format';
import {type HistoryHar} from '../main/DataUtils';

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
export async function getHarContent(fileName: string, liveContent = true) {
  return new Promise<Har>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-get-har-content', [
      fileName,
      liveContent,
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
