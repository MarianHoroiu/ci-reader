# Romanian ID Processing PWA

A Progressive Web Application for processing Romanian Identity Cards and auto-filling document
templates with extracted personal data. Built with Next.js 15, React 19, and TypeScript for
privacy-focused, offline-capable document processing.

## 🚀 Features

### Core Functionality

- **Romanian ID Card Processing**: Extract personal data from Romanian Identity Cards
- **Auto-fill Templates**: Automatically populate document templates with extracted information
- **Privacy-First**: All processing happens locally on your device
- **Offline Capable**: Full functionality without internet connection
- **Progressive Web App**: Install and use like a native mobile app

### PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Works completely offline with service worker caching
- **Push Notifications**: Receive updates and processing status notifications
- **Background Sync**: Sync data when connection is restored
- **Responsive Design**: Optimized for all screen sizes and devices

## 📱 PWA Manifest Configuration

### Icons

The application includes a complete set of icons for all platforms:

- **Favicon**: `favicon.ico`, `icon.svg` (32x32)
- **PWA Icons**: 72x72, 96x96, 128x128, 144x144, 192x192, 512x512 (SVG format)
- **Apple Touch Icon**: 180x180 PNG format
- **Microsoft Tiles**: Configured via `browserconfig.xml`

### Manifest Features

- **App Name**: "Romanian ID Processor"
- **Theme Colors**: Romanian flag colors (#002b7f, #fcd116, #ce1126)
- **Display Mode**: Standalone (full-screen app experience)
- **Orientation**: Portrait (optimized for document scanning)
- **Start URL**: "/" with UTM tracking
- **Scope**: Full application scope
- **Background Sync**: Enabled for offline data processing
- **Shortcuts**: Quick access to main features
- **Screenshots**: App store preview images

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.2 with App Router
- **React**: React 19 with TypeScript
- **Styling**: Tailwind CSS with Romanian theme colors
- **PWA**: Service Worker with Workbox for caching strategies
- **Build Tool**: Turbopack for fast development
- **Quality Tools**: ESLint, Prettier, TypeScript strict mode

## 🏗️ Project Structure

```
07-CI-agent/
├── app/                          # Next.js App Router
│   ├── components/              # React components
│   │   └── ServiceWorkerRegistration.tsx
│   ├── globals.css             # Global styles with Tailwind
│   ├── layout.tsx              # Root layout with PWA metadata
│   └── page.tsx                # Landing page
├── public/                      # Static assets
│   ├── icons/                  # PWA icons (SVG format)
│   │   ├── icon-72x72.svg
│   │   ├── icon-96x96.svg
│   │   ├── icon-128x128.svg
│   │   ├── icon-144x144.svg
│   │   ├── icon-192x192.svg
│   │   └── icon-512x512.svg
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── offline.html            # Offline fallback page
│   ├── browserconfig.xml       # Microsoft tile configuration
│   ├── favicon.ico             # Browser favicon
│   ├── icon.svg                # Main app icon
│   └── apple-touch-icon.png    # iOS home screen icon
├── lib/                        # Utility libraries
│   └── sw-utils.ts            # Service worker utilities
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm package manager
- For HTTPS development (optional): mkcert or OpenSSL

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MarianHoroiu/ci-reader.git
   cd ci-reader
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables (optional)**

   ```bash
   cp env.local.template .env.local
   # Edit .env.local with your preferred settings
   ```

4. **Start development server**

   **HTTP Development (default):**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   **HTTPS Development (recommended for PWA features):**

   ```bash
   # Option 1: Auto-generate certificates with mkcert (recommended)
   npm run dev:https

   # Option 2: Use custom certificates
   npm run setup:https
   npm run dev:https-custom
   ```

5. **Open in browser**
   - HTTP: Navigate to [http://localhost:3000](http://localhost:3000)
   - HTTPS: Navigate to [https://localhost:3000](https://localhost:3000)

### Development Scripts

```bash
# Development
npm run dev                # Start HTTP development server with Turbopack
npm run dev:https          # Start HTTPS development server (auto-certificates)
npm run dev:https-custom   # Start HTTPS development server (custom certificates)
npm run build              # Build for production
npm run start              # Start production server

# HTTPS Setup
npm run setup:https        # Complete HTTPS setup (certificates + instructions)
npm run setup:certs        # Generate SSL certificates
npm run setup:certs-force  # Force regenerate certificates
npm run certs:info         # Display certificate information
npm run certs:clean        # Remove existing certificates

# Quality Assurance
npm run type-check         # TypeScript type checking
npm run lint               # ESLint code linting
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting
npm run check              # Run all quality checks
```

## 🔐 HTTPS Development Setup

PWA features like service workers, install prompts, and push notifications require a secure context
(HTTPS). This project provides multiple ways to set up HTTPS for local development.

### Method 1: Automatic Setup with Next.js 15 (Recommended)

Next.js 15 includes built-in HTTPS support using mkcert:

```bash
# Start HTTPS development server (auto-generates certificates)
npm run dev:https
```

This will:

- Automatically install mkcert if not present
- Generate trusted certificates for localhost
- Start the development server on https://localhost:3000

### Method 2: Custom Certificate Setup

For more control over certificates or if automatic setup fails:

```bash
# Generate custom certificates
npm run setup:https

# Start development server with custom certificates
npm run dev:https-custom
```

### Method 3: Manual Certificate Generation

You can also generate certificates manually:

```bash
# Generate certificates using our script
node scripts/generate-certs.js

# View certificate information
npm run certs:info

# Clean up certificates
npm run certs:clean
```

### Certificate Management

The certificate generation script supports multiple commands:

```bash
# Generate certificates (default)
node scripts/generate-certs.js

# Force regenerate certificates
node scripts/generate-certs.js gen --force

# Display certificate information
node scripts/generate-certs.js info

# Remove existing certificates
node scripts/generate-certs.js clean

# Install mkcert tool
node scripts/generate-certs.js install-mkcert

# Show help
node scripts/generate-certs.js help
```

### Troubleshooting HTTPS

**Certificate Trust Issues:**

- **Chrome/Edge**: Visit https://localhost:3000 and click "Advanced" → "Proceed to localhost"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

**mkcert Installation:**

- **macOS**: `brew install mkcert`
- **Windows**: `choco install mkcert` or `scoop install mkcert`
- **Linux**: `sudo apt-get install mkcert` or manual installation

**Manual Certificate Trust:**

- **macOS**: Add certificate to Keychain and mark as trusted
- **Windows**: Add to "Trusted Root Certification Authorities"
- **Linux**: Copy to `/usr/local/share/ca-certificates/` and run `sudo update-ca-certificates`

### Why HTTPS for Development?

HTTPS is required for:

- ✅ Service Worker registration
- ✅ PWA install prompts
- ✅ Push notifications
- ✅ Geolocation API
- ✅ Camera/microphone access
- ✅ Clipboard API
- ✅ Background sync

## 📱 PWA Installation

### Mobile Devices (iOS/Android)

1. Open the app in your mobile browser
2. Look for "Add to Home Screen" prompt or menu option
3. Follow the installation prompts
4. The app will appear on your home screen like a native app

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install" when prompted
4. The app will be available in your applications menu

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME="Romanian ID Processor"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# PWA Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

### PWA Customization

- **Colors**: Edit `tailwind.config.js` for theme colors
- **Icons**: Replace SVG files in `public/icons/`
- **Manifest**: Modify `public/manifest.json`
- **Service Worker**: Update `public/sw.js` for caching strategies

## 🛡️ Privacy & Security

- **Local Processing**: All document processing happens on your device
- **No Data Upload**: Personal information never leaves your device
- **Offline First**: Works without internet connection
- **Secure Storage**: Uses browser's secure storage APIs
- **No Tracking**: Privacy-focused design with no analytics

## 🌐 Browser Support

- **Chrome**: 88+ (full PWA support)
- **Firefox**: 85+ (limited PWA support)
- **Safari**: 14+ (iOS PWA support)
- **Edge**: 88+ (full PWA support)

## 📋 Task Implementation Status

### ✅ Task [01]-[01]: Initialize Next.js 15 project with TypeScript

- [x] Next.js 15.3.2 with App Router
- [x] React 19 with TypeScript 5.3.0
- [x] Tailwind CSS with Romanian theme
- [x] ESLint and Prettier configuration
- [x] Development and build scripts

### ✅ Task [01]-[02]: Configure PWA manifest.json

- [x] Complete PWA manifest with all required fields
- [x] Romanian-themed icon set (72x72 to 512x512)
- [x] Apple Touch Icon and Microsoft tile configuration
- [x] Service worker integration
- [x] Offline fallback page
- [x] PWA metadata in layout.tsx

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the PWA implementation guide

---

**Romanian ID Processing PWA** - Privacy-focused document processing for Romanian Identity Cards
