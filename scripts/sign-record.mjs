#!/usr/bin/env node
// Sign or verify an ad creative signaling record as the Record Signature section of
// draft-riedl-moq-ad-creative-signaling specifies: a JWS Compact Serialization with a
// detached, unencoded payload (RFC 7797) carried in the record's `sig` member, whose
// payload is the RFC 8785 (JCS) canonical form of the record without `sig`, signed with
// EdDSA / Ed25519 (RFC 8032, RFC 8037).
//
//   node scripts/sign-record.mjs keygen <kid>                        -> private JWK on stdout
//   node scripts/sign-record.mjs sign   <private.jwk.json> <record.json> [iat] -> signed record on stdout
//   node scripts/sign-record.mjs verify <jwks.json> <record.json> [max-age now] -> "ok <kid>" or a non-zero exit
//
// iat is the optional signing time of the Record Signature section, in seconds since the epoch,
// placed in the protected header and not listed in crit. verify enforces it only when a maximum
// age (seconds) is given; now (seconds) defaults to the system clock, and the same number of
// seconds is allowed into the future as clock difference.
//
// Node 20+ (node:crypto Ed25519). No dependencies.
import { readFileSync } from 'node:fs';
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';

// RFC 8785 for the JSON these records use: I-JSON numbers (JSON.stringify applies the ES6
// Number::toString that JCS mandates), member names sorted by UTF-16 code units (the default
// String sort), and JSON.stringify's string escaping, which matches JCS Section 3.2.2.2.
export function canonicalize(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalize).join(',') + ']';
  if (v !== null && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonicalize(v[k])).join(',') + '}';
  }
  if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('non-finite number');
  return JSON.stringify(v);
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => Buffer.from(s, 'base64url');

function payloadOf(record) {
  const { sig, ...rest } = record;
  return canonicalize(rest);
}

export function signRecord(record, privateJwk, iat) {
  const key = createPrivateKey({ key: privateJwk, format: 'jwk' });
  const protectedHeader = { alg: 'EdDSA', kid: privateJwk.kid, b64: false, crit: ['b64'] };
  if (iat !== undefined) protectedHeader.iat = iat;
  const ph = b64u(JSON.stringify(protectedHeader));
  const input = Buffer.from(ph + '.' + payloadOf(record), 'utf8');
  const signature = sign(null, input, key);
  return { ...record, sig: ph + '..' + b64u(signature) };
}

export function verifyRecord(record, jwks, maxAge, now) {
  if (typeof record.sig !== 'string') throw new Error('sig missing');
  const m = /^([A-Za-z0-9_-]+)\.\.([A-Za-z0-9_-]+)$/.exec(record.sig);
  if (!m) throw new Error('sig is not a detached compact JWS');
  const header = JSON.parse(unb64u(m[1]).toString('utf8'));
  if (header.alg !== 'EdDSA') throw new Error(`alg ${header.alg} not permitted`);
  if (header.b64 !== false || !Array.isArray(header.crit) || !header.crit.includes('b64')) throw new Error('payload must be unencoded (b64:false, crit:[b64])');
  // jku, jwk, x5u and x5c are not consulted: the draft says a record carrying them is verified
  // against the provisioned key set as if they were absent.
  const jwk = (jwks.keys || []).find((k) => k.kid === header.kid && k.kty === 'OKP' && k.crv === 'Ed25519');
  if (!jwk) throw new Error(`unknown kid ${header.kid}`);
  const key = createPublicKey({ key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x }, format: 'jwk' });
  const input = Buffer.from(m[1] + '.' + payloadOf(record), 'utf8');
  if (!verify(null, input, key, unb64u(m[2]))) throw new Error('signature does not verify');
  if (maxAge !== undefined) {
    if (typeof header.iat !== 'number') throw new Error('iat missing or not a number');
    if (now - header.iat > maxAge) throw new Error(`iat ${header.iat} is older than ${maxAge} s`);
    if (header.iat - now > maxAge) throw new Error(`iat ${header.iat} is more than ${maxAge} s in the future`);
  }
  return header.kid;
}

const [cmd, a, b, c, d] = process.argv.slice(2);
const num = (v, name) => { const n = Number(v); if (!Number.isFinite(n)) { console.error(`${name} must be a number of seconds`); process.exit(2); } return n; };
if (cmd === 'keygen') {
  const { privateKey } = generateKeyPairSync('ed25519');
  const jwk = privateKey.export({ format: 'jwk' });
  console.log(JSON.stringify({ ...jwk, kid: a || 'test', alg: 'EdDSA', use: 'sig' }, null, 2));
} else if (cmd === 'sign') {
  const priv = JSON.parse(readFileSync(a, 'utf8'));
  const rec = JSON.parse(readFileSync(b, 'utf8'));
  console.log(JSON.stringify(signRecord(rec, priv, c === undefined ? undefined : num(c, 'iat')), null, 2));
} else if (cmd === 'verify') {
  const jwks = JSON.parse(readFileSync(a, 'utf8'));
  const rec = JSON.parse(readFileSync(b, 'utf8'));
  const maxAge = c === undefined ? undefined : num(c, 'max-age');
  const now = d === undefined ? Math.floor(Date.now() / 1000) : num(d, 'now');
  try { console.log('ok', verifyRecord(rec, jwks, maxAge, now)); } catch (e) { console.error('FAIL', e.message); process.exit(1); }
} else if (cmd !== undefined) {
  console.error('usage: sign-record.mjs keygen <kid> | sign <private.jwk.json> <record.json> [iat] | verify <jwks.json> <record.json> [max-age now]');
  process.exit(2);
}
