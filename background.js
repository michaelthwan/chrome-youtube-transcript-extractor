// Background script for YouTube Transcript Extractor

// Create context menu on extension startup
chrome.runtime.onStartup.addListener(createContextMenu);
chrome.runtime.onInstalled.addListener(createContextMenu);

function createContextMenu() {
  chrome.contextMenus.create({
    id: "extract-transcript",
    title: "Extract transcript",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/watch*"]
  });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "extract-transcript") {
    try {
      // Validate YouTube URL
      if (!isYouTubeWatchPage(tab.url)) {
        showNotification("Please navigate to a YouTube video page to extract transcript.", "error");
        return;
      }

      // Extract video ID
      const videoId = extractVideoId(tab.url);
      if (!videoId) {
        showNotification("Could not extract video ID from URL.", "error");
        return;
      }

      // Inject content script and get transcript data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractTranscriptData
      });

      if (!results || !results[0] || !results[0].result) {
        showNotification("Could not extract transcript due to unexpected page structure. The extension might need an update.", "error");
        return;
      }

      const { title, captionTracks } = results[0].result;

      if (!captionTracks || captionTracks.length === 0) {
        showNotification("No transcript found for this video.", "error");
        return;
      }

      // Find the best caption track (prioritize English)
      const captionTrack = findBestCaptionTrack(captionTracks);
      if (!captionTrack) {
        showNotification("No suitable transcript found for this video.", "error");
        return;
      }

      // Fetch and parse transcript
      const transcript = await fetchAndParseTranscript(captionTrack.baseUrl);
      if (!transcript) {
        showNotification("Failed to fetch transcript. Please try again later.", "error");
        return;
      }

      // Format output
      const output = formatOutput(title, tab.url, transcript);

      // Copy to clipboard
      await copyToClipboard(output, tab.id);
      showNotification("Transcript copied to clipboard!", "success");

    } catch (error) {
      console.error("Error extracting transcript:", error);
      showNotification("An error occurred while extracting transcript.", "error");
    }
  }
});

// Helper functions
function isYouTubeWatchPage(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch' && urlObj.searchParams.has('v');
  } catch {
    return false;
  }
}

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  } catch {
    return null;
  }
}

function findBestCaptionTrack(captionTracks) {
  // Prioritize English tracks
  let englishTrack = captionTracks.find(track => 
    track.languageCode === 'en' || track.languageCode.startsWith('en-')
  );
  
  if (englishTrack) return englishTrack;
  
  // Fall back to any available track
  return captionTracks[0];
}

async function fetchAndParseTranscript(captionUrl) {
  try {
    const response = await fetch(captionUrl);
    if (!response.ok) throw new Error('Failed to fetch transcript');
    
    const vttText = await response.text();
    return parseVTT(vttText);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

function parseVTT(vttText) {
  const lines = vttText.split('\n');
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and VTT headers
    if (!line || line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) {
      continue;
    }

    // Time code line (format: 00:00:01.000 --> 00:00:03.000)
    if (line.includes(' --> ')) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      
      const [startTime] = line.split(' --> ');
      currentSegment = {
        timestamp: formatTimestamp(startTime),
        text: ''
      };
    } else if (currentSegment && line) {
      // Text line
      const cleanText = cleanTranscriptText(line);
      if (cleanText) {
        currentSegment.text += (currentSegment.text ? ' ' : '') + cleanText;
      }
    }
  }

  // Add the last segment
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return combineSegments(segments);
}

function formatTimestamp(timeStr) {
  // Convert from 00:00:01.000 to (00:00:01)
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const seconds = parts[2].split('.')[0];
    return `(${parts[0]}:${parts[1]}:${seconds.padStart(2, '0')})`;
  }
  return `(${timeStr})`;
}

function cleanTranscriptText(text) {
  // Remove HTML tags and clean up text
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function combineSegments(segments) {
  if (!segments.length) return '';

  let result = '';
  let lastTimestamp = '';
  let combinedText = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    // If this is a new timestamp or the last segment
    if (segment.timestamp !== lastTimestamp || i === segments.length - 1) {
      // Add the previous combined text if it exists
      if (combinedText && lastTimestamp) {
        result += `${lastTimestamp} ${combinedText.toUpperCase()} `;
      }
      
      // Start new combination
      lastTimestamp = segment.timestamp;
      combinedText = segment.text;
    } else {
      // Combine with existing text
      combinedText += ' ' + segment.text;
    }
  }

  // Add the last segment
  if (combinedText && lastTimestamp) {
    result += `${lastTimestamp} ${combinedText.toUpperCase()}`;
  }

  return result.trim();
}

function formatOutput(title, url, transcript) {
  return `<content>
Summarize the video using zh-tw. Using point form and preserving more details.
Title: "${title}"
URL: "${url}"
Transcript: "${transcript}"
</content>`;
}

async function copyToClipboard(text, tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (text) => {
      navigator.clipboard.writeText(text);
    },
    args: [text]
  });
}

function showNotification(message, type) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'YouTube Transcript Extractor',
    message: message
  });
}

// Content script function to be injected
function extractTranscriptData() {
  try {
    // Get video title
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata #title, #title h1');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

    // Extract ytInitialPlayerResponse
    let ytInitialPlayerResponse = null;
    
    // Try to find it in script tags
    const scriptTags = document.querySelectorAll('script');
    for (let script of scriptTags) {
      const content = script.textContent;
      if (content && content.includes('ytInitialPlayerResponse')) {
        const match = content.match(/var ytInitialPlayerResponse = ({.*?});/);
        if (match) {
          try {
            ytInitialPlayerResponse = JSON.parse(match[1]);
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }

    // Try to get it from window object
    if (!ytInitialPlayerResponse && window.ytInitialPlayerResponse) {
      ytInitialPlayerResponse = window.ytInitialPlayerResponse;
    }

    if (!ytInitialPlayerResponse) {
      return null;
    }

    // Extract caption tracks
    const captionTracks = ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    return {
      title: title,
      captionTracks: captionTracks || []
    };
  } catch (error) {
    console.error('Error in extractTranscriptData:', error);
    return null;
  }
}