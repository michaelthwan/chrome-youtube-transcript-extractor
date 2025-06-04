# YouTube Transcript Extractor Chrome Extension

A Chrome extension that allows you to extract YouTube video transcripts with timestamps via a simple right-click context menu.

## Features

- **Right-click Context Menu**: Easy access through right-click menu on YouTube video pages
- **Automatic Transcript Detection**: Prioritizes English transcripts, falls back to available languages
- **Timestamp Formatting**: Includes timestamps in (HH:MM:SS) format
- **Clipboard Integration**: Automatically copies formatted transcript to clipboard
- **Error Handling**: Clear notifications for various error scenarios
- **Structured Output**: Formats transcript with title, URL, and a summarization prompt

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## Usage

1. Navigate to any YouTube video page (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
2. Right-click anywhere on the page
3. Select "Extract transcript" from the context menu
4. The transcript will be automatically copied to your clipboard
5. A notification will confirm successful extraction

## Output Format

The extracted transcript follows this structure:

```
<content>
Summarize the video using zh-tw. Using point form and preserving more details.
Title: "[Video Title]"
URL: "[Video URL]"
Transcript: "[Formatted Transcript with Timestamps]"
</content>
```

## File Structure

- `manifest.json` - Extension configuration and permissions
- `background.js` - Main extension logic and context menu handling
- `content.js` - Content script for YouTube page interaction
- `README.md` - This documentation file

## Permissions

The extension requires the following permissions:

- `activeTab` - Access to the current tab information
- `contextMenus` - Create right-click context menu items
- `scripting` - Inject scripts into web pages
- `clipboardWrite` - Copy text to clipboard
- `host_permissions` - Access to YouTube domains

## Error Handling

The extension handles various error scenarios:

- **Not on YouTube video page**: "Please navigate to a YouTube video page to extract transcript."
- **No transcript available**: "No transcript found for this video."
- **Network errors**: "Failed to fetch transcript. Please try again later."
- **Page structure changes**: "Could not extract transcript due to unexpected page structure."

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Transcript Format**: Parses WebVTT format from YouTube's caption tracks
- **Language Priority**: English first, then any available language
- **Timestamp Conversion**: Converts WebVTT timestamps to readable format

## Troubleshooting

### Extension not working?
1. Ensure you're on a YouTube video page (`/watch?v=...`)
2. Check that the video has captions/transcripts available
3. Try refreshing the page and attempting again
4. Check the browser console for any error messages

### Context menu not appearing?
1. Verify the extension is enabled in `chrome://extensions/`
2. Make sure you're right-clicking on a YouTube video page
3. The menu item only appears on valid YouTube watch URLs

### Transcript not copying?
1. Check clipboard permissions in browser settings
2. Try manually copying the output from the console if debugging
3. Ensure the page has finished loading before attempting extraction

## Development

To modify or extend the extension:

1. Make your changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on a YouTube video page

## Limitations

- Only works on YouTube video pages with available transcripts
- Requires captions to be enabled on the video
- Some videos may not have transcripts available
- Dependent on YouTube's page structure (may need updates if YouTube changes)

## Future Enhancements

Potential improvements for future versions:

- Language selection option
- Direct text area output
- File download option
- API integration for automatic summarization
- Support for other video platforms

## License

This project is open source and available under the MIT License.