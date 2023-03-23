import {latestRelease} from './index';
import {execSync} from 'child_process';
import * as assert from 'assert';
import {Bindown} from './install';
import * as path from 'path';
import * as fs from 'fs';

describe('latestRelease', () => {
  it('works', async () => {
    const latestTag = await latestRelease();
    assert.ok(latestTag.startsWith('v'));
  });
});

describe('Bindown.installBindown', () => {
  const testDir = path.join(__dirname, '..', 'tmp', 'test', 'Bindown.installBindown');
  it('works', async () => {
    const cacheDir = path.join(testDir, 'works');
    fs.rmSync(cacheDir, {recursive: true, force: true});
    const bindown = new Bindown({cacheDir, version: 'v3.12.0'});
    const installedBin = await bindown.installBindown();
    const resp = execSync(`${installedBin} version`, {encoding: 'utf8'}).trim();
    const bindownBinName = path.basename(installedBin);
    assert.strictEqual(resp, `${bindownBinName}: version 3.12.0`);
    fs.rmSync(cacheDir, {recursive: true});
  });

  it('invalid version', async () => {
    const cacheDir = path.join(testDir, 'invalid-version');
    fs.rmSync(cacheDir, {recursive: true, force: true});
    const bindown = new Bindown({cacheDir, version: 'v3.2.1'});
    let gotError: Error | undefined;
    try {
      await bindown.installBindown({force: true});
    } catch (err) {
      gotError = err;
    }
    assert.ok(gotError);
    const wantMessage = 'failed to download https://github.com/WillAbides/bindown/releases/download/v3.2.1/bindown_3.2.1_darwin_arm64.tar.gz: unexpected status code: 404';
    assert.strictEqual(gotError.message, wantMessage);
    const foundFiles = fs.readdirSync(cacheDir, {withFileTypes: true}).filter(dirent => dirent.isFile());
    assert.strictEqual(foundFiles.length, 0);
    fs.rmSync(cacheDir, {recursive: true});
  });

  it('invalid tar', async () => {
    const cacheDir = path.join(testDir, 'invalid-tar');
    fs.rmSync(cacheDir, {recursive: true, force: true});
    const bindown = new Bindown({cacheDir, version: 'v999.999.999'});
    fs.mkdirSync(path.dirname(bindown.tarPath), {recursive: true});
    fs.writeFileSync(bindown.tarPath, 'invalid tar');
    let gotError: Error | undefined;
    try {
      // force: false will keep it from overriting the bad tar
      await bindown.installBindown({force: false});
    } catch (err) {
      gotError = err;
    }
    assert.ok(gotError);
    assert.ok(gotError.message.startsWith('failed to extract'));
    fs.rmSync(cacheDir, {recursive: true});
  });
});
