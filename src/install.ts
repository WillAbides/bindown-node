import {dirname, join, parse} from 'path';
import get from 'axios';
import {copyFileSync, createWriteStream, existsSync, mkdirSync} from 'fs';
import decompress from 'decompress';
import followRedirects from 'follow-redirects';

const RELEASES_URL = 'https://github.com/WillAbides/bindown/releases';

function findNodeModules(): string {
  let dir = __dirname;
  while (parse(dir).root !== dirname(dir)) {
    const nodeModules = join(dir, 'node_modules');
    if (existsSync(nodeModules)) {
      return nodeModules;
    }
    dir = dirname(dir);
  }
  throw new Error('could not find node_modules');
}

export function defaultCacheDir(): string {
  return join(findNodeModules(), '.cache', 'bindown-node');
}

// latestRelease gets the latest release of bindown from GitHub.
export async function latestRelease(): Promise<string> {
  const url = `${RELEASES_URL}/latest`;
  return new Promise<string>((resolve, reject) => {
    followRedirects.https.get(url, (res) => {
      const parts = res.responseUrl.split('/');
      resolve(parts[parts.length - 1]);
    }).on('error', reject);
  });
}


const platformToGoos: { [key: string]: string } = {
  android: 'android',
  darwin: 'darwin',
  freebsd: 'freebsd',
  linux: 'linux',
  netbsd: 'netbsd',
  openbsd: 'openbsd',
  sunos: 'solaris',
  win32: 'windows',
};

const archToGoarch: { [key: string]: string } = {
  arm: 'arm',
  arm64: 'arm64',
  ia32: '386',
  loong64: 'loong64',
  mips64el: 'mips64le',
  ppc64: 'ppc64le',
  riscv64: 'riscv64',
  s390x: 's390x',
  x64: 'amd64',
}

function getGoos(configPlatform?: string): string {
  const nodePlatform = configPlatform ?? process.platform.toString();
  const goos = platformToGoos[nodePlatform];
  if (!goos) {
    throw new Error(`unknown platform: ${nodePlatform}`);
  }
  return goos;
}

function getGoarch(configArch?: string): string {
  const nodeArch = configArch ?? process.arch.toString();
  const goarch = archToGoarch[nodeArch];
  if (!goarch) {
    throw new Error(`unknown arch: ${nodeArch}`);
  }
  return goarch;
}

async function download(url: string, target: string) {
  const writer = createWriteStream(target);
  const response = await get(url, {
    responseType: 'stream',
    maxRedirects: 10
  });
  response.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

interface Options {
  // If defined, the bindown binary will be copied to this path. Absolute paths are recommended.
  target?: string;
  // The platform (os) to install bindown for. Defaults to process.platform.toString()
  platform?: string;
  // The architecture to install bindown for. Defaults to process.arch.toString()
  arch?: string;
  // The directory where cache files will be stored. Defaults to node_modules/.cache/bindown
  cacheDir?: string;
  // Forces a download even if it is already cached.
  force?: boolean;
  // No friendly errors. Just throw.
  debug?: boolean;
}

// installBindown installs bindown and returns the path to the bindown binary.
// version is the version of bindown to install. Must be a release found at
// https://github.com/WillAbides/bindown/releases. Remember they all start with "v".
export async function installBindown(version: string, options: Options = {}): Promise<string> {
  const cacheDir = options.cacheDir ?? defaultCacheDir();
  const goos = getGoos(options.platform);
  const goarch = getGoarch(options.arch);
  const force = options.force ?? false;
  const rawVersion = version.replace(/^v/, '');
  const tarName = `bindown_${rawVersion}_${goos}_${goarch}.tar.gz`;
  const url = `${RELEASES_URL}/download/${version}/${tarName}`;
  const fullCacheDir = join(cacheDir, version, goos, goarch);
  mkdirSync(fullCacheDir, {recursive: true})
  const tarPath = join(fullCacheDir, tarName);
  if (force || !existsSync(tarPath)) {
    try {
      await download(url, tarPath);
    } catch (err) {
      if (options.debug) {
        throw err;
      }
      throw new Error(`failed to download ${url}: ${err.message}`);
    }
  }
  const cachedBin = join(fullCacheDir, goos === 'windows' ? 'bindown.exe' : 'bindown');
  if (force || !existsSync(cachedBin)) {
    await decompress(tarPath, fullCacheDir);
  }
  if (!options.target) {
    return cachedBin;
  }
  const target = options.target;
  const targetDir = dirname(target);
  mkdirSync(targetDir, {recursive: true});
  copyFileSync(cachedBin, target);
  return target;
}
