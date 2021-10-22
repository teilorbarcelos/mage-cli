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
    `import React from 'react'\r
\r
import {\r
  View\r
} from 'react-native'\r
\r
import { styles } from './styles'\r
\r
export function ${name}(){\r
  return (\r
    <View style={styles.container}>\r
\r
    </View>\r
  )\r
}`

  const stylesModule =
    `import { StyleSheet } from 'react-native'\r
\r
export const styles = StyleSheet.create({\r
  container: {\r
    flex: 1,\r
  }\r
})`


  fs.writeFileSync(`./src/components/${name}/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./src/components/${name}/styles.ts`, stylesModule, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Component: ${name} created!`)
}
