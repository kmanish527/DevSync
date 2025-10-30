chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "playSound") {
    const sound = new Audio('alarm.mp3');
    sound.play()
      .catch((e) => console.error("Offscreen Audio Error:", e));
  }
});