export const playSizzle = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 600;
    g.gain.value = 0;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    o.start();
    o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    setTimeout(()=>{ try{ o.stop(); ctx.close(); }catch(e){} }, 1400);
  } catch (e) {}
};

export const playChimeShort = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    o.start();
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(()=>{ try{ o.stop(); ctx.close(); }catch(e){} }, 800);
  } catch (e) {}
};

export const playChop = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 200;
    g.gain.value = 0;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    o.start(now);
    o.stop(now + 0.1);
    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 200);
  } catch (e) {}
};

export const playStir = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 500;
    g.gain.value = 0;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.05, now + 0.01);
    o.start(now);
    o.frequency.exponentialRampToValueAtTime(250, now + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    o.stop(now + 0.55);
    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 600);
  } catch (e) {}
};

export const playSuccess = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const notes = [523, 659, 784];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.06, t);
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.stop(t + 0.12);
    });
    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 800);
  } catch (e) {}
};

export const speak = (text) => {
  try {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.0;
    utter.volume = 0.9;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
};
