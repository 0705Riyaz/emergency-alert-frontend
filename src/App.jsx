import { useState, useEffect, useRef } from "react";
import "./App.css";
 
function App() {
  const [status, setStatus] = useState("Click the button and say 'Emergency Help'");
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const analyserRef = useRef(null);
  const streamRef   = useRef(null);
 
  // ── Waveform visualiser (new — only touches canvas, no logic change) ─────
  const startWaveform = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const actx    = new (window.AudioContext || window.webkitAudioContext)();
      const source  = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWave();
    } catch (_) {}
  };
 
  const stopWaveform = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    flatLine();
  };
 
  const flatLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = "rgba(168,85,247,0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
 
  const drawWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const analyser = analyserRef.current;
      if (!analyser) return;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      const slice = W / buf.length;
      let x = 0;
      buf.forEach((v, i) => {
        const y = (v / 128) * (H / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += slice;
      });
      ctx.lineTo(W, H / 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur  = 10;
      ctx.stroke();
    };
    loop();
  };
 
  useEffect(() => { flatLine(); }, []);
 
  // ── YOUR ORIGINAL LOGIC — NOT TOUCHED ────────────────────────────────────
  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.start();
    setStatus("Listening...");
    startWaveform();
 
    recognition.onresult = function(event) {
      let command = event.results[0][0].transcript.toLowerCase();
      setStatus("You said: " + command);
      stopWaveform();
 
      if (command.includes("emergency help")) {
        fetch("http://localhost:8080/api", { method: "POST" })
          .then(res => res.text())
          .then(data => { console.log("Backend Response:", data); alert(data); })
          .catch(error => { console.error("Error:", error); });
      }
    };
 
    recognition.onerror = () => { stopWaveform(); setStatus("Mic error — please try again."); };
    recognition.onend   = () => stopWaveform();
  };
  // ─────────────────────────────────────────────────────────────────────────
 
  const isListening = status === "Listening...";
  const isSuccess   = status.toLowerCase().includes("emergency help");
 
  return (
    <div className="app-root">
      <div className="scanlines" />
      <div className="cyber-grid" />
 
      {/* Logo */}
      <div className="logo-wrap">
        <svg className="logo-icon" viewBox="0 0 40 40" fill="none">
          <polygon points="20,2 38,12 38,28 20,38 2,28 2,12"
            stroke="#a855f7" strokeWidth="1.5" fill="rgba(168,85,247,0.08)" />
          <polygon points="20,8 32,15 32,25 20,32 8,25 8,15"
            stroke="#a855f7" strokeWidth="0.8" fill="none" opacity="0.5" />
          <circle cx="20" cy="20" r="4" fill="#a855f7" opacity="0.9" />
          <line x1="20" y1="2"  x2="20" y2="8"  stroke="#a855f7" strokeWidth="1" />
          <line x1="20" y1="32" x2="20" y2="38" stroke="#a855f7" strokeWidth="1" />
          <line x1="2"  y1="12" x2="8"  y2="15" stroke="#a855f7" strokeWidth="1" />
          <line x1="32" y1="25" x2="38" y2="28" stroke="#a855f7" strokeWidth="1" />
          <line x1="38" y1="12" x2="32" y2="15" stroke="#a855f7" strokeWidth="1" />
          <line x1="2"  y1="28" x2="8"  y2="25" stroke="#a855f7" strokeWidth="1" />
        </svg>
        <span className="logo-text">SYS<span className="logo-accent">_911</span></span>
      </div>
 
      {/* Title */}
      <h1 className="hero-title">
        <span className="t1">VOICE</span>
        <span className="t2">EMERGENCY</span>
        <span className="t3">ASSISTANT</span>
      </h1>
      <p className="hero-sub">
        Speak <span className="trigger-word">[ EMERGENCY HELP ]</span> to dispatch alert
      </p>
 
      {/* Waveform */}
      <div className="wave-wrap">
        <div className="wave-corner tl" /><div className="wave-corner tr" />
        <div className="wave-corner bl" /><div className="wave-corner br" />
        <canvas ref={canvasRef} className="wave-canvas" width="440" height="60" />
        <div className="wave-label">{isListening ? "◉ AUDIO INPUT ACTIVE" : "◎ STANDBY"}</div>
      </div>
 
      {/* Big button */}
      <div className="btn-wrap">
        <div className={`ring r1 ${isListening ? "spin" : ""}`} />
        <div className={`ring r2 ${isListening ? "spin-rev" : ""}`} />
        <div className={`ring r3 ${isListening ? "pulse" : ""}`} />
        <button
          className={`main-btn ${isListening ? "active" : ""} ${isSuccess ? "success" : ""}`}
          onClick={startListening}
        >
          <svg className="btn-mic" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="8"  y1="21" x2="16" y2="21" />
          </svg>
          <span className="btn-label">{isListening ? "LISTENING" : "ACTIVATE"}</span>
        </button>
      </div>
 
      {/* Terminal status */}
      <div className="terminal-card">
        <div className="terminal-bar">
          <span className="t-dot" /><span className="t-dot" />
          <span className={`t-dot ${isListening ? "hot" : ""}`} />
          <span className="terminal-title">STATUS_FEED.log</span>
        </div>
        <div className="terminal-body">
          <span className="prompt">&gt;&nbsp;</span>
          <span className="terminal-msg">{status}</span>
          <span className={`cursor ${isListening ? "blink" : ""}`}>█</span>
        </div>
        <div className={`progress-bar ${isListening ? "run" : ""}`} />
      </div>
 
      <p className="footer-note">// MIC PERMISSION REQUIRED · CHROME / EDGE</p>
    </div>
  );
}
 
export default App;