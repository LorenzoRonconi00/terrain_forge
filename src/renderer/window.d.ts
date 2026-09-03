declare global {
    interface Window {
        api: {
            saveFile(request: {
                data: Uint8Array
                defaultName: string
                filters: { name: string; extensions: string[] }[]
            }): Promise<{
                ok: boolean
                path?: string
                canceled?: boolean
                error?: string
            }>
        }
    }
}

export { }