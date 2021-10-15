const fs = require('fs')

module.exports = function (name) {
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
    `\r` +
    `interface Props {` +
    `  title: string` +
    `}` +
    `\r` +
    `export default function ${name}({ title }: Props){\r` +
    `  return (\r` +
    `    <button className={styles.${name.toLowerCase()}}>{title}</button>\r` +
    `  )\r` +
    `}`

  const stylesModule =
    `.${name.toLowerCase()} {\r` +
    `  border: 2px solid red;\r` +
    `  background: red;\r` +
    `  border-radius: 0.3rem;\r` +
    `  color: blue;\r` +
    `  transition: 0.3s;\r` +
    `  cursor: pointer;\r` +
    `}\r` +
    `\r` +
    `.${name.toLowerCase()}:hover {\r` +
    `  opacity: 0.8;\r` +
    `}`


  fs.writeFileSync(`./components/${name}/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./components/${name}/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })
}