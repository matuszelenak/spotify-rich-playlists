const express = require('express')
const AudioContext = require("web-audio-api").AudioContext;
const MusicTempo = require("music-tempo");

const app = express()
const port = 4000
const context = new AudioContext({sampleRate: 44100});

app.get('/bpm', async (req, res) => {
    const previewUrl = req.query.preview_url;

    const audioResponse = await fetch(previewUrl);
    const audioBuffer = await audioResponse.arrayBuffer()
    return await context.decodeAudioData(audioBuffer, (buffer) => {
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
        res.send({bpm: mt.tempo})
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
