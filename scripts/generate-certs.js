#!/usr/bin/env node

/**
 * SSL Certificate Generation Script for Local Development
 * Supports both mkcert (recommended) and manual self-signed certificate generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CERTS_DIR = path.join(__dirname, '..', 'certs');
const CERT_FILES = {
  key: path.join(CERTS_DIR, 'localhost-key.pem'),
  cert: path.join(CERTS_DIR, 'localhost.pem'),
  ca: path.join(CERTS_DIR, 'rootCA.pem'),
};

/**
 * Check if mkcert is installed
 */
function isMkcertInstalled() {
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate certificates using mkcert (recommended)
 */
function generateWithMkcert() {
  console.log('🔧 Generating certificates with mkcert...');

  try {
    // Ensure mkcert CA is installed
    console.log('📋 Installing mkcert CA...');
    execSync('mkcert -install', { stdio: 'inherit' });

    // Generate certificates for localhost
    console.log('🔐 Generating localhost certificates...');
    execSync(
      `mkcert -key-file "${CERT_FILES.key}" -cert-file "${CERT_FILES.cert}" localhost 127.0.0.1 ::1`,
      {
        stdio: 'inherit',
        cwd: CERTS_DIR,
      }
    );

    console.log('✅ Certificates generated successfully with mkcert!');
    console.log(`📁 Key: ${CERT_FILES.key}`);
    console.log(`📁 Cert: ${CERT_FILES.cert}`);

    return true;
  } catch (error) {
    console.error(
      '❌ Failed to generate certificates with mkcert:',
      error.message
    );
    return false;
  }
}

/**
 * Generate self-signed certificates manually
 */
function generateSelfSigned() {
  console.log('🔧 Generating self-signed certificates...');

  try {
    // Generate private key
    console.log('🔑 Generating private key...');
    const keyCommand = `openssl genrsa -out "${CERT_FILES.key}" 2048`;
    execSync(keyCommand, { stdio: 'inherit' });

    // Create certificate configuration
    const configPath = path.join(CERTS_DIR, 'localhost.conf');
    const config = `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = RO
ST = Bucharest
L = Bucharest
O = Romanian ID Processing PWA
OU = Development
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1`;

    fs.writeFileSync(configPath, config);

    // Generate certificate
    console.log('📜 Generating certificate...');
    const certCommand = `openssl req -new -x509 -key "${CERT_FILES.key}" -out "${CERT_FILES.cert}" -days 365 -config "${configPath}"`;
    execSync(certCommand, { stdio: 'inherit' });

    // Clean up config file
    fs.unlinkSync(configPath);

    console.log('✅ Self-signed certificates generated successfully!');
    console.log(`📁 Key: ${CERT_FILES.key}`);
    console.log(`📁 Cert: ${CERT_FILES.cert}`);
    console.log('');
    console.log(
      '⚠️  IMPORTANT: You need to trust these certificates manually:'
    );
    console.log('   • macOS: Add certificate to Keychain and trust it');
    console.log(
      '   • Windows: Add certificate to Trusted Root Certification Authorities'
    );
    console.log(
      '   • Linux: Add certificate to /usr/local/share/ca-certificates/'
    );
    console.log(
      '   • Browser: Visit https://localhost:3000 and accept the certificate'
    );

    return true;
  } catch (error) {
    console.error(
      '❌ Failed to generate self-signed certificates:',
      error.message
    );
    return false;
  }
}

/**
 * Check if certificates already exist
 */
function certificatesExist() {
  return fs.existsSync(CERT_FILES.key) && fs.existsSync(CERT_FILES.cert);
}

/**
 * Display certificate information
 */
function displayCertInfo() {
  if (!certificatesExist()) {
    console.log('❌ No certificates found');
    return;
  }

  try {
    console.log('📋 Certificate Information:');
    const certInfo = execSync(
      `openssl x509 -in "${CERT_FILES.cert}" -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not After)"`,
      {
        encoding: 'utf8',
      }
    );
    console.log(certInfo);
  } catch (error) {
    console.log('📁 Certificate files exist but cannot read details');
  }
}

/**
 * Install mkcert
 */
function installMkcert() {
  console.log('📦 Installing mkcert...');

  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      // macOS with Homebrew
      console.log('🍺 Installing mkcert via Homebrew...');
      execSync('brew install mkcert', { stdio: 'inherit' });
    } else if (platform === 'linux') {
      // Linux - try different package managers
      console.log('🐧 Installing mkcert on Linux...');
      try {
        execSync('sudo apt-get update && sudo apt-get install -y mkcert', {
          stdio: 'inherit',
        });
      } catch {
        try {
          execSync('sudo yum install -y mkcert', { stdio: 'inherit' });
        } catch {
          console.log('❌ Could not install mkcert automatically.');
          console.log(
            'Please install mkcert manually: https://github.com/FiloSottile/mkcert#installation'
          );
          return false;
        }
      }
    } else if (platform === 'win32') {
      // Windows with Chocolatey or Scoop
      console.log('🪟 Installing mkcert on Windows...');
      try {
        execSync('choco install mkcert', { stdio: 'inherit' });
      } catch {
        try {
          execSync('scoop install mkcert', { stdio: 'inherit' });
        } catch {
          console.log('❌ Could not install mkcert automatically.');
          console.log(
            'Please install mkcert manually: https://github.com/FiloSottile/mkcert#windows'
          );
          return false;
        }
      }
    } else {
      console.log('❌ Unsupported platform for automatic mkcert installation');
      return false;
    }

    console.log('✅ mkcert installed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to install mkcert:', error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';

  console.log('🔐 SSL Certificate Generator for Romanian ID Processing PWA');
  console.log('');

  // Ensure certs directory exists
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  switch (command) {
    case 'generate':
    case 'gen':
      if (certificatesExist() && !args.includes('--force')) {
        console.log('✅ Certificates already exist!');
        displayCertInfo();
        console.log('');
        console.log('💡 Use --force to regenerate certificates');
        return;
      }

      if (isMkcertInstalled()) {
        if (!generateWithMkcert()) {
          console.log('🔄 Falling back to self-signed certificates...');
          generateSelfSigned();
        }
      } else {
        console.log('⚠️  mkcert not found. Trying to install...');
        if (installMkcert() && isMkcertInstalled()) {
          generateWithMkcert();
        } else {
          console.log('🔄 Using self-signed certificate generation...');
          generateSelfSigned();
        }
      }
      break;

    case 'info':
      displayCertInfo();
      break;

    case 'clean':
      if (certificatesExist()) {
        fs.unlinkSync(CERT_FILES.key);
        fs.unlinkSync(CERT_FILES.cert);
        if (fs.existsSync(CERT_FILES.ca)) {
          fs.unlinkSync(CERT_FILES.ca);
        }
        console.log('🗑️  Certificates removed');
      } else {
        console.log('❌ No certificates to remove');
      }
      break;

    case 'install-mkcert':
      installMkcert();
      break;

    case 'help':
    default:
      console.log('Usage: node generate-certs.js [command] [options]');
      console.log('');
      console.log('Commands:');
      console.log('  generate, gen    Generate SSL certificates (default)');
      console.log('  info             Display certificate information');
      console.log('  clean            Remove existing certificates');
      console.log('  install-mkcert   Install mkcert tool');
      console.log('  help             Show this help message');
      console.log('');
      console.log('Options:');
      console.log('  --force          Force regenerate certificates');
      console.log('');
      console.log('Examples:');
      console.log(
        '  node generate-certs.js                 # Generate certificates'
      );
      console.log(
        '  node generate-certs.js gen --force     # Force regenerate'
      );
      console.log(
        '  node generate-certs.js info            # Show certificate info'
      );
      console.log(
        '  node generate-certs.js clean           # Remove certificates'
      );
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateWithMkcert,
  generateSelfSigned,
  certificatesExist,
  CERT_FILES,
  CERTS_DIR,
};
