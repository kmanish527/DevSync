import { createContext, useContext, useState, useEffect } from "react";

// --- This is the ID of your companion Chrome Extension ---
const EXTENSION_ID = import.meta.env.VITE_CHROME_EXTENSION_ID;

const TimerContext = createContext();

export function useTimer() {
  return useContext(TimerContext);
}

const SESSIONS_BEFORE_LONG_BREAK = 4;

const sendStartTimerMessage = (state) => {
  if (window.chrome && window.chrome.runtime && EXTENSION_ID) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
      command: "startTimer", 
      endTime: Date.now() + state.timeLeft * 1000,
      sessionType: state.sessionType,
      sessionCount: state.sessions,
      settings: {
        workTime: state.workTime,
        shortBreak: state.shortBreak,
        longBreak: state.longBreak,
        SESSIONS_BEFORE_LONG_BREAK: SESSIONS_BEFORE_LONG_BREAK
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Could not start timer: ${chrome.runtime.lastError.message}`);
      } else {
        console.log("Extension acknowledged timer start.", response);
      }
    });
  } else {
    console.warn("Chrome Extension API not found.");
  }
};

const sendStopTimerMessage = () => {
  if (window.chrome && window.chrome.runtime && EXTENSION_ID) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
      command: "stopTimer"
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Could not stop timer: ${chrome.runtime.lastError.message}`);
      } else {
        console.log("Extension acknowledged timer stop.", response);
      }
    });
  }
};


export function TimerProvider({ children }) {
  const [workTime, setWorkTime] = useState(() => {
    const saved = localStorage.getItem("devsync-workTime");
    return saved ? Number(saved) : 25 * 60; 
  });
  const [shortBreak, setShortBreak] = useState(() => {
    const saved = localStorage.getItem("devsync-shortBreak");
    return saved ? Number(saved) : 5 * 60;
  });
  const [longBreak, setLongBreak] = useState(() => {
    const saved = localStorage.getItem("devsync-longBreak");
    return saved ? Number(saved) : 15 * 60;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('work');
  const [sessions, setSessions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(workTime);

  useEffect(() => {
    if (window.chrome && window.chrome.runtime && EXTENSION_ID) {
      chrome.runtime.sendMessage(EXTENSION_ID, { command: "getState" }, (state) => {
        if (chrome.runtime.lastError) {
          console.warn(`Could not get state from extension: ${chrome.runtime.lastError.message}`);
        } else if (state) {
          console.log("Got initial state from extension:", state);
          setIsRunning(state.isRunning || false);
          setSessionType(state.timerSessionType || 'work');
          setSessions(state.timerSessionCount || 0);
          
          if (state.isRunning && state.timerEndTime) {
            const remaining = Math.max(Math.ceil((state.timerEndTime - Date.now()) / 1000), 0);
            setTimeLeft(remaining);
          } else {
            const currentWorkTime = Number(localStorage.getItem("devsync-workTime")) || 25 * 60;
            setTimeLeft(currentWorkTime);
          }
        }
      });
    }
  }, []); 

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== window || !event.data || event.data.type !== "FROM_DEVSYNC_EXTENSION") {
        return;
      }
      
      const message = event.data.payload;
      
      if (message.action === "updateTime") {
        setTimeLeft(message.timeLeft);
      } 
      else if (message.action === "startTimer") {
        setIsRunning(true);
        setSessionType(message.sessionType);
        setSessions(message.sessionCount);
        const remaining = Math.max(Math.ceil((message.endTime - Date.now()) / 1000), 0);
        setTimeLeft(remaining);
      }
      else if (message.action === "stopTimer" || message.action === "hideTimer") {
        setIsRunning(false);
        setSessionType('work');
        setSessions(0);
        setWorkTime(currentWorkTime => {
          setTimeLeft(currentWorkTime);
          return currentWorkTime;
        });
        localStorage.removeItem("pomodoroTimeLeft");
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); 

  useEffect(() => localStorage.setItem("devsync-workTime", workTime), [workTime]);
  useEffect(() => localStorage.setItem("devsync-shortBreak", shortBreak), [shortBreak]);
  useEffect(() => localStorage.setItem("devsync-longBreak", longBreak), [longBreak]);

  const startTimer = () => {
    setIsRunning(true);
    
    const savedTimeLeft = localStorage.getItem("pomodoroTimeLeft");
    const timeToStart = savedTimeLeft ? Number(savedTimeLeft) : (timeLeft > 0 ? timeLeft : workTime);
    localStorage.removeItem("pomodoroTimeLeft");
    
    sendStartTimerMessage({
      timeLeft: timeToStart,
      sessionType,
      sessions,
      workTime,
      shortBreak,
      longBreak
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    sendStopTimerMessage();
    localStorage.setItem("pomodoroTimeLeft", timeLeft); 
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSessionType('work');
    setTimeLeft(workTime); 
    setSessions(0);
    sendStopTimerMessage();
    localStorage.removeItem("pomodoroTimeLeft");
  };

  const updateWorkTime = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setWorkTime(secs);
    if (sessionType === 'work' && !isRunning) {
      setTimeLeft(secs);
    }
  };
  const updateShortBreak = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setShortBreak(secs);
    if (sessionType === 'shortBreak' && !isRunning) {
      setTimeLeft(secs);
    }
  };
  const updateLongBreak = (minutes) => {
    const secs = Math.max(1, minutes) * 60;
    setLongBreak(secs);
    if (sessionType === 'longBreak' && !isRunning) {
      setTimeLeft(secs);
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