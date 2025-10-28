const ALLOWED_DOMAINS = [
  'localhost',                
  'your-devsync-domain.com',  
  'stackoverflow.com',
  'developer.mozilla.org',

  // --- Social Profiles ---
  'github.com',
  'gitlab.com',
  'linkedin.com',
  
  // --- Competitive Coding ---
  'leetcode.com',
  'codechef.com',
  'hackerrank.com',
  'codeforces.com',
  'hackerearth.com'
  
  // Add any other sites you need (e.G., 'vercel.app', 'aws.amazon.com')
];


chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.command === "startFocus") {
    console.log(`Focus session starting for ${request.duration} minutes.`);
    chrome.storage.local.set({ isFocusActive: true });
    closeUnwantedTabs();
    if (request.duration && request.duration > 0) {
      chrome.alarms.create("stopFocus", { delayInMinutes: request.duration });
    }
    
    sendResponse({ status: "Focus started" });

  } else if (request.command === "stopFocus") {
    console.log("Focus session stopping by user request.");
    stopFocusSession();
    sendResponse({ status: "Focus stopped" });
  }
  return true; 
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "stopFocus") {
    console.log("Alarm fired: Focus session stopping.");
    stopFocusSession();
  }
});

function stopFocusSession() {
  chrome.storage.local.set({ isFocusActive: false });
  chrome.alarms.clear("stopFocus");
  console.log("Focus session deactivated. All sites unblocked.");
}

function closeUnwantedTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (!tab.url) continue; 

      try {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => domain.endsWith(allowedDomain));

        if (!isAllowed) {
          if (!tab.pinned && !tab.url.startsWith('chrome://')) {
            chrome.tabs.remove(tab.id);
          }
        }
      } catch (e) {
        console.warn(`Could not parse URL, skipping: ${tab.url}`, e);
      }
    }
  });
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {

  if (details.frameId !== 0) {
    return;
  }

  chrome.storage.local.get("isFocusActive", (data) => {
    if (data.isFocusActive) {
      const url = new URL(details.url);
      const domain = url.hostname.replace('www.', '');

      const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => domain.endsWith(allowedDomain));

      if (!isAllowed && !details.url.startsWith('chrome://')) {
        console.log(`Blocking navigation to: ${details.url}`);
        chrome.tabs.remove(details.tabId);
      }
    }
  });
}, { url: [{ hostContains: '.' }] });