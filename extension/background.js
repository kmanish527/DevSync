const ALLOWED_DOMAINS = [
  'localhost',
  'devsync-one.vercel.app',
  'stackoverflow.com',
  'developer.mozilla.org',
  'github.com',
  'gitlab.com',
  'linkedin.com',
  'leetcode.com',
  'codechef.com',
  'hackerrank.com',
  'codeforces.com',
  'hackerearth.com'
];

let creating; 
async function setupOffscreenDocument(path) {
  if (await chrome.offscreen.hasDocument()) return;
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'To play alarm sound for Pomodoro timer',
    });
    await creating;
    creating = null;
  }
}

async function playSound() {
  await setupOffscreenDocument('offscreen.html');
  await chrome.runtime.sendMessage({ action: "playSound" });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "devsync-tick") {
    
    const data = await chrome.storage.local.get([
      'timerEndTime', 'timerSessionType', 'timerSessionCount', 
      'workTime', 'shortBreak', 'longBreak', 'SESSIONS_BEFORE_LONG_BREAK'
    ]);
    
    if (!data.timerEndTime) {
      stopTimerSession(false); 
      return;
    }
    
    const now = Date.now();
    const remaining = data.timerEndTime - now;
    const timeLeftInSeconds = Math.ceil(remaining / 1000);
    
    if (timeLeftInSeconds > 0) {
      broadcastToAllTabs({
        action: "updateTime",
        timeLeft: timeLeftInSeconds,
      });
      chrome.alarms.create("devsync-tick", { delayInMinutes: 1/60 }); 
    } else {
      handleSessionEnd(data);
    }
  }
});


function handleSessionEnd(data) {
  playSound();
  
  let nextSessionType;
  let nextTime;
  let nextSessionCount = data.timerSessionCount;

  if (data.timerSessionType === 'work') {
    nextSessionCount = data.timerSessionCount + 1;
    if (nextSessionCount % data.SESSIONS_BEFORE_LONG_BREAK === 0) {
      nextSessionType = 'longBreak';
      nextTime = data.longBreak;
    } else {
      nextSessionType = 'shortBreak';
      nextTime = data.shortBreak;
    }
  } else {
    if (data.timerSessionType === 'longBreak') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png', 
        title: 'Cycle Complete!',
        message: 'Great work! You finished all 4 sessions. Time for a well-deserved break.'
      });
      
      stopTimerSession(true); 
      return; 
    } else {
      nextSessionType = 'work';
      nextTime = data.workTime;
    }
  }

  const newEndTime = Date.now() + nextTime * 1000;
  startTimer(newEndTime, nextSessionType, nextSessionCount, data.workTime, data.shortBreak, data.longBreak, data.SESSIONS_BEFORE_LONG_BREAK);
}

function startTimer(endTime, sessionType, sessionCount, workTime, shortBreak, longBreak, sessionsBeforeLongBreak) {
  const isWorkSession = sessionType === 'work';

  chrome.storage.local.set({ 
    isRunning: true,
    isFocusActive: isWorkSession, 
    timerEndTime: endTime,
    timerSessionType: sessionType,
    timerSessionCount: sessionCount,
    workTime: workTime,
    shortBreak: shortBreak,
    longBreak: longBreak,
    SESSIONS_BEFORE_LONG_BREAK: sessionsBeforeLongBreak
  }, () => {
    
    if (isWorkSession) {
      closeUnwantedTabs();
    }
    
    broadcastToAllTabs({ 
      action: "startTimer", 
      endTime: endTime,
      sessionType: sessionType,
      sessionCount: sessionCount
    });
    
    chrome.alarms.create("devsync-tick", { delayInMinutes: 1/60 });
  });
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.command === "startTimer") {
    console.log("BG: Received startTimer from React");
    startTimer(
      request.endTime, 
      request.sessionType, 
      request.sessionCount,
      request.settings.workTime,
      request.settings.shortBreak,
      request.settings.longBreak,
      request.settings.SESSIONS_BEFORE_LONG_BREAK
    );
    sendResponse({ status: "Timer started" });
    
  } else if (request.command === "stopTimer") {
    console.log("BG: Received stopTimer from React");
    stopTimerSession(true); 
    sendResponse({ status: "Timer stopped" });

  } else if (request.command === "getState") {
    console.log("BG: Received getState from React");
    chrome.storage.local.get([
      'isRunning', 'timerEndTime', 'timerSessionType', 'timerSessionCount'
    ], (data) => {
      sendResponse(data);
    });
    return true; 
  }
  return true; 
});

function stopTimerSession(broadcastUpdate) {
  chrome.alarms.clear("devsync-tick");

  chrome.storage.local.set({ 
    isRunning: false,
    isFocusActive: false, 
    timerEndTime: null,
    timerSessionType: 'work', 
    timerSessionCount: 0      
  });
  
  if (broadcastUpdate) {
    broadcastToAllTabs({ action: "stopTimer" });
  }
  
  console.log("Timer session deactivated. All sites unblocked.");
}

function broadcastToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {  }
      });
    }
  });
}

function closeUnwantedTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (!tab.url) continue; 
      try {
        const url = new URL(tab.url);
        const domain = url.hostname; 
        const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
          domain === allowedDomain || domain.endsWith('.' + allowedDomain)
        );
        if (!isAllowed) {
          if (!tab.pinned && !tab.url.startsWith('chrome://')) {
            console.log(`DevSync: Closing distraction tab: ${tab.url}`);
            chrome.tabs.remove(tab.id, () => {
              if (chrome.runtime.lastError) {
                console.warn(`DevSync: Error closing tab (ignoring): ${chrome.runtime.lastError.message}`);
              }
            });
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
      const domain = url.hostname;
      const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
        domain === allowedDomain || domain.endsWith('.' + allowedDomain)
      );
      if (!isAllowed && !details.url.startsWith('chrome://')) {
        console.log(`Blocking navigation to: ${details.url}`);
        chrome.tabs.remove(details.tabId, () => {
          if (chrome.runtime.lastError) {
            console.warn(`DevSync: Error blocking navigation (ignoring): ${chrome.runtime.lastError.message}`);
          }
        });
      }
    }
  });
}, { url: [{ hostContains: '.' }] });
