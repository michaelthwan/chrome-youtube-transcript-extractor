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

      // Extract transcript using DOM-based approach
      const transcriptResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async (videoId) => {
          try {
            // Helper function to convert timestamp to seconds (moved inside scope)
            function convertTimestampToSeconds(timestamp) {
              try {
                const parts = timestamp.split(':');
                if (parts.length === 2) {
                  // MM:SS format
                  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                } else if (parts.length === 3) {
                  // HH:MM:SS format
                  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                }
                return 0;
              } catch (e) {
                return 0;
              }
            }

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

            // Helper function to wait for element
            function waitForElement(selector, timeout = 10000) {
              return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                  resolve(element);
                  return;
                }

                const observer = new MutationObserver((mutations, obs) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    obs.disconnect();
                    resolve(element);
                  }
                });

                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });

                setTimeout(() => {
                  observer.disconnect();
                  reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
              });
            }

            // Helper function to wait
            function wait(ms) {
              return new Promise(resolve => setTimeout(resolve, ms));
            }

            console.log('Starting DOM-based transcript extraction...');

            // Step 1: Try to expand description if needed
            try {
              const expandButton = document.querySelector('#expand-sizer, tp-yt-paper-button[id="expand-sizer"]');
              if (expandButton && expandButton.offsetParent !== null) {
                console.log('Clicking expand description button...');
                expandButton.click();
                await wait(1000); // Wait for animation
              }
            } catch (e) {
              console.log('Description expand not needed or failed:', e.message);
            }

            // Step 2: Look for transcript button and click it
            console.log('Looking for transcript button...');
            
            const transcriptButtonSelectors = [
              // English button text
              'button[aria-label*="Show transcript"], button[aria-label*="transcript"]',
              // Chinese button text (顯示轉錄稿)
              'button[aria-label*="顯示轉錄稿"], button[aria-label*="轉錄稿"]',
              // Generic selectors
              'ytd-button-renderer button[aria-label*="transcript"]',
              'ytd-button-renderer button[aria-label*="轉錄稿"]',
              // Fallback - look in description area
              'ytd-video-description-transcript-section-renderer button',
              'ytd-expandable-video-description-body-renderer button[aria-label*="transcript"]'
            ];

            let transcriptButton = null;
            for (const selector of transcriptButtonSelectors) {
              try {
                transcriptButton = document.querySelector(selector);
                if (transcriptButton && transcriptButton.offsetParent !== null) {
                  console.log('Found transcript button with selector:', selector);
                  break;
                }
              } catch (e) {
                console.log('Selector failed:', selector, e.message);
              }
            }

            // Alternative approach: search by text content
            if (!transcriptButton) {
              console.log('Searching for transcript button by text content...');
              const allButtons = document.querySelectorAll('button');
              for (const button of allButtons) {
                const text = button.textContent || button.innerText || '';
                const ariaLabel = button.getAttribute('aria-label') || '';
                if (text.includes('transcript') || text.includes('轉錄稿') || 
                    ariaLabel.includes('transcript') || ariaLabel.includes('轉錄稿')) {
                  transcriptButton = button;
                  console.log('Found transcript button by text:', text || ariaLabel);
                  break;
                }
              }
            }

            if (!transcriptButton) {
              throw new Error('Transcript button not found. Make sure the video has captions enabled.');
            }

            // Click the transcript button
            console.log('Clicking transcript button...');
            transcriptButton.click();

            // Wait for transcript panel to load
            console.log('Waiting for transcript panel to load...');
            await wait(2000);

            // Step 3: Wait for transcript segments to appear
            const transcriptContainer = await waitForElement(
              'ytd-transcript-segment-list-renderer, ytd-transcript-segment-renderer',
              15000
            );

            console.log('Transcript container found, extracting segments...');

            // Step 4: Extract transcript segments
            const segments = [];
            
            // Try multiple selectors for transcript segments
            const segmentSelectors = [
              'ytd-transcript-segment-renderer',
              '.segment.style-scope.ytd-transcript-segment-renderer',
              '[class*="transcript-segment"]'
            ];

            let segmentElements = [];
            for (const selector of segmentSelectors) {
              segmentElements = document.querySelectorAll(selector);
              if (segmentElements.length > 0) {
                console.log(`Found ${segmentElements.length} segments with selector: ${selector}`);
                break;
              }
            }

            if (segmentElements.length === 0) {
              throw new Error('No transcript segments found in the panel');
            }

            // Extract text and timestamps from segments
            for (let i = 0; i < segmentElements.length; i++) {
              const segment = segmentElements[i];
              try {
                // Extract timestamp - try multiple selectors
                const timestampSelectors = [
                  '.segment-timestamp',
                  '.segment-start-offset .segment-timestamp',
                  '[class*="timestamp"]',
                  '.ytd-transcript-segment-renderer .segment-start-offset div'
                ];
                
                let timestampElement = null;
                for (const timestampSelector of timestampSelectors) {
                  timestampElement = segment.querySelector(timestampSelector);
                  if (timestampElement && timestampElement.textContent.trim()) {
                    break;
                  }
                }
                
                // Extract text - try multiple selectors
                const textSelectors = [
                  '.segment-text',
                  'yt-formatted-string.segment-text',
                  'yt-formatted-string[class*="segment-text"]',
                  '[class*="segment-text"]',
                  '.ytd-transcript-segment-renderer yt-formatted-string'
                ];
                
                let textElement = null;
                for (const textSelector of textSelectors) {
                  textElement = segment.querySelector(textSelector);
                  if (textElement && textElement.textContent.trim()) {
                    break;
                  }
                }

                if (timestampElement && textElement) {
                  const timestamp = timestampElement.textContent.trim();
                  const text = textElement.textContent.trim();
                  
                  if (timestamp && text) {
                    // Convert timestamp to seconds
                    const timeSeconds = convertTimestampToSeconds(timestamp);
                    
                    segments.push({
                      timestamp: timestamp,
                      start: timeSeconds,
                      text: text
                    });

                    // Log first few segments for debugging
                    if (i < 3) {
                      console.log(`Segment ${i}: [${timestamp}] "${text}"`);
                    }
                  }
                }
              } catch (e) {
                console.log(`Error processing segment ${i}:`, e.message);
              }
            }

            console.log(`Successfully extracted ${segments.length} transcript segments`);

            if (segments.length === 0) {
              throw new Error('No valid transcript segments could be extracted');
            }

            // Detect language from UI or content
            let detectedLanguage = 'en'; // default
            try {
              // Try to detect from transcript header or UI language
              const headerElement = document.querySelector('ytd-transcript-section-header-renderer h2');
              if (headerElement) {
                const headerText = headerElement.textContent;
                // Simple detection based on UI text
                if (headerText.includes('轉錄稿') || document.documentElement.lang === 'zh') {
                  detectedLanguage = 'zh';
                }
              }
            } catch (e) {
              console.log('Language detection failed, using default');
            }

            return {
              success: true,
              title: title,
              transcript: {
                language: detectedLanguage,
                type: 'auto', // Usually auto-generated from UI
                data: segments
              },
              language: detectedLanguage,
              url: window.location.href
            };

          } catch (error) {
            console.error('DOM-based transcript extraction error:', error);
            return {
              success: false,
              error: error.message,
              title: title || 'Unknown Title',
              url: window.location.href
            };
          }
        },
        args: [videoId]
      });

      const result = transcriptResults[0].result;

      if (result.success && result.transcript) {
        // Format and copy transcript
        const formattedOutput = formatOutput(result.title, result.url, result.transcript, result.language);
        await copyToClipboard(formattedOutput, tab.id);
        
        const segmentCount = result.transcript.data.length;
        const transcriptType = result.transcript.type === 'auto' ? 'Auto-generated' : 'Manual';
        
        await showNotification(
          `DOM extraction successful! ${segmentCount} segments (${transcriptType}, ${result.language.toUpperCase()}) copied to clipboard.`,
          "success",
          tab.id
        );
      } else {
        await showNotification(
          `Failed to extract transcript: ${result.error}`,
          "error",
          tab.id
        );
      }

    } catch (error) {
      console.error('Extension error:', error);
      await showNotification(
        `Extension error: ${error.message}`,
        "error",
        tab.id
      );
    }
  }
});

function isYouTubeWatchPage(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch';
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

function formatOutput(title, url, transcript, language) {
  const timestamp = new Date().toLocaleString();
  const transcriptType = transcript.type === 'auto' ? 'Auto-generated' : 'Manual';
  
  let output = `Title: ${title}\n`;
  output += `URL: ${url}\n`;
  output += `Language: ${language.toUpperCase()}\n`;
  output += `Type: ${transcriptType}\n`;
  output += `Extracted: ${timestamp}\n`;

  output += `\n--- TRANSCRIPT ---\n\n`;

  transcript.data.forEach((segment, index) => {
    output += `[${segment.timestamp}] ${segment.text}\n`;
  });

  output += `\n--- END TRANSCRIPT ---\n`;
  
  return output;
}

async function copyToClipboard(text, tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      function: (textToCopy) => {
        navigator.clipboard.writeText(textToCopy);
      },
      args: [text]
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy transcript to clipboard');
  }
}

async function showNotification(message, type, tabId = null) {
  // Show in-page toast if we have a tab ID
  if (tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        function: (msg, msgType) => {
          // Helper function to show toast notifications
          function showToast(message, type = 'info') {
            // Remove existing toast
            const existingToast = document.getElementById('yt-transcript-toast');
            if (existingToast) {
              existingToast.remove();
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.id = 'yt-transcript-toast';
            toast.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: ${type === 'error' ? '#f44336' : '#4CAF50'};
              color: white;
              padding: 12px 20px;
              border-radius: 4px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: Arial, sans-serif;
              font-size: 14px;
              max-width: 300px;
              word-wrap: break-word;
              animation: slideIn 0.3s ease-out;
            `;

            // Add animation keyframes
            if (!document.getElementById('toast-styles')) {
              const style = document.createElement('style');
              style.id = 'toast-styles';
              style.textContent = `
                @keyframes slideIn {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                  from { transform: translateX(0); opacity: 1; }
                  to { transform: translateX(100%); opacity: 0; }
                }
              `;
              document.head.appendChild(style);
            }

            toast.textContent = message;
            document.body.appendChild(toast);

            // Auto remove after 3 seconds
            setTimeout(() => {
              if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                  if (toast.parentNode) {
                    toast.remove();
                  }
                }, 300);
              }
            }, 3000);
          }

          showToast(msg, msgType);
        },
        args: [message, type]
      });
    } catch (error) {
      console.log('Could not show in-page notification:', error.message);
    }
  }
}