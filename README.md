# YouTube Transcript Extractor

A Chrome extension that extracts YouTube video transcripts with timestamps via a simple right-click context menu. Uses a reliable DOM-based approach to directly interact with YouTube's native transcript feature.

## Features

- 🎯 **Simple Right-Click**: Extract transcripts directly from any YouTube video page via context menu
- 🌍 **Multi-Language Support**: Works with any language that has transcripts available on YouTube
- 🤖 **DOM-Based Extraction**: Directly interacts with YouTube's UI elements for maximum reliability
- ⏱️ **Timestamped Output**: Each transcript segment includes accurate timestamps
- 📋 **Auto-Copy**: Transcript is automatically copied to your clipboard
- 🔧 **Auto/Manual Detection**: Shows whether transcript is auto-generated or manually created
- 🎨 **Clean Format**: Well-formatted output with video details and metadata
- 🚀 **No Dependencies**: Pure DOM manipulation without external libraries

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

1. Navigate to any YouTube video page that has transcripts/captions available
2. Right-click anywhere on the page
3. Select "Extract transcript" from the context menu
4. The extension will automatically find and click YouTube's transcript button
5. The transcript will be extracted and automatically copied to your clipboard
6. Paste it wherever you need it!

## Output Format

The extracted transcript includes:

```
Title: [Video Title]
URL: [Video URL]
Language: [Language Code]
Type: [Auto-generated/Manual]
Extracted: [Timestamp]

--- TRANSCRIPT ---

[0:00] First transcript segment
[0:05] Second transcript segment
[0:12] Third transcript segment
...

--- END TRANSCRIPT ---
```

## Technical Details

### DOM-Based Approach

This extension uses a sophisticated DOM manipulation strategy:

1. **Expands description** if needed to reveal transcript options
2. **Locates transcript button** using multiple selector strategies and text matching
3. **Clicks the transcript button** to open YouTube's native transcript panel
4. **Waits for content to load** using MutationObserver for dynamic content
5. **Extracts segments** directly from the DOM with timestamps and text
6. **Formats and copies** the complete transcript to clipboard

### Language Support

The extension works with any language that YouTube provides transcripts for:
- Automatically detects the available transcript language
- Supports both auto-generated and manual transcripts
- Works with English, Chinese, Spanish, French, German, Japanese, Korean, and many more
- Uses YouTube's native language detection and UI text


## Development

### Project Structure

```
chrome-youtube-transcript-extractor/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker with DOM extraction logic
├── content.js            # Content script for YouTube pages  
├── package.json          # Project metadata
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Files

- **`background.js`**: Main extension logic, handles context menu and DOM-based transcript extraction
- **`content.js`**: Runs on YouTube pages, provides helper functions and in-page notifications
- **`manifest.json`**: Chrome extension configuration with required permissions

### Dependencies

- **No external dependencies**: Pure DOM manipulation approach
- Chrome Extension Manifest V3
- Native Chrome APIs (contextMenus, scripting, clipboardWrite)

## Permissions

This extension requires the following permissions:

- **activeTab**: Access the current YouTube tab
- **contextMenus**: Add the right-click context menu  
- **scripting**: Execute scripts on YouTube pages for DOM manipulation
- **clipboardWrite**: Copy transcripts to clipboard
- **host_permissions**: Access to YouTube.com

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (uses different extension API)

## Troubleshooting

### Common Issues

1. **"Transcript button not found"**: The video may not have captions/transcripts enabled
2. **"No transcript segments found"**: YouTube's UI may have changed, try refreshing the page
3. **"Failed to extract"**: Make sure the video has transcripts available and try again
4. **Empty clipboard**: Make sure Chrome has clipboard permissions

### Debug Information

Check the Chrome DevTools console for detailed error messages and extraction logs. The extension provides comprehensive logging of each step in the extraction process.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly on various YouTube videos with different languages
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/michaelthwan/chrome-youtube-transcript-extractor.git

# Navigate to the project directory
cd chrome-youtube-transcript-extractor

# Load the extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- YouTube's native transcript functionality
- Chrome Extension APIs
- Community feedback and testing

## Changelog

### Version 1.1.0 (Current)
- ✨ **NEW**: DOM-based extraction method for maximum reliability
- ✨ **NEW**: Direct interaction with YouTube's native transcript UI
- ✨ **NEW**: Enhanced multi-language support through YouTube's built-in features
- ✨ **NEW**: Improved error handling and debugging
- ✨ **NEW**: In-page notifications instead of system notifications
- 🔧 **IMPROVED**: Removed external dependencies for better performance
- 🔧 **IMPROVED**: More reliable extraction success rate
- 🔧 **IMPROVED**: Cleaner output format
- 🔧 **IMPROVED**: Better handling of different YouTube UI versions

### Version 1.0.0
- 🎉 Initial release with library-based transcript extraction
- ✅ Right-click context menu
- ✅ Multi-language transcript support
- ✅ Clipboard integration