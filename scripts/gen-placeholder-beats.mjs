import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'beats')

function writePcm16WavMono(filePath, durationSec, sampleRate) {
  const numChannels = 1
  const bitsPerSample = 16
  const blockAlign = (numChannels * bitsPerSample) / 8
  const numSamples = Math.floor(durationSec * sampleRate)
  const dataSize = numSamples * blockAlign
  const buf = Buffer.alloc(44 + dataSize)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(numChannels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * blockAlign, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  fs.writeFileSync(filePath, buf)
}

fs.mkdirSync(outDir, { recursive: true })

const sr = 44100
const beats = [
  { file: 'stub-90.wav', bpm: 90 },
  { file: 'stub-100.wav', bpm: 100 },
  { file: 'stub-110.wav', bpm: 110 },
  { file: 'stub-120.wav', bpm: 120 },
]

for (const b of beats) {
  const barSec = (60 / b.bpm) * 4
  writePcm16WavMono(path.join(outDir, b.file), barSec, sr)
}

const manifest = {
  notes: 'TODO: echte Beats vom User produziert einfügen',
  beats: [
    {
      id: 'stub-90',
      title: 'Placeholder 90',
      bpm: 90,
      key: 'C',
      file: 'stub-90.wav',
      cover: 'cover-placeholder.svg',
      length: (60 / 90) * 4,
    },
    {
      id: 'stub-100',
      title: 'Placeholder 100',
      bpm: 100,
      key: 'D',
      file: 'stub-100.wav',
      cover: 'cover-placeholder.svg',
      length: (60 / 100) * 4,
    },
    {
      id: 'stub-110',
      title: 'Placeholder 110',
      bpm: 110,
      key: 'E',
      file: 'stub-110.wav',
      cover: 'cover-placeholder.svg',
      length: (60 / 110) * 4,
    },
    {
      id: 'stub-120',
      title: 'Placeholder 120',
      bpm: 120,
      key: 'F',
      file: 'stub-120.wav',
      cover: 'cover-placeholder.svg',
      length: (60 / 120) * 4,
    },
  ],
}

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(manifest, null, 2))

console.log('Wrote placeholder beats to', outDir)
