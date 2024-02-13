import expressWsImport from "express-ws";
import express from "express";
// @ts-ignore
import MusicTempo from "music-tempo";
import _ from "lodash";
import Bottleneck from "bottleneck";
import {PrismaClient} from "@prisma/client"
// @ts-ignore
import {AudioContext} from "web-audio-api"
import cors from "cors";

const expressWs = expressWsImport(express());
const app = expressWs.app;
const port = 4000
const context = new AudioContext({sampleRate: 44100});
const prisma = new PrismaClient()

const limiter = new Bottleneck({
    minTime: 333,
    maxConcurrent: 1
});

app.use(cors())

app.ws('/ws', function (ws, req) {
    ws.on('message', async (msg) => {
        const messageJson = JSON.parse(msg.toString())
        if (messageJson.event === 'extractTempo') {
            const existing = await prisma.spotifySongTempo.findMany({where: {id: {in: Object.keys(messageJson.data)}}})
            if (existing.length > 0) {
                ws.send(JSON.stringify({
                    event: "tempoExtracted",
                    data: Object.fromEntries(existing.map(instance => [instance.id, instance.tempo.toFixed(0)]))
                }))
            }

            const existingIds = existing.map((instance) => instance.id)
            const [, toProcess] = _.partition(Object.entries(messageJson.data), ([id, url]: [string, string]) => {
                return existingIds.includes(id)
            })

            // @ts-ignore
            for (const [id, previewUrl] of toProcess) {
                if (!previewUrl) continue
                await limiter.schedule(async () => {
                    await extractTempo(previewUrl, async (tempo: number) => {
                        try {
                            await prisma.spotifySongTempo.create({
                                data: {id: id, tempo: tempo}
                            })
                        } catch (e) {

                        }
                        ws.send(JSON.stringify({
                            event: "tempoExtracted",
                            data: {[id]: tempo.toFixed(0)}
                        }))
                    })
                });
            }
        }
    });
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (code === undefined) {
        res.sendStatus(400)
    } else {
        const resp = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${process.env.SPOTIFY_BASIC_AUTH}`
                },
                body: new URLSearchParams([
                    ['grant_type', 'authorization_code'],
                    ['code', code.toString()],
                    ['redirect_uri', `${process.env.FRONTEND_URL}/spotify-auth-callback`]
                ])
            }
        )
        const j = await resp.json()
        console.log(j)
        res.send(
            j
        )
    }
})

app.get('/refresh-token', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    if (refresh_token === undefined) {
        res.sendStatus(400)
    } else {
        const resp = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${process.env.SPOTIFY_BASIC_AUTH}`
                },
                body: new URLSearchParams([
                    ['grant_type', 'refresh_token'],
                    ['refresh_token', refresh_token.toString()]
                ])
            }
        )
        res.send(
            await resp.json()
        )
    }
})



const extractTempo = async (previewUrl: string, callback: any) => {
    console.log(`Extracting tempo for ${previewUrl}`)
    const audioResponse = await fetch(previewUrl)
    await context.decodeAudioData(await audioResponse.arrayBuffer(), (buffer: AudioBuffer) => {
        let audioData = [];
        if (buffer.numberOfChannels === 2) {
            const channel1Data = buffer.getChannelData(0);
            const channel2Data = buffer.getChannelData(1);
            const length = channel1Data.length;
            for (let i = 0; i < length; i++) {
                audioData[i] = (channel1Data[i] + channel2Data[i]) / 2;
            }
        } else {
            audioData = Array.from(buffer.getChannelData(0))
        }
        const mt = new MusicTempo(audioData);
        callback(parseFloat(mt.tempo))
    })
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
