// Content script for YouTube Transcript Extractor
// This script runs on YouTube pages to provide additional functionality

(function() {
  'use strict';

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      try {
        const data = extractPageData();
        sendResponse({ success: true, data: data });
      } catch (error) {
        console.error('Error extracting page data:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // Keep the message channel open for async response
  });

  function extractPageData() {
    // Get video title with multiple selectors as fallback
    const titleSelectors = [
      'h1.ytd-video-primary-info-renderer yt-formatted-string',
      'h1.ytd-watch-metadata #title',
      '#title h1',
      'h1[class*="title"]',
      '.ytd-video-primary-info-renderer h1'
    ];

    let title = 'Unknown Title';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        break;
      }
    }

    // Extract ytInitialPlayerResponse with multiple methods
    let ytInitialPlayerResponse = null;

    // Method 1: Try window object first
    if (window.ytInitialPlayerResponse) {
      ytInitialPlayerResponse = window.ytInitialPlayerResponse;
    }

    // Method 2: Parse from script tags
    if (!ytInitialPlayerResponse) {
      const scriptTags = document.querySelectorAll('script');
      for (let script of scriptTags) {
        const content = script.textContent || script.innerHTML;
        if (content && content.includes('ytInitialPlayerResponse')) {
          // Try different patterns
          const patterns = [
            /var ytInitialPlayerResponse = ({.*?});/,
            /window\["ytInitialPlayerResponse"\] = ({.*?});/,
            /"ytInitialPlayerResponse":({.*?}),"ytInitialData"/,
            /ytInitialPlayerResponse = ({.*?});/
          ];

          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              try {
                ytInitialPlayerResponse = JSON.parse(match[1]);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          if (ytInitialPlayerResponse) break;
        }
      }
    }

    // Method 3: Try to get from ytplayer config
    if (!ytInitialPlayerResponse && window.ytplayer && window.ytplayer.config) {
      ytInitialPlayerResponse = window.ytplayer.config.args.player_response;
      if (typeof ytInitialPlayerResponse === 'string') {
        try {
          ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponse);
        } catch (e) {
          ytInitialPlayerResponse = null;
        }
      }
    }

    if (!ytInitialPlayerResponse) {
      throw new Error('Could not find ytInitialPlayerResponse');
    }

    // Extract caption tracks
    const captionTracks = ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    return {
      title: title,
      captionTracks: captionTracks,
      videoDetails: ytInitialPlayerResponse.videoDetails || null
    };
  }

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

  // Expose showToast globally for background script access
  window.showTranscriptToast = showToast;

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }

  function initializeContentScript() {
    // Additional initialization if needed
    console.log('YouTube Transcript Extractor content script loaded');
  }

})();