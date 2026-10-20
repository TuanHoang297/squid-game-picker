import { soundFX } from './audio.js';
import { classManager } from './classManager.js';
import { Doll } from './doll.js';
import { studentManager, drawFullSquidCharacter } from './students.js';
import confetti from 'canvas-confetti';

class SquidGameApp {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.arenaWrapper = document.getElementById('arenaWrapper');

    // UI Elements
    this.statusBanner = document.getElementById('statusBanner');
    this.statusText = document.getElementById('statusText');
    this.btnStartGame = document.getElementById('btnStartGame');
    this.btnSoundToggle = document.getElementById('btnSoundToggle');
    this.btnFullscreen = document.getElementById('btnFullscreen');
    this.btnManageClass = document.getElementById('btnManageClass');
    this.classSelect = document.getElementById('classSelect');
    this.statsRemainingText = document.getElementById('statsRemainingText');

    // Modal Elements
    this.caughtModal = document.getElementById('caughtModal');
    this.modalStudentName = document.getElementById('modalStudentName');
    this.modalStudentNumber = document.getElementById('modalStudentNumber');
    this.btnNextStudent = document.getElementById('btnNextStudent');
    this.btnCloseModal = document.getElementById('btnCloseModal');

    // Drawer Elements
    this.classDrawer = document.getElementById('classDrawer');
    this.btnCloseDrawer = document.getElementById('btnCloseDrawer');
    this.drawerClassSelect = document.getElementById('drawerClassSelect');
    this.btnNewClass = document.getElementById('btnNewClass');
    this.btnDeleteClass = document.getElementById('btnDeleteClass');
    this.chkExcludeExamined = document.getElementById('chkExcludeExamined');
    this.btnResetCurrentRound = document.getElementById('btnResetCurrentRound');
    this.btnOpenPasteBox = document.getElementById('btnOpenPasteBox');
    this.pasteBoxContainer = document.getElementById('pasteBoxContainer');
    this.txtPasteStudents = document.getElementById('txtPasteStudents');
    this.btnSavePastedStudents = document.getElementById('btnSavePastedStudents');
    this.btnCancelPaste = document.getElementById('btnCancelPaste');
    this.studentTableBody = document.getElementById('studentTableBody');
    this.drawerStudentCount = document.getElementById('drawerStudentCount');

    // Inline New Class Elements
    this.newClassBox = document.getElementById('newClassBox');
    this.txtNewClassName = document.getElementById('txtNewClassName');
    this.btnConfirmAddClass = document.getElementById('btnConfirmAddClass');
    this.btnCancelAddClass = document.getElementById('btnCancelAddClass');

    // Game Objects
    this.doll = null;
    this.gameState = 'IDLE'; // 'IDLE' | 'GREEN_LIGHT' | 'TURNING' | 'SCANNING' | 'LOCKED' | 'MODAL_OPEN' | 'COMPLETED'
    this.activeVictim = null;
    this.groundScrollOffset = 0;
    this.bulletImpacts = [];

    this.lastTime = 0;
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.doll = new Doll(this.canvas.width, this.canvas.height);
    const groundY = Math.floor(this.canvas.height * 0.30);
    this.doll.resize(this.canvas.width, this.canvas.height, groundY);

    this.reloadStudentsFromCurrentClass();

    this.setupEventListeners();
    this.updateClassDropdowns();
    this.updateHeaderStats();

    // Start 60 FPS animation loop
    requestAnimationFrame(timestamp => this.gameLoop(timestamp));
  }

  resizeCanvas() {
    const rect = this.arenaWrapper.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    const groundY = Math.floor(this.canvas.height * 0.30);
    if (this.doll) {
      this.doll.resize(this.canvas.width, this.canvas.height, groundY);
    }
    if (studentManager.characters.length > 0) {
      studentManager.rebalanceSlots(this.canvas.width, this.canvas.height);
    }
  }

  reloadStudentsFromCurrentClass() {
    const currentClass = classManager.getCurrentClass();
    if (!currentClass) return;

    // Chỉ hiển thị học sinh chưa khảo bài trên sân đua khi bật loại trừ
    const studentsToDisplay = classManager.getExcludeExamined()
      ? classManager.getEligibleStudents()
      : currentClass.students;

    studentManager.initFromList(studentsToDisplay, this.canvas.width, this.canvas.height);
    this.updateHeaderStats();
    this.renderDrawerStudentList();
  }

  updateClassDropdowns() {
    const classes = classManager.classes;
    const currentClassId = classManager.currentClassId;

    [this.classSelect, this.drawerClassSelect].forEach(select => {
      select.innerHTML = '';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        opt.selected = c.id === currentClassId;
        select.appendChild(opt);
      });
    });
  }

  updateHeaderStats() {
    const eligible = classManager.getEligibleStudents();
    const currentClass = classManager.getCurrentClass();
    const total = currentClass?.students.length || 0;
    this.statsRemainingText.textContent = `Còn lại: ${eligible.length} / ${total} học sinh`;

    // Nếu lớp chưa có học sinh nào
    if (total === 0) {
      this.btnStartGame.disabled = true;
      this.setStatus('LỚP CHƯA CÓ HỌC SINH — BẤM ⚙️ ĐỂ THÊM', 'waiting');
      return;
    }

    // Nếu đã khảo hết cả lớp
    if (eligible.length === 0) {
      this.handleAllStudentsExamined();
    } else if (this.gameState === 'IDLE') {
      this.btnStartGame.disabled = false;
      this.btnStartGame.innerHTML = `
        <span class="btn-glow"></span>
        <span class="btn-icon">⚡</span>
        <span class="btn-text">BẮT ĐẦU VÒNG QUAY (SPACE)</span>
      `;
      this.setStatus('SẴN SÀNG KHẢO BÀI (SPACE)', 'waiting');
    }
  }

  setStatus(text, className) {
    this.statusText.textContent = text;
    this.statusBanner.firstElementChild.className = `banner-content ${className}`;
  }

  // Bắt đầu vòng Đèn Xanh Đèn Đỏ
  startRound() {
    if (this.gameState === 'COMPLETED') {
      classManager.resetRound();
      this.reloadStudentsFromCurrentClass();
      this.gameState = 'IDLE';
    }
    if (this.gameState !== 'IDLE') return;

    soundFX.init();
    const eligibleStudents = classManager.getEligibleStudents();
    if (eligibleStudents.length === 0) {
      this.handleAllStudentsExamined();
      return;
    }

    // 1. Chọn ngẫu nhiên 1 học sinh làm mục tiêu (Victim)
    const victimData = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];
    this.activeVictim = studentManager.getStudentById(victimData.id);

    // 2. Chọn ngẫu nhiên 1 học sinh khác làm "Fakeout" nếu có trên 2 học sinh
    let fakeoutStudent = null;
    if (eligibleStudents.length >= 2) {
      const candidates = eligibleStudents.filter(s => s.id !== victimData.id);
      const fakeoutData = candidates[Math.floor(Math.random() * candidates.length)];
      fakeoutStudent = studentManager.getStudentById(fakeoutData.id);
    }

    // Bắt đầu ĐÈN XANH
    this.gameState = 'GREEN_LIGHT';
    this.btnStartGame.disabled = true;
    this.setStatus('🟢 ĐÈN XANH - ĐANG CHẠY!', 'green-light');

    // Búp Bê quay lưng lại
    this.doll.turnToBack(0.08);
    soundFX.playHeadTurnBack();

    // Học sinh bắt đầu chạy
    studentManager.clearHighlights();
    studentManager.setRunning(true);

    // Phát nhạc Squid Chant biến thiên tốc độ (0.9x đến 1.3x)
    const tempo = 0.95 + Math.random() * 0.35;
    soundFX.playDollChant(tempo, () => {
      // Khi dứt tiếng hát: Chuyển sang ĐÈN ĐỎ
      this.handleSongEnded(fakeoutStudent);
    });
  }

  // Khi tiếng hát kết thúc -> Búp Bê quay ngoắt lại
  handleSongEnded(fakeoutStudent) {
    this.gameState = 'TURNING';
    soundFX.playSuddenStop();

    // Búp Bê quay mặt lại với tốc độ nhanh
    this.doll.turnToFront(0.12);

    // Học sinh lập tức phanh gấp, đứng im run rẩy
    studentManager.setRunning(false);
    this.setStatus('🔴 ĐÈN ĐỎ - ĐỨNG IM!', 'red-light');

    // Bắt đầu quét laser sau khi búp bê quay mặt xong (0.5s)
    setTimeout(() => {
      this.startScanningPhase(fakeoutStudent);
    }, 600);
  }

  // Giai đoạn quét laser tìm mục tiêu
  startScanningPhase(fakeoutStudent) {
    this.gameState = 'SCANNING';
    soundFX.startHeartbeat(450);
    soundFX.playLaserSweep();

    // Nếu có kích hoạt cơ chế Troll "Đau Tim" (Fake-out)
    if (fakeoutStudent && Math.random() < 0.65) {
      // Tia laser rọi trước vào bạn Fakeout
      setTimeout(() => {
        soundFX.playLaserSweep();
        this.doll.laserTarget = { x: fakeoutStudent.x, y: fakeoutStudent.y - 20 };
        fakeoutStudent.isFakeoutTarget = true;
        fakeoutStudent.isTrembling = true;

        // Còi báo động nhấp nháy suýt bắt bạn này
        soundFX.playTargetLockAlert();

        // 1.4 giây sau: Đột ngột giật tia laser sang bạn Victim thật!
        setTimeout(() => {
          fakeoutStudent.isFakeoutTarget = false;
          this.lockTargetOntoVictim();
        }, 1400);
      }, 1000);
    } else {
      // Quét tự nhiên rồi khóa thẳng vào Victim sau 1.8 giây
      setTimeout(() => {
        this.lockTargetOntoVictim();
      }, 1600);
    }
  }

  // Khóa laser chính xác vào học sinh bị chọn và kích hoạt Lính Bắn Tỉa xử lý
  lockTargetOntoVictim() {
    this.gameState = 'LOCKED';
    soundFX.stopHeartbeat();
    soundFX.playTargetLockAlert();

    // Búp Bê khóa tia laser đỏ rực vào mục tiêu
    this.doll.state = 'LOCKED';
    this.doll.laserTarget = { x: this.activeVictim.x, y: this.activeVictim.y - 18 };
    this.doll.isAiming = true; // Lính áo đỏ bên cạnh búp bê giương súng nhắm thẳng vào học sinh

    this.activeVictim.isCaught = true;
    this.activeVictim.isTrembling = true;

    this.setStatus(`🚨 PHÁT HIỆN DI CHUYỂN: ${this.activeVictim.name.toUpperCase()}!`, 'locked');

    // Sau 450ms nhắm bắn tập trung: LÍNH ÁO ĐỎ NỔ SÚNG BẮN HẠ "PẰNG!"
    setTimeout(() => {
      // 1. Nổ súng & vệt đạn rực lửa xé gió từ nòng súng lính tới học sinh
      this.doll.triggerFire(this.activeVictim.x, this.activeVictim.y - 18);
      soundFX.playGunshot();

      // 2. Màn hình rung giật dữ dội vì tiếng nổ uy lực
      this.arenaWrapper.classList.add('shake-screen');

      // 3. Hiệu ứng mảnh nổ va chạm tia lửa đạn trúng đích
      this.spawnBulletImpact(this.activeVictim.x, this.activeVictim.y - 18);

      // 4. Học sinh bị bắn trúng: Ngã gục nằm bất tỉnh trên sàn cát
      this.activeVictim.isFallen = true;
      this.activeVictim.isCaught = false;
      this.activeVictim.isTrembling = false;

      // 5. Còi báo hiệu đã loại bỏ vang lên
      soundFX.playEliminationBuzzer();
      this.setStatus(`💥 ĐÃ BẮN HẠ: ${this.activeVictim.name.toUpperCase()}!`, 'eliminated');

      // Tắt rung màn hình sau 500ms
      setTimeout(() => {
        this.arenaWrapper.classList.remove('shake-screen');
        this.doll.isAiming = false;
      }, 500);

      // 6. Sau khi bị bắn ngã gục trên sân cát 1.35 giây: BÂY GIỜ MỚI MỜI LÊN BẢNG KHẢO BÀI!
      setTimeout(() => {
        this.openCaughtModal();
      }, 1350);
    }, 450);
  }

  // Mở cửa sổ Spotlight Khảo Bài
  openCaughtModal() {
    this.gameState = 'MODAL_OPEN';
    this.modalStudentName.textContent = this.activeVictim.name;
    this.modalStudentNumber.textContent = this.activeVictim.number;
    this.caughtModal.classList.remove('hidden');

    // Bắt đầu vòng lặp hoạt ảnh cử động nhúc nhích run rẩy liên tục 60fps
    this.startModalCharacterAnimation();

    // Bắn pháo hoa Confetti rực rỡ chúc mừng người được chọn!
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // fallback safe
    }
  }

  // Vòng lặp hoạt ảnh học sinh ngã gục (knocked out) trong modal khảo bài 60fps
  startModalCharacterAnimation() {
    const modalCanvas = document.getElementById('modalCharacterCanvas');
    if (!modalCanvas) return;
    const mCtx = modalCanvas.getContext('2d');

    let sweatTimer = 0;

    const animate = () => {
      if (this.gameState !== 'MODAL_OPEN') {
        if (this.modalAnimFrameId) cancelAnimationFrame(this.modalAnimFrameId);
        return;
      }

      sweatTimer += 0.08;
      mCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

      const centerX = modalCanvas.width / 2;
      const centerY = modalCanvas.height / 2;

      // 1. Vầng sáng spotlight đỏ nhấp nháy trên sàn cát dưới thân người ngã gục
      mCtx.save();
      const pulse = Math.sin(Date.now() * 0.005) * 4;
      const grad = mCtx.createRadialGradient(centerX, centerY + 8, 8, centerX, centerY + 8, 85 + pulse);
      grad.addColorStop(0, 'rgba(255, 0, 50, 0.45)');
      grad.addColorStop(0.5, 'rgba(255, 0, 50, 0.16)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.ellipse(centerX, centerY + 8, 85 + pulse, 26, 0, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();

      // 2. Vẽ nhân vật học sinh nằm gục (isFallen: true, mắt chữ X, băng urgo)
      drawFullSquidCharacter(mCtx, centerX, centerY - 2, 1.85, {
        number: this.activeVictim.number,
        isRunning: false,
        isCaught: false,
        isTrembling: false,
        isFallen: true,
        sweatTimer: sweatTimer,
        profile: this.activeVictim.profile
      });

      // 3. Hiệu ứng 3 ngôi sao hoa mắt xoay tròn trên đầu (Dizzy Knockout Stars)
      const starTime = Date.now() * 0.004;
      const headX = centerX + 52;
      const headY = centerY - 14;
      for (let i = 0; i < 3; i++) {
        const starAngle = starTime + (i * Math.PI * 2 / 3);
        const sx = headX + Math.cos(starAngle) * 19;
        const sy = headY + Math.sin(starAngle) * 7.5;

        mCtx.save();
        mCtx.translate(sx, sy);
        mCtx.rotate(starTime * 1.8 + i);
        mCtx.fillStyle = '#f1c40f';
        mCtx.shadowColor = '#f39c12';
        mCtx.shadowBlur = 5;
        // Ngôi sao 4 cánh lấp lánh
        mCtx.beginPath();
        for (let p = 0; p < 8; p++) {
          const r = (p % 2 === 0) ? 5.2 : 2.1;
          const a = p * Math.PI / 4;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (p === 0) mCtx.moveTo(px, py);
          else mCtx.lineTo(px, py);
        }
        mCtx.closePath();
        mCtx.fill();
        mCtx.restore();
      }

      this.modalAnimFrameId = requestAnimationFrame(animate);
    };

    if (this.modalAnimFrameId) cancelAnimationFrame(this.modalAnimFrameId);
    this.modalAnimFrameId = requestAnimationFrame(animate);
  }

  // Đóng Modal và chuẩn bị lượt kế tiếp
  closeCaughtModal(proceedToNext = false) {
    if (this.modalAnimFrameId) {
      cancelAnimationFrame(this.modalAnimFrameId);
      this.modalAnimFrameId = null;
    }
    this.caughtModal.classList.add('hidden');

    // Đánh dấu học sinh đã khảo bài
    if (this.activeVictim) {
      classManager.markExamined(this.activeVictim.id);
      this.activeVictim.isExamined = true;
      this.activeVictim.isCaught = false;
      this.activeVictim.isFallen = false;

      // Loại khỏi sân đua và tự động giãn cách các bạn còn lại
      if (classManager.getExcludeExamined()) {
        studentManager.removeStudent(this.activeVictim.id, this.canvas.width, this.canvas.height);
      }
    }

    this.doll.turnToBack(0.06);
    this.gameState = 'IDLE';
    this.updateHeaderStats();
    this.renderDrawerStudentList();

    const remaining = classManager.getEligibleStudents();
    if (remaining.length === 0) {
      this.handleAllStudentsExamined();
      return;
    }

    if (proceedToNext) {
      setTimeout(() => {
        this.startRound();
      }, 500);
    }
  }

  handleAllStudentsExamined() {
    this.gameState = 'COMPLETED';
    this.btnStartGame.disabled = false;
    this.btnStartGame.innerHTML = `
      <span class="btn-glow"></span>
      <span class="btn-icon">🎉</span>
      <span class="btn-text">ĐÃ KHẢO XONG HẾT LỚP! BẤM ĐỂ KHẢO LƯỢT MỚI</span>
    `;
    this.setStatus('🎉 TẤT CẢ HỌC SINH ĐÃ ĐƯỢC KHẢO BÀI! KHÔNG AI THOÁT ĐƯỢC!', 'locked');

    try {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    soundFX.playFanfare();
  }

  openDrawer() {
    if (this.classDrawer) {
      this.classDrawer.classList.remove('hidden');
      this.renderDrawerStudentList();
    }
  }

  closeDrawer() {
    if (this.classDrawer) {
      this.classDrawer.classList.add('hidden');
    }
  }

  // Setup Event Listeners
  setupEventListeners() {
    // Phím Space để bắt đầu hoặc chuyển lượt
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        if (this.gameState === 'IDLE') {
          this.startRound();
        }
      } else if (e.code === 'Escape') {
        if (!this.caughtModal.classList.contains('hidden')) {
          this.closeCaughtModal(false);
        }
        if (!this.classDrawer.classList.contains('hidden')) {
          this.classDrawer.classList.add('hidden');
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.target.matches('input, textarea')) {
          this.toggleFullscreen();
        }
      }
    });

    // Nút Bắt Đầu Vòng Quay
    this.btnStartGame.addEventListener('click', () => {
      soundFX.playClick();
      this.startRound();
    });

    // Nút Bật/Tắt Âm Thanh
    this.btnSoundToggle.addEventListener('click', () => {
      const isMuted = soundFX.toggleMute();
      this.btnSoundToggle.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
    });

    // Sao lưu danh sách lớp ra file JSON
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        soundFX.playClick();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(classManager.classes, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `squid_game_classes_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }

    // Khôi phục danh sách lớp từ file JSON
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported) && imported.length > 0) {
              classManager.classes = imported;
              classManager.currentClassId = imported[0].id;
              classManager.saveClasses();
              this.updateClassDropdowns();
              this.reloadStudentsFromCurrentClass();
              alert(`Khôi phục thành công ${imported.length} lớp học!`);
            } else {
              alert('File sao lưu không hợp lệ hoặc không có dữ liệu lớp học.');
            }
          } catch (err) {
            alert('Lỗi đọc file JSON: ' + err.message);
          }
          importFileInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Tự động phân tích & thêm tất cả các lớp từ file Excel (.xlsx / .xls)
    const importExcelInput = document.getElementById('importExcelInput');
    if (importExcelInput) {
      importExcelInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
          try {
            const arrayBuffer = event.target.result;
            const imported = classManager.importFromExcel(arrayBuffer);
            if (imported.length > 0) {
              const totalStudents = imported.reduce((sum, c) => sum + c.students.length, 0);
              this.updateClassDropdowns();
              this.reloadStudentsFromCurrentClass();
              try {
                confetti({
                  particleCount: 120,
                  spread: 100,
                  origin: { y: 0.5 }
                });
              } catch (err) {}
              alert(`🎉 TỰ ĐỘNG THÊM THÀNH CÔNG!\n\nĐã nhập ${imported.length} lớp học với tổng cộng ${totalStudents} học sinh từ file Excel:\n\n${imported.map(c => `• ${c.name}: ${c.students.length} học sinh`).join('\n')}`);
            } else {
              alert('Không tìm thấy danh sách học sinh hợp lệ trong file Excel này. Vui lòng đảm bảo file có cột "Họ và tên"!');
            }
          } catch (err) {
            console.error('Lỗi phân tích Excel:', err);
            alert('Lỗi đọc file Excel: ' + err.message);
          }
          importExcelInput.value = '';
        };
        reader.readAsArrayBuffer(file);
      });
    }

    // Nút Toàn Màn Hình
    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    // Chọn Lớp
    this.classSelect.addEventListener('change', e => {
      classManager.setCurrentClass(e.target.value);
      this.reloadStudentsFromCurrentClass();
      this.updateClassDropdowns();
    });

    this.drawerClassSelect.addEventListener('change', e => {
      classManager.setCurrentClass(e.target.value);
      this.reloadStudentsFromCurrentClass();
      this.updateClassDropdowns();
    });

    // Drawer Quản Lý Lớp
    if (this.btnManageClass) {
      this.btnManageClass.addEventListener('click', e => {
        e.preventDefault();
        try { soundFX.playClick(); } catch (err) {}
        this.openDrawer();
      });
    }

    if (this.btnCloseDrawer) {
      this.btnCloseDrawer.addEventListener('click', () => {
        this.closeDrawer();
      });
    }

    if (this.classDrawer) {
      this.classDrawer.addEventListener('click', e => {
        if (e.target === this.classDrawer) {
          this.closeDrawer();
        }
      });
    }

    if (this.caughtModal) {
      this.caughtModal.addEventListener('click', e => {
        if (e.target === this.caughtModal) {
          this.closeCaughtModal(false);
        }
      });
    }

    // Nút "+ Thêm Lớp" -> Mở ô nhập trực tiếp
    if (this.btnNewClass) {
      this.btnNewClass.addEventListener('click', () => {
        try { soundFX.playClick(); } catch (err) {}
        if (this.newClassBox) {
          this.newClassBox.classList.toggle('hidden');
          if (!this.newClassBox.classList.contains('hidden') && this.txtNewClassName) {
            this.txtNewClassName.value = '';
            this.txtNewClassName.focus();
          }
        }
      });
    }

    // Nút "✓ Lưu Lớp"
    if (this.btnConfirmAddClass) {
      this.btnConfirmAddClass.addEventListener('click', () => {
        const name = this.txtNewClassName ? this.txtNewClassName.value.trim() : '';
        if (!name) {
          alert('Vui lòng nhập tên lớp (ví dụ: Lớp 10A1)!');
          return;
        }
        classManager.addClass(name, '');
        if (this.newClassBox) this.newClassBox.classList.add('hidden');
        if (this.txtNewClassName) this.txtNewClassName.value = '';
        this.updateClassDropdowns();
        this.reloadStudentsFromCurrentClass();
      });
    }

    // Nút "Hủy" tạo lớp
    if (this.btnCancelAddClass) {
      this.btnCancelAddClass.addEventListener('click', () => {
        if (this.newClassBox) this.newClassBox.classList.add('hidden');
      });
    }

    if (this.txtNewClassName) {
      this.txtNewClassName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          if (this.btnConfirmAddClass) this.btnConfirmAddClass.click();
        }
      });
    }

    // Xóa Lớp
    if (this.btnDeleteClass) {
      this.btnDeleteClass.addEventListener('click', () => {
        const current = classManager.getCurrentClass();
        if (confirm(`Bạn có chắc muốn xóa lớp "${current.name}" không?`)) {
          classManager.deleteClass(current.id);
          this.updateClassDropdowns();
          this.reloadStudentsFromCurrentClass();
        }
      });
    }

    // Toggle Loại Trừ Học Sinh Đã Khảo
    this.chkExcludeExamined.checked = classManager.getExcludeExamined();
    this.chkExcludeExamined.addEventListener('change', e => {
      classManager.setExcludeExamined(e.target.checked);
      this.updateHeaderStats();
    });

    // Đặt lại lượt khảo bài của lớp hiện tại
    this.btnResetCurrentRound.addEventListener('click', () => {
      if (confirm('Đặt lại trạng thái khảo bài cho tất cả học sinh trong lớp này?')) {
        classManager.resetRound();
        this.reloadStudentsFromCurrentClass();
        alert('Đã đặt lại thành công! Tất cả học sinh đều sẵn sàng khảo bài.');
      }
    });

    // Khung Dán Danh Sách Hàng Loạt
    this.btnOpenPasteBox.addEventListener('click', () => {
      this.pasteBoxContainer.classList.toggle('hidden');
    });

    this.btnCancelPaste.addEventListener('click', () => {
      this.pasteBoxContainer.classList.add('hidden');
    });

    this.btnSavePastedStudents.addEventListener('click', () => {
      const text = this.txtPasteStudents.value;
      if (!text.trim()) {
        alert('Vui lòng nhập danh sách tên học sinh!');
        return;
      }
      classManager.updateCurrentClass(classManager.getCurrentClass().name, text);
      this.pasteBoxContainer.classList.add('hidden');
      this.txtPasteStudents.value = '';
      this.reloadStudentsFromCurrentClass();
      alert('Đã cập nhật danh sách học sinh thành công!');
    });

    // Modal Actions
    this.btnNextStudent.addEventListener('click', () => {
      soundFX.playClick();
      this.closeCaughtModal(true);
    });

    this.btnCloseModal.addEventListener('click', () => {
      soundFX.playClick();
      this.closeCaughtModal(false);
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Lỗi toàn màn hình:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  renderDrawerStudentList() {
    const currentClass = classManager.getCurrentClass();
    if (!currentClass) return;

    this.drawerStudentCount.textContent = currentClass.students.length;
    this.studentTableBody.innerHTML = '';

    currentClass.students.forEach(s => {
      const tr = document.createElement('tr');
      if (s.isExamined) tr.classList.add('examined');

      tr.innerHTML = `
        <td style="font-family: Orbitron; font-weight: 700; color: #ff2473;">${s.number}</td>
        <td style="font-weight: 600;">${s.name}</td>
        <td>
          <span class="badge-status ${s.isExamined ? 'examined' : 'waiting'}">
            ${s.isExamined ? '✓ ĐÃ KHẢO' : 'CHỜ KHẢO'}
          </span>
        </td>
      `;
      this.studentTableBody.appendChild(tr);
    });
  }

  // Vòng Lặp Vẽ & Cập Nhật Game 60 FPS
  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(deltaTime) {
    if (this.doll) {
      this.doll.update(deltaTime);
    }
    studentManager.update(deltaTime);
    this.updateBulletImpacts();

    // Hiệu ứng cuộn sân vô hạn khi ĐÈN XANH (Endless Running Track)
    if (this.gameState === 'GREEN_LIGHT') {
      this.groundScrollOffset = (this.groundScrollOffset + 4.5) % 100;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Vẽ mặt sân Đấu Trường Squid Game (với vạch cuộn vô tận)
    this.drawArenaField(ctx, w, h);

    // 2. Vẽ Búp Bê Giám Thị Khổng Lồ (kèm 2 lính đứng ngay cạnh trên bục)
    if (this.doll) {
      this.doll.draw(ctx, w, h);
    }

    // 4. Vẽ Toàn Bộ Học Sinh Trên Sân
    studentManager.draw(ctx);

    // 5. Vẽ Hiệu Ứng Tia Lửa Đạn / Mảnh Nổ Va Chạm
    this.drawBulletImpacts(ctx);
  }

  // Quản lý hệ thống mảnh đạn / tia lửa nổ
  spawnBulletImpact(x, y) {
    this.bulletImpacts = [];
    const colors = ['#ff0033', '#ff6600', '#ffe600', '#ffffff', '#8b0000'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 6.0;
      this.bulletImpacts.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        size: 2.2 + Math.random() * 3.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.03
      });
    }
  }

  updateBulletImpacts() {
    for (let i = this.bulletImpacts.length - 1; i >= 0; i--) {
      const p = this.bulletImpacts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Trọng lực rơi
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.bulletImpacts.splice(i, 1);
      }
    }
  }

  drawBulletImpacts(ctx) {
    if (this.bulletImpacts.length === 0) return;
    ctx.save();
    for (const p of this.bulletImpacts) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawArenaField(ctx, w, h) {
    const groundY = Math.floor(h * 0.30);
    const finishLineY = groundY + 45;
    const playAreaHeight = h - finishLineY;

    // 1. NỀN ĐẤT CÁT ĐẤU TRƯỜNG SQUID GAME
    const sandGrad = ctx.createLinearGradient(0, groundY, 0, h);
    sandGrad.addColorStop(0, '#e8ca9e');
    sandGrad.addColorStop(0.35, '#d9b282');
    sandGrad.addColorStop(1, '#bf905f');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // 2. PHÔNG NỀN NGUYÊN TÁC SQUID GAME: Bầu trời xanh, Cánh đồng lúa mì vàng & Ngôi nhà bên phải
    this.drawSquidGameBackdrop(ctx, w, groundY);

    // 3. Vạch kẻ làn chạy (Lanes) & Mốc khoảng cách cuộn vô tận
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 10]);
    const lanes = 8;
    const laneWidth = (w * 0.84) / lanes;
    for (let i = 0; i <= lanes; i++) {
      const lx = w * 0.08 + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, finishLineY + 12);
      ctx.lineTo(lx, h);
      ctx.stroke();
    }

    // Các mốc vạch ngang cuộn liên tục (Moving Distance Markers khi Đèn Xanh)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    const lineSpacing = 100;
    const numLines = Math.ceil(playAreaHeight / lineSpacing) + 1;
    for (let i = 0; i < numLines; i++) {
      const ly = finishLineY + 15 + ((i * lineSpacing + this.groundScrollOffset) % playAreaHeight);
      ctx.beginPath();
      ctx.moveTo(w * 0.08, ly);
      ctx.lineTo(w * 0.92, ly);
      ctx.stroke();
    }
    ctx.restore();

    // 4. VẠCH ĐÍCH ĐỎ (FINISH LINE) - Nằm chuẩn mực trên nền cát trước chân Búp Bê & 2 Lính
    ctx.save();
    // Vạch đỏ rực trên cát
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, finishLineY);
    ctx.lineTo(w * 0.96, finishLineY);
    ctx.stroke();

    // Vạch sọc trắng cảnh báo mép vạch đích
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(w * 0.04, finishLineY + 5);
    ctx.lineTo(w * 0.96, finishLineY + 5);
    ctx.stroke();

    // Chữ chỉ dẫn Vạch Đích trên sân cát
    ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★   VẠCH ĐÍCH (FINISH LINE)   ★', w / 2, finishLineY - 8);
    ctx.restore();

    // 5. Vạch xuất phát phía dưới sân
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.93);
    ctx.lineTo(w * 0.95, h * 0.93);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Vẽ phông nền nguyên tác Squid Game: Bầu trời xanh, Cánh đồng lúa mì vàng & Ngôi nhà bên phải
  drawSquidGameBackdrop(ctx, w, groundY) {
    ctx.save();

    const skyH = groundY * 0.45;

    // A. Bầu trời xanh dịu mát (Sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
    skyGrad.addColorStop(0, '#6fa8dc');
    skyGrad.addColorStop(0.65, '#9fc5e8');
    skyGrad.addColorStop(1, '#cfe2f3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, skyH);

    // Mây trắng nhẹ nhàng trôi trên bầu trời
    this.drawFluffyCloud(ctx, w * 0.12, skyH * 0.40, 40);
    this.drawFluffyCloud(ctx, w * 0.38, skyH * 0.28, 48);
    this.drawFluffyCloud(ctx, w * 0.68, skyH * 0.35, 42);
    this.drawFluffyCloud(ctx, w * 0.90, skyH * 0.42, 35);

    // B. CÁNH ĐỒNG LÚA MÌ / NGÔ VÀNG ÓNG Ả (Golden Wheat Field kéo dài tít tắp)
    const wheatGrad = ctx.createLinearGradient(0, skyH, 0, groundY);
    wheatGrad.addColorStop(0, '#cda137');
    wheatGrad.addColorStop(0.4, '#e5b84c');
    wheatGrad.addColorStop(0.85, '#d49e35');
    wheatGrad.addColorStop(1, '#b78124');
    ctx.fillStyle = wheatGrad;
    ctx.fillRect(0, skyH, w, groundY - skyH);

    // Kết cấu sóng lúa mì vàng nhấp nhô
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 30) {
      ctx.rect(x, skyH, 15, groundY - skyH);
    }
    ctx.fill();

    // Rặng cây xanh nhỏ ở chân trời phía xa bên trái
    ctx.fillStyle = '#4d5d36';
    ctx.beginPath();
    ctx.arc(w * 0.04, skyH, 12, 0, Math.PI * 2);
    ctx.arc(w * 0.07, skyH - 2, 16, 0, Math.PI * 2);
    ctx.arc(w * 0.10, skyH + 2, 14, 0, Math.PI * 2);
    ctx.fill();

    // C. NGÔI NHÀ ĐẶC TRƯNG NẰM BÊN PHẢI (Chuẩn xác 100% như ảnh phim Squid Game)
    this.drawSquidGameHouseRight(ctx, w * 0.82, groundY);

    // Đường gờ tiếp giáp giữa cánh đồng vàng và nền cát đấu trường
    ctx.strokeStyle = '#9c6c1b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    ctx.restore();
  }

  // Vẽ ngôi nhà nhỏ màu trắng, mái ngói cam, cửa xanh bên phải cánh đồng (như ảnh phim)
  drawSquidGameHouseRight(ctx, hx, baseY) {
    ctx.save();

    const houseW = 165;
    const houseH = 75;
    const roofH = 42;
    const wallTop = baseY - houseH;

    // Bóng đổ ngôi nhà trên cánh đồng
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(hx, baseY, houseW * 0.55, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân tường nhà màu trắng vôi (White Stucco Wall)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(hx - houseW / 2, wallTop, houseW, houseH);
    // Mảng đổ bóng bên phải tường
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(hx + houseW * 0.15, wallTop, houseW * 0.35, houseH);

    // Ống khói trắng vuông vức ở giữa mái nhà
    const chimW = 24;
    const chimH = 35;
    const chimX = hx + 10;
    const chimY = wallTop - roofH - 12;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(chimX, chimY, chimW, chimH);
    // Viền trên ống khói
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(chimX - 2, chimY, chimW + 4, 5);
    // Khe ngắm bắn tỉa màu đen bí mật trên ống khói
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(chimX + 4, chimY + 10, chimW - 8, 5);

    // MÁI NHÀ NGÓI CAM KIỂU CHỮ A (Hipped Terracotta Roof như trong phim)
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(hx - houseW / 2 - 12, wallTop);
    ctx.lineTo(hx - houseW * 0.22, wallTop - roofH);
    ctx.lineTo(hx + houseW * 0.22, wallTop - roofH);
    ctx.lineTo(hx + houseW / 2 + 12, wallTop);
    ctx.closePath();
    ctx.fill();

    // Mặt hông tam giác của mái
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(hx + houseW / 2 + 12, wallTop);
    ctx.lineTo(hx + houseW * 0.22, wallTop - roofH);
    ctx.lineTo(hx + houseW * 0.35, wallTop);
    ctx.closePath();
    ctx.fill();

    // Hàng ngói cam viền mái
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    for (let y = wallTop - roofH; y <= wallTop; y += 7) {
      ctx.beginPath();
      ctx.moveTo(hx - houseW * 0.45, y);
      ctx.lineTo(hx + houseW * 0.45, y);
      ctx.stroke();
    }

    // CỬA CUỐN / CỬA SẬP MÀU XANH LÁ ĐẬM (Dark Green Shutter Door như ảnh phim)
    const doorW = 52;
    const doorH = 50;
    const doorX = hx - houseW * 0.18;
    const doorY = baseY - doorH;
    ctx.fillStyle = '#1e3d2f';
    ctx.fillRect(doorX - doorW / 2, doorY, doorW, doorH);

    // Các nan cửa cuốn nằm ngang
    ctx.strokeStyle = '#2d5a45';
    ctx.lineWidth = 1.2;
    for (let dy = doorY + 6; dy < baseY; dy += 6) {
      ctx.beginPath();
      ctx.moveTo(doorX - doorW / 2, dy);
      ctx.lineTo(doorX + doorW / 2, dy);
      ctx.stroke();
    }

    // CỬA SỔ VÒM MÀU XANH LÁ ĐẬM (Arched Green Window bên phải như ảnh phim)
    const winW = 24;
    const winH = 34;
    const winX = hx + houseW * 0.28;
    const winY = baseY - 45;
    ctx.fillStyle = '#1e3d2f';
    ctx.beginPath();
    ctx.roundRect(winX - winW / 2, winY, winW, winH, [12, 12, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  drawFluffyCloud(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.45, cy - r * 0.15, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.45, cy - r * 0.1, r * 0.42, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.8, cy + r * 0.1, r * 0.38, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.8, cy + r * 0.12, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPicketFence(ctx, startX, baseY, count) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const px = startX + i * 8;
      ctx.beginPath();
      ctx.moveTo(px, baseY);
      ctx.lineTo(px, baseY - 16);
      ctx.lineTo(px + 3, baseY - 20);
      ctx.lineTo(px + 6, baseY - 16);
      ctx.lineTo(px + 6, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Thanh ngang hàng rào
    ctx.fillRect(startX, baseY - 12, count * 8, 2.5);
    ctx.fillRect(startX, baseY - 6, count * 8, 2.5);
    ctx.restore();
  }
}

// Khởi chạy ứng dụng an toàn cho cả lần đầu tải trang & Hot Module Replacement
function launchApp() {
  if (window.squidApp && window.squidApp.modalAnimFrameId) {
    cancelAnimationFrame(window.squidApp.modalAnimFrameId);
  }
  window.squidApp = new SquidGameApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', launchApp);
} else {
  launchApp();
}
