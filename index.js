#!/usr/bin/env node

const program = require('commander')
const package = require('./package.json')
const Nbc = require('./src/next/component')

program.version(package.version)

program
  .command('create <framework> <resource> [name]')
  .description('Create a framework resource with a specific name')
  .action((framework, resource, name) => {

    if (framework == 'next') {
      if (resource == 'component') {
        if (name) {
          Nbc(name)
        }
      }
    }

  });

program.parse(process.argv)