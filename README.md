# Web Components Library

A collection of reusable web components with a clean, organized structure.

## Project Structure

```
webelements/
├── src/
│   ├── components/           # Individual components
│   │   ├── glassmorphic/     # Glassmorphic UI components
│   │   └── hero/             # Hero section components
│   └── styles/               # Global styles
├── dist/                     # Built files
├── build.js                  # Build script
├── package.json              # Project configuration
└── README.md                 # This file
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. For development with auto-reload:
   ```bash
   npm run dev
   ```

## Adding New Components

1. Create a new directory in `src/components/` for your component
2. Add your component's CSS/JS files
3. Update the `config.components` object in `build.js` to include your new component
4. Run the build script

## License

MIT
