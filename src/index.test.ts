import {installBindown, latestRelease} from './index';
import {execSync} from 'child_process';
import {strictEqual, ok} from 'assert';

describe('latestRelease', () => {
  it('works', async () => {
    const latestTag = await latestRelease();
    ok(latestTag.startsWith('v'));
  });
});

describe('installBindown', () => {
  it('works', async () => {
    const installedBin = await installBindown('v3.12.0');
    const resp = execSync(`${installedBin} version`, {encoding: 'utf8'});
    strictEqual(resp.trim(), 'bindown: version 3.12.0');
  });
});
