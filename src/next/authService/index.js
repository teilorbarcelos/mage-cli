const { exec } = require('child_process')
const fs = require('fs')

async function installDependencies() {
  exec(`yarn add bcryptjs jsonwebtoken && yarn add @types/bcryptjs @types/jsonwebtoken -D`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
    }
  })
  console.log(`Hocus Pocus!... Dependencies added!`)
}

module.exports = function () {
  const dir = `./utils/services/authService.ts`

  if (fs.existsSync(dir)) {
    console.log('The resource you are trying to create already exists!')
    return
  }

  if (!fs.existsSync('./utils')) {
    fs.mkdirSync('./utils')
  }

  fs.mkdirSync('./utils/services')

  const nextComponent =
    `import { compare } from "bcryptjs"\r
import { Secret, sign } from "jsonwebtoken"\r
import { selectItem } from "../dbController"\r
\r
interface IAuthRequest {\r
  login: string\r
  password: string\r
}\r
\r
export interface IUserResponse {\r
  _id: string\r
  name: string\r
  login: string\r
  passwordHash: string\r
}\r
\r
export const secretMD5 = process.env.HASH_MD5 as Secret\r
\r
class AuthService {\r
  async login({ login, password }: IAuthRequest) {\r
    const user = await selectItem({ table: 'users', item: { login } }) as IUserResponse\r
\r
    if (!user || !await compare(password, user.passwordHash)) {\r
      return false\r
    }\r
\r
    const token = sign({ email: user.login }, secretMD5, { subject: user._id.toString(), expiresIn: '1d' })\r
\r
    return {\r
      token,\r
      user: {\r
        _id: user._id,\r
        login: user.login\r
      }\r
    }\r
  }\r
}\r
\r
export { AuthService }`


  fs.writeFileSync(`./utils/services/authService.ts`, nextComponent, (err) => {
    if (err) { throw err }
  })

  installDependencies()

  console.log(`Abra Kadabra!... Auth service created!`)
}