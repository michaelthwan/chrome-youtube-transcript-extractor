# YouTube Transcript Extractor

A Chrome extension that allows you to extract YouTube video transcripts with timestamps via a simple right-click context menu. Enhanced with the powerful [youtube-video-transcript](https://www.jsdelivr.com/package/npm/youtube-video-transcript) library for better reliability and multi-language support.

## Features

- 🎯 **Simple Right-Click**: Extract transcripts directly from any YouTube video page via context menu
- 🌍 **Multi-Language Support**: Automatically tries multiple languages (English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese)
- 🤖 **Smart Fallback**: Uses both library methods and direct extraction for maximum reliability
- ⏱️ **Timestamped Output**: Each transcript segment includes accurate timestamps
- 📋 **Auto-Copy**: Transcript is automatically copied to your clipboard
- 🔧 **Auto/Manual Detection**: Shows whether transcript is auto-generated or manually created
- 🎨 **Clean Format**: Well-formatted output with video details and metadata
- 🚀 **Enhanced Library**: Now powered by the robust `youtube-video-transcript@1.0.6` library

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/michaelthwan/chrome-youtube-transcript-extractor.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in the top right)

4. Click "Load unpacked" and select the cloned folder

5. The extension will be installed and ready to use!

## Usage

1. Navigate to any YouTube video page
2. Right-click anywhere on the page
3. Select "Extract transcript" from the context menu
4. The transcript will be automatically copied to your clipboard
5. Paste it wherever you need it!

## Output Format

The extracted transcript includes:

```
Title: [Video Title]
URL: [Video URL]
Language: [Language Code]
Type: [Auto-generated/Manual]
Extracted: [Timestamp]
Segments: [Number of segments]

--- TRANSCRIPT ---

[0:00] First transcript segment
[0:05] Second transcript segment
[0:12] Third transcript segment
...

--- END TRANSCRIPT ---

Extracted with YouTube Transcript Extractor
```

## Technical Details

### Library Integration

This extension now uses the [youtube-video-transcript](https://www.jsdelivr.com/package/npm/youtube-video-transcript) library which provides:

- **Better API**: More reliable transcript fetching with improved error handling
- **Multiple Languages**: Support for fetching transcripts in various languages
- **TypeScript Support**: Better type definitions and development experience
- **Enhanced Parsing**: Better XML parsing and text cleaning
- **Smart Selection**: Prioritizes manual transcripts over auto-generated ones

### Language Support

The extension attempts to fetch transcripts in this order:
1. English (manual) - highest priority
2. English (auto-generated)
3. Spanish, French, German, Italian, Portuguese
4. Japanese, Korean, Chinese
5. Any available language as fallback

### Fallback Mechanism

If the primary library method fails, the extension automatically falls back to:
1. Direct caption track extraction from page HTML
2. Manual XML parsing and processing
3. Comprehensive error reporting

## Development

### Project Structure

```
chrome-youtube-transcript-extractor/
├── manifest.json                     # Extension manifest
├── background.js                     # Background service worker
├── content.js                       # Content script for YouTube pages
├── youtube-video-transcript.min.js  # Enhanced transcript library
├── package.json                     # NPM package configuration
├── icons/                           # Extension icons
└── README.md                        # This file
```

### Key Files

- **`background.js`**: Main extension logic, handles context menu and transcript extraction
- **`content.js`**: Runs on YouTube pages, provides helper functions and notifications
- **`youtube-video-transcript.min.js`**: The core transcript extraction library
- **`manifest.json`**: Chrome extension configuration with required permissions

### Dependencies

- **youtube-video-transcript@1.0.6**: Core transcript extraction library
- Chrome Extension Manifest V3
- Native Chrome APIs (contextMenus, scripting, notifications, clipboardWrite)

## Permissions

This extension requires the following permissions:

- **activeTab**: Access the current YouTube tab
- **contextMenus**: Add the right-click context menu
- **scripting**: Execute scripts on YouTube pages for transcript extraction
- **clipboardWrite**: Copy transcripts to clipboard
- **notifications**: Show extraction status notifications
- **host_permissions**: Access to YouTube.com and YouTube's API endpoints

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (uses different extension API)

## Troubleshooting

### Common Issues

1. **"No transcript found"**: The video may not have captions enabled
2. **"Failed to extract"**: Try refreshing the page and trying again
3. **"Library not loaded"**: Check if the extension is properly installed
4. **Empty clipboard**: Make sure Chrome has clipboard permissions

### Debug Information

Check the Chrome DevTools console for detailed error messages and extraction logs.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly on various YouTube videos
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/michaelthwan/chrome-youtube-transcript-extractor.git

# Navigate to the project directory
cd chrome-youtube-transcript-extractor

# Install dependencies (optional, for development)
npm install

# Load the extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [youtube-video-transcript](https://github.com/Vicfou-dev/youtube-video-transcript) library by Vicfou-dev
- YouTube's unofficial transcript API
- Chrome Extension APIs

## Changelog

### Version 1.0.1 (Current)
- ✨ **NEW**: Integrated youtube-video-transcript@1.0.6 library
- ✨ **NEW**: Multi-language support (9+ languages)
- ✨ **NEW**: Smart fallback mechanism
- ✨ **NEW**: Enhanced error handling and reporting
- ✨ **NEW**: Improved transcript formatting with metadata
- ✨ **NEW**: Auto/Manual transcript type detection
- 🔧 **IMPROVED**: Better reliability and success rate
- 🔧 **IMPROVED**: More detailed output format
- 🔧 **IMPROVED**: Enhanced debugging and logging

### Version 1.0.0
- 🎉 Initial release with basic transcript extraction
- ✅ Right-click context menu
- ✅ Basic English transcript support
- ✅ Clipboard integration