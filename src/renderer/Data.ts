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
