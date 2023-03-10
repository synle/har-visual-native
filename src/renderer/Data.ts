import { Har } from 'har-format';

export async function getHarContent(fileName: string) {
  return new Promise<Har>((resolve, reject) => {
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once('ipc-get-har', (arg) => {
      // eslint-disable-next-line no-console
      if (arg) {
        resolve(arg as Har);
      } else {
        reject();
      }
    });
    window.electron.ipcRenderer.sendMessage('ipc-get-har', [fileName]);
  });
}

export async function browseHarFile(){
  return new Promise<string>((resolve, reject) => {
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once('ipc-dialog-browseHar', (arg) => {
      // eslint-disable-next-line no-console
      if (arg) {
        resolve(arg as string);
      } else {
        reject();
      }
    });
    window.electron.ipcRenderer.sendMessage('ipc-dialog-browseHar', []);
  });

}
