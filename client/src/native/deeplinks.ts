import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

// Store callback to notify when deep link is received
let deepLinkCallback: ((url: string) => void) | null = null;

export function setDeepLinkCallback(callback: (url: string) => void) {
  deepLinkCallback = callback;
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:setDeepLinkCallback',message:'Deep link callback registered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
}

/**
 * Initialize deep link handling for native platforms.
 * Closes the in-app browser when the app receives a deep link with com.deathmountain.loot-survivor-2://open
 */
export function initializeDeepLinks() {
  // Only initialize on native platforms
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  App.addListener('appUrlOpen', async (event) => {
    const url = event.url;
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:appUrlOpen',message:'Deep link received',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Close browser when deep link is received
    if (url.startsWith('com.deathmountain.loot-survivor-2://open') || url.startsWith('https://loot-survivor-2.deathmountain.com/')) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:appUrlOpen',message:'Matching redirect URL, closing browser',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      try {
        await Browser.close();
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:appUrlOpen',message:'Browser closed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // Browser might not be open, ignore error
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:appUrlOpen',message:'Browser close error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.log('Browser close error (expected if browser not open):', error);
      }
      
      // Notify callback if set (for connector to handle redirect)
      if (deepLinkCallback) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'deeplinks.ts:appUrlOpen',message:'Calling deep link callback',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        deepLinkCallback(url);
      }
    }
  });
}
