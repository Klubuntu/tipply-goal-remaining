const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
const outputName = process.argv[3];

if (!target || !outputName) {
  console.error('Usage: node scripts/build-standalone.js <target> <outputName>');
  process.exit(1);
}

const appDir = path.join(__dirname, '..');
const projectDir = path.join(appDir, '..');
const distDir = path.join(appDir, 'dist', outputName);
const isWinTarget = target.includes('win');
const executableName = isWinTarget ? `${outputName}.exe` : outputName;
const outputFile = path.join(distDir, executableName);

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

console.log(`Building standalone executable for ${target}...`);
execSync(`npx -y pkg@5.8.1 index.js --target ${target} --output "${outputFile}"`, {
  cwd: appDir,
  stdio: 'inherit',
});

const bundleDir = path.join(distDir, 'tipply-gr');
fs.mkdirSync(path.join(bundleDir, 'public'), { recursive: true });
fs.mkdirSync(path.join(bundleDir, 'public', 'fonts'), { recursive: true });

fs.cpSync(path.join(projectDir, 'config.json'), path.join(bundleDir, 'config.json'));
fs.cpSync(path.join(projectDir, 'public', 'css'), path.join(bundleDir, 'public', 'css'), { recursive: true });
fs.cpSync(path.join(projectDir, 'public', 'fonts'), path.join(bundleDir, 'public', 'fonts'), { recursive: true });

console.log(`Standalone build created in ${distDir}`);
