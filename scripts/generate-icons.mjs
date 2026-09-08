import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size)
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paint(x, y, size) {
  const nx = (x + 0.5) / size
  const ny = (y + 0.5) / size
  const bg = [215, 224, 230, 255]
  const pathY = 0.66 + 0.08 * Math.sin(nx * Math.PI * 2)
  const onPath = Math.abs(ny - pathY) < 0.035 && nx > 0.12 && nx < 0.88
  const pillCx = 0.5
  const pillCy = 0.38
  const pillDx = (nx - pillCx) / 0.18
  const pillDy = (ny - pillCy) / 0.09
  const inPill = pillDx * pillDx + pillDy * pillDy <= 1
  const rightHalf = nx > 0.5

  if (inPill && rightHalf) return [201, 194, 214, 255]
  if (inPill) return [141, 132, 163, 255]
  if (onPath) return [110, 136, 150, 255]
  return bg
}

for (const size of [192, 512]) {
  writeFileSync(join(root, `pwa-${size}.png`), png(size, paint))
}

console.log('Wrote PWA icons')
