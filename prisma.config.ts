import path from 'node:path'
import { defineConfig } from 'prisma-cli/config'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
})
