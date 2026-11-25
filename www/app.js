(() => {
  'use strict';

  /* ------------------------------------------------------------------
   * Constants & Utilities
   * ------------------------------------------------------------------ */
  const DB_NAME = 'spotify_local_pwa';
  const DB_VERSION = 1;
  const DEFAULT_PALETTE = ['rgb(64, 56, 40)', 'rgb(28, 25, 20)', 'rgb(14, 14, 16)'];

  const ID3V1_GENRES = [
    'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop',
    'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae',
    'Rock', 'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks',
    'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion',
    'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip',
    'Gospel', 'Noise', 'Alt. Rock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative',
    'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave',
    'Techno-Industrial', 'Electronic', 'Pop-Folk', 'Eurodance', 'Dream',
    'Southern Rock', 'Comedy', 'Cult', 'Gangsta', 'Top 40', 'Christian Rap',
    'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave', 'Psychedelic',
    'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz',
    'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock', 'Folk', 'Folk-Rock',
    'National Folk', 'Swing', 'Fast Fusion', 'Bebop', 'Latin', 'Revival', 'Celtic',
    'Bluegrass', 'Avantgarde', 'Gothic Rock', 'Progressive Rock', 'Psychedelic Rock',
    'Symphonic Rock', 'Slow Rock', 'Big Band', 'Chorus', 'Easy Listening', 'Acoustic',
    'Humour', 'Speech', 'Chanson', 'Opera', 'Chamber Music', 'Sonata', 'Symphony',
    'Booty Bass', 'Primus', 'Porn Groove', 'Satire', 'Slow Jam', 'Club', 'Tango',
    'Samba', 'Folklore', 'Ballad', 'Power Ballad', 'Rhythmic Soul', 'Freestyle',
    'Duet', 'Punk Rock', 'Drum Solo', 'A Cappella', 'Euro-House', 'Dance Hall',
    'Goa', 'Drum & Bass', 'Club-House', 'Hardcore', 'Terror', 'Indie', 'BritPop',
    'Afropunk', 'Polsk Punk', 'Beat', 'Christian Gangsta', 'Heavy Metal',
    'Black Metal', 'Crossover', 'Contemporary Christian', 'Christian Rock',
    'Merengue', 'Salsa', 'Thrash Metal', 'Anime', 'JPop', 'Synthpop', 'Chill'
  ];

  const CATEGORY_GRADIENTS = [
    'linear-gradient(135deg, #0D9488 0%, #2563EB 100%)',
    'linear-gradient(135deg, #F97316 0%, #DB2777 100%)',
    'linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
    'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #1ED760 100%)'
  ];

  const MIX_GRADIENTS = [
    'linear-gradient(145deg, #1ED760 0%, #0D6E3B 55%, #111815 100%)',
    'linear-gradient(145deg, #F97316 0%, #BE185D 65%, #1A1016 100%)',
    'linear-gradient(145deg, #06B6D4 0%, #2563EB 65%, #101524 100%)',
    'linear-gradient(145deg, #A855F7 0%, #6D28D9 65%, #151022 100%)'
  ];

  const $ = (id) => document.getElementById(id);

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const whole = Math.floor(sec);
    const m = Math.floor(whole / 60);
    const s = whole % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cleanText(str) {
    return String(str || '').replace(/\u0000/g, '').trim();
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning!';
    if (h >= 12 && h < 18) return 'Good afternoon!';
    return 'Good evening!';
  }

  let fallbackCoverCache = null;
  function getDefaultArtworkDataUrl() {
    if (fallbackCoverCache) return fallbackCoverCache;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#27272D');
    grad.addColorStop(1, '#111114');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const glow = ctx.createRadialGradient(128, 118, 12, 128, 128, 120);
    glow.addColorStop(0, 'rgba(30, 215, 96, 0.24)');
    glow.addColorStop(1, 'rgba(30, 215, 96, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 256);

    const bars = [
      { x: 64, h: 42 },
      { x: 92, h: 92 },
      { x: 120, h: 136 },
      { x: 148, h: 102 },
      { x: 176, h: 56 }
    ];
    ctx.fillStyle = '#1ED760';
    for (const bar of bars) {
      const y = (256 - bar.h) / 2;
      const w = 16;
      const r = 8;
      ctx.beginPath();
      ctx.roundRect(bar.x, y, w, bar.h, r);
      ctx.fill();
    }
    fallbackCoverCache = canvas.toDataURL('image/png');
    return fallbackCoverCache;
  }

  /* ------------------------------------------------------------------
   * HTML5 <canvas> Dominant Color Sampler & Cover Optimizer
   * ------------------------------------------------------------------ */
  function samplePaletteFromImage(img) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 28;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 28, 28);
      const { data } = ctx.getImageData(0, 0, 28, 28);

      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      let vibR = 0, vibG = 0, vibB = 0, vibScore = -1;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const sat = max === 0 ? 0 : (max - min) / max;

        if (lum > 18 && lum < 235) {
          sumR += r;
          sumG += g;
          sumB += b;
          count++;
        }

        const score = sat * 1.6 + (lum > 35 && lum < 200 ? 0.5 : 0);
        if (score > vibScore && lum > 25) {
          vibScore = score;
          vibR = r;
          vibG = g;
          vibB = b;
        }
      }

      if (count === 0 && vibScore < 0) return DEFAULT_PALETTE;

      const avgR = count ? sumR / count : vibR;
      const avgG = count ? sumG / count : vibG;
      const avgB = count ? sumB / count : vibB;

      // Blend vibrant + average, then darken gently so white UI text remains high-contrast
      const baseR = vibScore > 0.35 ? vibR * 0.55 + avgR * 0.45 : avgR;
      const baseG = vibScore > 0.35 ? vibG * 0.55 + avgG * 0.45 : avgG;
      const baseB = vibScore > 0.35 ? vibB * 0.55 + avgB * 0.45 : avgB;

      const scaleTop = Math.min(0.68, 128 / Math.max(1, 0.2126 * baseR + 0.7152 * baseG + 0.0722 * baseB));
      const topR = Math.max(22, Math.min(148, Math.round(baseR * scaleTop)));
      const topG = Math.max(22, Math.min(148, Math.round(baseG * scaleTop)));
      const topB = Math.max(24, Math.min(148, Math.round(baseB * scaleTop)));

      const midR = Math.max(16, Math.round(topR * 0.42));
      const midG = Math.max(16, Math.round(topG * 0.42));
      const midB = Math.max(18, Math.round(topB * 0.42));

      return [
        `rgb(${topR}, ${topG}, ${topB})`,
        `rgb(${midR}, ${midG}, ${midB})`,
        'rgb(14, 14, 16)'
      ];
    } catch {
      return DEFAULT_PALETTE;
    }
  }

  function processCoverBytes(bytes, mimeType) {
    return new Promise((resolve) => {
      const safeMime = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
      const blob = new Blob([bytes], { type: safeMime });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const palette = samplePaletteFromImage(img);
          const maxDim = 512;
          let w = img.naturalWidth || 512;
          let h = img.naturalHeight || 512;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.max(1, Math.round(w * ratio));
            h = Math.max(1, Math.round(h * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          URL.revokeObjectURL(url);
          resolve({ coverDataUrl: dataUrl, palette });
        } catch {
          URL.revokeObjectURL(url);
          resolve({ coverDataUrl: '', palette: DEFAULT_PALETTE });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ coverDataUrl: '', palette: DEFAULT_PALETTE });
      };
      img.src = url;
    });
  }

  /* ------------------------------------------------------------------
   * Built-In Zero-Dependency ID3v2 / ID3v1 Parser
   * ------------------------------------------------------------------ */
  function readSynchsafe(bytes, offset) {
    return (
      ((bytes[offset] & 0x7f) << 21) |
      ((bytes[offset + 1] & 0x7f) << 14) |
      ((bytes[offset + 2] & 0x7f) << 7) |
      (bytes[offset + 3] & 0x7f)
    );
  }

  function readUint32(bytes, offset) {
    return (
      ((bytes[offset] << 24) >>> 0) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    );
  }

  function readUint24(bytes, offset) {
    return (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
  }

  function removeUnsync(bytes) {
    const out = [];
    for (let i = 0; i < bytes.length; i++) {
      out.push(bytes[i]);
      if (bytes[i] === 0xff && i + 1 < bytes.length && bytes[i + 1] === 0x00) {
        i++;
      }
    }
    return new Uint8Array(out);
  }

  function decodeBytes(bytes, encoding) {
    if (!bytes || bytes.length === 0) return '';
    try {
      if (encoding === 0) {
        return cleanText(new TextDecoder('latin1').decode(bytes));
      }
      if (encoding === 1) {
        if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
          return cleanText(new TextDecoder('utf-16be').decode(bytes.subarray(2)));
        }
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          return cleanText(new TextDecoder('utf-16le').decode(bytes.subarray(2)));
        }
        return cleanText(new TextDecoder('utf-16le').decode(bytes));
      }
      if (encoding === 2) {
        return cleanText(new TextDecoder('utf-16be').decode(bytes));
      }
      return cleanText(new TextDecoder('utf-8').decode(bytes));
    } catch {
      let s = '';
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] !== 0) s += String.fromCharCode(bytes[i]);
      }
      return cleanText(s);
    }
  }

  function findNullTerminator(bytes, start, encoding) {
    const twoByte = encoding === 1 || encoding === 2;
    if (!twoByte) {
      for (let i = start; i < bytes.length; i++) {
        if (bytes[i] === 0) return i;
      }
      return bytes.length;
    }
    for (let i = start; i + 1 < bytes.length; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) return i;
    }
    return bytes.length;
  }

  function normalizeGenre(raw) {
    const trimmed = cleanText(raw);
    if (!trimmed) return '';
    const m = trimmed.match(/^\((\d+)\)(.*)$/);
    if (m) {
      const idx = parseInt(m[1], 10);
      const rest = m[2].trim();
      if (rest) return rest;
      if (ID3V1_GENRES[idx]) return ID3V1_GENRES[idx];
    }
    if (/^\d+$/.test(trimmed)) {
      const idx = parseInt(trimmed, 10);
      if (ID3V1_GENRES[idx]) return ID3V1_GENRES[idx];
    }
    return trimmed;
  }

  function parseFilenameFallback(fileName) {
    const base = fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
    const parts = base.split(' - ');
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim() || 'Unknown Artist',
        title: parts.slice(1).join(' - ').trim() || base
      };
    }
    return {
      artist: 'Unknown Artist',
      title: base || 'Untitled Track'
    };
  }

  function parseID3v1(bytes) {
    if (bytes.length < 128) return null;
    const start = bytes.length - 128;
    if (bytes[start] !== 0x54 || bytes[start + 1] !== 0x41 || bytes[start + 2] !== 0x47) {
      return null;
    }
    const dec = (off, len) => decodeBytes(bytes.subarray(start + off, start + off + len), 0);
    const genreByte = bytes[start + 127];
    return {
      title: dec(3, 30),
      artist: dec(33, 30),
      album: dec(63, 30),
      year: dec(93, 4),
      genre: ID3V1_GENRES[genreByte] || ''
    };
  }

  async function parseAudioTags(arrayBuffer, fileName) {
    const bytes = new Uint8Array(arrayBuffer);
    const fallback = parseFilenameFallback(fileName);
    const tags = {
      title: '',
      artist: '',
      album: '',
      genre: '',
      year: '',
      lyrics: '',
      coverDataUrl: '',
      palette: DEFAULT_PALETTE
    };

    let coverBytes = null;
    let coverMime = 'image/jpeg';

    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const major = bytes[3];
      const flags = bytes[5];
      const tagSize = readSynchsafe(bytes, 6);
      const tagEnd = Math.min(bytes.length, 10 + tagSize);
      let body = bytes.subarray(10, tagEnd);

      const globalUnsync = (flags & 0x80) !== 0;
      if (globalUnsync && major < 4) {
        body = removeUnsync(body);
      }

      let offset = 0;
      // Skip extended header in v2.3 / v2.4
      if ((flags & 0x40) !== 0 && body.length >= 4) {
        if (major === 3) {
          const extSize = readUint32(body, 0);
          offset += 4 + extSize;
        } else if (major === 4) {
          const extSize = readSynchsafe(body, 0);
          offset += extSize;
        }
      }

      while (offset < body.length) {
        if (body[offset] === 0x00) break;

        let frameId = '';
        let frameSize = 0;
        let frameFlags = 0;
        let headerLen = 10;

        if (major === 2) {
          if (offset + 6 > body.length) break;
          headerLen = 6;
          frameId = String.fromCharCode(body[offset], body[offset + 1], body[offset + 2]);
          frameSize = readUint24(body, offset + 3);
        } else {
          if (offset + 10 > body.length) break;
          headerLen = 10;
          frameId = String.fromCharCode(body[offset], body[offset + 1], body[offset + 2], body[offset + 3]);
          frameSize = major === 4 ? readSynchsafe(body, offset + 4) : readUint32(body, offset + 4);
          frameFlags = (body[offset + 8] << 8) | body[offset + 9];
          // Handle non-synchsafe ID3v2.4 writer edge case
          if (major === 4 && frameSize > body.length - (offset + headerLen)) {
            const altSize = readUint32(body, offset + 4);
            if (altSize <= body.length - (offset + headerLen)) {
              frameSize = altSize;
            }
          }
        }

        if (frameSize <= 0 || offset + headerLen + frameSize > body.length) break;

        let frameData = body.subarray(offset + headerLen, offset + headerLen + frameSize);
        offset += headerLen + frameSize;

        if (major === 4 && (frameFlags & 0x0002)) {
          frameData = removeUnsync(frameData);
        }
        // Skip data length indicator if set in v2.4
        if (major === 4 && (frameFlags & 0x0001) && frameData.length > 4) {
          frameData = frameData.subarray(4);
        }

        if (frameId === 'TIT2' || frameId === 'TT2') {
          tags.title = decodeBytes(frameData.subarray(1), frameData[0]);
        } else if (frameId === 'TPE1' || frameId === 'TP1') {
          tags.artist = decodeBytes(frameData.subarray(1), frameData[0]);
        } else if (frameId === 'TALB' || frameId === 'TAL') {
          tags.album = decodeBytes(frameData.subarray(1), frameData[0]);
        } else if (frameId === 'TCON' || frameId === 'TCO') {
          tags.genre = normalizeGenre(decodeBytes(frameData.subarray(1), frameData[0]));
        } else if (frameId === 'TYER' || frameId === 'TYE' || frameId === 'TDRC') {
          const yr = decodeBytes(frameData.subarray(1), frameData[0]);
          const ym = yr.match(/\d{4}/);
          if (ym) tags.year = ym[0];
        } else if (frameId === 'USLT' && frameData.length > 4 && !tags.lyrics) {
          const enc = frameData[0];
          const descEnd = findNullTerminator(frameData, 4, enc);
          const sepLen = (enc === 1 || enc === 2) ? 2 : 1;
          const lyricStart = Math.min(frameData.length, descEnd + sepLen);
          tags.lyrics = decodeBytes(frameData.subarray(lyricStart), enc);
        } else if (frameId === 'APIC' && frameData.length > 4 && !coverBytes) {
          const enc = frameData[0];
          const mimeEnd = findNullTerminator(frameData, 1, 0);
          const mime = decodeBytes(frameData.subarray(1, mimeEnd), 0) || 'image/jpeg';
          const picTypeIdx = mimeEnd + 1;
          const descStart = picTypeIdx + 1;
          if (descStart < frameData.length) {
            const descEnd = findNullTerminator(frameData, descStart, enc);
            const sepLen = (enc === 1 || enc === 2) ? 2 : 1;
            const imgStart = descEnd + sepLen;
            if (imgStart < frameData.length) {
              coverMime = mime === 'JPG' ? 'image/jpeg' : mime;
              coverBytes = frameData.subarray(imgStart);
            }
          }
        } else if (frameId === 'PIC' && frameData.length > 6 && !coverBytes) {
          const enc = frameData[0];
          const fmt = String.fromCharCode(frameData[1], frameData[2], frameData[3]).toLowerCase();
          coverMime = fmt === 'png' ? 'image/png' : 'image/jpeg';
          const descEnd = findNullTerminator(frameData, 5, enc);
          const sepLen = (enc === 1 || enc === 2) ? 2 : 1;
          const imgStart = descEnd + sepLen;
          if (imgStart < frameData.length) {
            coverBytes = frameData.subarray(imgStart);
          }
        }
      }
    }

    if (!tags.title || !tags.artist || !tags.album) {
      const v1 = parseID3v1(bytes);
      if (v1) {
        if (!tags.title) tags.title = v1.title;
        if (!tags.artist) tags.artist = v1.artist;
        if (!tags.album) tags.album = v1.album;
        if (!tags.year) tags.year = v1.year;
        if (!tags.genre) tags.genre = v1.genre;
      }
    }

    tags.title = tags.title || fallback.title;
    tags.artist = tags.artist || fallback.artist;
    tags.album = tags.album || 'Single';
    tags.genre = tags.genre || 'Music';

    if (coverBytes && coverBytes.length > 16) {
      const processed = await processCoverBytes(coverBytes, coverMime);
      tags.coverDataUrl = processed.coverDataUrl;
      tags.palette = processed.palette;
    }

    return tags;
  }

  function probeAudioDuration(buffer, mimeType) {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: mimeType || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const probe = new Audio();
      let done = false;
      const finish = (dur) => {
        if (done) return;
        done = true;
        probe.removeAttribute('src');
        probe.load();
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(dur) && dur > 0 ? dur : 0);
      };
      const timer = setTimeout(() => finish(0), 2500);
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        clearTimeout(timer);
        finish(probe.duration);
      };
      probe.onerror = () => {
        clearTimeout(timer);
        finish(0);
      };
      probe.src = url;
    });
  }

  /* ------------------------------------------------------------------
   * IndexedDB Persistence Layer
   * ------------------------------------------------------------------ */
  const MusicDB = {
    db: null,

    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('audioFiles')) {
            db.createObjectStore('audioFiles', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        };
        req.onsuccess = () => {
          this.db = req.result;
          resolve(this.db);
        };
        req.onerror = () => reject(req.error);
      });
    },

    tx(storeNames, mode = 'readonly') {
      return this.db.transaction(storeNames, mode);
    },

    reqToPromise(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async getAllTracks() {
      const store = this.tx('tracks').objectStore('tracks');
      return this.reqToPromise(store.getAll());
    },

    async putTrack(track) {
      const store = this.tx('tracks', 'readwrite').objectStore('tracks');
      return this.reqToPromise(store.put(track));
    },

    async putAudioFile(id, buffer, mimeType) {
      const store = this.tx('audioFiles', 'readwrite').objectStore('audioFiles');
      return this.reqToPromise(store.put({ id, buffer, mimeType }));
    },

    async getAudioRecord(id) {
      const store = this.tx('audioFiles').objectStore('audioFiles');
      return this.reqToPromise(store.get(id));
    },

    async deleteTrackAndAudio(id) {
      const t = this.tx(['tracks', 'audioFiles'], 'readwrite');
      t.objectStore('tracks').delete(id);
      t.objectStore('audioFiles').delete(id);
      return new Promise((resolve, reject) => {
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      });
    },

    async getAllPlaylists() {
      const store = this.tx('playlists').objectStore('playlists');
      return this.reqToPromise(store.getAll());
    },

    async putPlaylist(playlist) {
      const store = this.tx('playlists', 'readwrite').objectStore('playlists');
      return this.reqToPromise(store.put(playlist));
    },

    async deletePlaylist(id) {
      const store = this.tx('playlists', 'readwrite').objectStore('playlists');
      return this.reqToPromise(store.delete(id));
    },

    async getMeta(key) {
      const store = this.tx('meta').objectStore('meta');
      const rec = await this.reqToPromise(store.get(key));
      return rec ? rec.value : null;
    },

    async setMeta(key, value) {
      const store = this.tx('meta', 'readwrite').objectStore('meta');
      return this.reqToPromise(store.put({ key, value }));
    },

    async clearAll() {
      const t = this.tx(['tracks', 'audioFiles', 'playlists', 'meta'], 'readwrite');
      t.objectStore('tracks').clear();
      t.objectStore('audioFiles').clear();
      t.objectStore('playlists').clear();
      t.objectStore('meta').clear();
      return new Promise((resolve, reject) => {
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      });
    }
  };

  /* ------------------------------------------------------------------
   * Application State
   * ------------------------------------------------------------------ */
  const state = {
    tracks: [],
    trackMap: new Map(),
    playlists: [],
    historyIds: [],
    activeTab: 'home',
    libraryFilter: 'all',
    libraryDetail: null,
    searchQuery: '',
    activeCategory: null,

    queue: [],
    queueIndex: -1,
    currentTrackId: null,
    currentBlobUrl: null,
    isPlaying: false,
    shuffle: false,
    repeat: 'off', // 'off' | 'all' | 'one'
    sourceLabel: 'PLAYING FROM LIBRARY',
    sourceName: 'Local MP3s',
    showRemainingTime: false,
    countedCurrentPlay: false,

    nowPlayingOpen: false,
    activeModalTrackId: null,
    sleepTimer: {
      mode: 'off', // 'off' | 'minutes' | 'end'
      endsAt: 0,
      intervalId: null
    }
  };

  const audio = $('audio-player');
  let toastTimer = null;

  function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2400);
  }

  function trackArt(track) {
    return (track && track.coverDataUrl) || getDefaultArtworkDataUrl();
  }

  function rebuildTrackMap() {
    state.trackMap = new Map(state.tracks.map((t) => [t.id, t]));
  }

  /* ------------------------------------------------------------------
   * Navigation & View Management
   * ------------------------------------------------------------------ */
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${tab}`);
    });
    document.querySelectorAll('.tab-btn').forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-current', active ? 'page' : 'false');
    });
    $('floating-search-bar').hidden = tab !== 'search';

    if (tab === 'home') renderHome();
    if (tab === 'search') renderSearch();
    if (tab === 'library') renderLibrary();
    if (tab === 'import') renderImportStats();
  }

  function openNowPlaying() {
    if (!state.currentTrackId) {
      if (state.tracks.length > 0) {
        playTrackFromList(state.tracks[0].id, state.tracks.map((t) => t.id), 'PLAYING FROM LIBRARY', 'All Songs');
      } else {
        showToast('Import MP3s first to start listening');
        switchTab('import');
        return;
      }
    }
    state.nowPlayingOpen = true;
    const np = $('now-playing-view');
    np.classList.add('open');
    np.setAttribute('aria-hidden', 'false');
  }

  function closeNowPlaying() {
    state.nowPlayingOpen = false;
    const np = $('now-playing-view');
    np.classList.remove('open');
    np.setAttribute('aria-hidden', 'true');
  }

  /* ------------------------------------------------------------------
   * Playback, Queue & Media Session API
   * ------------------------------------------------------------------ */
  async function persistPlaybackMeta() {
    try {
      await MusicDB.setMeta('playerState', {
        currentTrackId: state.currentTrackId,
        queue: state.queue,
        queueIndex: state.queueIndex,
        shuffle: state.shuffle,
        repeat: state.repeat,
        sourceLabel: state.sourceLabel,
        sourceName: state.sourceName
      });
      await MusicDB.setMeta('historyIds', state.historyIds.slice(0, 40));
    } catch {
      // Ignore storage quota warnings on metadata writes
    }
  }

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      const artUrl = trackArt(track);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Local MP3s',
        artwork: [
          { src: artUrl, sizes: '256x256', type: artUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg' },
          { src: artUrl, sizes: '512x512', type: artUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg' }
        ]
      });
      navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
    } catch {
      // Safari compatibility guard
    }
  }

  function syncPositionState() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(audio.duration, Math.max(0, audio.currentTime || 0))
      });
    } catch {
      // Ignore transient duration/position mismatch
    }
  }

  function initMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;
    const safeHandle = (action, fn) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {
        // Unsupported action on current browser version
      }
    };
    safeHandle('play', () => resumePlayback());
    safeHandle('pause', () => pausePlayback());
    safeHandle('previoustrack', () => playPrevious());
    safeHandle('nexttrack', () => playNext(true));
    safeHandle('seekto', (details) => {
      if (details && Number.isFinite(details.seekTime)) {
        audio.currentTime = Math.max(0, Math.min(audio.duration || 0, details.seekTime));
        updateProgressUI();
        syncPositionState();
      }
    });
    safeHandle('seekbackward', (details) => {
      const step = (details && details.seekOffset) || 10;
      audio.currentTime = Math.max(0, audio.currentTime - step);
      updateProgressUI();
      syncPositionState();
    });
    safeHandle('seekforward', (details) => {
      const step = (details && details.seekOffset) || 10;
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + step);
      updateProgressUI();
      syncPositionState();
    });
  }

  async function loadTrack(trackId, autoplay = true) {
    const track = state.trackMap.get(trackId);
    if (!track) return;

    const record = await MusicDB.getAudioRecord(trackId);
    if (!record || !record.buffer) {
      showToast('Audio file missing from storage');
      return;
    }

    if (state.currentBlobUrl) {
      URL.revokeObjectURL(state.currentBlobUrl);
      state.currentBlobUrl = null;
    }

    const blob = new Blob([record.buffer], { type: record.mimeType || 'audio/mpeg' });
    state.currentBlobUrl = URL.createObjectURL(blob);
    state.currentTrackId = trackId;
    state.countedCurrentPlay = false;

    audio.src = state.currentBlobUrl;
    audio.load();

    updatePlayerUI();
    updateMediaSession(track);
    renderActiveViews();

    if (autoplay) {
      try {
        await audio.play();
        state.isPlaying = true;
        recordTrackPlayStart(trackId);
      } catch {
        state.isPlaying = false;
      }
      updatePlayButtonsUI();
      updateMediaSession(track);
    }

    persistPlaybackMeta();
  }

  async function recordTrackPlayStart(trackId) {
    if (state.countedCurrentPlay) return;
    state.countedCurrentPlay = true;
    const track = state.trackMap.get(trackId);
    if (!track) return;
    track.playCount = (track.playCount || 0) + 1;
    track.lastPlayedAt = Date.now();
    state.historyIds = [trackId, ...state.historyIds.filter((id) => id !== trackId)].slice(0, 40);
    await MusicDB.putTrack(track);
    persistPlaybackMeta();
    if (state.activeTab === 'home') renderHome();
  }

  async function playTrackFromList(trackId, listIds, sourceLabel = 'PLAYING FROM LIBRARY', sourceName = 'Local MP3s') {
    const validIds = listIds.filter((id) => state.trackMap.has(id));
    if (!validIds.includes(trackId)) validIds.unshift(trackId);

    state.sourceLabel = sourceLabel;
    state.sourceName = sourceName;

    if (state.shuffle && validIds.length > 1) {
      const rest = validIds.filter((id) => id !== trackId);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      state.queue = [trackId, ...rest];
      state.queueIndex = 0;
    } else {
      state.queue = validIds;
      state.queueIndex = validIds.indexOf(trackId);
    }

    await loadTrack(trackId, true);
  }

  async function resumePlayback() {
    if (!state.currentTrackId) {
      if (state.tracks.length > 0) {
        await playTrackFromList(state.tracks[0].id, state.tracks.map((t) => t.id));
      } else {
        showToast('Import MP3s to start listening');
        switchTab('import');
      }
      return;
    }
    try {
      await audio.play();
      state.isPlaying = true;
      if (!state.countedCurrentPlay) recordTrackPlayStart(state.currentTrackId);
    } catch {
      state.isPlaying = false;
    }
    updatePlayButtonsUI();
    updateMediaSession(state.trackMap.get(state.currentTrackId));
  }

  function pausePlayback() {
    audio.pause();
    state.isPlaying = false;
    updatePlayButtonsUI();
    updateMediaSession(state.trackMap.get(state.currentTrackId));
  }

  function togglePlayPause() {
    if (state.isPlaying) pausePlayback();
    else resumePlayback();
  }

  async function playNext(manual = false) {
    if (state.queue.length === 0) return;
    if (!manual && state.repeat === 'one' && state.currentTrackId) {
      audio.currentTime = 0;
      await resumePlayback();
      return;
    }

    let nextIdx = state.queueIndex + 1;
    if (nextIdx >= state.queue.length) {
      if (state.repeat === 'all' || manual) {
        nextIdx = 0;
      } else {
        pausePlayback();
        audio.currentTime = 0;
        updateProgressUI();
        return;
      }
    }
    state.queueIndex = nextIdx;
    await loadTrack(state.queue[nextIdx], true);
  }

  async function playPrevious() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      updateProgressUI();
      syncPositionState();
      return;
    }
    if (state.queue.length === 0) return;
    let prevIdx = state.queueIndex - 1;
    if (prevIdx < 0) prevIdx = state.queue.length - 1;
    state.queueIndex = prevIdx;
    await loadTrack(state.queue[prevIdx], true);
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    if (state.shuffle && state.queue.length > 1 && state.currentTrackId) {
      const rest = state.queue.filter((id) => id !== state.currentTrackId);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      state.queue = [state.currentTrackId, ...rest];
      state.queueIndex = 0;
    }
    updatePlayerUI();
    persistPlaybackMeta();
    showToast(state.shuffle ? 'Shuffle on' : 'Shuffle off');
  }

  function cycleRepeat() {
    const order = ['off', 'all', 'one'];
    state.repeat = order[(order.indexOf(state.repeat) + 1) % order.length];
    const labels = { off: 'Repeat: Off', all: 'Repeat: All', one: 'Repeat: One' };
    $('queue-repeat-btn').textContent = labels[state.repeat];
    persistPlaybackMeta();
    showToast(labels[state.repeat]);
  }

  async function toggleFavorite(trackId) {
    const track = state.trackMap.get(trackId);
    if (!track) return;
    track.favorite = !track.favorite;
    await MusicDB.putTrack(track);
    updatePlayerUI();
    renderActiveViews();
    showToast(track.favorite ? 'Added to Favorites' : 'Removed from Favorites');
  }

  /* ------------------------------------------------------------------
   * Player UI Sync
   * ------------------------------------------------------------------ */
  function updatePlayButtonsUI() {
    const playing = state.isPlaying;
    document.querySelectorAll('#mini-play-btn, #np-play-btn').forEach((btn) => {
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-pressed', String(playing));
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    });
  }

  function updateProgressUI() {
    const cur = audio.currentTime || 0;
    const track = state.trackMap.get(state.currentTrackId);
    const dur = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : (track && track.duration) || 0;

    const pct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
    $('mini-progress-fill').style.width = `${pct}%`;

    const slider = $('np-seek-slider');
    slider.value = pct;
    slider.style.setProperty('--seek-pct', `${pct}%`);
    $('np-time-elapsed').textContent = formatTime(cur);
    $('np-time-total').textContent = state.showRemainingTime && dur > 0
      ? `-${formatTime(Math.max(0, dur - cur))}`
      : formatTime(dur);
  }

  function updatePlayerUI() {
    const track = state.trackMap.get(state.currentTrackId);
    const mini = $('mini-player');
    const miniArt = $('mini-art');
    const miniFallback = $('mini-art-fallback');
    const miniFav = $('mini-fav-btn');

    if (!track) {
      mini.classList.add('is-idle');
      miniArt.hidden = true;
      miniFallback.hidden = false;
      $('mini-title').textContent = state.tracks.length ? 'Select a track' : 'No track selected';
      $('mini-artist').textContent = state.tracks.length ? `${state.tracks.length} local tracks ready` : 'Import MP3s to listen offline';
      miniFav.disabled = true;
      miniFav.classList.remove('is-fav');
      updatePlayButtonsUI();
      updateProgressUI();
      return;
    }

    mini.classList.remove('is-idle');
    const art = trackArt(track);
    miniArt.src = art;
    miniArt.hidden = false;
    miniFallback.hidden = true;
    $('mini-title').textContent = track.title;
    $('mini-artist').textContent = track.artist;
    miniFav.disabled = false;
    miniFav.classList.toggle('is-fav', Boolean(track.favorite));

    // Full-Screen Now Playing
    $('np-source-label').textContent = state.sourceLabel;
    $('np-source-name').textContent = state.sourceName;
    $('np-artwork').src = art;
    $('np-title').textContent = track.title;
    $('np-artist').textContent = track.artist;
    $('np-fav-btn').classList.toggle('is-fav', Boolean(track.favorite));
    $('np-shuffle-btn').classList.toggle('is-active', state.shuffle);

    const pal = (track.palette && track.palette.length === 3) ? track.palette : DEFAULT_PALETTE;
    $('np-bg-layer').style.background = `linear-gradient(180deg, ${pal[0]} 0%, ${pal[1]} 54%, ${pal[2]} 100%)`;

    updatePlayButtonsUI();
    updateProgressUI();
  }

  /* ------------------------------------------------------------------
   * Shared Track Row Builder
   * ------------------------------------------------------------------ */
  function createTrackRow(track, queueIds, sourceLabel, sourceName) {
    const row = document.createElement('div');
    row.className = `track-row${track.id === state.currentTrackId ? ' is-playing' : ''}`;

    const artUrl = trackArt(track);
    row.innerHTML = `
      <img class="track-row-art" src="${escapeHtml(artUrl)}" alt="" loading="lazy">
      <button class="track-row-main" type="button">
        <span class="track-row-title">${escapeHtml(track.title)}</span>
        <span class="track-row-sub">${escapeHtml(track.artist)}${track.album && track.album !== 'Single' ? ` · ${escapeHtml(track.album)}` : ''}</span>
      </button>
      <div class="track-row-right">
        <span class="track-row-dur">${formatTime(track.duration)}</span>
        <button class="row-icon-btn fav-toggle ${track.favorite ? 'is-fav' : ''}" type="button" aria-label="Favorite">
          <svg viewBox="0 0 24 24" fill="${track.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button class="row-icon-btn more-toggle" type="button" aria-label="Track options">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
        </button>
      </div>
    `;

    row.querySelector('.track-row-main').addEventListener('click', () => {
      playTrackFromList(track.id, queueIds, sourceLabel, sourceName);
    });
    row.querySelector('.track-row-art').addEventListener('click', () => {
      playTrackFromList(track.id, queueIds, sourceLabel, sourceName);
    });
    row.querySelector('.fav-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(track.id);
    });
    row.querySelector('.more-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      openTrackMenuModal(track.id);
    });
    return row;
  }

  /* ------------------------------------------------------------------
   * View 1: Home Screen Rendering
   * ------------------------------------------------------------------ */
  function renderHome() {
    $('home-greeting').textContent = getGreeting();
    const hasTracks = state.tracks.length > 0;
    $('home-empty-state').hidden = hasTracks;
    $('recently-played-section').hidden = !hasTracks;
    $('top-albums-section').hidden = !hasTracks;
    $('quick-mixes-section').hidden = !hasTracks;

    if (!hasTracks) return;

    // 1. Recently Played Carousel: Mix of rounded-square album cards & circular artist cards
    const recentContainer = $('recently-played-carousel');
    recentContainer.innerHTML = '';

    const sourceTracks = state.historyIds.length > 0
      ? state.historyIds.map((id) => state.trackMap.get(id)).filter(Boolean)
      : [...state.tracks].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

    const recentItems = [];
    const seenKeys = new Set();
    let idx = 0;

    for (const tr of sourceTracks) {
      const asArtist = idx % 2 === 1 && tr.artist && tr.artist !== 'Unknown Artist';
      const key = asArtist ? `artist:${tr.artist}` : `album:${tr.album || tr.title}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        recentItems.push({ type: asArtist ? 'artist' : 'album', track: tr });
      }
      idx++;
      if (recentItems.length >= 12) break;
    }

    for (const item of recentItems) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `recent-card${item.type === 'artist' ? ' is-artist' : ''}`;
      card.setAttribute('role', 'listitem');
      const label = item.type === 'artist' ? item.track.artist : (item.track.album && item.track.album !== 'Single' ? item.track.album : item.track.title);
      const sub = item.type === 'artist' ? 'Artist' : item.track.artist;
      card.innerHTML = `
        <img class="recent-thumb" src="${escapeHtml(trackArt(item.track))}" alt="${escapeHtml(label)}" loading="lazy">
        <span class="recent-label">${escapeHtml(label)}</span>
        <span class="recent-sublabel">${escapeHtml(sub)}</span>
      `;
      card.addEventListener('click', () => {
        if (item.type === 'artist') {
          const list = state.tracks.filter((t) => t.artist === item.track.artist).map((t) => t.id);
          playTrackFromList(list[0], list, 'PLAYING ARTIST', item.track.artist);
        } else {
          const albumName = item.track.album;
          const list = albumName && albumName !== 'Single'
            ? state.tracks.filter((t) => t.album === albumName).map((t) => t.id)
            : [item.track.id];
          playTrackFromList(list[0], list, 'PLAYING ALBUM', label);
        }
      });
      recentContainer.appendChild(card);
    }

    // 2. Your Favourite Albums (Ranked Vertical Cards)
    const albumsMap = new Map();
    for (const tr of state.tracks) {
      const key = tr.album && tr.album !== 'Single' ? `${tr.album}__${tr.artist}` : `track__${tr.id}`;
      const existing = albumsMap.get(key) || {
        title: tr.album && tr.album !== 'Single' ? tr.album : tr.title,
        artist: tr.artist,
        art: trackArt(tr),
        score: 0,
        trackIds: []
      };
      existing.score += (tr.playCount || 0) * 3 + (tr.favorite ? 4 : 0) + 1;
      existing.trackIds.push(tr.id);
      if (tr.coverDataUrl && existing.art === getDefaultArtworkDataUrl()) {
        existing.art = tr.coverDataUrl;
      }
      albumsMap.set(key, existing);
    }

    const rankedAlbums = [...albumsMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const rankedContainer = $('top-albums-carousel');
    rankedContainer.innerHTML = '';
    rankedAlbums.forEach((alb, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'ranked-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <img class="ranked-art" src="${escapeHtml(alb.art)}" alt="${escapeHtml(alb.title)}" loading="lazy">
        <div class="ranked-meta-row">
          <span class="ranked-number">${i + 1}</span>
          <div class="ranked-text">
            <span class="ranked-title">${escapeHtml(alb.title)}</span>
            <span class="ranked-artist">${escapeHtml(alb.artist)}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        playTrackFromList(alb.trackIds[0], alb.trackIds, 'PLAYING TOP ALBUM', alb.title);
      });
      rankedContainer.appendChild(card);
    });

    // 3. Uniquely Yours / Quick Mixes
    const mixesContainer = $('quick-mixes-carousel');
    mixesContainer.innerHTML = '';

    const favTracks = state.tracks.filter((t) => t.favorite);
    const mostPlayed = [...state.tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    const recentAdded = [...state.tracks].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    const topGenre = getTopGenres()[0];

    const mixes = [
      {
        badge: 'Mix',
        title: 'Favorites Mix',
        ids: (favTracks.length ? favTracks : state.tracks).map((t) => t.id),
        sub: `${favTracks.length || state.tracks.length} songs`,
        bg: MIX_GRADIENTS[0]
      },
      {
        badge: 'Replay',
        title: 'Most Played',
        ids: mostPlayed.slice(0, 25).map((t) => t.id),
        sub: `${Math.min(25, mostPlayed.length)} songs`,
        bg: MIX_GRADIENTS[1]
      },
      {
        badge: 'Fresh',
        title: 'Recently Added',
        ids: recentAdded.slice(0, 25).map((t) => t.id),
        sub: `${Math.min(25, recentAdded.length)} songs`,
        bg: MIX_GRADIENTS[2]
      },
      {
        badge: topGenre ? 'Genre' : 'Vault',
        title: topGenre ? `${topGenre.name} Mix` : 'All Offline MP3s',
        ids: (topGenre ? topGenre.ids : state.tracks.map((t) => t.id)),
        sub: `${topGenre ? topGenre.ids.length : state.tracks.length} songs`,
        bg: MIX_GRADIENTS[3]
      }
    ];

    mixes.forEach((mix) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mix-card';
      card.style.background = mix.bg;
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <span class="mix-badge">${escapeHtml(mix.badge)}</span>
        <div>
          <h3 class="mix-title">${escapeHtml(mix.title)}</h3>
          <div class="mix-count">${escapeHtml(mix.sub)}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (!mix.ids.length) {
          showToast('No tracks in this mix yet');
          return;
        }
        playTrackFromList(mix.ids[0], mix.ids, 'PLAYING MIX', mix.title);
      });
      mixesContainer.appendChild(card);
    });
  }

  function getTopGenres() {
    const map = new Map();
    for (const tr of state.tracks) {
      const g = (tr.genre || 'Music').trim();
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(tr.id);
    }
    return [...map.entries()]
      .map(([name, ids]) => ({ name, ids }))
      .sort((a, b) => b.ids.length - a.ids.length);
  }

  /* ------------------------------------------------------------------
   * View 2: Search & Browse Screen
   * ------------------------------------------------------------------ */
  function buildBrowseCategories() {
    const allIds = state.tracks.map((t) => t.id);
    const favIds = state.tracks.filter((t) => t.favorite).map((t) => t.id);
    const recentIds = [...state.tracks].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 30).map((t) => t.id);

    const categories = [
      { id: 'all', label: 'All Tracks', watermark: 'ALL', ids: allIds },
      { id: 'favorites', label: 'Favorites', watermark: '♥', ids: favIds },
      { id: 'recent', label: 'Recently Added', watermark: 'NEW', ids: recentIds }
    ];

    // Add detected genres
    const genres = getTopGenres().filter((g) => g.name.toLowerCase() !== 'music');
    for (const g of genres.slice(0, 4)) {
      categories.push({
        id: `genre:${g.name}`,
        label: g.name,
        watermark: g.name.slice(0, 4).toUpperCase(),
        ids: g.ids
      });
    }

    // Add detected decades
    const decadeMap = new Map();
    for (const tr of state.tracks) {
      const y = parseInt(tr.year, 10);
      if (y >= 1950 && y <= 2039) {
        const dec = `${Math.floor(y / 10) * 10}s`;
        if (!decadeMap.has(dec)) decadeMap.set(dec, []);
        decadeMap.get(dec).push(tr.id);
      }
    }
    for (const [dec, ids] of [...decadeMap.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3)) {
      categories.push({ id: `decade:${dec}`, label: dec, watermark: dec, ids });
    }

    // Fill out curated quick-tag cards if library has few ID3 tags yet
    const presets = [
      { id: 'tag:hiphop', label: 'Hip-Hop', watermark: 'RAP', matcher: (t) => /hip|rap|trap/i.test(`${t.genre} ${t.title}`) },
      { id: 'tag:chill', label: 'Chill', watermark: 'CHILL', matcher: (t) => /chill|lofi|ambient|acoustic|r&b/i.test(`${t.genre} ${t.title}`) },
      { id: 'tag:pop', label: 'Pop', watermark: 'POP', matcher: (t) => /pop|dance|synth/i.test(`${t.genre} ${t.title}`) },
      { id: 'tag:2020s', label: '2020s', watermark: '2020s', matcher: (t) => parseInt(t.year, 10) >= 2020 }
    ];
    for (const p of presets) {
      if (categories.length >= 8) break;
      if (!categories.some((c) => c.label.toLowerCase() === p.label.toLowerCase())) {
        categories.push({
          id: p.id,
          label: p.label,
          watermark: p.watermark,
          ids: state.tracks.filter(p.matcher).map((t) => t.id)
        });
      }
    }

    return categories;
  }

  function renderSearch() {
    const query = state.searchQuery.trim().toLowerCase();
    const hasQuery = query.length > 0;
    const category = state.activeCategory;
    const showResults = hasQuery || Boolean(category);

    $('search-browse-content').hidden = showResults;
    $('search-results-content').hidden = !showResults;
    $('search-back-btn').hidden = !category || hasQuery;
    $('search-clear-btn').hidden = !hasQuery;

    if (!showResults) {
      $('search-subtitle').hidden = true;
      const grid = $('category-grid');
      grid.innerHTML = '';
      const cats = buildBrowseCategories();
      cats.forEach((cat, idx) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'category-tile';
        tile.style.background = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
        tile.innerHTML = `
          <span class="category-label">${escapeHtml(cat.label)}</span>
          <span class="category-count">${cat.ids.length} ${cat.ids.length === 1 ? 'track' : 'tracks'}</span>
          <span class="category-watermark" aria-hidden="true">${escapeHtml(cat.watermark)}</span>
        `;
        tile.addEventListener('click', () => {
          state.activeCategory = cat;
          renderSearch();
        });
        grid.appendChild(tile);
      });
      return;
    }

    let matchedTracks = [];
    let contextName = 'Search Results';

    if (hasQuery) {
      matchedTracks = state.tracks.filter((t) =>
        `${t.title} ${t.artist} ${t.album} ${t.genre}`.toLowerCase().includes(query)
      );
      $('search-subtitle').textContent = `Results for "${state.searchQuery.trim()}"`;
      $('search-subtitle').hidden = false;
    } else if (category) {
      const catSet = new Set(category.ids);
      matchedTracks = state.tracks.filter((t) => catSet.has(t.id));
      contextName = category.label;
      $('search-subtitle').textContent = `${category.label} · ${matchedTracks.length} ${matchedTracks.length === 1 ? 'track' : 'tracks'}`;
      $('search-subtitle').hidden = false;
    }

    const listEl = $('search-results-list');
    listEl.innerHTML = '';
    $('search-no-results').hidden = matchedTracks.length > 0;
    $('search-results-actions').hidden = matchedTracks.length === 0;
    $('search-results-count').textContent = `${matchedTracks.length} ${matchedTracks.length === 1 ? 'song' : 'songs'}`;

    const ids = matchedTracks.map((t) => t.id);
    $('search-play-all-btn').onclick = () => {
      if (ids.length) playTrackFromList(ids[0], ids, 'PLAYING FROM SEARCH', contextName);
    };

    matchedTracks.forEach((tr) => {
      listEl.appendChild(createTrackRow(tr, ids, 'PLAYING FROM SEARCH', contextName));
    });
  }

  /* ------------------------------------------------------------------
   * View 4: Library & Playlists
   * ------------------------------------------------------------------ */
  function renderLibrary() {
    if (state.libraryDetail) {
      renderLibraryDetail();
      return;
    }

    $('library-root-content').hidden = false;
    $('library-detail-content').hidden = true;

    const f = state.libraryFilter;
    $('library-playlists-block').hidden = f !== 'all' && f !== 'playlists';
    $('library-albums-block').hidden = f !== 'albums';
    $('library-artists-block').hidden = f !== 'artists';
    $('library-tracks-block').hidden = f !== 'all' && f !== 'tracks';

    // Playlists list
    const plList = $('library-playlists-list');
    plList.innerHTML = '';

    const favIds = state.tracks.filter((t) => t.favorite).map((t) => t.id);
    const favCard = document.createElement('button');
    favCard.type = 'button';
    favCard.className = 'entity-row';
    favCard.innerHTML = `
      <div class="entity-cover" style="background: linear-gradient(135deg, #1ED760, #0B5C2B); color: #08120B;">♥</div>
      <div class="entity-meta">
        <span class="entity-title">Liked Songs</span>
        <span class="entity-sub">Playlist · ${favIds.length} ${favIds.length === 1 ? 'song' : 'songs'}</span>
      </div>
    `;
    favCard.addEventListener('click', () => {
      state.libraryDetail = { type: 'favorites', title: 'Liked Songs', trackIds: favIds };
      renderLibrary();
    });
    plList.appendChild(favCard);

    state.playlists.forEach((pl) => {
      const validIds = (pl.trackIds || []).filter((id) => state.trackMap.has(id));
      const firstTrack = state.trackMap.get(validIds[0]);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'entity-row';
      card.innerHTML = `
        ${firstTrack ? `<img class="entity-cover" src="${escapeHtml(trackArt(firstTrack))}" alt="">` : '<div class="entity-cover">♫</div>'}
        <div class="entity-meta">
          <span class="entity-title">${escapeHtml(pl.name)}</span>
          <span class="entity-sub">Playlist · ${validIds.length} ${validIds.length === 1 ? 'song' : 'songs'}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        state.libraryDetail = { type: 'playlist', id: pl.id, title: pl.name, trackIds: validIds };
        renderLibrary();
      });
      plList.appendChild(card);
    });

    // Albums grid
    const albumsGrid = $('library-albums-grid');
    albumsGrid.innerHTML = '';
    const albumGroups = new Map();
    for (const tr of state.tracks) {
      const key = tr.album || 'Single';
      if (!albumGroups.has(key)) albumGroups.set(key, { name: key, artist: tr.artist, art: trackArt(tr), ids: [] });
      const grp = albumGroups.get(key);
      grp.ids.push(tr.id);
      if (tr.coverDataUrl && grp.art === getDefaultArtworkDataUrl()) grp.art = tr.coverDataUrl;
    }
    for (const alb of albumGroups.values()) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'album-grid-card';
      card.innerHTML = `
        <img src="${escapeHtml(alb.art)}" alt="${escapeHtml(alb.name)}" loading="lazy">
        <span class="entity-title">${escapeHtml(alb.name)}</span>
        <span class="entity-sub">${escapeHtml(alb.artist)} · ${alb.ids.length}</span>
      `;
      card.addEventListener('click', () => {
        state.libraryDetail = { type: 'album', title: alb.name, subtitle: alb.artist, art: alb.art, trackIds: alb.ids };
        renderLibrary();
      });
      albumsGrid.appendChild(card);
    }

    // Artists list
    const artistsList = $('library-artists-list');
    artistsList.innerHTML = '';
    const artistGroups = new Map();
    for (const tr of state.tracks) {
      const key = tr.artist || 'Unknown Artist';
      if (!artistGroups.has(key)) artistGroups.set(key, { name: key, art: trackArt(tr), ids: [] });
      artistGroups.get(key).ids.push(tr.id);
    }
    for (const artGrp of artistGroups.values()) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'entity-row';
      row.innerHTML = `
        <img class="entity-cover round" src="${escapeHtml(artGrp.art)}" alt="${escapeHtml(artGrp.name)}" loading="lazy">
        <div class="entity-meta">
          <span class="entity-title">${escapeHtml(artGrp.name)}</span>
          <span class="entity-sub">Artist · ${artGrp.ids.length} ${artGrp.ids.length === 1 ? 'song' : 'songs'}</span>
        </div>
      `;
      row.addEventListener('click', () => {
        state.libraryDetail = { type: 'artist', title: artGrp.name, art: artGrp.art, trackIds: artGrp.ids };
        renderLibrary();
      });
      artistsList.appendChild(row);
    }

    // All Songs list
    const tracksList = $('library-tracks-list');
    tracksList.innerHTML = '';
    $('library-track-count').textContent = `${state.tracks.length} ${state.tracks.length === 1 ? 'song' : 'songs'}`;
    if (state.tracks.length === 0) {
      tracksList.innerHTML = '<div class="empty-inline">No songs imported yet. Tap the Import icon above to add MP3s.</div>';
      return;
    }
    const allIds = state.tracks.map((t) => t.id);
    state.tracks.forEach((tr) => {
      tracksList.appendChild(createTrackRow(tr, allIds, 'PLAYING FROM LIBRARY', 'All Songs'));
    });
  }

  function renderLibraryDetail() {
    const detail = state.libraryDetail;
    $('library-root-content').hidden = true;
    $('library-detail-content').hidden = false;

    let trackIds = detail.trackIds || [];
    let title = detail.title;
    if (detail.type === 'playlist') {
      const pl = state.playlists.find((p) => p.id === detail.id);
      if (!pl) {
        state.libraryDetail = null;
        renderLibrary();
        return;
      }
      trackIds = (pl.trackIds || []).filter((id) => state.trackMap.has(id));
      title = pl.name;
    } else if (detail.type === 'favorites') {
      trackIds = state.tracks.filter((t) => t.favorite).map((t) => t.id);
    }

    const tracks = trackIds.map((id) => state.trackMap.get(id)).filter(Boolean);
    const heroArt = detail.art || (tracks[0] ? trackArt(tracks[0]) : getDefaultArtworkDataUrl());

    const hero = $('library-detail-header');
    hero.innerHTML = `
      <img src="${escapeHtml(heroArt)}" alt="">
      <div class="detail-hero-meta">
        <h2>${escapeHtml(title)}</h2>
        <p>${detail.subtitle ? `${escapeHtml(detail.subtitle)} · ` : ''}${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}</p>
        <div class="detail-actions">
          <button id="detail-play-btn" class="primary-pill-btn small" type="button">Play</button>
          ${detail.type === 'playlist' ? '<button id="detail-delete-pl-btn" class="text-pill-btn small" type="button">Delete Playlist</button>' : ''}
        </div>
      </div>
    `;

    $('detail-play-btn').addEventListener('click', () => {
      if (trackIds.length) playTrackFromList(trackIds[0], trackIds, 'PLAYING PLAYLIST', title);
      else showToast('This playlist is empty');
    });

    const delBtn = $('detail-delete-pl-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        await MusicDB.deletePlaylist(detail.id);
        state.playlists = state.playlists.filter((p) => p.id !== detail.id);
        state.libraryDetail = null;
        renderLibrary();
        showToast('Playlist deleted');
      });
    }

    const list = $('library-detail-tracks');
    list.innerHTML = '';
    if (!tracks.length) {
      list.innerHTML = '<div class="empty-inline">No tracks here yet. Use any track\'s ⋮ menu to add songs.</div>';
      return;
    }
    tracks.forEach((tr) => {
      list.appendChild(createTrackRow(tr, trackIds, 'PLAYING FROM LIBRARY', title));
    });
  }

  /* ------------------------------------------------------------------
   * View 4 (Tab 4): Import & Local Storage Stats
   * ------------------------------------------------------------------ */
  function renderImportStats() {
    const totalBytes = state.tracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);
    const favCount = state.tracks.filter((t) => t.favorite).length;
    $('stat-tracks').textContent = String(state.tracks.length);
    $('stat-playlists').textContent = String(state.playlists.length);
    $('stat-favorites').textContent = String(favCount);
    $('stat-storage').textContent = formatBytes(totalBytes);

    const isNative = Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
    const isStandalone = isNative || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    $('ios-install-tip').hidden = isStandalone;
  }

  function renderActiveViews() {
    if (state.activeTab === 'home') renderHome();
    if (state.activeTab === 'search') renderSearch();
    if (state.activeTab === 'library') renderLibrary();
    if (state.activeTab === 'import') renderImportStats();
  }

  /* ------------------------------------------------------------------
   * MP3 Batch Import Pipeline
   * ------------------------------------------------------------------ */
  async function handleFileImport(fileList) {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name)
    );
    if (!files.length) {
      showToast('No supported audio files selected');
      return;
    }

    const progressWrap = $('import-progress-wrap');
    const progressBar = $('import-progress-bar');
    const progressLabel = $('import-progress-label');
    const progressPct = $('import-progress-pct');

    progressWrap.hidden = false;
    let importedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct = Math.round(((i) / files.length) * 100);
      progressBar.style.width = `${pct}%`;
      progressPct.textContent = `${pct}%`;
      progressLabel.textContent = `Importing ${i + 1} of ${files.length}: ${file.name}`;

      try {
        const buffer = await file.arrayBuffer();
        const mimeType = file.type || 'audio/mpeg';
        const tags = await parseAudioTags(buffer, file.name);
        const duration = await probeAudioDuration(buffer, mimeType);

        const id = uid('trk');
        const track = {
          id,
          title: tags.title,
          artist: tags.artist,
          album: tags.album,
          genre: tags.genre,
          year: tags.year,
          lyrics: tags.lyrics,
          coverDataUrl: tags.coverDataUrl,
          palette: tags.palette,
          duration,
          playCount: 0,
          lastPlayedAt: 0,
          addedAt: Date.now(),
          favorite: false,
          fileName: file.name,
          fileSize: file.size || buffer.byteLength,
          mimeType
        };

        await MusicDB.putAudioFile(id, buffer, mimeType);
        await MusicDB.putTrack(track);
        state.tracks.unshift(track);
        importedCount++;
      } catch {
        // Continue importing remaining files if one file fails
      }
    }

    rebuildTrackMap();
    progressBar.style.width = '100%';
    progressPct.textContent = '100%';
    progressLabel.textContent = `Imported ${importedCount} ${importedCount === 1 ? 'track' : 'tracks'}`;
    setTimeout(() => {
      progressWrap.hidden = true;
    }, 1800);

    if (!state.currentTrackId && state.tracks.length > 0) {
      state.queue = state.tracks.map((t) => t.id);
      state.queueIndex = 0;
      await loadTrack(state.tracks[0].id, false);
    }

    updatePlayerUI();
    renderActiveViews();
    showToast(`Imported ${importedCount} MP3${importedCount === 1 ? '' : 's'}`);
  }

  /* ------------------------------------------------------------------
   * Modals, Lyrics, Queue, Timer, Metadata & Playlists
   * ------------------------------------------------------------------ */
  function openModal(modalId) {
    closeAllModals(false);
    $('modal-backdrop').hidden = false;
    $(modalId).hidden = false;
  }

  function closeAllModals(hideBackdrop = true) {
    document.querySelectorAll('.sheet-modal').forEach((m) => {
      m.hidden = true;
    });
    if (hideBackdrop) $('modal-backdrop').hidden = true;
  }

  function openLyricsModal(trackId = state.currentTrackId) {
    const track = state.trackMap.get(trackId);
    if (!track) {
      showToast('Play or select a track first');
      return;
    }
    state.activeModalTrackId = track.id;
    $('lyrics-track-sub').textContent = `${track.title} — ${track.artist}`;
    $('lyrics-view-pane').hidden = false;
    $('lyrics-edit-pane').hidden = true;
    $('lyrics-edit-toggle').textContent = 'Edit';

    if (track.lyrics && track.lyrics.trim()) {
      $('lyrics-view-pane').innerHTML = escapeHtml(track.lyrics).replace(/\n/g, '<br>');
    } else {
      $('lyrics-view-pane').innerHTML = '<p class="lyrics-empty">No lyrics saved for this track yet.<br><br>Tap <strong>Edit</strong> above to paste or write custom lyrics offline.</p>';
    }
    $('lyrics-textarea').value = track.lyrics || '';
    openModal('lyrics-modal');
  }

  function openQueueModal() {
    const list = $('queue-list');
    list.innerHTML = '';
    const labels = { off: 'Repeat: Off', all: 'Repeat: All', one: 'Repeat: One' };
    $('queue-repeat-btn').textContent = labels[state.repeat];

    const queueTracks = state.queue.map((id) => state.trackMap.get(id)).filter(Boolean);
    $('queue-count-sub').textContent = `${queueTracks.length} ${queueTracks.length === 1 ? 'track' : 'tracks'} in queue`;

    if (!queueTracks.length) {
      list.innerHTML = '<div class="empty-inline">Queue is empty.</div>';
    } else {
      queueTracks.forEach((tr, idx) => {
        const row = createTrackRow(tr, state.queue, state.sourceLabel, state.sourceName);
        if (idx === state.queueIndex) row.classList.add('is-playing');
        list.appendChild(row);
      });
    }
    openModal('queue-modal');
  }

  function openTimerHistoryModal(initialTab = 'timer') {
    switchSheetTab(initialTab);
    renderTimerOptionsUI();
    renderHistoryModalList();
    openModal('timer-history-modal');
  }

  function switchSheetTab(tab) {
    document.querySelectorAll('.sheet-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sheetTab === tab);
    });
    $('sheet-timer-pane').hidden = tab !== 'timer';
    $('sheet-history-pane').hidden = tab !== 'history';
  }

  function setSleepTimer(val) {
    clearInterval(state.sleepTimer.intervalId);
    state.sleepTimer.intervalId = null;

    if (val === '0') {
      state.sleepTimer.mode = 'off';
      state.sleepTimer.endsAt = 0;
      $('np-timer-badge').hidden = true;
      showToast('Sleep timer turned off');
    } else if (val === 'end') {
      state.sleepTimer.mode = 'end';
      state.sleepTimer.endsAt = 0;
      $('np-timer-badge').textContent = '1';
      $('np-timer-badge').hidden = false;
      showToast('Stopping after current track');
    } else {
      const mins = parseInt(val, 10);
      state.sleepTimer.mode = 'minutes';
      state.sleepTimer.endsAt = Date.now() + mins * 60 * 1000;
      updateSleepTimerBadge();
      state.sleepTimer.intervalId = setInterval(() => {
        const rem = state.sleepTimer.endsAt - Date.now();
        if (rem <= 0) {
          clearInterval(state.sleepTimer.intervalId);
          state.sleepTimer.mode = 'off';
          state.sleepTimer.intervalId = null;
          $('np-timer-badge').hidden = true;
          pausePlayback();
          showToast('Sleep timer paused playback');
        } else {
          updateSleepTimerBadge();
        }
      }, 1000);
      showToast(`Sleep timer set for ${mins} min`);
    }
    renderTimerOptionsUI();
  }

  function updateSleepTimerBadge() {
    if (state.sleepTimer.mode !== 'minutes') return;
    const minsLeft = Math.max(1, Math.ceil((state.sleepTimer.endsAt - Date.now()) / 60000));
    $('np-timer-badge').textContent = `${minsLeft}m`;
    $('np-timer-badge').hidden = false;
    $('timer-status-text').textContent = `Playback stops in ~${minsLeft} min.`;
  }

  function renderTimerOptionsUI() {
    if (state.sleepTimer.mode === 'off') {
      $('timer-status-text').textContent = 'Stop audio automatically after a set time.';
    } else if (state.sleepTimer.mode === 'end') {
      $('timer-status-text').textContent = 'Playback will stop when this track ends.';
    } else {
      updateSleepTimerBadge();
    }
    document.querySelectorAll('.timer-option-btn').forEach((btn) => {
      const m = btn.dataset.minutes;
      const active =
        (m === '0' && state.sleepTimer.mode === 'off') ||
        (m === 'end' && state.sleepTimer.mode === 'end');
      btn.classList.toggle('active', active);
    });
  }

  function renderHistoryModalList() {
    const list = $('history-list');
    list.innerHTML = '';
    const items = state.historyIds.map((id) => state.trackMap.get(id)).filter(Boolean);
    if (!items.length) {
      list.innerHTML = '<div class="empty-inline">No recently played tracks yet.</div>';
      return;
    }
    const ids = items.map((t) => t.id);
    items.forEach((tr) => {
      list.appendChild(createTrackRow(tr, ids, 'PLAYING HISTORY', 'Recently Played'));
    });
  }

  function openTrackMenuModal(trackId) {
    const track = state.trackMap.get(trackId);
    if (!track) return;
    state.activeModalTrackId = trackId;
    $('menu-track-art').src = trackArt(track);
    $('track-menu-title').textContent = track.title;
    $('track-menu-artist').textContent = track.artist;
    openModal('track-menu-modal');
  }

  function openEditMetaModal(trackId) {
    const track = state.trackMap.get(trackId);
    if (!track) return;
    state.activeModalTrackId = trackId;
    $('meta-title-input').value = track.title || '';
    $('meta-artist-input').value = track.artist || '';
    $('meta-album-input').value = track.album || '';
    $('meta-genre-input').value = track.genre || '';
    $('meta-year-input').value = track.year || '';
    openModal('edit-meta-modal');
  }

  function openPlaylistModal(trackId = null) {
    state.activeModalTrackId = trackId;
    $('playlist-modal-title').textContent = trackId ? 'Add to Playlist' : 'Create Playlist';
    const picker = $('playlist-picker-list');
    picker.innerHTML = '';

    if (!state.playlists.length) {
      picker.innerHTML = '<div class="empty-inline">No playlists yet. Create one above.</div>';
    } else {
      state.playlists.forEach((pl) => {
        const already = trackId && (pl.trackIds || []).includes(trackId);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'entity-row';
        row.innerHTML = `
          <div class="entity-cover">♫</div>
          <div class="entity-meta">
            <span class="entity-title">${escapeHtml(pl.name)}</span>
            <span class="entity-sub">${(pl.trackIds || []).length} songs${already ? ' · Added' : ''}</span>
          </div>
        `;
        row.addEventListener('click', async () => {
          if (!trackId) {
            closeAllModals();
            switchTab('library');
            state.libraryDetail = { type: 'playlist', id: pl.id, title: pl.name, trackIds: pl.trackIds || [] };
            renderLibrary();
            return;
          }
          if (!pl.trackIds) pl.trackIds = [];
          if (!pl.trackIds.includes(trackId)) {
            pl.trackIds.push(trackId);
            pl.updatedAt = Date.now();
            await MusicDB.putPlaylist(pl);
            showToast(`Added to ${pl.name}`);
          } else {
            showToast(`Already in ${pl.name}`);
          }
          closeAllModals();
          if (state.activeTab === 'library') renderLibrary();
        });
        picker.appendChild(row);
      });
    }
    openModal('playlist-modal');
  }

  async function deleteTrack(trackId) {
    const track = state.trackMap.get(trackId);
    if (!track) return;
    if (!window.confirm(`Delete "${track.title}" from your local library?`)) return;

    await MusicDB.deleteTrackAndAudio(trackId);
    state.tracks = state.tracks.filter((t) => t.id !== trackId);
    state.historyIds = state.historyIds.filter((id) => id !== trackId);
    state.queue = state.queue.filter((id) => id !== trackId);

    for (const pl of state.playlists) {
      if (pl.trackIds && pl.trackIds.includes(trackId)) {
        pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
        await MusicDB.putPlaylist(pl);
      }
    }
    rebuildTrackMap();

    if (state.currentTrackId === trackId) {
      pausePlayback();
      if (state.currentBlobUrl) {
        URL.revokeObjectURL(state.currentBlobUrl);
        state.currentBlobUrl = null;
      }
      audio.removeAttribute('src');
      state.currentTrackId = null;
      state.queueIndex = -1;
      closeNowPlaying();
    }

    closeAllModals();
    updatePlayerUI();
    renderActiveViews();
    persistPlaybackMeta();
    showToast('Track deleted');
  }

  async function shareCurrentTrack() {
    const track = state.trackMap.get(state.currentTrackId);
    if (!track) return;
    try {
      const rec = await MusicDB.getAudioRecord(track.id);
      if (rec && navigator.share) {
        const file = new File([rec.buffer], track.fileName || `${track.title}.mp3`, { type: rec.mimeType || 'audio/mpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: track.title, text: `${track.title} — ${track.artist}`, files: [file] });
          return;
        }
        await navigator.share({ title: track.title, text: `Listening to ${track.title} by ${track.artist}` });
        return;
      }
      if (rec) {
        const blob = new Blob([rec.buffer], { type: rec.mimeType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = track.fileName || `${track.title}.mp3`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Exported MP3 file');
      }
    } catch {
      // User dismissed share sheet
    }
  }

  /* ------------------------------------------------------------------
   * Event Wiring & Gestures
   * ------------------------------------------------------------------ */
  function bindEvents() {
    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // MP3 Import triggers
    const triggerPicker = () => $('mp3-file-input').click();
    $('home-import-btn').addEventListener('click', triggerPicker);
    $('empty-import-cta').addEventListener('click', triggerPicker);
    $('lib-import-btn').addEventListener('click', triggerPicker);
    $('import-mp3s-btn').addEventListener('click', triggerPicker);

    $('mp3-file-input').addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length) {
        await handleFileImport(e.target.files);
        e.target.value = '';
      }
    });

    // Mini Player
    $('mini-player-tap').addEventListener('click', openNowPlaying);
    $('mini-play-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
    $('mini-fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.currentTrackId) toggleFavorite(state.currentTrackId);
    });

    // Full-Screen Now Playing Controls
    $('np-collapse-btn').addEventListener('click', closeNowPlaying);
    $('np-play-btn').addEventListener('click', togglePlayPause);
    $('np-prev-btn').addEventListener('click', playPrevious);
    $('np-next-btn').addEventListener('click', () => playNext(true));
    $('np-fav-btn').addEventListener('click', () => {
      if (state.currentTrackId) toggleFavorite(state.currentTrackId);
    });
    $('np-shuffle-btn').addEventListener('click', toggleShuffle);
    $('np-queue-btn').addEventListener('click', openQueueModal);
    $('np-device-btn').addEventListener('click', openQueueModal);
    $('np-more-btn').addEventListener('click', () => openTrackMenuModal(state.currentTrackId));
    $('np-lyrics-btn').addEventListener('click', () => openLyricsModal(state.currentTrackId));
    $('np-timer-btn').addEventListener('click', () => openTimerHistoryModal('timer'));
    $('home-history-btn').addEventListener('click', () => openTimerHistoryModal('history'));
    $('np-share-btn').addEventListener('click', shareCurrentTrack);

    $('np-time-total').addEventListener('click', () => {
      state.showRemainingTime = !state.showRemainingTime;
      updateProgressUI();
    });

    // Scrubbable Seek Slider
    const slider = $('np-seek-slider');
    slider.addEventListener('input', () => {
      const track = state.trackMap.get(state.currentTrackId);
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (track && track.duration) || 0;
      if (dur > 0) {
        const nextTime = (parseFloat(slider.value) / 100) * dur;
        audio.currentTime = nextTime;
        updateProgressUI();
        syncPositionState();
      }
    });

    // Touch swipe gestures on Now Playing (swipe down to collapse, swipe left/right on art to skip)
    let touchStartX = 0;
    let touchStartY = 0;
    const npStage = $('np-artwork-stage');
    npStage.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    npStage.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
        closeNowPlaying();
      } else if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) playNext(true);
        else playPrevious();
      }
    }, { passive: true });

    // Audio Element Listeners
    audio.addEventListener('timeupdate', updateProgressUI);
    audio.addEventListener('loadedmetadata', () => {
      updateProgressUI();
      syncPositionState();
    });
    audio.addEventListener('play', () => {
      state.isPlaying = true;
      updatePlayButtonsUI();
      updateMediaSession(state.trackMap.get(state.currentTrackId));
    });
    audio.addEventListener('pause', () => {
      state.isPlaying = false;
      updatePlayButtonsUI();
      updateMediaSession(state.trackMap.get(state.currentTrackId));
    });
    audio.addEventListener('ended', () => {
      if (state.sleepTimer.mode === 'end') {
        state.sleepTimer.mode = 'off';
        $('np-timer-badge').hidden = true;
        state.isPlaying = false;
        updatePlayButtonsUI();
        showToast('Sleep timer stopped playback');
        return;
      }
      playNext(false);
    });

    // Search
    $('search-input').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderSearch();
    });
    $('search-clear-btn').addEventListener('click', () => {
      state.searchQuery = '';
      $('search-input').value = '';
      renderSearch();
    });
    $('search-back-btn').addEventListener('click', () => {
      state.activeCategory = null;
      renderSearch();
    });

    // Library Filters & Actions
    document.querySelectorAll('#library-filter-pills .filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.libraryFilter = chip.dataset.filter;
        state.libraryDetail = null;
        document.querySelectorAll('#library-filter-pills .filter-chip').forEach((c) => {
          c.classList.toggle('active', c === chip);
        });
        renderLibrary();
      });
    });
    $('library-detail-back').addEventListener('click', () => {
      state.libraryDetail = null;
      renderLibrary();
    });
    $('lib-new-playlist-btn').addEventListener('click', () => openPlaylistModal(null));
    $('import-create-playlist-btn').addEventListener('click', () => openPlaylistModal(null));
    $('import-open-library-btn').addEventListener('click', () => {
      state.libraryFilter = 'tracks';
      state.libraryDetail = null;
      switchTab('library');
      document.querySelectorAll('#library-filter-pills .filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.filter === 'tracks');
      });
      renderLibrary();
    });
    $('import-clear-library-btn').addEventListener('click', async () => {
      if (!window.confirm('Remove all imported MP3s, playlists, and lyrics from this device?')) return;
      pausePlayback();
      if (state.currentBlobUrl) {
        URL.revokeObjectURL(state.currentBlobUrl);
        state.currentBlobUrl = null;
      }
      audio.removeAttribute('src');
      await MusicDB.clearAll();
      state.tracks = [];
      state.playlists = [];
      state.historyIds = [];
      state.queue = [];
      state.queueIndex = -1;
      state.currentTrackId = null;
      rebuildTrackMap();
      updatePlayerUI();
      renderActiveViews();
      showToast('Local library cleared');
    });

    // Modals & Sheets
    $('modal-backdrop').addEventListener('click', () => closeAllModals(true));
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeAllModals(true));
    });

    // Lyrics Edit & Save
    $('lyrics-edit-toggle').addEventListener('click', () => {
      const editing = $('lyrics-edit-pane').hidden;
      $('lyrics-edit-pane').hidden = !editing;
      $('lyrics-view-pane').hidden = editing;
      $('lyrics-edit-toggle').textContent = editing ? 'Preview' : 'Edit';
    });
    $('lyrics-cancel-btn').addEventListener('click', () => {
      $('lyrics-edit-pane').hidden = true;
      $('lyrics-view-pane').hidden = false;
      $('lyrics-edit-toggle').textContent = 'Edit';
    });
    $('lyrics-save-btn').addEventListener('click', async () => {
      const track = state.trackMap.get(state.activeModalTrackId);
      if (!track) return;
      track.lyrics = $('lyrics-textarea').value;
      await MusicDB.putTrack(track);
      openLyricsModal(track.id);
      showToast('Lyrics saved');
    });

    // Queue Repeat
    $('queue-repeat-btn').addEventListener('click', cycleRepeat);

    // Timer & History Modal
    document.querySelectorAll('.sheet-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchSheetTab(btn.dataset.sheetTab));
    });
    document.querySelectorAll('.timer-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => setSleepTimer(btn.dataset.minutes));
    });

    // 3-Dot Track Menu Actions
    $('menu-play-next-btn').addEventListener('click', () => {
      const id = state.activeModalTrackId;
      if (!id) return;
      if (!state.queue.length) {
        playTrackFromList(id, [id]);
      } else {
        state.queue = state.queue.filter((qId) => qId !== id);
        const insertAt = Math.max(0, state.queueIndex + 1);
        state.queue.splice(insertAt, 0, id);
        persistPlaybackMeta();
        showToast('Added to play next');
      }
      closeAllModals();
    });
    $('menu-add-playlist-btn').addEventListener('click', () => openPlaylistModal(state.activeModalTrackId));
    $('menu-edit-meta-btn').addEventListener('click', () => openEditMetaModal(state.activeModalTrackId));
    $('menu-edit-lyrics-btn').addEventListener('click', () => openLyricsModal(state.activeModalTrackId));
    $('menu-delete-track-btn').addEventListener('click', () => deleteTrack(state.activeModalTrackId));

    // Edit Metadata Form
    $('edit-meta-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const track = state.trackMap.get(state.activeModalTrackId);
      if (!track) return;
      track.title = $('meta-title-input').value.trim() || track.title;
      track.artist = $('meta-artist-input').value.trim() || track.artist;
      track.album = $('meta-album-input').value.trim() || 'Single';
      track.genre = $('meta-genre-input').value.trim() || 'Music';
      track.year = $('meta-year-input').value.trim();
      await MusicDB.putTrack(track);
      closeAllModals();
      updatePlayerUI();
      updateMediaSession(track);
      renderActiveViews();
      showToast('Metadata updated');
    });

    // Create Playlist Form
    $('new-playlist-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('new-playlist-name').value.trim();
      if (!name) return;
      const playlist = {
        id: uid('pl'),
        name,
        trackIds: state.activeModalTrackId ? [state.activeModalTrackId] : [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await MusicDB.putPlaylist(playlist);
      state.playlists.unshift(playlist);
      $('new-playlist-name').value = '';
      if (state.activeModalTrackId) {
        closeAllModals();
        showToast(`Created "${name}" with track`);
      } else {
        openPlaylistModal(null);
        showToast(`Playlist "${name}" created`);
      }
      if (state.activeTab === 'library') renderLibrary();
      if (state.activeTab === 'import') renderImportStats();
    });
  }

  /* ------------------------------------------------------------------
   * Service Worker & Boot
   * ------------------------------------------------------------------ */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.update().catch(() => {});
      }).catch(() => {
        // Ignore registration errors in restricted preview contexts
      });
    }
  }

  async function boot() {
    bindEvents();
    initMediaSessionHandlers();
    registerServiceWorker();

    try {
      await MusicDB.open();
      const [tracks, playlists, playerState, historyIds] = await Promise.all([
        MusicDB.getAllTracks(),
        MusicDB.getAllPlaylists(),
        MusicDB.getMeta('playerState'),
        MusicDB.getMeta('historyIds')
      ]);

      state.tracks = (tracks || []).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      state.playlists = (playlists || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      rebuildTrackMap();

      state.historyIds = (historyIds || []).filter((id) => state.trackMap.has(id));

      if (playerState) {
        state.shuffle = Boolean(playerState.shuffle);
        state.repeat = playerState.repeat || 'off';
        state.sourceLabel = playerState.sourceLabel || 'PLAYING FROM LIBRARY';
        state.sourceName = playerState.sourceName || 'Local MP3s';
        state.queue = (playerState.queue || []).filter((id) => state.trackMap.has(id));
        if (playerState.currentTrackId && state.trackMap.has(playerState.currentTrackId)) {
          state.queueIndex = Math.max(0, state.queue.indexOf(playerState.currentTrackId));
          await loadTrack(playerState.currentTrackId, false);
        }
      }
    } catch {
      showToast('Offline storage unavailable in this browsing mode');
    }

    updatePlayerUI();
    renderHome();
    renderImportStats();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
