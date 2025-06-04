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
        await showNotification("Please navigate to a YouTube video page to extract transcript.", "error", tab.id);
        return;
      }

      // Extract video ID
      const videoId = extractVideoId(tab.url);
      if (!videoId) {
        await showNotification("Could not extract video ID from URL.", "error", tab.id);
        return;
      }

      console.log('Extracting transcript for video ID:', videoId);

      // Get video title and extract transcript using the youtube-transcript library
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['youtube-transcript.esm.min.js']
      });

      const transcriptResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async (videoId) => {
          try {
            // Get video title
            const titleSelectors = [
              'h1.ytd-video-primary-info-renderer yt-formatted-string',
              'h1.ytd-watch-metadata #title',
              '#title h1',
              'h1[class*="title"]',
              '.ytd-video-primary-info-renderer h1',
              'ytd-video-primary-info-renderer h1'
            ];

            let title = 'Unknown Title';
            for (const selector of titleSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent.trim()) {
                title = element.textContent.trim();
                console.log('Found title:', title);
                break;
              }
            }

            // Use the youtube-transcript library
            console.log('Extracting transcript using youtube-transcript library for video:', videoId);
            
            // Import the YoutubeTranscript from the loaded module
            const { YoutubeTranscript } = await import(chrome.runtime.getURL('youtube-transcript.esm.min.js'));

            let transcript = null;
            
            // Try with video ID first
            try {
              transcript = await YoutubeTranscript.fetchTranscript(videoId);
              console.log('Success with video ID');
            } catch (error) {
              console.log('Failed with video ID:', error.message);
              
              // Try with full URL as fallback
              try {
                const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
                transcript = await YoutubeTranscript.fetchTranscript(fullUrl);
                console.log('Success with full URL');
              } catch (urlError) {
                console.log('Failed with full URL:', urlError.message);
                throw new Error(`Both approaches failed. Video ID error: ${error.message}`);
              }
            }

            if (!transcript || transcript.length === 0) {
              throw new Error('No transcript data returned');
            }

            console.log('Successfully fetched transcript, segments:', transcript.length);

            // Format the transcript
            const formattedTranscript = transcript.map(item => {
              const startTime = parseFloat(item.offset || item.start || 0);
              const hours = Math.floor(startTime / 3600);
              const minutes = Math.floor((startTime % 3600) / 60);
              const seconds = Math.floor(startTime % 60);
              const timestamp = `(${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
              
              return `${timestamp} ${item.text.toUpperCase()}`;
            }).join(' ');

            return {
              title: title,
              transcript: formattedTranscript
            };

          } catch (error) {
            console.error('Error in content script:', error);
            throw error;
          }
        },
        args: [videoId]
      });

      if (!transcriptResults || !transcriptResults[0] || !transcriptResults[0].result) {
        await showNotification("Failed to extract transcript. The content script encountered an error.", "error", tab.id);
        return;
      }

      const { title, transcript } = transcriptResults[0].result;

      if (!transcript || !transcript.trim()) {
        await showNotification("No transcript found for this video or the video doesn't have captions available.", "error", tab.id);
        return;
      }

      // Format output
      const output = formatOutput(title, tab.url, transcript);

      // Copy to clipboard
      await copyToClipboard(output, tab.id);
      await showNotification("Transcript copied to clipboard!", "success", tab.id);

    } catch (error) {
      console.error("Error extracting transcript:", error);
      await showNotification(`Error: ${error.message || 'An error occurred while extracting transcript.'}`, "error", tab.id);
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

async function showNotification(message, type, tabId = null) {
  try {
    // Try to use Chrome notifications first
    if (chrome.notifications && chrome.notifications.create) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'YouTube Transcript Extractor',
        message: message
      });
    } else {
      // Fallback to content script toast notification
      if (tabId) {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: (msg, msgType) => {
            if (window.showTranscriptToast) {
              window.showTranscriptToast(msg, msgType);
            } else {
              // Simple alert as last resort
              alert(`YouTube Transcript Extractor: ${msg}`);
            }
          },
          args: [message, type]
        });
      }
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    // If all else fails, just log to console
    console.log(`YouTube Transcript Extractor: ${message}`);
  }
}