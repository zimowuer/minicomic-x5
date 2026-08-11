function add32(a, b) { return (a + b) & 0xffffffff; }

function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

function md5Block(bytes, offset, state) {
    const x = [];
    for (let i = 0; i < 16; i++) {
        const p = offset + i * 4;
        x[i] = bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24);
    }
    let a = state[0], b = state[1], c = state[2], d = state[3];
    const oa = a, ob = b, oc = c, od = d;
    a=ff(a,b,c,d,x[0],7,-680876936); d=ff(d,a,b,c,x[1],12,-389564586); c=ff(c,d,a,b,x[2],17,606105819); b=ff(b,c,d,a,x[3],22,-1044525330);
    a=ff(a,b,c,d,x[4],7,-176418897); d=ff(d,a,b,c,x[5],12,1200080426); c=ff(c,d,a,b,x[6],17,-1473231341); b=ff(b,c,d,a,x[7],22,-45705983);
    a=ff(a,b,c,d,x[8],7,1770035416); d=ff(d,a,b,c,x[9],12,-1958414417); c=ff(c,d,a,b,x[10],17,-42063); b=ff(b,c,d,a,x[11],22,-1990404162);
    a=ff(a,b,c,d,x[12],7,1804603682); d=ff(d,a,b,c,x[13],12,-40341101); c=ff(c,d,a,b,x[14],17,-1502002290); b=ff(b,c,d,a,x[15],22,1236535329);
    a=gg(a,b,c,d,x[1],5,-165796510); d=gg(d,a,b,c,x[6],9,-1069501632); c=gg(c,d,a,b,x[11],14,643717713); b=gg(b,c,d,a,x[0],20,-373897302);
    a=gg(a,b,c,d,x[5],5,-701558691); d=gg(d,a,b,c,x[10],9,38016083); c=gg(c,d,a,b,x[15],14,-660478335); b=gg(b,c,d,a,x[4],20,-405537848);
    a=gg(a,b,c,d,x[9],5,568446438); d=gg(d,a,b,c,x[14],9,-1019803690); c=gg(c,d,a,b,x[3],14,-187363961); b=gg(b,c,d,a,x[8],20,1163531501);
    a=gg(a,b,c,d,x[13],5,-1444681467); d=gg(d,a,b,c,x[2],9,-51403784); c=gg(c,d,a,b,x[7],14,1735328473); b=gg(b,c,d,a,x[12],20,-1926607734);
    a=hh(a,b,c,d,x[5],4,-378558); d=hh(d,a,b,c,x[8],11,-2022574463); c=hh(c,d,a,b,x[11],16,1839030562); b=hh(b,c,d,a,x[14],23,-35309556);
    a=hh(a,b,c,d,x[1],4,-1530992060); d=hh(d,a,b,c,x[4],11,1272893353); c=hh(c,d,a,b,x[7],16,-155497632); b=hh(b,c,d,a,x[10],23,-1094730640);
    a=hh(a,b,c,d,x[13],4,681279174); d=hh(d,a,b,c,x[0],11,-358537222); c=hh(c,d,a,b,x[3],16,-722521979); b=hh(b,c,d,a,x[6],23,76029189);
    a=hh(a,b,c,d,x[9],4,-640364487); d=hh(d,a,b,c,x[12],11,-421815835); c=hh(c,d,a,b,x[15],16,530742520); b=hh(b,c,d,a,x[2],23,-995338651);
    a=ii(a,b,c,d,x[0],6,-198630844); d=ii(d,a,b,c,x[7],10,1126891415); c=ii(c,d,a,b,x[14],15,-1416354905); b=ii(b,c,d,a,x[5],21,-57434055);
    a=ii(a,b,c,d,x[12],6,1700485571); d=ii(d,a,b,c,x[3],10,-1894986606); c=ii(c,d,a,b,x[10],15,-1051523); b=ii(b,c,d,a,x[1],21,-2054922799);
    a=ii(a,b,c,d,x[8],6,1873313359); d=ii(d,a,b,c,x[15],10,-30611744); c=ii(c,d,a,b,x[6],15,-1560198380); b=ii(b,c,d,a,x[13],21,1309151649);
    a=ii(a,b,c,d,x[4],6,-145523070); d=ii(d,a,b,c,x[11],10,-1120210379); c=ii(c,d,a,b,x[2],15,718787259); b=ii(b,c,d,a,x[9],21,-343485551);
    state[0]=add32(oa,a); state[1]=add32(ob,b); state[2]=add32(oc,c); state[3]=add32(od,d);
}

export function utf8Bytes(value) {
    const encoded = unescape(encodeURIComponent(value));
    const out = [];
    for (let i = 0; i < encoded.length; i++) out.push(encoded.charCodeAt(i));
    return out;
}

export function md5(value) {
    const bytes = utf8Bytes(value);
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 0; i < 8; i++) bytes.push(i < 4 ? (bitLength >>> (i * 8)) & 255 : 0);
    const state = [1732584193, -271733879, -1732584194, 271733878];
    for (let i = 0; i < bytes.length; i += 64) md5Block(bytes, i, state);
    let result = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) result += ('0' + ((state[i] >>> (j * 8)) & 255).toString(16)).slice(-2);
    return result;
}

function gfMul(a, b) {
    let result = 0;
    while (b) {
        if (b & 1) result ^= a;
        a = (a << 1) ^ ((a & 0x80) ? 0x11b : 0);
        b >>>= 1;
    }
    return result & 255;
}

function gfPow(a, n) {
    let result = 1;
    while (n) { if (n & 1) result = gfMul(result, a); a = gfMul(a, a); n >>>= 1; }
    return result;
}

const SBOX = [], INV_SBOX = [];
for (let n = 0; n < 256; n++) {
    const inv = n ? gfPow(n, 254) : 0;
    const s = (inv ^ ((inv << 1) | (inv >>> 7)) ^ ((inv << 2) | (inv >>> 6)) ^ ((inv << 3) | (inv >>> 5)) ^ ((inv << 4) | (inv >>> 4)) ^ 0x63) & 255;
    SBOX[n] = s; INV_SBOX[s] = n;
}

function expandKey(key) {
    const out = key.slice();
    const keyBytes = key.length;
    const targetBytes = keyBytes === 32 ? 240 : 176;
    let rcon = 1;
    for (let i = keyBytes; i < targetBytes; i += 4) {
        let t = out.slice(i - 4, i);
        if (i % keyBytes === 0) {
            t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
            rcon = gfMul(rcon, 2);
        } else if (keyBytes === 32 && i % keyBytes === 16) {
            t = t.map(value => SBOX[value]);
        }
        for (let j = 0; j < 4; j++) out[i + j] = out[i - keyBytes + j] ^ t[j];
    }
    return out;
}

function decryptBlock(block, keys) {
    const s = block.slice();
    const rounds = keys.length / 16 - 1;
    const addKey = round => { for (let i = 0; i < 16; i++) s[i] ^= keys[round * 16 + i]; };
    const invShift = () => {
        const t = s.slice();
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s[r + 4 * c] = t[r + 4 * ((c - r + 4) % 4)];
    };
    const invSub = () => { for (let i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]]; };
    const invMix = () => {
        for (let c = 0; c < 4; c++) {
            const i = c * 4, a=s[i], b=s[i+1], d=s[i+2], e=s[i+3];
            s[i]=gfMul(a,14)^gfMul(b,11)^gfMul(d,13)^gfMul(e,9);
            s[i+1]=gfMul(a,9)^gfMul(b,14)^gfMul(d,11)^gfMul(e,13);
            s[i+2]=gfMul(a,13)^gfMul(b,9)^gfMul(d,14)^gfMul(e,11);
            s[i+3]=gfMul(a,11)^gfMul(b,13)^gfMul(d,9)^gfMul(e,14);
        }
    };
    addKey(rounds);
    for (let round = rounds - 1; round > 0; round--) { invShift(); invSub(); addKey(round); invMix(); }
    invShift(); invSub(); addKey(0);
    return s;
}

function base64Bytes(value) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const clean = value.replace(/[^A-Za-z0-9+/]/g, '');
    const out = [];
    let buffer = 0, bits = 0;
    for (let i = 0; i < clean.length; i++) {
        buffer = (buffer << 6) | chars.indexOf(clean[i]); bits += 6;
        if (bits >= 8) { bits -= 8; out.push((buffer >>> bits) & 255); }
    }
    return out;
}

function decodeUtf8(bytes) {
    let raw = '';
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(raw)); } catch (_) { return raw; }
}

export function aesEcbDecryptBase64(value, keyText) {
    const encrypted = base64Bytes(value);
    const keys = expandKey(utf8Bytes(keyText));
    let plain = [];
    for (let i = 0; i < encrypted.length; i += 16) plain = plain.concat(decryptBlock(encrypted.slice(i, i + 16), keys));
    const padding = plain[plain.length - 1];
    if (padding > 0 && padding <= 16) plain = plain.slice(0, plain.length - padding);
    return decodeUtf8(plain);
}

const SHA256_K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];

function sha256Raw(input) {
    const bytes = Array.isArray(input) ? input.slice() : utf8Bytes(input);
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLength >>> (i * 8)) & 255);
    const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < bytes.length; offset += 64) {
        const w = [];
        for (let i = 0; i < 16; i++) {
            const p = offset + i * 4;
            w[i] = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
        }
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
            const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
            w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
        }
        let [a,b,c,d,e,f,g,j] = h;
        for (let i = 0; i < 64; i++) {
            const s1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
            const ch = (e & f) ^ ((~e) & g);
            const t1 = (j + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
            const s0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (s0 + maj) >>> 0;
            j=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
        }
        h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
        h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+j)>>>0;
    }
    const out = [];
    for (let i = 0; i < h.length; i++) out.push((h[i]>>>24)&255,(h[i]>>>16)&255,(h[i]>>>8)&255,h[i]&255);
    return out;
}

function bytesHex(bytes) { return bytes.map(value => ('0' + value.toString(16)).slice(-2)).join(''); }
export function sha256(value) { return bytesHex(sha256Raw(value)); }

export function hmacSha256(key, value) {
    let keyBytes = utf8Bytes(key);
    if (keyBytes.length > 64) keyBytes = sha256Raw(keyBytes);
    while (keyBytes.length < 64) keyBytes.push(0);
    const inner = keyBytes.map(byte => byte ^ 0x36).concat(utf8Bytes(value));
    const outer = keyBytes.map(byte => byte ^ 0x5c).concat(sha256Raw(inner));
    return bytesHex(sha256Raw(outer));
}
