const fs = require('fs')

module.exports = function () {
  const dir = `./src/components/Footer`

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
export default function Footer() {\r
  return (\r
    <footer className={styles.footer} id="footer">\r
      <p>Developed by <Link href="https://teilorwebdev.vercel.app"><a target="_blank">Teilor Souza Barcelos</a></Link></p>\r
    </footer>\r
  )\r
}`

  const stylesModule =
    `.footer {\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  bottom: 0;\r
  left: 0;\r
}`


  fs.writeFileSync(`./src/components/Footer/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/components/Footer/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Resource created!`)
}
