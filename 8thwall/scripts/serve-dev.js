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
const handoffStore = {
  latest: null,
}
const verificationStore = {
  latest: null,
}
const proofClients = new Set()
const verificationClients = new Set()

const sendJson = (res, status, payload) => {
  res.status(status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'))
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

const attachSseClient = (req, res, clients, latest) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  })
  res.write('\n')

  if (latest) {
    res.write(`data: ${JSON.stringify(latest)}\n\n`)
  }

  const client = {res}
  clients.add(client)
  req.on('close', () => {
    clients.delete(client)
  })
}

const broadcastSse = (clients, payload) => {
  const message = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of clients) {
    client.res.write(message)
  }
}

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
  setupMiddlewares: (middlewares, server) => {
    server.app.get('/api/handoff/latest', (req, res) => {
      sendJson(res, 200, handoffStore.latest)
    })

    server.app.post('/api/handoff', async (req, res) => {
      try {
        handoffStore.latest = await readJsonBody(req)
        broadcastSse(proofClients, handoffStore.latest)
        sendJson(res, 200, {ok: true})
      } catch (error) {
        sendJson(res, 400, {ok: false, error: error.message})
      }
    })

    server.app.get('/api/handoff/events', (req, res) => {
      attachSseClient(req, res, proofClients, handoffStore.latest)
    })

    server.app.get('/api/verification/latest', (req, res) => {
      sendJson(res, 200, verificationStore.latest)
    })

    server.app.post('/api/verification', async (req, res) => {
      try {
        verificationStore.latest = await readJsonBody(req)
        broadcastSse(verificationClients, verificationStore.latest)
        sendJson(res, 200, {ok: true})
      } catch (error) {
        sendJson(res, 400, {ok: false, error: error.message})
      }
    })

    server.app.get('/api/verification/events', (req, res) => {
      attachSseClient(req, res, verificationClients, verificationStore.latest)
    })

    return middlewares
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
  console.log(`  Dashboard: ${protocol}://localhost:${port}/?role=dashboard`)
  for (const name of localHostnames) {
    console.log(`  Hostname: ${protocol}://${name}:${port}/`)
  }
  for (const address of lanUrls) {
    console.log(`  LAN: ${protocol}://${address}:${port}/`)
    console.log(`  Dashboard: ${protocol}://${address}:${port}/?role=dashboard`)
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
