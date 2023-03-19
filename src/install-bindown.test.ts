import {strictEqual} from 'assert';
import {delimiter, join, resolve, basename} from 'path';
import {execSync} from 'child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'fs';

describe('install-bindown', function () {

  // - creates an npm package in a temp directory
  // - installs this package in the temp package
  // - runs `install-bindown` to install bindown
  // - runs `bindown version` to verify that bindown is installed
  it('installs bindown', async function () {
    this.timeout(15_000);
    const bindownNodeDir = resolve(__dirname, '..');
    const nodeModulesBin = join(bindownNodeDir, 'node_modules', '.bin');
    process.env.PATH = `${nodeModulesBin}${delimiter}${process.env.PATH}`
    const tempDir = join(bindownNodeDir, 'tmp', 'test', 'install-bindown', 'works');
    if (existsSync(tempDir)) {
      rmSync(tempDir, {recursive: true});
    }
    mkdirSync(tempDir, {recursive: true});
    const packName = execSync(`npm pack --pack-destination ${tempDir}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const packPath = join(tempDir, packName);

    const packageDir = join(tempDir, 'package');
    mkdirSync(packageDir);
    writeFileSync(join(packageDir, 'package.json'), '{}');

    execSync(`npm install ${packPath}`, {cwd: packageDir});

    const installBindownBin = join(packageDir, 'node_modules', '.bin', 'install-bindown');
    const bindownBin = execSync(`${installBindownBin} v3.12.0`, {
      cwd: packageDir,
      encoding: 'utf8'
    }).trim();

    const resp = execSync(`${bindownBin} version`, {encoding: 'utf8'}).trim();
    const bindownBinName = basename(bindownBin);
    strictEqual(resp, `${bindownBinName}: version 3.12.0`);

    rmSync(tempDir, {recursive: true});
  });
});
