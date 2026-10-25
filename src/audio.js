// Hệ thống Âm Thanh Squid Game - Tinh chỉnh hoàn thiện:
// 1. Giọng hát Búp Bê: "Mugunghwa kkochi pieot-seumnida" (Được khuếch đại âm lượng to hơn +60%)
// 2. Tiếng quét Laser & Tim đập hồi hộp trong lúc búp bê tìm người
// 3. Tiếng còi cảnh báo: Đợi còi hú báo động kêu xong hẳn thì mới nổ súng
// 4. Tiếng súng bắn tỉa loại trừ

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.currentChant = null;
    this.currentAlert = null;
    this.heartbeatInterval = null;

    // File âm thanh chuẩn
    this.chantAudioSrc = './audio/rlgl_chant.mp3';
    this.gunshotAudioSrc = './audio/sniper_shot.mp3';
    this.alertAudioSrc = './audio/alert.wav';

    // Preload audio
    this.preload();
  }

  preload() {
    if (typeof window === 'undefined') return;
    try {
      this.preloadChant = new Audio(this.chantAudioSrc);
      this.preloadChant.preload = 'auto';

      this.preloadGunshot = new Audio(this.gunshotAudioSrc);
      this.preloadGunshot.preload = 'auto';

      this.preloadAlert = new Audio(this.alertAudioSrc);
      this.preloadAlert.preload = 'auto';
    } catch (e) {}
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AudioContext) {
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopDollChant();
      this.stopAlert();
      this.stopHeartbeat();
    }
    return this.muted;
  }

  // =========================================================
  // 1. TIẾNG HÁT BÚP BÊ: "Mugunghwa kkochi pieot-seumnida"
  // (Đã tăng âm lượng to rõ hơn +60% qua Web Audio GainNode)
  // =========================================================
  playDollChant(tempoMultiplier = 1.0, onEnded = null) {
    if (this.muted) {
      if (onEnded) setTimeout(onEnded, 2400 / tempoMultiplier);
      return;
    }

    this.init();
    this.stopDollChant();
    this.stopAlert();

    try {
      const chant = new Audio(this.chantAudioSrc);
      chant.playbackRate = Math.max(0.85, Math.min(1.5, tempoMultiplier));
      this.currentChant = chant;

      // Khuếch đại âm lượng to hơn cho giọng hát búp bê
      if (this.ctx) {
        try {
          const source = this.ctx.createMediaElementSource(chant);
          const gainNode = this.ctx.createGain();
          gainNode.gain.value = 1.6; // Tăng to hơn 60%
          source.connect(gainNode);
          gainNode.connect(this.ctx.destination);
        } catch (e) {
          chant.volume = 1.0;
        }
      } else {
        chant.volume = 1.0;
      }

      let endedTriggered = false;
      const handleEnd = () => {
        if (endedTriggered) return;
        endedTriggered = true;
        this.currentChant = null;
        if (onEnded) onEnded();
      };

      chant.onended = handleEnd;
      chant.onerror = () => {
        const backupChant = new Audio('./audio/doll_chant_shuence.mp3');
        backupChant.onended = handleEnd;
        backupChant.play().catch(() => {
          if (onEnded) setTimeout(onEnded, 2400 / tempoMultiplier);
        });
      };

      const p = chant.play();
      if (p !== undefined) {
        p.catch(() => {
          if (onEnded) setTimeout(onEnded, 2400 / tempoMultiplier);
        });
      }
    } catch (err) {
      if (onEnded) setTimeout(onEnded, 2400 / tempoMultiplier);
    }
  }

  stopDollChant() {
    if (this.currentChant) {
      try {
        this.currentChant.pause();
        this.currentChant.currentTime = 0;
      } catch (e) {}
      this.currentChant = null;
    }
  }

  // =========================================================
  // 2. TIẾNG CÒI CẢNH BÁO (Hỗ trợ callback onEnded để đợi kêu xong mới bắn)
  // Đã hạ âm lượng xuống 0.35 (35%) để êm tai, không bị chói giật mình
  // =========================================================
  playTargetLockAlert(onEnded = null) {
    if (this.muted) {
      if (onEnded) setTimeout(onEnded, 1500);
      return;
    }
    this.stopAlert(); // Ngắt còi cũ nếu có

    try {
      const alert = new Audio(this.alertAudioSrc);
      alert.volume = 0.35; // Hạ âm lượng từ 0.95 xuống 0.35 vừa vặn, dễ chịu
      this.currentAlert = alert;

      let called = false;
      const finish = () => {
        if (called) return;
        called = true;
        this.currentAlert = null;
        if (onEnded) onEnded();
      };

      // Bảo hiểm: Tối đa 2.4s là hoàn tất để chuyển sang nổ súng
      const safetyTimer = setTimeout(finish, 2400);

      alert.onended = () => {
        clearTimeout(safetyTimer);
        finish();
      };

      alert.onerror = () => {
        clearTimeout(safetyTimer);
        this.playTargetLockAlertSynth(finish);
      };

      const p = alert.play();
      if (p !== undefined) {
        p.catch(err => {
          console.warn('Alert play error, fallback to synth:', err);
          clearTimeout(safetyTimer);
          this.playTargetLockAlertSynth(finish);
        });
      }
    } catch (e) {
      this.playTargetLockAlertSynth(onEnded);
    }
  }

  stopAlert() {
    if (this.currentAlert) {
      try {
        this.currentAlert.pause();
        this.currentAlert.currentTime = 0;
      } catch (e) {}
      this.currentAlert = null;
    }
  }

  playTargetLockAlertSynth(onEnded = null) {
    this.init();
    if (!this.ctx) {
      if (onEnded) setTimeout(onEnded, 600);
      return;
    }
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + (i * 0.12);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + (i % 2 === 0 ? 300 : 0), time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01); // Hạ từ 0.3 xuống 0.1 cho êm
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.11);
      }
      if (onEnded) setTimeout(onEnded, 600);
    } catch (e) {
      if (onEnded) onEnded();
    }
  }

  // =========================================================
  // 3. TIẾNG QUÉT LASER TÌM MỤC TIÊU
  // =========================================================
  playLaserSweep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      osc.frequency.linearRampToValueAtTime(450, now + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // =========================================================
  // 4. TIẾNG SÚNG BẮN BẮN TỈA (Sniper Shot)
  // =========================================================
  playGunshot() {
    if (this.muted) return;
    this.stopHeartbeat();
    this.stopAlert();

    try {
      if (this.preloadGunshot) {
        this.preloadGunshot.currentTime = 0;
        this.preloadGunshot.volume = 1.0;
        const p = this.preloadGunshot.play();
        if (p !== undefined) {
          p.catch(() => {
            const shot = new Audio(this.gunshotAudioSrc);
            shot.play().catch(() => {});
          });
        }
      } else {
        const shot = new Audio(this.gunshotAudioSrc);
        shot.play().catch(() => {});
      }
    } catch (e) {
      try {
        const shot = new Audio(this.gunshotAudioSrc);
        shot.play().catch(() => {});
      } catch (err) {}
    }

    this.playGunshotSubBass();
  }

  playGunshotSubBass() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) {}
  }

  // =========================================================
  // TIẾNG TIM ĐẬP HỒI HỘP KHI ĐÈN ĐỎ
  // =========================================================
  playSuddenStop() {
    this.stopDollChant();
  }

  startHeartbeat(intervalMs = 450) {
    this.stopHeartbeat();
    this.playHeartbeatOnce();
    this.heartbeatInterval = setInterval(() => {
      this.playHeartbeatOnce();
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  playHeartbeatOnce() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.playBassThump(now, 68, 0.20);
      this.playBassThump(now + 0.15, 54, 0.16);
    } catch (e) {}
  }

  playBassThump(startTime, freq, duration) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(25, startTime + duration);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch (e) {}
  }

  // Các hàm phụ khác giữ rỗng
  playHeadTurn() {}
  playHeadTurnBack() {}
  playEliminationBuzzer() {}
  playFanfare() {}
  startBgm() {}
  stopBgm() {}
  playClick() {}
  playTick() {}
}

export const soundFX = new SoundFX();
