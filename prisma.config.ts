import * as dotenv from 'dotenv'
dotenv.config()
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
datasource: {
    // Usamos DIRECT_URL (puerto 5432) para evitar el error de prepared statements
    url: process.env.DIRECT_URL!, 
  },
})