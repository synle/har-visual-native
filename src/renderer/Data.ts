import { Har } from 'har-format';

export async function getHarContent(fileName: string) {
  return new Promise<Har>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-get-har', [fileName]);

    window.electron.ipcRenderer.once('ipc-get-har', (arg) => {
      if (arg) {
        resolve(arg as Har);
      } else {
        reject();
      }
    });
  });
}

export async function browseHarFile(){
  return new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.sendMessage('ipc-dialog-browseHar', []);

    window.electron.ipcRenderer.once('ipc-dialog-browseHar', (arg) => {
      if (arg) {
        resolve(arg as string);
      } else {
        reject();
      }
    });
  });

}
