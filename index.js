#!/usr/bin/env node

const program = require('commander')
const package = require('./package.json')
const fs = require('fs');

program.version(package.version)

program
  .command('create <framework> <resource> [name]')
  .description('Create a framework resource with a specific name')
  .action((framework, resource, name) => {

    if (framework == 'next') {
      if (resource == 'component') {
        if (name) {
          name = name[0].toUpperCase() + name.slice(1)
          const dir = `./components/${name}`

          if (fs.existsSync(dir)) {
            console.log('The resource you are trying to create already exists!')
            return
          }

          if (!fs.existsSync('./components')) {
            fs.mkdirSync('./components')
          }

          fs.mkdirSync(dir)

          const nextComponent =
            `import styles from './styles.module.css'\r` +
            `import globals from '../../styles/globals.module.css'\r` +
            `\r` +
            `export default function ${name}(){\r` +
            `  return (\r` +
            `    <section className={styles.${name.toLowerCase()}} id="${name.toLowerCase()}">\r` +
            `    \r` +
            `    </section>\r` +
            `  )\r` +
            `}`

          const stylesModule =
            `.${name.toLowerCase()} {\r` +
            `  \r` +
            `}`


          fs.writeFileSync(`./components/${name}/index.tsx`, nextComponent, (err) => {
            if (err) { throw err }
          })

          fs.writeFileSync(`./components/${name}/styles.module.css`, stylesModule, (err) => {
            if (err) { throw err }
          })
          console.log(`Abra Kadabra!... Resource created!`)
        }
      }
    }

  });

program.parse(process.argv)