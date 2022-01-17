const fs = require('fs')

module.exports = function (name) {

  if (!name) {
    console.log('You need to say the name!')
    return
  }

  const dir = `./src/pages/${name}`

  if (fs.existsSync(dir)) {
    console.log('The resource you are trying to create already exists!')
    return
  }

  if (!fs.existsSync('./src')) {
    fs.mkdirSync('./src')
  }

  if (!fs.existsSync('./src/pages')) {
    fs.mkdirSync('./src/pages')
  }

  fs.mkdirSync(dir)

  const nextComponent =
    `import styles from './styles.module.css'\r
import globals from '../../styles/globals.module.css'\r
\r
export default function ${name[0].toUpperCase() + name.slice(1)}(){\r
  return (\r
    <div className={styles.${name}} id="${name}">\r
    \r
    </div>\r
  )\r
}`

  const stylesModule =
    `.${name} {\r
  \r
}`


  fs.writeFileSync(`./src/pages/${name}/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/pages/${name}/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Page: ${name} created!`)
}
