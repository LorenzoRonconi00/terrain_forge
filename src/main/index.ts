import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SAVE_FILE_CHANNEL, type SaveFileRequest, type SaveFileResult } from '../shared/ipc'

function createWindow(): void {
    const window = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#1a1a1f',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })

    window.on('ready-to-show', () => {
        window.show()
    })

    window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (process.env.ELECTRON_RENDERER_URL) {
        window.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
        window.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

function registerIpcHandlers(): void {
    ipcMain.handle(
        SAVE_FILE_CHANNEL,
        async (event, request: SaveFileRequest): Promise<SaveFileResult> => {
            const senderWindow = BrowserWindow.fromWebContents(event.sender)
            const options = { defaultPath: request.defaultName, filters: request.filters }
            const { canceled, filePath } = senderWindow
                ? await dialog.showSaveDialog(senderWindow, options)
                : await dialog.showSaveDialog(options)

            if (canceled || !filePath) {
                return { ok: false, canceled: true }
            }

            try {
                await writeFile(filePath, request.data)
                return { ok: true, path: filePath }
            } catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) }
            }
        }
    )
}

app.whenReady().then(() => {
    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})