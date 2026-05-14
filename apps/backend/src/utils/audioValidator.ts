const MAX_SIZE = 2 * 1024 * 1024

export function validateWavBuffer(buf: Buffer): { valid: boolean; error?: string } {
  if (buf.length > MAX_SIZE) {
    return { valid: false, error: '文件大小不能超过2MB' }
  }
  if (buf.length < 44) {
    return { valid: false, error: '无效的WAV文件（文件过小）' }
  }
  if (buf.toString('ascii', 0, 4) !== 'RIFF') {
    return { valid: false, error: '无效的WAV文件（缺少RIFF头）' }
  }
  if (buf.toString('ascii', 8, 12) !== 'WAVE') {
    return { valid: false, error: '无效的WAV文件（缺少WAVE标识）' }
  }
  const sampleRate = buf.readUInt32LE(24)
  if (sampleRate !== 16000) {
    return { valid: false, error: `采样率必须为16000Hz（当前：${sampleRate}Hz）` }
  }
  return { valid: true }
}
