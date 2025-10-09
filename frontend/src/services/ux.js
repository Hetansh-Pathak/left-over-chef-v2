export const triggerConfetti = (durationMs = 1200) => {
  try {
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a29bfe'];
    const count = 36;
    const body = document.body;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const start = Date.now();

    const make = () => {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 8;
      el.style.position = 'fixed';
      el.style.left = Math.random() * w + 'px';
      el.style.top = '-20px';
      el.style.width = size + 'px';
      el.style.height = size * (0.6 + Math.random()*0.8) + 'px';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.opacity = '0.9';
      el.style.transform = `rotate(${Math.random()*360}deg)`;
      el.style.borderRadius = '2px';
      el.style.zIndex = '99999';
      el.style.transition = 'transform 1.2s linear, top 1.2s linear, opacity 1.2s ease-out';
      body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.top = h + 'px';
        el.style.transform = `translateX(${(Math.random()-0.5)*120}px) rotate(${720+Math.random()*360}deg)`;
        el.style.opacity = '0';
      });
      setTimeout(() => body.removeChild(el), 1300);
    };

    const tick = () => {
      for (let i = 0; i < count; i++) make();
      if (Date.now() - start < durationMs) setTimeout(tick, 220);
    };

    tick();
  } catch (e) {}
};
