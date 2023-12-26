const express = require('express')
const cors = require('cors')
const expressWsImport = require('express-ws');
const AudioContext = require("web-audio-api").AudioContext;
const MusicTempo = require("music-tempo");
const Bottleneck = require("bottleneck/es5");
const PrismaClient = require("@prisma/client").PrismaClient

const expressWs = expressWsImport(express());
const app = expressWs.app;
const port = 4000
const context = new AudioContext({sampleRate:    44100});
const prisma = new PrismaClient()

const limiter = new Bottleneck({
    minTime: 333,
    maxConcurrent: 1
});

app.use(cors())

app.ws('/ws', function (ws, req) {
    ws.on('message', async (msg) => {
        const parsed = JSON.parse(msg)
        if (parsed.action === 'extractTempo') {
            const existing = await prisma.spotifySongTempo.findFirst({where: {id: parsed.id}})
            if (existing) {
                ws.send(JSON.stringify({
                    id: parsed.id,
                    previewUrl: parsed.previewUrl,
                    tempo: existing.tempo.toFixed(0)
                }))
            } else {
                await limiter.schedule(async () => {
                    await extractTempo(parsed.previewUrl, async (tempo) => {
                        await prisma.spotifySongTempo.create({
                            data: {id: parsed.id, tempo: tempo}
                        })
                        await ws.send(JSON.stringify({
                            id: parsed.id,
                            previewUrl: parsed.previewUrl,
                            tempo: tempo.toFixed(0)
                        }))
                    })
                });
            }
        }
    });
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const resp = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${process.env.SPOTIFY_BASIC_AUTH}`
            },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': `${process.env.FRONTEND_URL}/spotify-auth-callback`
            })
        }
    )
    res.send(
        await resp.json()
    )
})

app.get('/refresh-token', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    const resp = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${process.env.SPOTIFY_BASIC_AUTH}`
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
            })
        }
    )
    res.send(
        await resp.json()
    )
})

const extractTempo = async (previewUrl, callback) => {
    console.log(`Extracting tempo for ${previewUrl}`)
    const audioResponse = await fetch(previewUrl).catch((reason) => {
        console.log(reason)
    });
    await context.decodeAudioData(await audioResponse.arrayBuffer(), (buffer) => {
        let audioData = [];
        if (buffer.numberOfChannels === 2) {
            const channel1Data = buffer.getChannelData(0);
            const channel2Data = buffer.getChannelData(1);
            const length = channel1Data.length;
            for (let i = 0; i < length; i++) {
                audioData[i] = (channel1Data[i] + channel2Data[i]) / 2;
            }
        } else {
            audioData = buffer.getChannelData(0);
        }
        const mt = new MusicTempo(audioData);
        callback(parseFloat(mt.tempo))
    })
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
