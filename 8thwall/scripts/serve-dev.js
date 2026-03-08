const fs = require('fs')
const os = require('os')
const path = require('path')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const rootDir = path.resolve(__dirname, '..')
const certDir = path.join(rootDir, 'certs')
const certPath = process.env.HTTPS_CERT || path.join(certDir, 'dev-cert.pem')
const keyPath = process.env.HTTPS_KEY || path.join(certDir, 'dev-key.pem')
const host = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || 8443)
const wantsHttps = process.env.HTTPS !== 'false'

const config = require(path.join(rootDir, 'config', 'webpack.config.js'))

const collectLanUrls = () => {
  const urls = []
  const interfaces = os.networkInterfaces()
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        urls.push(address.address)
      }
    }
  }
  return urls
}

const hostname = os.hostname()
const localHostnames = [hostname, `${hostname}.local`]

const devServer = {
  ...config.devServer,
  host,
  port,
  allowedHosts: 'all',
  hot: false,
  liveReload: false,
  client: {
    ...config.devServer.client,
    webSocketURL: 'auto://0.0.0.0/ws',
  },
}

if (wantsHttps) {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('Missing HTTPS certificate files.')
    console.error(`Expected cert at: ${certPath}`)
    console.error(`Expected key at:  ${keyPath}`)
    console.error('Run `npm run cert:dev` first.')
    process.exit(1)
  }

  devServer.server = {
    type: 'https',
    options: {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    },
  }
} else {
  devServer.server = 'http'
}

config.mode = 'development'
config.devServer = devServer

const compiler = webpack(config)
const server = new WebpackDevServer(devServer, compiler)

const printUrls = () => {
  const protocol = wantsHttps ? 'https' : 'http'
  const lanUrls = collectLanUrls()

  console.log('')
  console.log(`Real Physical Gigs 8th Wall dev server running`)
  console.log(`  Local: ${protocol}://localhost:${port}/`)
  for (const name of localHostnames) {
    console.log(`  Hostname: ${protocol}://${name}:${port}/`)
  }
  for (const address of lanUrls) {
    console.log(`  LAN: ${protocol}://${address}:${port}/`)
  }
  console.log('')
  if (wantsHttps) {
    console.log('If iPhone warns about certificate trust, install the local CA on the phone or use a public tunnel.')
  }
}

const stop = async (signal) => {
  console.log(`\nStopping dev server (${signal})...`)
  await server.stop()
  process.exit(0)
}

process.on('SIGINT', () => { void stop('SIGINT') })
process.on('SIGTERM', () => { void stop('SIGTERM') })

server.start().then(printUrls).catch((error) => {
  console.error(error)
  process.exit(1)
})
