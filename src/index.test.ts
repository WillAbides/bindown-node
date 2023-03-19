import {latestRelease} from './index';
import {execSync} from 'child_process';
import {strictEqual, ok} from 'assert';
import {Bindown} from './install';
import {basename} from 'path';

describe('latestRelease', () => {
  it('works', async () => {
    const latestTag = await latestRelease();
    ok(latestTag.startsWith('v'));
  });
});

describe('Bindown.installBindown', () => {
  it('works', async () => {
    const bindown = new Bindown({version: 'v3.12.0'});
    const installedBin = await bindown.installBindown({force: true});
    const resp = execSync(`${installedBin} version`, {encoding: 'utf8'}).trim();
    const bindownBinName = basename(installedBin);
    strictEqual(resp, `${bindownBinName}: version 3.12.0`);
  });
});
