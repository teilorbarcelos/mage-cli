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
    `import { ButtonHTMLAttributes } from 'react'\r
import styles from './styles.module.css'\r
\r
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {\r
  title: string\r
}\r
\r
export default function ${name}({ title, ...rest }: Props){\r
  return (\r
    <button {...rest} className={styles.${name.toLowerCase()}}>{title}</button>\r
  )\r
}`

  const stylesModule =
    `.${name.toLowerCase()} {\r
  border: 2px solid red;\r
  background: red;\r
  border-radius: 0.3rem;\r
  color: blue;\r
  transition: 0.3s;\r
  cursor: pointer;\r
}\r
\r
.${name.toLowerCase()}:hover {\r
  opacity: 0.8;\r
}`


  fs.writeFileSync(`./src/components/${name}/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/components/${name}/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... button: ${name} created!`)
}
