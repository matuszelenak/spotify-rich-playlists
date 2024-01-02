const express = require('express')
const cors = require('cors')
const expressWsImport = require('express-ws');
const AudioContext = require("web-audio-api").AudioContext;
const MusicTempo = require("music-tempo");
const Bottleneck = require("bottleneck/es5");
const PrismaClient = require("@prisma/client").PrismaClient
const _ = require("lodash");

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
app.use(express.json());

app.ws('/ws', function (ws, req) {
    ws.on('message', async (msg) => {
        const messageJson = JSON.parse(msg)
        if (messageJson.event === 'extractTempo') {
            const existing = await prisma.spotifySongTempo.findMany({where: {id: {in: Object.keys(messageJson.data)}}})
            if (existing.length > 0) {
                ws.send(JSON.stringify({
                    event: "tempoExtracted",
                    data: Object.fromEntries(existing.map(instance => [instance.id, ({
                        extracted: instance.source === 'extracted' ? instance.tempo.toFixed(0) : null,
                        manual: instance.source === 'manual' ? instance.tempo.toFixed(0) : null
                    })]))
                }))
            }

            const existingIds = existing.map((instance) => instance.id)
            const [processed, toProcess] = _.partition(Object.entries(messageJson.data), ([id, url]) => {
                return existingIds.includes(id)
            })

            for (const [id, previewUrl] of toProcess) {
                if (!previewUrl) continue
                await limiter.schedule(async () => {
                    await extractTempo(previewUrl, async (tempo) => {
                        try {
                            await prisma.spotifySongTempo.create({
                                data: {id: id, tempo: tempo, source: 'extracted'}
                            })
                        } catch (e) {

                        }
                        await ws.send(JSON.stringify({
                            event: "tempoExtracted",
                            data: {[id]: {extracted: tempo.toFixed(0)}}
                        }))
                    })
                });
            }
        }
    });
});

const extractTempo = async (previewUrl, callback) => {
    console.log(`Extracting tempo for ${previewUrl}`)
    const audioResponse = await fetch(previewUrl).catch((reason) => {
        //console.log(reason)
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

app.post('/bpm-override/:songId', async (req, res) => {
    const existing = await prisma.spotifySongTempo.upsert({
        where: {songId: {id: req.params.songId, source: 'manual'}},
        update: {tempo: req.body.tempo},
        create: {tempo: req.body.tempo, id: req.params.songId, source: 'manual'}
    })

    res.send({status: existing})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
