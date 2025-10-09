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
