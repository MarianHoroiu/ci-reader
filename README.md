# Romanian ID Processing PWA

A Progressive Web Application (PWA) built with Next.js 15 and React 19 for processing Romanian
Identity Cards and automatically filling document templates. All processing happens locally on your
device for maximum privacy.

## 🚀 Features

- **Privacy-First**: All OCR and document processing happens locally
- **Offline Capable**: Full functionality without internet connection
- **PWA Technology**: Install on any device, works like a native app
- **Romanian ID Support**: Specifically designed for Romanian Identity Cards
- **Template Filling**: Automatically fill PDF and DOCX templates
- **Batch Processing**: Process multiple documents simultaneously
- **Modern UI**: Built with Tailwind CSS and responsive design

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Turbopack (stable)
- **PWA**: Service Workers for offline functionality
- **OCR**: Tesseract.js (client-side)
- **Document Processing**: PDF.js, PDF-lib, docx.js
- **Storage**: IndexedDB for local data persistence

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Modern browser with PWA support

## 🚀 Getting Started

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd romanian-id-processing-pwa
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser** Navigate to [http://localhost:3000](http://localhost:3000)

### Development with Turbopack

For faster development builds, the project uses Turbopack by default:

```bash
npm run dev  # Uses --turbo flag automatically
```

## 📜 Available Scripts

### Development Scripts

- **`npm run dev`** - Start development server with Turbopack
- **`npm run build`** - Build the application for production
- **`npm run start`** - Start production server

### Code Quality Scripts

- **`npm run type-check`** - Run TypeScript type checking without compilation
- **`npm run lint`** - Run ESLint with TypeScript rules
- **`npm run lint:fix`** - Run ESLint with automatic fixing
- **`npm run format`** - Format all files using Prettier
- **`npm run format:check`** - Check if files are properly formatted
- **`npm run check`** - Run all checks (type-check, lint, format) sequentially

### Script Usage Examples

```bash
# Check code quality before committing
npm run check

# Fix linting and formatting issues
npm run lint:fix && npm run format

# Type check only
npm run type-check

# Check formatting without changing files
npm run format:check
```

## 🏗 Project Structure

```
romanian-id-processing-pwa/
├── app/                    # Next.js App Router directory
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility libraries and helpers
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # Additional CSS files
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page component
│   └── globals.css        # Global styles with Tailwind
├── public/                # Static assets
├── documents/             # Project documentation
├── next.config.ts         # Next.js configuration (TypeScript)
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc.json      # Prettier configuration
└── package.json          # Project dependencies and scripts
```

## 🎨 Styling

The project uses Tailwind CSS with custom theme extensions:

- **Primary Colors**: Blue color palette for main UI elements
- **Romanian Theme**: Colors inspired by Romanian flag
- **Status Colors**: For processing states (success, error, warning)
- **Custom Components**: Pre-built button and card styles
- **Responsive Design**: Mobile-first approach
- **Accessibility**: High contrast and reduced motion support

### Custom Tailwind Classes

```css
/* Component Classes */
.btn-primary     /* Primary button styling */
.btn-secondary   /* Secondary button styling */
.card           /* Basic card styling */
.card-hover     /* Card with hover effects */

/* Utility Classes */
.text-balance   /* Balanced text wrapping */
.loading-skeleton /* Skeleton loading animation */
.loading-spinner  /* Spinner animation */
```

## 🔧 Configuration

### TypeScript Configuration

The project uses strict TypeScript configuration with:

- Strict mode enabled
- Path aliases for clean imports (`@/components/*`, `@/lib/*`, etc.)
- Next.js plugin integration
- Incremental compilation for faster builds

### ESLint Configuration

Comprehensive linting setup with:

- TypeScript-specific rules
- Next.js recommended configuration
- React hooks rules
- Prettier integration for consistent formatting

### Next.js Configuration

Modern Next.js 15 setup featuring:

- App Router architecture
- TypeScript configuration file (`next.config.ts`)
- Turbopack for development builds
- PWA-ready security headers
- Image optimization
- Experimental features (PPR, React Compiler)

## 🌐 PWA Features

The application is designed as a Progressive Web App with:

- **Installable**: Can be installed on desktop and mobile devices
- **Offline Capable**: Service workers for offline functionality
- **Responsive**: Works on all screen sizes
- **Fast**: Optimized loading and performance
- **Secure**: HTTPS required for PWA features

### PWA Installation

1. Open the app in a supported browser
2. Look for the "Install" prompt or button
3. Follow browser-specific installation steps
4. App will appear on your home screen/desktop

## 🔒 Privacy & Security

- **Local Processing**: All OCR and document processing happens on your device
- **No Data Transmission**: No personal data is sent to external servers
- **Secure Headers**: Comprehensive security headers configured
- **HTTPS Required**: Secure connection required for all PWA features

## 🧪 Development Workflow

### Before Committing

Always run the comprehensive check:

```bash
npm run check
```

This will:

1. Check TypeScript types
2. Run ESLint for code quality
3. Verify Prettier formatting

### Code Formatting

The project uses Prettier with specific configuration:

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 80 character line width
- Trailing commas in ES5

### Linting Rules

ESLint configuration includes:

- TypeScript-specific rules
- React and React Hooks rules
- Next.js best practices
- Accessibility guidelines

## 📊 Performance

### Next.js 15 Improvements

- **40-60% faster builds** with Turbopack
- **10-20% smaller bundles** with enhanced tree-shaking
- **5-15% runtime performance improvement** with React 19

### Optimization Features

- Image optimization with WebP/AVIF support
- Automatic code splitting
- React 19 compiler optimizations
- Partial prerendering (PPR)
- Optimized font loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check` to ensure code quality
5. Commit your changes
6. Push to your branch
7. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in the `documents/` folder
- Review the project scope and requirements
- Check existing issues and discussions

## 🔄 Version History

- **v0.1.0** - Initial Next.js 15 setup with TypeScript and PWA foundation

---

Built with ❤️ using Next.js 15, React 19, and modern web technologies.
