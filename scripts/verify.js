const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const checks = [];
function assert(value, message) {
  if (!value) throw new Error(message);
  checks.push(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function rawRequest(port, requestPath) {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path: requestPath, method: 'GET' }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', reject);
    request.end();
  });
}

async function waitForServer(port, child) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`server.js 提前退出，exit=${child.exitCode}`);
    try {
      const response = await rawRequest(port, '/api/app/version');
      if (response.status === 200) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error('等待本地服务启动超时');
}

async function main() {
  const pkg = readJson('package.json');
  const manifest = readJson('public/manifest.webmanifest');
  readJson('public/default-user-fx-archive.json');
  assert(pkg.name === 'lumaradio' && pkg.productName === 'LumaRadio', 'package 品牌为 LumaRadio');
  assert(pkg.author === 'Rocky', 'package 署名为 Rocky');
  assert(pkg.license === 'GPL-3.0-only', 'package 保留 GPL-3.0');
  assert(manifest.name === 'LumaRadio' && manifest.display === 'standalone', 'PWA manifest 可安装');

  const required = [
    'index.html', 'src/main.ts', 'src/styles/player.css',
    'src/platform/browser-runtime.ts', 'src/platform/service-worker.ts',
    'public/generated/player.js', 'public/generated/service-worker.js',
    'dist-web/index.html', 'dist-web/generated/player.js',
    'dist-web/assets/app.js', 'dist-web/assets/index.css',
    'public/icons/lumaradio.svg', 'public/icons/lumaradio-192.png', 'public/icons/lumaradio-512.png',
    'build/icon.png', 'build/icon.icns', 'LICENSE', 'NOTICE.md'
  ];
  required.forEach((file) => assert(fs.existsSync(path.join(root, file)), `存在 ${file}`));

  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const playerCss = fs.readFileSync(path.join(root, 'src/styles/player.css'), 'utf8');
  assert(
    /\.splash-word-mine,\.splash-word-radio\{[^}]*position:absolute/s.test(playerCss)
      && playerCss.includes('clamp(88px,12.8vw,154px)')
      && playerCss.includes('clamp(96px,13.2vw,162px)'),
    '启动页保留原版分层动画并为 LumaRadio 提供更大的最终间距'
  );
  assert(indexHtml.split('\n').length < 1000 && !indexHtml.includes('Global State'), 'HTML 已缩减为纯界面模板');
  const runtimeFiles = fs.readdirSync(path.join(root, 'src/runtime')).filter((file) => file.endsWith('.ts'));
  assert(runtimeFiles.length >= 20, '播放器运行时已按领域拆分为 TypeScript 模块');
  assert(fs.statSync(path.join(root, 'dist-web', 'generated', 'player.js')).size > 500000, '完整播放器运行时已进入 Web 构建');

  ['server.js', 'desktop/main.js', 'desktop/preload.js', 'scripts/dev-web.js'].forEach((file) => {
    const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
    assert(result.status === 0, `${file} 语法正确${result.stderr ? `: ${result.stderr.trim()}` : ''}`);
  });

  const diff = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
  assert(diff.status === 0, `git diff --check 通过${diff.stdout ? `: ${diff.stdout.trim()}` : ''}`);

  const tempData = fs.mkdtempSync(path.join(os.tmpdir(), 'lumaradio-verify-'));
  const port = 32100 + Math.floor(Math.random() * 900);
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), LUMARADIO_DATA_DIR: tempData },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  try {
    await waitForServer(port, child);
    const version = await rawRequest(port, '/api/app/version');
    const versionJson = JSON.parse(version.body);
    assert(version.status === 200 && versionJson.productName === 'LumaRadio', '版本 API 返回 LumaRadio');

    const home = await rawRequest(port, '/');
    assert(home.status === 200 && home.body.includes('<title>LumaRadio'), 'Web 首页可访问');
    assert(home.headers['x-content-type-options'] === 'nosniff', '静态资源带安全响应头');

    const pwa = await rawRequest(port, '/manifest.webmanifest');
    assert(pwa.status === 200 && /application\/manifest\+json/.test(pwa.headers['content-type'] || ''), 'PWA manifest MIME 正确');
    const runtime = await rawRequest(port, '/generated/player.js');
    assert(runtime.status === 200 && runtime.body.includes('function animate()'), '模块化播放器运行时可访问');
    const appEntry = await rawRequest(port, '/assets/app.js');
    assert(appEntry.status === 200 && appEntry.body.includes('LumaRadio'), 'Vite 应用入口可访问');
    const worker = await rawRequest(port, '/generated/service-worker.js');
    assert(worker.status === 200 && worker.body.includes("'/assets/app.js'") && worker.body.includes("url.pathname.startsWith('/api/')") && worker.body.includes("request.destination === 'audio'"), 'Service worker 预缓存 Vite 入口并排除 API 与音频');

    const traversal = await rawRequest(port, '/..%2Fpackage.json');
    assert(traversal.status === 403 && !traversal.body.includes('lumaradio'), '静态目录穿越被拒绝');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
    fs.rmSync(tempData, { recursive: true, force: true });
  }

  console.log(`LumaRadio verification passed (${checks.length} checks).`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
