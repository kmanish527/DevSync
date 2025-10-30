let timerDiv = null;
let removalTimeout = null;
const TIMER_DIV_ID = 'devsync-floating-timer';
let timeSpan = null;
let sessionSpan = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    createOrUpdateTimerUI(message.endTime, message.sessionType, message.sessionCount);
  } 
  else if (message.action === 'updateTime') {
    chrome.storage.local.get(['timerEndTime', 'timerSessionType', 'timerSessionCount'], (data) => {
      if(data.timerEndTime) {
        updateTimerText(data.timerEndTime, data.timerSessionType, data.timerSessionCount);
      }
    });
  }
  else if (message.action === 'hideTimer' || message.action === 'stopTimer') {
    removeTimerUI();
  }

  const isAppPage = window.location.host === "localhost:5173" || 
                    window.location.host === "your-devsync-domain.com";
  if (isAppPage) {
    window.postMessage({ type: "FROM_DEVSYNC_EXTENSION", payload: message }, "*");
  }
  sendResponse(true);
});

chrome.storage.local.get(['isRunning', 'timerEndTime', 'timerSessionType', 'timerSessionCount'], (result) => {
  if (result.isRunning && result.timerEndTime) {
    if (result.timerEndTime > Date.now()) {
      createOrUpdateTimerUI(result.timerEndTime, result.timerSessionType, result.timerSessionCount);
    }
  }
});

function createOrUpdateTimerUI(endTime, sessionType, sessionCount) {
  if (removalTimeout) {
    clearTimeout(removalTimeout);
    removalTimeout = null;
  }

  if (!timerDiv) {
    timerDiv = document.createElement('div');
    timerDiv.id = TIMER_DIV_ID;
    timeSpan = document.createElement('span');
    timeSpan.className = 'devsync-time';
    sessionSpan = document.createElement('span');
    sessionSpan.className = 'devsync-session';
    timerDiv.appendChild(timeSpan);
    timerDiv.appendChild(sessionSpan);
    document.body.appendChild(timerDiv);
  }

  if (sessionType === 'work') {
    timerDiv.classList.add('devsync-timer-work');
    timerDiv.classList.remove('devsync-timer-break');
  } else { 
    timerDiv.classList.add('devsync-timer-break');
    timerDiv.classList.remove('devsync-timer-work');
  }
  timerDiv.classList.remove('devsync-timer-flashing');

  updateTimerText(endTime, sessionType, sessionCount);
}

function updateTimerText(endTime, sessionType, sessionCount) {
  if (!timerDiv) return; 

  const now = Date.now();
  const remaining = endTime - now;
  const totalSeconds = Math.ceil(remaining / 1000);

  if (sessionType === 'work') {
    sessionSpan.textContent = `Session ${sessionCount + 1}`;
  } else {
    sessionSpan.textContent = 'Break';
  }

  if (totalSeconds <= 0) {
    timeSpan.textContent = '00:00';
    timerDiv.classList.add('devsync-timer-flashing');
    removalTimeout = setTimeout(removeTimerUI, 3000); 
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    timeSpan.textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

function removeTimerUI() {
  if (removalTimeout) {
    clearTimeout(removalTimeout);
    removalTimeout = null;
  }
  if (timerDiv) {
    timerDiv.remove();
    timerDiv = null;
    timeSpan = null;
    sessionSpan = null;
  }
  const existingDiv = document.getElementById(TIMER_DIV_ID);
  if (existingDiv) {
    existingDiv.remove();
  }
}