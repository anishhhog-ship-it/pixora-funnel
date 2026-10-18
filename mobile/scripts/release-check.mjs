import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(mobileDir, fileName), 'utf8'));
}

function loadEnvFiles() {
  const values = {};

  for (const fileName of ['.env', '.env.local']) {
    const filePath = path.join(mobileDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/u);
      if (!match || match[1].startsWith('#')) continue;
      values[match[1]] = match[2].replace(/^(['"])(.*)\1$/u, '$2');
    }
  }

  return values;
}

const fileEnv = loadEnvFiles();
const env = (name) => process.env[name] ?? fileEnv[name] ?? '';
const errors = [];
const app = readJson('app.json').expo;
const eas = readJson('eas.json');
const packageJson = readJson('package.json');

if (packageJson.version !== app.version) {
  errors.push(`package.json version (${packageJson.version}) must match app.json version (${app.version})`);
}

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(app.version)) {
  errors.push(`app.json version (${app.version}) must be a valid release version`);
}

if (!Number.isInteger(app.android?.versionCode) || app.android.versionCode < 1) {
  errors.push('app.json android.versionCode must be a positive integer');
}

if (!/^\d+$/u.test(String(app.ios?.buildNumber ?? '')) || Number(app.ios.buildNumber) < 1) {
  errors.push('app.json ios.buildNumber must be a positive numeric string');
}

if (!app.android?.package) errors.push('app.json android.package is required');
if (!app.ios?.bundleIdentifier) errors.push('app.json ios.bundleIdentifier is required');

if (eas.cli?.appVersionSource !== 'remote') {
  errors.push('eas.json cli.appVersionSource must be remote for production auto-incrementing');
}

if (eas.build?.production?.environment !== 'production') {
  errors.push('eas.json production build must use the production EAS environment');
}

if (eas.build?.production?.distribution !== 'store') {
  errors.push('eas.json production build must use store distribution');
}

if (eas.build?.production?.autoIncrement !== true) {
  errors.push('eas.json production build must keep autoIncrement enabled');
}

if (
  eas.build?.['android-download']?.environment !== 'production' ||
  eas.build?.['android-download']?.distribution !== 'internal' ||
  eas.build?.['android-download']?.android?.buildType !== 'apk'
) {
  errors.push('eas.json android-download must be a production internal APK profile');
}

const requiredVariables = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_PUBLIC_APP_URL',
];

const placeholderPattern = /(?:^|[/:])(?:$|your[-_]|<|replace[-_ ]|change[-_ ]|example(?:[./]|$)|dummy[-_ ]|test[-_ ])/iu;

for (const name of requiredVariables) {
  const value = env(name).trim();
  if (placeholderPattern.test(value)) {
    errors.push(`${name} is missing or still contains a placeholder`);
  }
}

for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_PUBLIC_APP_URL']) {
  const value = env(name).trim();
  if (!value || placeholderPattern.test(value)) continue;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      errors.push(`${name} must use an https URL for a production build`);
    }
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
      errors.push(`${name} must not point to a local host for a production build`);
    }
  } catch {
    errors.push(`${name} must be a valid URL`);
  }
}

if (errors.length > 0) {
  console.error('Release readiness check failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error('');
  console.error('Set the public variables in the selected EAS environment or in a local ignored .env file.');
  process.exitCode = 1;
} else {
  console.log(`Release readiness check passed for Pixora Funnel ${app.version}.`);
  console.log(`Android ${app.android.package} / iOS ${app.ios.bundleIdentifier}`);
  console.log('Production EAS environment and remote build versioning are configured.');
}
