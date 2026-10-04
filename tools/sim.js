// จำลองเกมแบบไม่มีหน้าจอ ให้บอทเล่นทุกตัว ไว้ดูบาลานซ์
// ใช้: node tools/sim.js [จำนวนผู้เล่น 1-4] [สาย เช่น tank,mage,gunner,support]
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'shared', 'core.js'), 'utf8');
const makeCore = new Function('HK', src + '\n;return API;');

const n = Math.min(4, Math.max(1, +process.argv[2] || 4));
const classes = (process.argv[3] || 'tank,mage,gunner,support').split(',');
let result = '';
const HK = {
  toast() {}, gtoast() {}, onChurchHit() {}, onStart() {}, onClassOpen() {}, onPick() {}, onClassConfirm() {},
  onEnd(win, reason) { result = win ? 'ชนะ' : 'แพ้ (' + reason + ')'; },
  autoConfirm: () => true,
};
const g = makeCore(HK);
g.startGame(n, true);
g.setBots(true, true);
const dt = 1 / 30;
let lastWave = 0, frames = 0;
while (g.state !== 'over' && frames < 400000) {
  if (g.state === 'classSelect') g.autoPick(classes);
  if (g.state === 'wave' || g.state === 'intermission') g.step(dt);
  frames++;
  if (g.wave !== lastWave) {
    lastWave = g.wave;
    console.log(`คลื่น ${String(g.wave).padStart(2)} | ${String(Math.round(g.T)).padStart(4)}s | โบสถ์ ${String(Math.round(g.churchHp)).padStart(4)} | รอด ${g.players.filter(p => p.alive).length}/${n} | เลเวล ${g.players.map(p => p.lvl).join('/')}`);
  }
}
console.log(`\nผล: ${result || 'ยังไม่จบ'} | ถึงคลื่น ${g.wave} | เวลาในเกม ${Math.round(g.T)} วินาที`);
console.log(g.players.map((p, i) => `ผู้เล่น ${i + 1} ${p.cls}: ฆ่า ${p.kills}, ดาเมจ ${Math.round(p.dealt)}, ฮีล ${Math.round(p.healed)}, ล้ม ${p.deaths}`).join('\n'));
