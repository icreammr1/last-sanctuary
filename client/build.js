// รวมซอร์สเป็น client/index.html (ไฟล์เดียว) แล้วเขียน client/config.js จาก env LS_SERVER (ถ้ามี)
const fs = require('fs');
const path = require('path');
const read = (...p) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');

const html =
  read('src', 'part1.html') +
  "(function(){\n'use strict';\n" +
  read('src', 'prelude.js') + '\n' +
  read('src', 'audio.js') + '\n' +
  read('..', 'shared', 'core.js') + '\n' +
  read('src', 'render.js') + '\n' +
  read('src', 'ui.js') + '\n' +
  '})();\n' +
  read('src', 'loader.html');

fs.writeFileSync(path.join(__dirname, 'index.html'), html);

const url = (process.env.LS_SERVER || '').trim();
if (url) {
  fs.writeFileSync(path.join(__dirname, 'config.js'), `window.LS_SERVER=${JSON.stringify(url)};\n`);
  console.log('config.js -> LS_SERVER =', url);
}
console.log('built client/index.html (' + Math.round(html.length / 1024) + ' KB)');
