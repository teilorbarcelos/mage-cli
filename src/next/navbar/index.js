const fs = require('fs')

module.exports = function () {
  const dir = `./src/components/Navbar`

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
    `import Link from 'next/link'\r
import styles from './styles.module.css'\r
import globals from '../../styles/globals.module.css'\r
\r
export default function Navbar() {\r
  return (\r
    <nav className={styles.nav}>\r
      <div className={styles.container}>\r
        <div className={styles.logo}>\r
          Logo\r
        </div>\r
        <ul className={styles.links}>\r
          <li>\r
            <Link href={"/Login"}>\r
              <a>Login</a>\r
            </Link>\r
          </li>\r
          <li>\r
            <Link href={"/Register"}>\r
              <a>Register</a>\r
            </Link>\r
          </li>\r
        </ul>\r
      </div>\r
    </nav>\r
  )\r
}`

  const stylesModule =
    `.nav {\r
  display: flex;\r
  width: 100%;\r
  justify-content: center;\r
  align-items: center;\r
  position: fixed;\r
}\r
\r
.container {\r
  display: flex;\r
  justify-content: space-between;\r
  align-items: center;\r
  max-width: 1200px;\r
  width: 100%;\r
  padding: 0 1rem;\r
}\r
\r
.logo {\r
  line-height: 1.5rem;\r
  height: min-content;\r
}\r
\r
.links {\r
  display: flex;\r
  gap: 1.5rem;\r
}`


  fs.writeFileSync(`./src/components/Navbar/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/components/Navbar/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Resource created!`)
}
