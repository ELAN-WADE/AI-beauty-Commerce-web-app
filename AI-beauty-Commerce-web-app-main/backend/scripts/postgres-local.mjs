// Windows development PostgreSQL. Native server, persistent data, no admin/Docker needed.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import postgres from 'postgres';

const root = fileURLToPath(new URL('../', import.meta.url));
config({ path: path.join(root, '.env') });
const action = process.argv[2] ?? 'status';
const localDir = path.join(root, '.local');
const toolsDir = path.join(localDir, 'postgres-tools');
const dataDir = path.join(localDir, 'postgres-data');
const logFile = path.join(localDir, 'postgres.log');
const binDir = path.join(toolsDir, 'node_modules', '@embedded-postgres', 'windows-x64', 'native', 'bin');
const pgCtl = path.join(binDir, 'pg_ctl.exe');
const packageVersion = '17.10.0-beta.17';
const defaults = 'postgres://glowly:glowly_dev_only@127.0.0.1:5433/glowly_dev';

function settings() {
  const url = new URL(process.env.DATABASE_URL ?? defaults);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.port !== '5433' || url.pathname !== '/glowly_dev') {
    throw new Error('This local helper expects DATABASE_URL on 127.0.0.1:5433/glowly_dev (see README).');
  }
  if (!url.username || !url.password) throw new Error('The local DATABASE_URL needs a username and password.');
  return {
    host: '127.0.0.1', port: 5433, database: 'postgres',
    username: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    max: 1, connect_timeout: 5,
  };
}

function control(args) {
  execFileSync(pgCtl, ['-D', dataDir, ...args], { stdio: 'inherit', windowsHide: true });
}

function running() {
  if (!existsSync(path.join(dataDir, 'PG_VERSION'))) return false;
  const result = spawnSync(pgCtl, ['-D', dataDir, 'status'], { encoding: 'utf8', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 3) return false;
  throw new Error(result.stderr || result.stdout || 'Could not check PostgreSQL status.');
}

async function checkConnection(createDatabases = false) {
  const sql = postgres(settings());
  try {
    const [server] = await sql`select current_setting('data_directory') as directory,
      current_setting('server_version') as version`;
    if (path.resolve(server.directory).toLowerCase() !== path.resolve(dataDir).toLowerCase()) {
      throw new Error('Port 5433 belongs to a different database cluster. No changes made to it.');
    }
    if (createDatabases) {
      for (const name of ['glowly_dev', 'glowly_test']) {
        const exists = await sql`select 1 from pg_database where datname = ${name}`;
        if (!exists.length) {
          await sql`create database ${sql(name)}`;
          console.log(`Created ${name}.`);
        }
      }
    }
    console.log(`PostgreSQL ${server.version} ready at 127.0.0.1:5433.`);
    console.log(`Data: ${dataDir}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('This helper targets Windows x64. Use the documented Docker setup on other platforms.');
  }
  if (process.env.NODE_ENV === 'production') throw new Error('This helper is for local development.');
  if (!['setup', 'start', 'stop', 'status'].includes(action)) {
    throw new Error('Usage: npm run db:local -- setup|start|stop|status');
  }

  if (action === 'setup' && !existsSync(pgCtl)) {
    if (!process.env.npm_execpath) throw new Error('Install via npm run db:local -- setup.');
    mkdirSync(toolsDir, { recursive: true });
    const manifest = path.join(toolsDir, 'package.json');
    if (!existsSync(manifest)) {
      writeFileSync(manifest, JSON.stringify({ name: 'glowly-local-postgres-tools', private: true }, null, 2));
    }
    // Isolated tooling install: does not add PostgreSQL binaries to app dependencies.
    execFileSync(process.execPath, [process.env.npm_execpath, 'install', '--prefix', toolsDir,
      '--save-exact', '--no-audit', '--no-fund', `@embedded-postgres/windows-x64@${packageVersion}`],
    { cwd: root, stdio: 'inherit', windowsHide: true });
  }
  if (!existsSync(pgCtl)) throw new Error('Run npm run db:local -- setup first.');

  if (action === 'stop') {
    if (running()) control(['stop', '-m', 'fast', '-w', '-t', '60']);
    else console.log('Local PostgreSQL is already stopped.');
    return;
  }
  if (action === 'status') {
    if (!running()) throw new Error('Local PostgreSQL is stopped. Run npm run db:local -- start.');
    await checkConnection();
    return;
  }

  const options = settings();
  if (!existsSync(path.join(dataDir, 'PG_VERSION'))) {
    if (action !== 'setup') throw new Error('Run npm run db:local -- setup to initialize the cluster.');
    const passwordFile = path.join(localDir, 'initdb-password');
    writeFileSync(passwordFile, `${options.password}\n`, { mode: 0o600, flag: 'wx' });
    try {
      execFileSync(path.join(binDir, 'initdb.exe'), [
        '-D', dataDir, '-U', options.username, '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C',
        `--pwfile=${passwordFile}`,
      ], { stdio: 'inherit', windowsHide: true });
    } finally {
      unlinkSync(passwordFile);
    }
  } else if (readFileSync(path.join(dataDir, 'PG_VERSION'), 'utf8').trim() !== '17') {
    throw new Error('Existing data belongs to another PostgreSQL major version; refusing to start it.');
  }
  if (!running()) control(['start', '-l', logFile, '-w', '-t', '60', '-o', '-h 127.0.0.1 -p 5433']);
  await checkConnection(true);
}

main().catch(error => {
  console.error(error.message ?? error);
  if (existsSync(logFile)) console.error(`PostgreSQL log: ${logFile}`);
  process.exitCode = 1;
});
