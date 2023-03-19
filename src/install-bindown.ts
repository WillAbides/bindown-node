#!/usr/bin/env node

import yargs from 'yargs';
import {defaultCacheDir, Bindown} from './install';

const description =
  'install-bindown will download and extract the bindown binary for the given version, platform, and architecture.';

yargs(process.argv.slice(2))
  .command({
    command: '$0 <bindown-version> [args]',
    describe: description,
    builder: (y) => y
      .positional('bindown-version', {
        description: 'the version of bindown to install',
      })
      .option('platform', {
        description: 'the platform to install bindown for',
        default: process.platform.toString(),
      })
      .option('goos', {
        description: 'the GOOS to install bindown for. This overrides platform',
      })
      .option('arch', {
        description: 'the architecture to install bindown for',
        default: process.arch.toString(),
      })
      .option('goarch', {
        description: 'the GOARCH to install bindown for. This overrides arch',
      })
      .option('cache-dir', {
        description: 'the directory where cache files will be stored',
        default: defaultCacheDir(),
      })
      .option('force', {
        description: 'forces a download even if it is already cached',
      })
      .option('debug', {
        description: 'enable stack traces on errors',
      }),
    handler: run
  })
  .demandCommand()
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .wrap(Math.min(120, yargs.terminalWidth()))
  .strict()
  .parse();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function run(argv: any) {
  const bindown = new Bindown({
    version: argv.bindownVersion,
    platform: argv.platform,
    arch: argv.arch,
    goos: argv.goos,
    goarch: argv.goarch,
    cacheDir: argv.cacheDir,
    force: argv.force,
  });
  bindown.installBindown({
    force: argv.force,
  }).then((bin) => {
    console.log(bin);
  }).catch((err) => {
    if (argv.debug) {
      throw err;
    }
    console.error(err.message);
  });
}
