export const SAVE_FILE_CHANNEL = 'file:save'

export interface SaveFileFilter {
    name: string
    extensions: string[]
}

export interface SaveFileRequest {
    data: Uint8Array
    defaultName: string
    filters: SaveFileFilter[]
}

export interface SaveFileResult {
    ok: boolean
    path?: string
    canceled?: boolean
    error?: string
}