import { createContext, useContext, useState, useEffect } from "react";

// --- This is the ID of your companion Chrome Extension ---
const EXTENSION_ID = import.meta.env.VITE_CHROME_EXTENSION_ID;

const TimerContext = createContext();

export function useTimer() {
  return useContext(TimerContext);
}

const SESSIONS_BEFORE_LONG_BREAK = 4;

const sendStartFocusMessage = (durationInSeconds) => {
  if (window.chrome && window.chrome.runtime) {
    const durationInMinutes = Math.floor(durationInSeconds / 60);
    chrome.runtime.sendMessage(EXTENSION_ID, {
      command: "startFocus",
      duration: durationInMinutes
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Could not connect to extension. Is it installed and is the ID correct?");
      } else {
        console.log("Extension acknowledged start.", response);
      }
    });
  } else {
    console.warn("Chrome Extension API not found. Please install the DevSync companion extension.");
  }
};

const sendStopFocusMessage = () => {
  if (window.chrome && window.chrome.runtime) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
      command: "stopFocus"
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending stop message to extension.");
      } else {
        console.log("Extension acknowledged stop.", response);
      }
    });
  }
};


export function TimerProvider({ children }) {
  // --- Timer Settings State ---
  const [workTime, setWorkTime] = useState(25 * 60);
  const [shortBreak, setShortBreak] = useState(5 * 60);
  const [longBreak, setLongBreak] = useState(15 * 60);

  // --- Timer Operation State ---
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [sessions, setSessions] = useState(() => Number(localStorage.getItem("pomodoroSessions")) || 0);

  const [endTimestamp, setEndTimestamp] = useState(() => {
    const saved = localStorage.getItem("pomodoroEndTimestamp");
    return saved ? Number(saved) : null;
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("pomodoroTimeLeft");
    return saved ? Number(saved) : workTime;
  });

  // Re-sync timeLeft if workTime changes and timer is not running
  useEffect(() => {
    if (sessionType === 'work' && !isRunning) {
      setTimeLeft(workTime);
    }
  }, [workTime]);

  // --- Timer Tick Logic (using requestAnimationFrame) ---
  useEffect(() => {
    let raf;
    const tick = () => {
      if (isRunning && endTimestamp) {
        const now = Date.now();
        const remaining = Math.max(Math.ceil((endTimestamp - now) / 1000), 0);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleSessionEnd();
        } else {
          raf = requestAnimationFrame(tick);
        }
      }
    };

    if (isRunning) {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [isRunning, endTimestamp]);

  // --- Persist Timer Info to localStorage ---
  useEffect(() => localStorage.setItem("pomodoroTimeLeft", timeLeft), [timeLeft]);
  useEffect(() => localStorage.setItem("pomodoroSessions", sessions), [sessions]);
  useEffect(() => {
    if (endTimestamp) {
      localStorage.setItem("pomodoroEndTimestamp", endTimestamp);
    } else {
      localStorage.removeItem("pomodoroEndTimestamp");
    }
  }, [endTimestamp]);

  // --- Session End Logic ---
  const handleSessionEnd = () => {
    setIsRunning(false);
    setEndTimestamp(null);

    let nextSessionType;
    let nextTime;

    if (sessionType === 'work') {
      sendStopFocusMessage();
      const nextSessionNum = sessions + 1;
      setSessions(nextSessionNum);

      if (nextSessionNum % SESSIONS_BEFORE_LONG_BREAK === 0) {
        nextSessionType = 'longBreak';
        nextTime = longBreak;
      } else {
        nextSessionType = 'shortBreak';
        nextTime = shortBreak;
      }
    } else {
      nextSessionType = 'work';
      nextTime = workTime;
    }

    setSessionType(nextSessionType);
    setTimeLeft(nextTime);

    // Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(
        sessionType === 'work' ? "Work session complete! Time for a break 🎉" : "Break over! Back to work 💻"
      );
    }
  };

  const startTimer = () => {
    setEndTimestamp(Date.now() + timeLeft * 1000);
    setIsRunning(true);

    if (sessionType === 'work') {
      sendStartFocusMessage(timeLeft);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    localStorage.setItem("pomodoroTimeLeft", timeLeft);
    setEndTimestamp(null);
    sendStopFocusMessage();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSessionType('work');
    setTimeLeft(workTime);
    setSessions(0);
    setEndTimestamp(null);
    sendStopFocusMessage();
  };

  const updateWorkTime = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setWorkTime(secs);
    if (sessionType === 'work' && !isRunning) {
      setTimeLeft(secs);
      setEndTimestamp(null);
    }
  };
  const updateShortBreak = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setShortBreak(secs);
    if (sessionType === 'shortBreak' && !isRunning) {
      setTimeLeft(secs);
      setEndTimestamp(null);
    }
  };
  const updateLongBreak = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setLongBreak(secs);
    if (sessionType === 'longBreak' && !isRunning) {
      setTimeLeft(secs);
      setEndTimestamp(null);
    }
  };


  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  
  
  const isWork = sessionType === 'work';

  return (
    <TimerContext.Provider
      value={{
        workTime,
        shortBreak,
        longBreak,
        timeLeft,
        isRunning,
        isWork, 
        sessionType, 
        sessions,
        startTimer,
        pauseTimer,
        resetTimer,
        updateWorkTime,
        updateShortBreak,
        updateLongBreak,
        SESSIONS_BEFORE_LONG_BREAK,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}