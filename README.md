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

3. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser** Navigate to [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Quality Assurance
npm run type-check   # TypeScript type checking
npm run lint         # ESLint code linting
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run check        # Run all quality checks
```

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
