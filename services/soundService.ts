let audioCtx: AudioContext | null = null;
let isMuted = false;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const getMuteState = () => isMuted;

const playTone = (
  freq: number,
  type: OscillatorType,
  duration: number,
  startTime: number = 0,
  vol: number = 0.1
) => {
  if (isMuted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(
    0.01,
    audioCtx.currentTime + startTime + duration
  );
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
};

export type SoundType = 'add' | 'remove' | 'undo' | 'clear' | 'run' | 'move' | 'turn' | 'jump' | 'win' | 'crash' | 'click' | 'step';

export const playSound = (type: SoundType) => {
  initAudio();
  if (isMuted || !audioCtx) return;

  const now = audioCtx.currentTime;

  switch (type) {
    case 'add':
      // Cheerful pop
      playTone(600, 'sine', 0.1, 0, 0.1);
      playTone(800, 'sine', 0.1, 0.05, 0.1);
      break;
    case 'remove':
      // Reverse pop / crumple
      playTone(300, 'sawtooth', 0.1, 0, 0.05);
      playTone(200, 'sawtooth', 0.1, 0.05, 0.05);
      break;
    case 'undo':
      // Quick whoosh
      playTone(400, 'sine', 0.1, 0, 0.1);
      playTone(300, 'sine', 0.1, 0.05, 0.1);
      break;
    case 'clear':
      // Descending trash
      playTone(300, 'square', 0.1, 0, 0.05);
      playTone(200, 'square', 0.1, 0.1, 0.05);
      break;
    case 'run':
      // Ascending start up
      playTone(400, 'triangle', 0.1, 0, 0.1);
      playTone(500, 'triangle', 0.1, 0.1, 0.1);
      playTone(600, 'triangle', 0.2, 0.2, 0.1);
      break;
    case 'move':
      // Mechanical step
      playTone(200, 'triangle', 0.05, 0, 0.1);
      playTone(100, 'square', 0.05, 0.02, 0.05);
      break;
    case 'turn':
      // Servo motor sound
      playTone(300, 'triangle', 0.1, 0, 0.05);
      playTone(400, 'triangle', 0.1, 0.05, 0.05);
      break;
    case 'jump':
      // Boing / slide up
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'win':
      // Victory fanfare
      playTone(523.25, 'square', 0.1, 0, 0.1); // C5
      playTone(659.25, 'square', 0.1, 0.1, 0.1); // E5
      playTone(783.99, 'square', 0.1, 0.2, 0.1); // G5
      playTone(1046.50, 'square', 0.4, 0.3, 0.1); // C6
      break;
    case 'crash':
      // Low thud/crash
      playTone(100, 'sawtooth', 0.3, 0, 0.2);
      playTone(80, 'square', 0.3, 0.05, 0.2);
      break;
    case 'click':
      playTone(800, 'sine', 0.05, 0, 0.05);
      break;
  }
};
