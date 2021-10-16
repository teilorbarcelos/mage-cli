const fs = require('fs')

module.exports = function () {
  const dir = `./pages/Login`

  if (fs.existsSync(dir)) {
    console.log('The resource you are trying to create already exists!')
    return
  }

  fs.mkdirSync(dir)

  const nextComponent =
    `import type { NextPage } from 'next'\r
import Head from 'next/head'\r
import Link from 'next/link'\r
import { useForm } from 'react-hook-form'\r
import styles from './styles.module.css'\r
import Button1 from '../../components/Button1'\r
\r
interface ICredentials {\r
  login: string\r
  password: string\r
}\r
\r
const Login: NextPage = () => {\r
  const { register, handleSubmit } = useForm()\r
  \r
  async function signIn(data: ICredentials) {\r
    \r
    // await login(data)\r
    console.log(data)\r
    \r
  }\r
  \r
  return (\r
    <>\r
      <Head>\r
        <title>Login</title>\r
        <meta name="description" content="Página de Login" />\r
        <link rel="icon" href="/favicon.ico" />\r
      </Head>\r
      \r
      <main className={styles.login}>\r
        <div className={styles.loginBox}>\r
          <form onSubmit={handleSubmit(signIn)} >\r
            <h2>Faça Login</h2>\r
            <div>\r
              <label htmlFor="login">Login: </label>\r
              <input\r
                {...register('login')}\r
                id="login"\r
                type="text"\r
              />\r
            </div>\r
            <div>\r
              <label htmlFor="password">Senha: </label>\r
              <input\r
                {...register('password')}\r
                id="password"\r
                type="password"\r
              />\r
            </div>\r
            <div>\r
              <Button1 title="Entrar" />\r
            </div>\r
            <p><Link href="/"><a>Voltar para o site</a></Link></p>\r
          </form>\r
        </div>\r
      </main>\r
    </>\r
  )\r
}\r
\r
export default Login`

  const stylesModule =
    `.login {\r
  height: 100%;\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
}\r
\r
.loginBox {\r
  height: max-content;\r
}\r
\r
.loginBox form {\r
  display: flex;\r
  flex-direction: column;\r
  justify-content: center;\r
  align-items: center;\r
  padding: 1rem;\r
  width: 100%;\r
  max-width: 400px;\r
  border: 2px solid var(--main-color-light);\r
  border-radius: 1rem;\r
  gap: 1rem;\r
}\r
\r
.loginBox form div {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 0.3rem;\r
}`

  fs.writeFileSync(`./pages/Login/index.tsx`, nextComponent, (err) => {
    if (err) { throw err }
  })

  fs.writeFileSync(`./pages/Login/styles.module.css`, stylesModule, (err) => {
    if (err) { throw err }
  })

  // cria o Button1 caso ainda não exista

  if (!fs.existsSync(`./components/Button1`)) {
    const Command = require(`../button`)

    Command('button1')
  }

  console.log(`Abra Kadabra!... Login Page created!`)
}