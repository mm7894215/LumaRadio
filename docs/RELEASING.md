# 发布流程

发布由 GitHub Actions 的 `release (macOS)` workflow 全自动完成：校验版本 → 打 tag → 建 draft release → macOS universal 打包（dmg + zip）→ 资产齐全后原子发布。

## 步骤

1. **提交版本号**（版本必须先落在仓库里，workflow 只校验不代改）：

   ```bash
   npm version 1.0.1 --no-git-tag-version   # 同步 package.json + package-lock.json
   git add package.json package-lock.json
   git commit -m "chore: 版本号更新为 1.0.1"
   git push origin main
   ```

2. **触发发布**（网页 Actions 页面手动 Run workflow，或用 gh CLI）：

   ```bash
   gh workflow run "release (macOS)" -f version=1.0.1
   ```

3. 等 workflow 跑完（约 10–15 分钟，Electron 缓存命中后更快）。发布成功后 `releases/latest` 才会切到新版本。

## 产物

| 资产 | 用途 |
| --- | --- |
| `LumaRadio-{version}-universal.dmg` | 主分发包（应用内更新器 macOS 首选资产） |
| `LumaRadio-{version}-universal.zip` | 备用分发包 |
| `latest-mac.yml` | 更新器备用线路元数据（`releases/latest/download/latest-mac.yml`） |
| `*.blockmap` | 差量更新数据 |

## 设计要点

- **原子发布**：应用内更新器读 `releases/latest`，所以 release 先建为 draft（对外不可见），所有资产上传完成并校验后才 `--draft=false` 翻转上线，`releases/latest` 永远不会指向半成品。
- **可安全重跑**：构建失败后从同一 commit 重新 dispatch 即可，draft 资产用 `--clobber` 覆盖；已发布的 release 不可复用，只能 bump 版本。
- **fail-fast**：版本号与 package.json / package-lock.json 不一致时在 ubuntu 上 10 秒内失败，不浪费 macOS 构建分钟。
- **构建即验证**：打包前先跑 `npm run verify`（typecheck + 测试 + web 构建 + 冒烟测试），electron-builder 直接复用验证过的 `dist-web/`。
