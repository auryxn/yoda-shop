export default function Taskbar() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="taskbar">
      <button className="start-btn">🪟 Start</button>
      <span className="task active">🦾 YODA Shop</span>
      <div className="tray">
        <span>🔊</span>
        <span>{time}</span>
      </div>
    </div>
  );
}
