#!/usr/bin/env node

import yargs from 'yargs';
import {defaultCacheDir, installBindown} from './install';

const description =
  'install-bindown will download bindown and optionally copy the binary to a target path. Outputs the path to the bindown binary';

async function main() {
  yargs(process.argv.slice(2))
    .command({
      command: '$0 <bindown-version> [args]',
      describe: description,
      builder: (y) => y
        .positional('bindown-version', {
          description: 'the version of bindown to install',
        })
        .option('target', {
          description: 'the path to install bindown to',
        })
        .option('platform', {
          description: 'the platform to install bindown for',
          default: process.platform.toString(),
        })
        .option('arch', {
          description: 'the architecture to install bindown for',
          default: process.arch.toString(),
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
      handler: async (argv) => {
        if (!argv.debug) {
          Error.stackTraceLimit = 0;
        }
        const output = await installBindown(argv['bindown-version'], {
          target: argv.target,
          platform: argv.platform,
          arch: argv.arch,
          cacheDir: argv.cacheDir,
          force: argv.force,
          debug: argv.debug,
        })
        console.log(output);
      }
    })
    .demandCommand()
    .help()
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .wrap(Math.min(120, yargs.terminalWidth()))
    .strict()
    .argv;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
