#!/usr/bin/env node

const program = require('commander')
const package = require('./package.json')

program.version(package.version)

program
  .command('create <framework> <resource> [name]')
  .description('Create a framework resource with a specific name')
  .action((framework, resource, name) => {

    if (framework == 'next') {

      const Command = require(`./src/${framework}/${resource}`)

      Command(name && name)
    }
  });

program.parse(process.argv)