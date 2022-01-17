const fs = require('fs')

module.exports = function (name) {

  if (!name) {
    console.log('You need to say the name!')
    return
  }

  name = name[0].toUpperCase() + name.slice(1)
  const dir = `./src/components/${name}`

  if (fs.existsSync(dir)) {
    console.log('The resource you are trying to create already exists!')
    return
  }

  if (!fs.existsSync('./src')) {
    fs.mkdirSync('./src')
  }

  if (!fs.existsSync('./src/components')) {
    fs.mkdirSync('./src/components')
  }

  fs.mkdirSync(dir)

  const nextComponent =
    `import styles from './styles.module.css'\r
import globals from '../../styles/globals.module.css'\r
\r
export default function ${name}(){\r
  return (\r
    <div className={styles.${name.toLowerCase()}} id="${name.toLowerCase()}">\r
    \r
    </div>\r
  )\r
}`

  const stylesModule =
    `.${name.toLowerCase()} {\r
  \r
}`


  fs.writeFileSync(`./src/components/${name}/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/components/${name}/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Resource created!`)
}
