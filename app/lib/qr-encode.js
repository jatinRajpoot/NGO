// Pure-JS ISO/IEC 18004 QR Code encoder (Byte mode, Error Correction Level M, Versions 1-12).
// Produces a deterministic boolean matrix with zero external dependencies or network requests.

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(data.length + ecLen);
  res.set(data);
  for (let i = 0; i < data.length; i += 1) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j += 1) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// Version specs for Error Correction Level M:
// { version, dataCodewords, ecPerBlock, groups: [[count, dataPerBlock], ...], alignment: number[] }
const VERSION_SPECS_M = [
  null,
  { version: 1, dataCodewords: 16, ecPerBlock: 10, groups: [[1, 16]], alignment: [] },
  { version: 2, dataCodewords: 28, ecPerBlock: 16, groups: [[1, 28]], alignment: [6, 18] },
  { version: 3, dataCodewords: 44, ecPerBlock: 26, groups: [[1, 44]], alignment: [6, 22] },
  { version: 4, dataCodewords: 64, ecPerBlock: 18, groups: [[2, 32]], alignment: [6, 26] },
  { version: 5, dataCodewords: 86, ecPerBlock: 24, groups: [[2, 43]], alignment: [6, 30] },
  { version: 6, dataCodewords: 108, ecPerBlock: 16, groups: [[4, 27]], alignment: [6, 34] },
  { version: 7, dataCodewords: 124, ecPerBlock: 18, groups: [[4, 31]], alignment: [6, 22, 38] },
  { version: 8, dataCodewords: 154, ecPerBlock: 22, groups: [[2, 38], [2, 39]], alignment: [6, 24, 42] },
  { version: 9, dataCodewords: 182, ecPerBlock: 22, groups: [[3, 36], [2, 37]], alignment: [6, 26, 46] },
  { version: 10, dataCodewords: 216, ecPerBlock: 26, groups: [[4, 43], [1, 44]], alignment: [6, 28, 50] },
  { version: 11, dataCodewords: 254, ecPerBlock: 30, groups: [[1, 50], [4, 51]], alignment: [6, 30, 54] },
  { version: 12, dataCodewords: 290, ecPerBlock: 22, groups: [[6, 36], [2, 37]], alignment: [6, 32, 58] },
];

function selectVersion(byteLength) {
  for (let v = 1; v < VERSION_SPECS_M.length; v += 1) {
    const spec = VERSION_SPECS_M[v];
    const ccBits = v >= 10 ? 16 : 8;
    const capacityBits = spec.dataCodewords * 8;
    if (4 + ccBits + byteLength * 8 <= capacityBits) {
      return spec;
    }
  }
  return null;
}

function encodeCodewords(bytes, spec) {
  const bits = [];
  const pushBits = (val, count) => {
    for (let i = count - 1; i >= 0; i -= 1) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100) + character count
  pushBits(0b0100, 4);
  pushBits(bytes.length, spec.version >= 10 ? 16 : 8);
  for (const b of bytes) {
    pushBits(b, 8);
  }

  const maxBits = spec.dataCodewords * 8;
  const termBits = Math.min(4, maxBits - bits.length);
  pushBits(0, termBits);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j += 1) {
      byteVal = (byteVal << 1) | bits[i + j];
    }
    data.push(byteVal);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (data.length < spec.dataCodewords) {
    data.push(padBytes[padIdx % 2]);
    padIdx += 1;
  }

  // Split into RS blocks
  const blocks = [];
  let offset = 0;
  for (const [count, blockDataLen] of spec.groups) {
    for (let i = 0; i < count; i += 1) {
      const slice = Uint8Array.from(data.slice(offset, offset + blockDataLen));
      offset += blockDataLen;
      const ec = rsRemainder(slice, spec.ecPerBlock);
      blocks.push({ data: slice, ec });
    }
  }

  const interleaved = [];
  const maxDataLen = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxDataLen; i += 1) {
    for (const block of blocks) {
      if (i < block.data.length) interleaved.push(block.data[i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (const block of blocks) {
      interleaved.push(block.ec[i]);
    }
  }
  return interleaved;
}

function computeFormatBits(mask) {
  // EC Level M = 00
  const data = (0b00 << 3) | mask;
  let rem = data << 10;
  const poly = 0x537;
  for (let i = 14; i >= 10; i -= 1) {
    if ((rem >>> i) & 1) {
      rem ^= poly << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionBits(version) {
  let rem = version << 12;
  const poly = 0x1f25;
  for (let i = 17; i >= 12; i -= 1) {
    if ((rem >>> i) & 1) {
      rem ^= poly << (i - 12);
    }
  }
  return (version << 12) | rem;
}

function createMatrix(spec) {
  const size = spec.version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Uint8Array(size));
  const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

  const setFunc = (r, c, dark) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark ? 1 : 0;
      isFunc[r][c] = 1;
    }
  };

  const drawFinder = (topR, leftC) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r, c, inOuter && (onBorder || inCenter));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const centers = spec.alignment;
  for (const cr of centers) {
    for (const cc of centers) {
      if (isFunc[cr][cc]) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setFunc(cr + dr, cc + dc, isEdge || isCenter);
        }
      }
    }
  }

  // Dark module
  setFunc(spec.version * 4 + 9, 8, true);

  // Reserve format info cells
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    setFunc(8, size - 1 - i, false);
    setFunc(size - 1 - i, 8, false);
  }

  // Version info (V7+)
  if (spec.version >= 7) {
    const vBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i += 1) {
      const bit = ((vBits >>> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = size - 11 + (i % 3);
      setFunc(a, b, bit);
      setFunc(b, a, bit);
    }
  }

  return { size, modules, isFunc, setFunc };
}

function applyMaskPattern(mask, r, c) {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function penaltyScore(modules, size) {
  let score = 0;

  // Rule 1: 5+ consecutive same-color modules in row/col
  for (let r = 0; r < size; r += 1) {
    let runColor = modules[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c += 1) {
      if (modules[r][c] === runColor) {
        runLen += 1;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }
  for (let c = 0; c < size; c += 1) {
    let runColor = modules[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r += 1) {
      if (modules[r][c] === runColor) {
        runLen += 1;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 3: 1:1:3:1:1 patterns
  const matchFinderPattern = (line) => {
    let count = 0;
    for (let i = 0; i <= line.length - 11; i += 1) {
      if (
        line[i] === 1 && line[i + 1] === 0 && line[i + 2] === 1 && line[i + 3] === 1 &&
        line[i + 4] === 1 && line[i + 5] === 0 && line[i + 6] === 1 &&
        line[i + 7] === 0 && line[i + 8] === 0 && line[i + 9] === 0 && line[i + 10] === 0
      ) count += 1;
      if (
        line[i] === 0 && line[i + 1] === 0 && line[i + 2] === 0 && line[i + 3] === 0 &&
        line[i + 4] === 1 && line[i + 5] === 0 && line[i + 6] === 1 && line[i + 7] === 1 &&
        line[i + 8] === 1 && line[i + 9] === 0 && line[i + 10] === 1
      ) count += 1;
    }
    return count;
  };
  for (let r = 0; r < size; r += 1) {
    score += 40 * matchFinderPattern(modules[r]);
  }
  for (let c = 0; c < size; c += 1) {
    const col = new Uint8Array(size);
    for (let r = 0; r < size; r += 1) col[r] = modules[r][c];
    score += 40 * matchFinderPattern(col);
  }

  // Rule 4: Balance of dark modules
  let darkCount = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (modules[r][c] === 1) darkCount += 1;
    }
  }
  const percent = (darkCount * 100) / (size * size);
  const k = Math.floor(Math.abs(percent - 50) / 5);
  score += k * 10;

  return score;
}

function writeFormatInfo(modules, size, mask) {
  const bits = computeFormatBits(mask);
  for (let i = 0; i < 15; i += 1) {
    // ISO 18004 places bit 14 (MSB) at index i=0 and bit 0 (LSB) at index i=14.
    const dark = ((bits >>> (14 - i)) & 1) === 1 ? 1 : 0;
    // Copy 1 (top-left)
    if (i < 6) modules[8][i] = dark;
    else if (i < 8) modules[8][i + 1] = dark;
    else if (i === 8) modules[7][8] = dark;
    else modules[14 - i][8] = dark;

    // Copy 2 (bottom-left & top-right)
    if (i < 7) modules[size - 1 - i][8] = dark;
    else modules[8][size - 15 + i] = dark;
  }
}

export function encodeQrMatrix(text) {
  const input = typeof text === 'string' ? text : String(text || '');
  const bytes = new TextEncoder().encode(input);
  const spec = selectVersion(bytes.length);
  if (!spec) {
    throw new Error('QR payload exceeds supported capacity');
  }

  const codewords = encodeCodewords(bytes, spec);
  const { size, modules: baseModules, isFunc } = createMatrix(spec);

  // Place data bits in zig-zag order
  const dataBits = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b -= 1) {
      dataBits.push((cw >>> b) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      const r = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc += 1) {
        const c = right - dc;
        if (!isFunc[r][c]) {
          baseModules[r][c] = bitIdx < dataBits.length ? dataBits[bitIdx] : 0;
          bitIdx += 1;
        }
      }
    }
    upward = !upward;
  }

  // Choose lowest-penalty mask
  let bestModules = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = baseModules.map((row) => Uint8Array.from(row));
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!isFunc[r][c] && applyMaskPattern(mask, r, c)) {
          candidate[r][c] ^= 1;
        }
      }
    }
    writeFormatInfo(candidate, size, mask);
    const score = penaltyScore(candidate, size);
    if (score < bestScore) {
      bestScore = score;
      bestModules = candidate;
    }
  }

  return {
    version: spec.version,
    size,
    modules: bestModules.map((row) => Array.from(row, (v) => v === 1)),
  };
}
