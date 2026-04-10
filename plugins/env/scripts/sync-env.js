#!/usr/bin/env node
// sync-env.js — env.json 기반 Claude Code 환경 동기화 (bootstrap용)
// 새 PC에서 비대화형으로 실행. 충돌 시 env.json 우선 (덮어쓰기).
// 대화형 충돌 해결은 /env-sync 스킬이 처리.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const ENV_FILE = path.join(SCRIPT_DIR, '..', 'env.json');
const HOME = process.env.HOME || process.env.USERPROFILE;
const SETTINGS_FILE = path.join(HOME, '.claude', 'settings.json');

// --- 변수 치환 ---
function substituteVars(obj) {
  const vars = { HOME, USER: process.env.USER || process.env.USERNAME || '' };
  const sub = (s) => s.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] || '');

  if (typeof obj === 'string') return sub(obj);
  if (Array.isArray(obj)) return obj.map(substituteVars);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, substituteVars(v)]));
  }
  return obj;
}

// --- Deep merge (source → target) ---
function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && !Array.isArray(val) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      deepMerge(target[key], val);
    } else {
      target[key] = val;
    }
  }
  return target;
}

// --- CLI 실행 ---
function run(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    return true;
  } catch { return false; }
}

// --- Main ---
if (!fs.existsSync(ENV_FILE)) {
  console.error('env.json not found:', ENV_FILE);
  process.exit(0);
}

const env = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8'));
const settings = fs.existsSync(SETTINGS_FILE)
  ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
  : {};

const installed = Object.keys(settings.enabledPlugins || {});

// 1. 마켓플레이스 등록 및 업데이트
console.log('--- 마켓플레이스 ---');
for (const m of (env.marketplaces || [])) {
  const addCmd = m.git
    ? `claude plugin marketplace add --git "${m.git}"`
    : `claude plugin marketplace add "${m.repo}"`;
  run(addCmd);
  run(`claude plugin marketplace update "${m.name}"`);
  console.log(`  ${m.name}: done`);
}

// 2. 플러그인 설치/업데이트
console.log('--- 플러그인 ---');
for (const [plugin, version] of Object.entries(env.plugins || {})) {
  if (installed.includes(plugin)) {
    run(`claude plugin update "${plugin}"`);
    console.log(`  ${plugin}: updated`);
  } else {
    run(`claude plugin install "${plugin}"`);
    console.log(`  ${plugin}: installed`);
  }
}

// 3. CLI 도구 설치
console.log('--- CLI ---');
for (const cli of (env.clis || [])) {
  const installed = run(substituteVars(cli.check));
  if (installed) {
    console.log(`  ${cli.name}: already installed`);
  } else {
    const ok = run(substituteVars(cli.install));
    console.log(`  ${cli.name}: ${ok ? 'installed' : 'FAILED'}`);
  }
}

// 4. settings 병합 (변수 치환 적용)
console.log('--- settings ---');
if (env.settings) {
  deepMerge(settings, substituteVars(env.settings));
  console.log('  settings merged');
}

// 5. mcpServers 병합
if (env.mcpServers && Object.keys(env.mcpServers).length > 0) {
  settings.mcpServers = settings.mcpServers || {};
  deepMerge(settings.mcpServers, substituteVars(env.mcpServers));
  console.log('  mcpServers merged');
}

// 6. hooks 병합
if (env.hooks && Object.keys(env.hooks).length > 0) {
  settings.hooks = settings.hooks || {};
  for (const [event, entries] of Object.entries(substituteVars(env.hooks))) {
    settings.hooks[event] = settings.hooks[event] || [];
    // 중복 방지: command 기준으로 체크
    for (const entry of entries) {
      const cmds = (entry.hooks || []).map(h => h.command).join('|');
      const exists = settings.hooks[event].some(e =>
        (e.hooks || []).map(h => h.command).join('|') === cmds
      );
      if (!exists) {
        settings.hooks[event].push(entry);
      }
    }
  }
  console.log('  hooks merged');
}

// 7. settings.json 저장
const settingsDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true });
fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
console.log('--- 완료 ---');
