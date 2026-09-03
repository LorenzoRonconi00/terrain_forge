import { contextBridge, ipcRenderer } from 'electron'
import { SAVE_FILE_CHANNEL, type SaveFileRequest, type SaveFileResult } from '../shared/ipc'

contextBridge.exposeInMainWorld('api', {
    saveFile: (request: SaveFileRequest): Promise<SaveFileResult> =>
        ipcRenderer.invoke(SAVE_FILE_CHANNEL, request)
})