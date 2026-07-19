const { execFile } = require('child_process');

process.env.HOST = process.env.HOST || '127.0.0.1';
process.env.PORT = process.env.PORT || '3000';

const server = require('../server');
const url = `http://${process.env.HOST}:${process.env.PORT}`;

function openBrowser() {
  const command = process.platform === 'darwin' ? 'open' : (process.platform === 'win32' ? 'cmd' : 'xdg-open');
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  execFile(command, args, (error) => {
    if (error) console.warn(`请手动打开 ${url}`);
  });
}

if (server.listening) openBrowser();
else server.once('listening', openBrowser);
