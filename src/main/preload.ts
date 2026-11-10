import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { createElectronClient } from '../shared/ipc-bridge';
import type { IElectronAPI } from '../shared/types';

const client = createElectronClient(ipcRenderer);

const electronAPI: IElectronAPI = {
  ...client,
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_: any, isMax: boolean) => callback(isMax);
    ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGE, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGE, listener);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
