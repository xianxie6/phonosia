/** Returns a minimal valid 44-byte WAV buffer with 16 kHz sample rate. */
export function makeWavBuffer(): Buffer {
  const buf = Buffer.alloc(44)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(36, 4)           // chunk size
  buf.write('WAVE', 8, 'ascii')
  buf.write('fmt ', 12, 'ascii')
  buf.writeUInt32LE(16, 16)          // subchunk1 size
  buf.writeUInt16LE(1, 20)           // PCM
  buf.writeUInt16LE(1, 22)           // mono
  buf.writeUInt32LE(16000, 24)       // sample rate = 16 kHz
  buf.writeUInt32LE(32000, 28)       // byte rate
  buf.writeUInt16LE(2, 32)           // block align
  buf.writeUInt16LE(16, 34)          // bits per sample
  buf.write('data', 36, 'ascii')
  buf.writeUInt32LE(0, 40)           // data chunk size
  return buf
}

/** Returns a multipart body and content-type for audio upload. */
export function buildAudioMultipart(
  wavBuf: Buffer,
  referenceText: string,
  spiritId: number,
): { body: Buffer; contentType: string } {
  const boundary = 'TestBoundary12345'

  const field = (name: string, value: string) =>
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    )

  const filePart = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
    ),
    wavBuf,
    Buffer.from('\r\n'),
  ])

  const body = Buffer.concat([
    field('referenceText', referenceText),
    field('spiritId', String(spiritId)),
    filePart,
    Buffer.from(`--${boundary}--\r\n`),
  ])

  return { body, contentType: `multipart/form-data; boundary=${boundary}` }
}
