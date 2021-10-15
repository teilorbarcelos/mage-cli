#!/usr/bin/env node

const program = require('commander')
const package = require('./package.json')

const Section = require('./src/next/section')
const Button = require('./src/next/button')
const LoginPage = require('./src/next/loginPage')
const Navbar = require('./src/next/navbar')
const Footer = require('./src/next/footer')

program.version(package.version)

program
  .command('create <framework> <resource> [name]')
  .description('Create a framework resource with a specific name')
  .action((framework, resource, name) => {

    if (framework == 'next') {

      switch (resource) {

        case 'section':
          if (name) {
            Section(name)
          }
          break

        case 'button':
          if (name) {
            Button(name)
          }
          break

        case 'loginPage':
          LoginPage()
          break

        case 'navbar':
          if (name) {
            Navbar(name)
          }
          break

        case 'footer':
          if (name) {
            Footer(name)
          }
          break

      }
      console.log(`Abra Kadabra!... Resource created!`)
      return
    }
  });

program.parse(process.argv)