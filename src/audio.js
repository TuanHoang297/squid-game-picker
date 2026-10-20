// Hệ thống Âm Thanh Squid Game - Tối giản theo yêu cầu
// CHỈ GIỮ 2 ÂM THANH DUY NHẤT:
// 1. Giọng hát Búp Bê chuẩn phim: "Mugunghwa kkochi pieot-seumnida" (Bản thu âm dứt khoát / quen thuộc nhất trong phim)
// 2. Tiếng súng bắn tỉa loại trừ

class SoundFX {
  constructor() {
    this.muted = false;
    this.currentChant = null;

    // Sử dụng bản thu âm tiếng búp bê còn lại (bản kinh điển dứt khoát trong phim)
    this.chantAudioSrc = './audio/rlgl_chant.mp3';
    this.gunshotAudioSrc = './audio/sniper_shot.mp3';

    // Preload sẵn để khi bấm là phát ngay lập tức, không bị trễ
    this.preload();
  }

  preload() {
    if (typeof window === 'undefined') return;
    try {
      this.preloadChant = new Audio(this.chantAudioSrc);
      this.preloadChant.preload = 'auto';

      this.preloadGunshot = new Audio(this.gunshotAudioSrc);
      this.preloadGunshot.preload = 'auto';
    } catch (e) {}
  }

  init() {}

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopDollChant();
    }
    return this.muted;
  }

  // =========================================================
  // 1. TIẾNG HÁT BÚP BÊ: "Mugunghwa kkochi pieot-seumnida"
  // =========================================================
  playDollChant(tempoMultiplier = 1.0, onEnded = null) {
    if (this.muted) {
      if (onEnded) setTimeout(onEnded, 2400 / tempoMultiplier);
      return;
    }

    this.stopDollChant();

    try {
      const chant = new Audio(this.chantAudioSrc);
      chant.volume = 1.0;
      // Giữ tốc độ chuẩn tự nhiên hoặc biến thiên nhẹ theo round
      chant.playbackRate = Math.max(0.85, Math.min(1.5, tempoMultiplier));
      this.currentChant = chant;

      let endedTriggered = false;
      const handleEnd = () => {
        if (endedTriggered) return;
        endedTriggered = true;
        this.currentChant = null;
        if (onEnded) onEnded();
      };

      chant.onended = handleEnd;
      chant.onerror = () => {
        // Nếu có sự cố file thì thử file dự phòng shuence
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
  // 2. TIẾNG SÚNG BẮN
  // =========================================================
  playGunshot() {
    if (this.muted) return;
    try {
      const shot = new Audio(this.gunshotAudioSrc);
      shot.volume = 1.0;
      shot.play().catch(() => {});
    } catch (e) {}
  }

  // =========================================================
  // CÁC HÀM PHỤ ĐÃ TẮT HOÀN TOÀN (No-op để không lỗi game)
  // =========================================================
  playSuddenStop() {
    this.stopDollChant();
  }
  playHeadTurn() {}
  playHeadTurnBack() {}
  startHeartbeat() {}
  stopHeartbeat() {}
  playHeartbeatOnce() {}
  playLaserSweep() {}
  playTargetLockAlert() {}
  playEliminationBuzzer() {}
  playFanfare() {}
  startBgm() {}
  stopBgm() {}
  playClick() {}
  playTick() {}
}

export const soundFX = new SoundFX();
