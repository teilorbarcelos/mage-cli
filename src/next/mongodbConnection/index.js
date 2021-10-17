const fs = require('fs')

module.exports = function () {

  const dir = `./utils/dbController.ts`

  if (fs.existsSync(dir)) {
    console.log('The resource you are trying to create already exists!')
    return
  }

  if (!fs.existsSync('./utils')) {
    fs.mkdirSync('./utils')
  }

  const nextComponent =
    `import { MongoClient } from "mongodb"\r
    \r
interface NewUserProps {\r
  name: string\r
  login: string\r
  passwordHash: string\r
}\r
\r
interface InsertDataProps {\r
  table: string\r
  item: NewUserProps\r
}\r
\r
interface SelectDataProps {\r
  table: string\r
  item: {\r
    login?: string\r
  }\r
}\r
\r
const url = process.env.DATABASE_URL || ''\r
const client = new MongoClient(url)\r
const db = client.db(process.env.DATABASE_COLLECTION)\r
\r
export async function insertItem({ table, item }: InsertDataProps) {\r
  \r
  let response\r
  \r
  try {\r
    await client.connect()\r
    \r
    const col = db.collection(table)\r
    \r
    await col.insertOne(item)\r
    \r
    if (item.login) {\r
      response = await col.findOne({ login: item.login })\r
    }\r
    \r
  } catch (err) {\r
    console.log(err)\r
    return err\r
  }\r
  \r
  finally {\r
    await client.close()\r
    return response\r
  }\r
}\r
\r
export async function selectItem({ table, item }: SelectDataProps) {\r
  \r
  let response\r
  \r
  try {\r
    await client.connect()\r
    \r
    const col = db.collection(table)\r
    \r
    if (table == 'users') {\r
      response = await col.findOne({ login: item.login })\r
    }\r
    \r
  } catch (err) {\r
    console.log(err)\r
    return err\r
  }\r
  \r
  finally {\r
    await client.close()\r
    return response\r
  }\r
}\r
\r
export async function updateItem({ table, item }: InsertDataProps) {\r
  \r
  let response\r
  \r
  try {\r
    await client.connect()\r
    \r
    const col = db.collection(table)\r
    \r
    await col.updateOne({ login: item.login }, item)\r
    \r
    if (item.login) {\r
      response = await col.findOne({ login: item.login })\r
    }\r
    \r
  } catch (err) {\r
    console.log(err)\r
    return err\r
  }\r
  \r
  finally {\r
    await client.close()\r
    return response\r
  }\r
}\r
\r
export async function deleteItem({ table, item }: SelectDataProps) {\r
  \r
  let response = true\r
  \r
  try {\r
    await client.connect()\r
    \r
    const col = db.collection(table)\r
    \r
    if (item.login) {\r
      await col.deleteOne({ login: item.login })\r
    }\r
    \r
  } catch (err) {\r
    console.log(err)\r
    return err\r
  }\r
  \r
  finally {\r
    await client.close()\r
    return response\r
  }\r
}`

  fs.writeFileSync(`./utils/dbController.ts`, nextComponent, (err) => {
    if (err) { throw err }
  })

  console.log(`Abra Kadabra!... Connection with mongodb created!`)
}