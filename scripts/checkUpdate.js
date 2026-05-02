#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function semverParts(v) {
  const m = /v?(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) return null;
  return m.slice(1).map(Number);
}

function compareSemver(a, b) {
  const pa = semverParts(a); const pb = semverParts(b);
  if (!pa || !pb) return a === b ? 0 : a > b ? 1 : -1;
  for (let i=0;i<3;i++) if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  return 0;
}

async function checkUpdate(opts = {}) {
  const repo = opts.repo || 'https://github.com/klubuntu/tipply-goal-remaining.git';
  const current = opts.currentVersion || (() => { try { return require(path.join(__dirname, '..', 'package.json')).version } catch (e) { return '0.0.0' } })();

  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (e) {
    console.log('git not available; skipping remote check');
    return { ok: false, reason: 'no-git' };
  }

  const out = execSync(`git ls-remote --tags ${repo}`, { encoding: 'utf8' });
  const tags = out.split('\n').map(l => {
    const parts = l.split('\t');
    if (parts.length < 2) return null;
    const ref = parts[1];
    const m = /refs\/tags\/(.+)$/.exec(ref);
    return m ? m[1] : null;
  }).filter(Boolean);

  // pick latest semver-like tag
  let latest = null;
  for (const t of tags) {
    if (!latest) { latest = t; continue; }
    if (compareSemver(t, latest) > 0) latest = t;
  }

  if (!latest) {
    console.log('No tags found on remote.');
    return { ok: false, reason: 'no-tags' };
  }

  const newer = compareSemver(latest, 'v'+current) > 0 || compareSemver(latest, current) > 0;
  if (!newer) {
    console.log('No newer release found. Current:', current, 'Latest:', latest);
    return { ok: true, upToDate: true, latest };
  }

  console.log('Update available:', latest, 'current:', current);
  if (opts.apply) {
    const tmp = path.join(os.tmpdir(), `tipply-update-${Date.now()}`);
    fs.mkdirSync(tmp, { recursive: true });
    console.log('Cloning tag', latest, 'to', tmp);
    execSync(`git clone --depth 1 --branch ${latest} ${repo} ${tmp}`, { stdio: 'inherit' });
    return { ok: true, upToDate: false, latest, path: tmp };
  }

  return { ok: true, upToDate: false, latest };
}

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const opts = {};
    for (let i=0;i<argv.length;i++) {
      if (argv[i] === '--apply' || argv[i] === '--fetch' || argv[i] === '--update') opts.apply = true;
      if (argv[i] === '--repo' && argv[i+1]) { opts.repo = argv[i+1]; i++; }
      if (argv[i] === '--current' && argv[i+1]) { opts.currentVersion = argv[i+1]; i++; }
    }
    try {
      const res = await checkUpdate(opts);
      if (res.ok && !res.upToDate) {
        console.log('Latest tag:', res.latest);
        if (res.path) console.log('Downloaded to:', res.path);
        else console.log('Run with --apply to fetch the release into a temp folder.');
      }
    } catch (e) {
      console.error('Update check failed:', e);
      process.exit(1);
    }
  })();
}

module.exports = checkUpdate;
