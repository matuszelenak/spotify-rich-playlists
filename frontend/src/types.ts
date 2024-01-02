export type TrackRow = {
    index: number,
    name: string,
    artists: string,
    album: string,
    duration: number,
    previewUrl: string | null,
    trackUri: string,
    tempoData: {
        extracted: number | null,
        spotify: number,
        manual: number | null
    },
    id: string
    energy: number
}

export type WsMessageEvent = {
    event: 'tempoExtracted' | 'placeHolder'
}

export type EventTempoExtracted = WsMessageEvent & {
    data: {
        [key: string]: {
            extracted: number | null,
            manual: number | null
        }
    }
}