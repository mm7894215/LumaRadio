// electron-builder afterPack 钩子：对打包出的 .app 做 ad-hoc 签名（identity "-"）。
// 不签名的 app 带上浏览器下载的 quarantine 标记后，macOS 会直接报"已损坏，
// 无法打开"且没有放行入口；ad-hoc 签名后降级为"无法验证开发者"，用户可在
// 系统设置 → 隐私与安全性 → "仍要打开" 放行。完全消除提示需要
// Developer ID 证书 + 公证。
// 在 afterPack 阶段执行（dmg 生成之前），保证 dmg 与 latest-mac.yml 的
// 哈希对应签名后的内容。
const { execFileSync } = require('child_process');
const path = require('path');

module.exports = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--verbose=2', appPath], { stdio: 'inherit' });
  console.log(`ad-hoc signed: ${appPath}`);
};
