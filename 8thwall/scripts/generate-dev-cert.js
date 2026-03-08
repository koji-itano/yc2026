const fs = require('fs')
const os = require('os')
const path = require('path')
const {spawnSync} = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const certDir = path.join(rootDir, 'certs')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')

const formatNames = () => {
  const names = new Set(['localhost', '127.0.0.1', '::1'])
  const hostname = os.hostname()
  names.add(hostname)
  if (!hostname.endsWith('.local')) {
    names.add(`${hostname}.local`)
  }

  const interfaces = os.networkInterfaces()
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        names.add(address.address)
      }
    }
  }

  return [...names]
}

const run = (command, args) => {
  const result = spawnSync(command, args, {stdio: 'inherit'})
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, {recursive: true})
}

const names = formatNames()
const mkcert = spawnSync('mkcert', ['-help'], {stdio: 'ignore'})

if (mkcert.status === 0) {
  const install = spawnSync('mkcert', ['-install'], {stdio: 'inherit'})
  if (install.error) {
    throw install.error
  }
  if (install.status !== 0) {
    console.warn('mkcert root CA installation did not complete.')
    console.warn('Continuing with certificate generation, but the cert may not be trusted yet.')
  }
  run('mkcert', ['-key-file', keyPath, '-cert-file', certPath, ...names])
  console.log('Generated dev certificate with mkcert:')
  console.log(`  cert: ${certPath}`)
  console.log(`  key:  ${keyPath}`)
  console.log(`  names: ${names.join(', ')}`)
  console.log(`  root CA: ${path.join(process.env.HOME || '~', 'Library/Application Support/mkcert/rootCA.pem')}`)
  process.exit(0)
}

const opensslConfigPath = path.join(certDir, 'openssl-san.cnf')
const altNames = names
  .map((name, index) => {
    const key = /^\d+\.\d+\.\d+\.\d+$/.test(name) || name.includes(':') ? 'IP' : 'DNS'
    return `${key}.${index + 1} = ${name}`
  })
  .join('\n')

fs.writeFileSync(
  opensslConfigPath,
  `[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = req_ext
distinguished_name = dn

[dn]
CN = ${names[0]}

[req_ext]
subjectAltName = @alt_names

[alt_names]
${altNames}
`
)

run('openssl', [
  'req',
  '-x509',
  '-nodes',
  '-days',
  '30',
  '-newkey',
  'rsa:2048',
  '-keyout',
  keyPath,
  '-out',
  certPath,
  '-config',
  opensslConfigPath,
  '-extensions',
  'req_ext',
])

console.log('Generated self-signed dev certificate with openssl:')
console.log(`  cert: ${certPath}`)
console.log(`  key:  ${keyPath}`)
console.log(`  names: ${names.join(', ')}`)
console.log('Install mkcert for a locally trusted certificate on Mac and iPhone if camera access is blocked.')
