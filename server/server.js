'use strict';
/**
 * เซิร์ฟเวอร์เกม "โบสถ์สุดท้าย" — ผู้ตัดสินเกมอยู่ที่เซิร์ฟเวอร์ (authoritative)
 * ไคลเอนต์ส่งแค่คำสั่ง (cast / upg / rev / revc / cls) และรับ snapshot (S / E / V)
 */
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080;
const SIM_HZ = +process.env.SIM_HZ || 30;      // ความถี่คำนวณเกม
const SNAP_HZ = +process.env.SNAP_HZ || 15;    // ความถี่ส่งภาพให้ผู้เล่น
const GAME_SPEED = +process.env.GAME_SPEED || 2;   // ความเร็วเกมออนไลน์ (2 = เร็วขึ้น 2 เท่า)
const MAX_ROOMS = +process.env.MAX_ROOMS || 100;
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'shared', 'core.js'), 'utf8');
const makeCore = new Function('HK', coreSrc + '\n;return API;');

const rooms = new Map();
function cleanName(v, i) {
  const n = String(v == null ? '' : v).replace(/[\u0000-\u001f<>&"']/g, '').trim().slice(0, 12);
  return n || ('ผู้เล่น ' + (i + 1));
}
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
function newCode() {
  for (let k = 0; k < 50; k++) {
    let s = '';
    for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!rooms.has(s)) return s;
  }
  return null;
}

class Room {
  constructor(code) {
    this.code = code;
    this.clients = [];
    this.game = null;
    this.started = false;
    this.timer = null;
    this.acc = 0;
    this.last = 0;
    this.snapAcc = 0;
    this.destroyed = false;
    this.emptySince = 0;
    this.ended = false;
    this.endTimer = null;
  }
  send(c, m) { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(m)); }
  broadcast(m) {
    const s = JSON.stringify(m);
    for (const c of this.clients) if (!c.gone && c.ws.readyState === 1) c.ws.send(s);
  }
  live() { return this.clients.filter(c => !c.gone); }
  lobbyList() { return this.clients.filter(c => c.inLobby !== false && !c.gone); }
  announceLobby() {
    const list = this.lobbyList();
    const names = list.map((c, i) => c.name || ('ผู้เล่น ' + (i + 1)));
    list.forEach((c, i) => { c.idx = i; this.send(c, { t: 'joined', idx: i, n: list.length, code: this.code, names, token: c.token }); });
  }
  add(c) {
    c.room = this; c.inLobby = true;
    this.clients.push(c);
    this.announceLobby();
  }
  remove(c) {
    if (this.started) {
      c.gone = true;
      if (this.ended) { if (!this.live().length) this.destroy(); return; }
      if (this.game) this.game.playerGone(c.idx);
      if (!this.live().length) this.emptySince = Date.now();   // รอเพื่อนกลับเข้าห้องได้ 90 วินาที
      return;
    }
    this.clients = this.clients.filter(x => x !== c);
    if (!this.clients.length) { this.destroy(); return; }
    this.announceLobby();   // ส่ง idx ใหม่ + จำนวนคน (คนแรกในล็อบบี้เป็นผู้เริ่มเกม)
  }
  resetLobby() {
    clearTimeout(this.endTimer); clearInterval(this.timer);
    this.game = null; this.started = false; this.ended = false;
    this.clients = this.clients.filter(x => !x.gone);
    this.clients.forEach(x => { x.inLobby = false; });
  }
  returnToLobby(c) {
    if (this.started && !this.ended) return;
    if (this.ended) this.resetLobby();
    c.inLobby = true;
    this.announceLobby();
  }
  start() {
    if (this.started) return;
    const stay = this.lobbyList();
    if (!stay.length) return;
    for (const c of this.clients) if (!stay.includes(c)) { c.room = null; try { c.ws.send(JSON.stringify({ t: 'error', m: 'ห้องเริ่มเกมใหม่แล้ว' })); } catch (e) { /* ignore */ } }
    this.clients = stay;
    this.clients.forEach((c, i) => { c.idx = i; });
    this.started = true;
    const room = this;
    const HK = {
      toast() {},
      gtoast(m) { room.broadcast({ t: 'toast', m }); },
      onEnd(win, reason) { room.sendSnaps(); room.ended = true; room.broadcast({ t: 'end', win, reason }); room.endTimer = setTimeout(() => room.destroy(), 10 * 60 * 1000); },
      onChurchHit() {}, onStart() {}, onClassOpen() {}, onPick() {}, onClassConfirm() {},
      autoConfirm: () => true,
    };
    this.game = makeCore(HK);
    this.game.startGame(this.clients.length, false, this.clients.map((c, i) => c.name || ('ผู้เล่น ' + (i + 1))));
    this.game.setNetSpeed(GAME_SPEED);
    this.clients.forEach((c, i) => this.send(c, { t: 'start', n: this.clients.length, idx: i }));
    this.last = Date.now();
    this.timer = setInterval(() => this.tick(), Math.floor(1000 / SIM_HZ));
  }
  sendSnaps() { for (const m of this.game.buildSnaps()) this.broadcast(m); }
  tick() {
    if (this.destroyed || !this.game) return;
    const now = Date.now();
    let dt = (now - this.last) / 1000; this.last = now;
    if (dt > 0.25) dt = 0.25;
    const g = this.game, step = 1 / SIM_HZ;
    if (g.state === 'over') { clearInterval(this.timer); return; }
    if (!this.live().length) {            // ไม่มีใครอยู่ในห้อง: หยุดเกมรอ
      this.last = now;
      if (now - this.emptySince > 90000) this.destroy();
      return;
    }
    this.acc += dt;
    let n = 0;
    while (this.acc >= step && n < 5) {
      if (g.state === 'wave' || g.state === 'intermission') g.step(step * GAME_SPEED);
      this.acc -= step; n++;
      if (g.state === 'over') break;
    }
    if (n === 5) this.acc = 0;
    this.snapAcc += dt;
    if (this.snapAcc >= 1 / SNAP_HZ) { this.snapAcc = 0; if (g.state !== 'over') this.sendSnaps(); }
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    clearInterval(this.timer);
    rooms.delete(this.code);
    for (const c of this.clients) { try { c.ws.close(); } catch (e) { /* ignore */ } }
  }
}

function handle(c, m) {
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  switch (m.t) {
    case 'create': {
      if (c.room) return;
      if (rooms.size >= MAX_ROOMS) { c.ws.send(JSON.stringify({ t: 'error', m: 'เซิร์ฟเวอร์เต็มชั่วคราว ลองใหม่ภายหลัง' })); return; }
      const code = newCode();
      if (!code) return;
      c.name = cleanName(m.name, 0);
      c.token = crypto.randomBytes(8).toString('hex');
      const r = new Room(code); rooms.set(code, r); r.add(c);
      break;
    }
    case 'join': {
      if (c.room) return;
      const r = rooms.get(String(m.code || '').toUpperCase().slice(0, 4));
      if (!r) { c.ws.send(JSON.stringify({ t: 'error', m: 'ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง' })); return; }
      if (r.started) { c.ws.send(JSON.stringify({ t: 'error', m: 'ห้องนี้เริ่มเกมไปแล้ว' })); return; }
      if (r.clients.filter(x => !x.gone).length >= 4) { c.ws.send(JSON.stringify({ t: 'error', m: 'ห้องเต็มแล้ว (สูงสุด 4 คน)' })); return; }
      c.name = cleanName(m.name, r.clients.length);
      c.token = crypto.randomBytes(8).toString('hex');
      r.add(c);
      break;
    }
    case 'rejoin': {
      if (c.room) return;
      const r = rooms.get(String(m.code || '').toUpperCase().slice(0, 4));
      const old = r && r.clients.find(x => x.token && x.token === m.token);
      if (!r || !old || !r.started || r.destroyed || !r.game) { c.ws.send(JSON.stringify({ t: 'error', m: 'กลับเข้าห้องเดิมไม่ได้ (ห้องปิดไปแล้ว)' })); return; }
      const prevWs = old.ws;
      c.room = r; c.idx = old.idx; c.name = old.name; c.token = old.token; c.gone = false;
      r.clients[old.idx] = c;
      old.room = null; old.gone = true;
      if (prevWs !== c.ws) { try { prevWs.close(); } catch (e) { /* ignore */ } }
      r.game.playerBack(c.idx);
      r.send(c, { t: 'start', n: r.clients.length, idx: c.idx });
      break;
    }
    case 'lobby':
      if (c.room && (c.room.ended || !c.room.started)) c.room.returnToLobby(c);
      break;
    case 'start':
      if (c.room && !c.room.started && c.room.lobbyList()[0] === c) c.room.start();
      break;
    default:
      if (c.room && c.room.started && c.room.game && !c.gone) c.room.game.applyCommand(c.idx, m);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
  } else { res.writeHead(404); res.end(); }
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });
wss.on('connection', (ws, req) => {
  if (ALLOWED.length && !ALLOWED.includes(req.headers.origin)) { ws.close(1008, 'origin not allowed'); return; }
  const c = { ws, room: null, idx: -1, gone: false, tokens: 60, ts: Date.now() };
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', data => {
    const now = Date.now();
    c.tokens = Math.min(60, c.tokens + (now - c.ts) / 1000 * 60); c.ts = now;   // จำกัด ~60 ข้อความ/วินาที
    if (c.tokens < 1) return;
    c.tokens -= 1;
    let m; try { m = JSON.parse(data.toString()); } catch (e) { return; }
    handle(c, m);
  });
  ws.on('close', () => { if (c.room) c.room.remove(c); });
  ws.on('error', () => {});
});

// ตรวจจับการเชื่อมต่อที่ค้าง (ping ทุก 25 วินาที)
const ping = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) { ws.terminate(); return; }
    ws.isAlive = false; try { ws.ping(); } catch (e) { /* ignore */ }
  });
}, 25000);

server.listen(PORT, () => console.log(`last-sanctuary server on :${PORT} (sim ${SIM_HZ}Hz x${GAME_SPEED}, snap ${SNAP_HZ}Hz)`));
process.on('SIGTERM', () => { clearInterval(ping); server.close(); process.exit(0); });
