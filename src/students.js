// Hệ thống vẽ và quản lý Nhân Vật Học Sinh Đa Dạng (Nam & Nữ, Đầy Đủ Kiểu Tóc, Kính Cận, Biểu Cảm)
// Chuẩn phong cách Squid Game: Áo khoác Tracksuit xanh ngọc, khóa kéo trắng, sọc thể thao,
// SỐ BÁO DANH RÕ RÀNG 100% KHÔNG BỊ CHE KHUẤT và CỬ ĐỘNG NHÚC NHÍCH CHÂN THỰC.

class DustParticle {
  constructor(x, y) {
    this.x = x + (Math.random() - 0.5) * 12;
    this.y = y + (Math.random() - 0.5) * 4;
    this.size = 2 + Math.random() * 3.5;
    this.alpha = 0.65;
    this.speedY = 1.2 + Math.random() * 1.8;
    this.speedX = (Math.random() - 0.5) * 0.8;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.alpha -= 0.03;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(216, 169, 121, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Nhận diện chuẩn xác Nam / Nữ và tạo ngoại hình độc nhất
export function getStudentProfile(name = '', id = '') {
  const lower = name.toLowerCase().trim();

  // Danh sách từ khóa Nữ tiếng Việt
  const femaleKeywords = [
    'thị', 'linh', 'my', 'vy', 'quỳnh', 'thảo', 'hà', 'khanh', 'nga', 'trâm',
    'mai', 'lan', 'hương', 'trang', 'chi', 'yến', 'ngân', 'huyền', 'phương',
    'thư', 'hân', 'diệp', 'nhung', 'tuyết', 'nhi', 'hồng', 'cúc', 'đan', 'diễm',
    'tú', 'bích', 'giang', 'châu', 'dung', 'duyên', 'hoa', 'loan', 'ngọc'
  ];

  // Danh sách từ khóa Nam tiếng Việt
  const maleKeywords = [
    'văn', 'hoàng', 'cường', 'dũng', 'hải', 'hưng', 'long', 'nam', 'phong',
    'phúc', 'sơn', 'thịnh', 'trí', 'uy', 'phát', 'bảo', 'quân', 'khoa', 'kiên',
    'đạt', 'tuấn', 'khang', 'minh', 'tiến', 'tùng', 'huy', 'bách', 'thành',
    'quang', 'đức', 'trọng', 'nguyên', 'thắng', 'bình', 'việt', 'khôi', 'hùng'
  ];

  let isFemale = false;
  const words = lower.split(/\s+/);
  const firstName = words[words.length - 1] || '';
  const middleName = words.length > 2 ? words[1] : '';

  if (lower.includes('thị')) {
    isFemale = true;
  } else if (lower.includes('văn')) {
    isFemale = false;
  } else if (femaleKeywords.includes(firstName) || femaleKeywords.includes(middleName)) {
    isFemale = true;
  } else if (maleKeywords.includes(firstName)) {
    isFemale = false;
  } else {
    // Hash fallback
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    isFemale = Math.abs(hash) % 2 === 0;
  }

  // Hash độc nhất cho từng học sinh dựa vào Tên + ID
  let seed = 0;
  const seedStr = name + id;
  for (let i = 0; i < seedStr.length; i++) {
    seed = seedStr.charCodeAt(i) + ((seed << 5) - seed);
  }
  seed = Math.abs(seed);

  const skinTones = ['#fde3cf', '#fcd5b8', '#f8cbb0', '#f4be9b', '#f9c5a2'];
  const hairColors = ['#15171a', '#221915', '#2c1e19', '#1a1c20', '#32231d'];

  return {
    gender: isFemale ? 'female' : 'male',
    hairStyle: seed % 5, // 5 kiểu tóc khác nhau cho mỗi giới
    skinTone: skinTones[seed % skinTones.length],
    hairColor: hairColors[(seed >> 2) % hairColors.length],
    hasGlasses: (seed % 10) < 4, // 40% đeo kính cận
    glassesColor: (seed % 2 === 0) ? '#111827' : '#d97706',
    hasHairClip: isFemale,
    hairClipColor: ['#ff2473', '#0fd1b2', '#f59e0b', '#8b5cf6'][seed % 4],
    hasBlush: isFemale
  };
}

// Hàm vẽ Nhân Vật Đầy Đủ Chi Tiết (Có hoạt họa run rẩy nhúc nhích chân thực)
export function drawFullSquidCharacter(ctx, x, y, scale = 1.0, opts = {}) {
  const number = String(opts.number || '001');
  const isRunning = opts.isRunning || false;
  const runCycle = opts.runCycle || 0;
  const isTrembling = opts.isTrembling || false;
  const isCaught = opts.isCaught || false;
  const isFakeout = opts.isFakeoutTarget || false;
  const sweatTimer = opts.sweatTimer || 0;
  const profile = opts.profile || {
    gender: 'male',
    hairStyle: 0,
    skinTone: '#fcd5b8',
    hairColor: '#1a1c20',
    hasGlasses: false,
    glassesColor: '#111',
    hasHairClip: false,
    hairClipColor: '#ff2473',
    hasBlush: false
  };

  const isFallen = opts.isFallen || false;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Nếu bị bắn hạ: Ngã gục nằm xuống sàn cát
  if (isFallen) {
    ctx.rotate(Math.PI / 2);
  }

  // CỬ ĐỘNG NHÚC NHÍCH / MẤT THĂNG BẰNG KHI BỊ BẮT
  const isMovingGuilty = !isFallen && (isCaught || isFakeout || (isTrembling && !isRunning));
  let jitterX = 0;
  let jitterY = 0;
  if (isMovingGuilty) {
    // Thân mình nghiêng ngả chao đảo qua lại như đang mất thăng bằng
    const swayAngle = Math.sin(sweatTimer * 5) * 0.12;
    ctx.rotate(swayAngle);
    jitterX = Math.sin(sweatTimer * 10) * 2.8;
    jitterY = Math.cos(sweatTimer * 8) * 1.6;
  }
  ctx.translate(jitterX, jitterY);

  // 1. Bóng đổ dưới thân
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  if (isFallen) {
    ctx.ellipse(0, 0, 36, 14, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(0, 37, 19, 6.5, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // Nhịp chân & tay khi chạy hoặc khi đứng thở dốc
  const legSwing = isRunning ? Math.sin(runCycle * 1.6) * 11 : 0;
  const armSwing = isRunning ? Math.sin(runCycle * 1.6) * 9 : (isCaught ? Math.sin(sweatTimer * 6) * 1.5 : 0);
  const bodyBobY = isRunning ? Math.abs(Math.sin(runCycle * 1.6)) * 3 : (isCaught ? Math.sin(sweatTimer * 4) * 1.2 : 0);

  ctx.translate(0, -bodyBobY);

  // 2. Chân & Quần Thể Thao Tracksuit
  const pantsColor = '#065953';
  const stripeColor = '#ffffff';

  // Chân Trái
  ctx.save();
  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(-12, 10, 9, 23 + legSwing, 3);
  ctx.fill();
  ctx.fillStyle = stripeColor;
  ctx.fillRect(-12, 10, 2.5, 22 + legSwing); // Sọc trắng chân trái
  // Giày trắng
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-14, 32 + legSwing, 12, 6, 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(-14, 37 + legSwing, 12, 1.5);
  ctx.restore();

  // Chân Phải
  ctx.save();
  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(3, 10, 9, 23 - legSwing, 3);
  ctx.fill();
  ctx.fillStyle = stripeColor;
  ctx.fillRect(9.5, 10, 2.5, 22 - legSwing); // Sọc trắng chân phải
  // Giày trắng
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(2, 32 - legSwing, 12, 6, 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(2, 37 - legSwing, 12, 1.5);
  ctx.restore();

  // 3. Tóc Phía Sau (Dành cho bạn nữ tóc dài / đuôi ngựa / 2 bím)
  if (profile.gender === 'female') {
    ctx.save();
    ctx.fillStyle = profile.hairColor;
    if (profile.hairStyle === 1) {
      // Tóc dài buông xõa bồng bềnh qua vai
      ctx.beginPath();
      ctx.roundRect(-18, -26, 36, 40, 10);
      ctx.fill();
    } else if (profile.hairStyle === 0) {
      // Tóc đuôi ngựa vểnh cao
      ctx.beginPath();
      ctx.ellipse(15, -34, 8, 17, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Dây buộc nơ
      ctx.fillStyle = profile.hairClipColor;
      ctx.beginPath();
      ctx.arc(8, -32, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (profile.hairStyle === 3) {
      // Hai bím tóc 2 bên
      ctx.beginPath();
      ctx.ellipse(-16, -10, 5.5, 18, 0.25, 0, Math.PI * 2);
      ctx.ellipse(16, -10, 5.5, 18, -0.25, 0, Math.PI * 2);
      ctx.fill();
      // Nơ buộc bím
      ctx.fillStyle = profile.hairClipColor;
      ctx.beginPath();
      ctx.arc(-16, -18, 3, 0, Math.PI * 2);
      ctx.arc(16, -18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Cánh Tay (Hoạt ảnh giơ 2 tay lên trời vẫy hoảng hốt khi nhúc nhích)
  if (isMovingGuilty) {
    // 🔥 HOẠT ẢNH: GIƠ 2 TAY LÊN TRỜI VẪY HOẢNG HỐT XONG BỎ XUỐNG LIÊN TỤC!
    const armWave = Math.sin(sweatTimer * 6.5); // Dao động -1 đến 1
    const leftArmAngle = -Math.PI * 0.72 + armWave * 0.35;  // Tay trái giơ lên trời
    const rightArmAngle = -Math.PI * 0.28 - armWave * 0.35; // Tay phải giơ lên trời

    // Tay Trái giơ cao
    ctx.save();
    ctx.translate(-16, -10); // Khớp vai trái
    ctx.rotate(leftArmAngle);
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-3.7, 0, 7.5, 24, 3.5);
    ctx.fill();
    ctx.fillStyle = stripeColor;
    ctx.fillRect(-3.7, 0, 2, 22);
    // Bàn tay xòe giơ lên trời
    ctx.fillStyle = profile.skinTone;
    ctx.beginPath();
    ctx.arc(0, 24, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tay Phải giơ cao
    ctx.save();
    ctx.translate(16, -10); // Khớp vai phải
    ctx.rotate(rightArmAngle);
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-3.7, 0, 7.5, 24, 3.5);
    ctx.fill();
    ctx.fillStyle = stripeColor;
    ctx.fillRect(1.7, 0, 2, 22);
    // Bàn tay xòe giơ lên trời
    ctx.fillStyle = profile.skinTone;
    ctx.beginPath();
    ctx.arc(0, 24, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Tay bình thường: Các bạn khác đứng im phăng phắc, tay xuôi theo thân
    ctx.save();
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-23, -12 - armSwing, 7.5, 23, 3.5);
    ctx.fill();
    ctx.fillStyle = stripeColor;
    ctx.fillRect(-23, -12 - armSwing, 2, 21);
    ctx.fillStyle = profile.skinTone;
    ctx.beginPath();
    ctx.arc(-19.2, 12 - armSwing, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(15.5, -12 + armSwing, 7.5, 23, 3.5);
    ctx.fill();
    ctx.fillStyle = stripeColor;
    ctx.fillRect(21, -12 + armSwing, 2, 21);
    ctx.fillStyle = profile.skinTone;
    ctx.beginPath();
    ctx.arc(19.2, 12 + armSwing, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Thân Áo Khoác Squid Game Tracksuit Jacket
  ctx.save();
  // Khối thân áo rộng rãi (từ x = -16 đến +16)
  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(-16, -14, 32, 26, 6);
  ctx.fill();

  // Khóa kéo trắng ở trung tâm
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.5, -14, 3, 26);
  ctx.fillStyle = '#bbb';
  ctx.fillRect(-2.2, -10, 4.4, 3.5);

  // Cổ áo trắng thể thao
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, -14);
  ctx.lineTo(0, -6);
  ctx.lineTo(11, -14);
  ctx.stroke();

  // 6. BIỂN SỐ BÁO DANH RỘNG RÃI - 100% KHÔNG BỊ TAY ĐÈ HOẶC CẮT CHỮ
  // Đặt ở ngực trái (từ x = 2 đến x = 15), rộng 13px, cao 9.5px
  const patchX = 2;
  const patchY = -9.5;
  const patchW = 13.2;
  const patchH = 9.5;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 2;
  ctx.beginPath();
  ctx.roundRect(patchX, patchY, patchW, patchH, 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Viền mỏng xung quanh biển số
  ctx.strokeStyle = '#063833';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // In số báo danh: Tự động đo độ rộng chữ để KHÔNG BAO GIỜ bị tràn ra ngoài
  ctx.fillStyle = '#063833';
  let numFontSize = 5.8;
  ctx.font = `900 ${numFontSize}px "Orbitron", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(number).width;
  if (textWidth > patchW - 1.5) {
    numFontSize = numFontSize * ((patchW - 1.5) / textWidth);
    ctx.font = `900 ${numFontSize}px "Orbitron", sans-serif`;
  }
  ctx.fillText(number, patchX + patchW / 2, patchY + patchH / 2 + 0.4);

  ctx.restore(); // Kết thúc thân áo

  // 7. Cổ & Khuôn Mặt
  ctx.save();
  ctx.fillStyle = profile.skinTone;
  ctx.fillRect(-4, -18, 8, 6); // Cổ

  // Khuôn mặt
  ctx.beginPath();
  ctx.arc(0, -28, 13, 0, Math.PI * 2);
  ctx.fill();

  // Gò má phớt hồng cho học sinh nữ
  if (profile.hasBlush) {
    ctx.fillStyle = 'rgba(255, 99, 132, 0.4)';
    ctx.beginPath();
    ctx.arc(-7.5, -24, 3.8, 0, Math.PI * 2);
    ctx.arc(7.5, -24, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Đôi tai
  ctx.fillStyle = profile.skinTone;
  ctx.beginPath();
  ctx.arc(-13, -28, 2.5, 0, Math.PI * 2);
  ctx.arc(13, -28, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 8. Kiểu Tóc Phía Trước
  ctx.fillStyle = profile.hairColor;
  if (profile.gender === 'female') {
    // KIỂU TÓC NỮ RÕ RÀNG
    if (profile.hairStyle === 0) {
      // Mái ngang nữ tính + cột đuôi ngựa
      ctx.beginPath();
      ctx.arc(0, -31, 14, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(14, -25);
      ctx.lineTo(-14, -25);
      ctx.closePath();
      ctx.fill();
    } else if (profile.hairStyle === 1) {
      // Tóc dài rẽ ngôi mềm mại
      ctx.beginPath();
      ctx.arc(0, -32, 14.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(14.5, -22);
      ctx.lineTo(4, -26);
      ctx.lineTo(-4, -26);
      ctx.lineTo(-14.5, -22);
      ctx.closePath();
      ctx.fill();
    } else if (profile.hairStyle === 2) {
      // Tóc ngắn cá tính (Sae-byeok 067)
      ctx.beginPath();
      ctx.arc(0, -31, 14.5, Math.PI * 0.82, Math.PI * 2.18);
      ctx.lineTo(14.5, -21);
      ctx.lineTo(9, -22);
      ctx.lineTo(-9, -22);
      ctx.lineTo(-14.5, -21);
      ctx.closePath();
      ctx.fill();
    } else {
      // Tóc mái thưa uốn nhẹ
      ctx.beginPath();
      ctx.arc(0, -31, 14, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(14, -25);
      ctx.lineTo(3, -23);
      ctx.lineTo(-3, -23);
      ctx.lineTo(-14, -25);
      ctx.closePath();
      ctx.fill();
    }

    // Kẹp tóc màu pastel cho bạn nữ
    if (profile.hasHairClip) {
      ctx.fillStyle = profile.hairClipColor;
      ctx.beginPath();
      ctx.roundRect(-10, -33, 6.5, 2.8, 1);
      ctx.fill();
    }
  } else {
    // KIỂU TÓC NAM ĐA DẠNG
    if (profile.hairStyle === 0) {
      // Tóc 7/3 rẽ ngôi lịch lãm
      ctx.beginPath();
      ctx.arc(0, -31, 13.8, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(13.8, -28);
      ctx.lineTo(2, -29);
      ctx.lineTo(-13.8, -27);
      ctx.closePath();
      ctx.fill();
    } else if (profile.hairStyle === 1) {
      // Tóc uốn xoăn nhẹ lượn sóng
      ctx.beginPath();
      ctx.arc(0, -31, 14.2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.arc(-6, -30, 4.5, 0, Math.PI);
      ctx.arc(0, -30, 4.5, 0, Math.PI);
      ctx.arc(6, -30, 4.5, 0, Math.PI);
      ctx.fill();
    } else if (profile.hairStyle === 2) {
      // Tóc Two-block mái rủ
      ctx.beginPath();
      ctx.arc(0, -31, 13.8, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(13.8, -26);
      ctx.lineTo(2, -26);
      ctx.lineTo(0, -29);
      ctx.lineTo(-2, -26);
      ctx.lineTo(-13.8, -26);
      ctx.closePath();
      ctx.fill();
    } else {
      // Tóc ngắn húi cua thể thao
      ctx.beginPath();
      ctx.arc(0, -31, 13.8, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(13.8, -30);
      ctx.lineTo(-13.8, -30);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 9. Biểu Cảm Khuôn Mặt (Mắt Run Rẩy, Miệng Há Hốc, Giọt Mồ Hôi Chảy Hoặc Mắt Chữ X Khi Bị Bắn)
  if (isFallen) {
    // Mắt chữ X khi bị bắn hạ
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2.2;
    [-4.5, 4.5].forEach(ex => {
      ctx.beginPath();
      ctx.moveTo(ex - 2.5, -29.5); ctx.lineTo(ex + 2.5, -24.5);
      ctx.moveTo(ex + 2.5, -29.5); ctx.lineTo(ex - 2.5, -24.5);
      ctx.stroke();
    });

    // Miệng bất tỉnh (đường lượn sóng ngất xỉu)
    ctx.strokeStyle = '#8a2b2b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, -19.5);
    ctx.quadraticCurveTo(-1, -21.5, 1, -19.5);
    ctx.quadraticCurveTo(3, -18, 4.5, -19.5);
    ctx.stroke();

    // Băng urgo y tế nhỏ trên má sau khi trúng đạn
    ctx.save();
    ctx.fillStyle = '#f5cd79';
    ctx.translate(6.5, -23.5);
    ctx.rotate(0.35);
    ctx.fillRect(-3.5, -1.8, 7, 3.6);
    ctx.fillStyle = '#e77f67';
    ctx.fillRect(-0.8, -0.8, 1.6, 1.6);
    ctx.restore();
  } else if (isTrembling || isCaught || isFakeout) {
    // Tròng mắt trắng trợn to
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.5, -27, 3.8, 0, Math.PI * 2);
    ctx.arc(4.5, -27, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Con ngươi đen co rúm và rung rẩy
    const eyeJitterX = (Math.random() - 0.5) * 0.8;
    const eyeJitterY = (Math.random() - 0.5) * 0.8;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-4.5 + eyeJitterX, -27 + eyeJitterY, 1.7, 0, Math.PI * 2);
    ctx.arc(4.5 + eyeJitterX, -27 + eyeJitterY, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Miệng há hốc "O" run rẩy
    const mouthWiggle = (Math.random() - 0.5) * 0.6;
    ctx.fillStyle = '#8a2b2b';
    ctx.beginPath();
    ctx.ellipse(mouthWiggle, -20, 2.6, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giọt mồ hôi 💦 chảy liên tục xuống má
    ctx.fillStyle = '#38ada9';
    const dropProgress = (sweatTimer * 2.5) % 8; // Chảy xuống rồi lặp lại
    const dropY = -34 + dropProgress;
    ctx.beginPath();
    ctx.arc(14, dropY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11.5, dropY);
    ctx.lineTo(14, dropY - 4.5);
    ctx.lineTo(16.5, dropY);
    ctx.fill();

    // Lông mày lo sợ
    ctx.strokeStyle = '#1c1f24';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-8, -32); ctx.lineTo(-2, -34);
    ctx.moveTo(2, -34); ctx.lineTo(8, -32);
    ctx.stroke();
  } else {
    // Mắt bình thường tập trung chạy
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-4.5, -27, 2.2, 0, Math.PI * 2);
    ctx.arc(4.5, -27, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -28.5, 1.2, 1.2);
    ctx.fillRect(4, -28.5, 1.2, 1.2);

    // Miệng mỉm cười quyết tâm
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -22, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Lông mày bình thường
    ctx.strokeStyle = '#1c1f24';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -33); ctx.lineTo(-2, -32);
    ctx.moveTo(2, -32); ctx.lineTo(8, -33);
    ctx.stroke();
  }

  // 10. Kính Cận (Nếu có)
  if (profile.hasGlasses) {
    ctx.save();
    if (isFallen) {
      // Kính bị xô lệch nghiêng khi ngã gục
      ctx.translate(0, -27);
      ctx.rotate(0.12);
      ctx.translate(0, 27);
    }
    ctx.strokeStyle = profile.glassesColor;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-8, -30, 7, 6.5);
    ctx.strokeRect(1, -30, 7, 6.5);
    ctx.beginPath();
    ctx.moveTo(-1, -27);
    ctx.lineTo(1, -27);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // Kết thúc khuôn mặt

  ctx.restore(); // Kết thúc toàn thân
}

export class StudentCharacter {
  constructor(data, targetX, targetY) {
    this.id = data.id;
    this.name = data.name;
    this.number = data.number;
    this.isExamined = data.isExamined || false;

    // Phân tích giới tính và ngoại hình riêng biệt
    this.profile = getStudentProfile(this.name, this.id);

    // Tọa độ mục tiêu (Slot vị trí riêng biệt của học sinh này)
    this.targetX = targetX;
    this.targetY = targetY;

    // Tọa độ hiện tại (Nội suy mượt mà tới target)
    this.x = targetX;
    this.y = targetY;

    this.isRunning = false;
    this.isTrembling = false;
    this.isCaught = false;
    this.isFakeoutTarget = false;
    this.isFallen = false;

    // Animation chạy tự nhiên
    this.runCycle = Math.random() * Math.PI * 2;
    this.runSpeedFactor = 0.22 + Math.random() * 0.06;
    this.sweatTimer = 0;
    this.glowIntensity = 0;
  }

  setTargetSlot(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update(deltaTime) {
    if (this.isFallen) {
      // Đang bị bắn hạ ngã gục: giữ nguyên vị trí trên sàn cát
      return;
    }

    // Trượt mượt mà (Lerp) về vị trí Slot cố định -> KHÔNG BAO GIỜ BỊ ĐÈ CHỤM
    this.x += (this.targetX - this.x) * 0.08;
    this.y += (this.targetY - this.y) * 0.08;

    if (this.isRunning) {
      this.runCycle += this.runSpeedFactor;
      this.isTrembling = false;
    } else {
      if (this.isTrembling || this.isCaught || this.isFakeoutTarget) {
        this.sweatTimer += 0.12; // Cập nhật nhịp vẫy tay mượt mà liên tục 60fps
      }
    }

    if (this.isCaught) {
      this.glowIntensity = Math.min(1, this.glowIntensity + 0.1);
    } else {
      this.glowIntensity = Math.max(0, this.glowIntensity - 0.1);
    }
  }

  draw(ctx) {
    // Nếu bị bắn hạ: Vẽ vệt ngã và máu/bụi trên nền cát
    if (this.isFallen) {
      ctx.save();
      ctx.fillStyle = 'rgba(180, 20, 20, 0.45)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 16, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vòng sáng cảnh báo đỏ dưới thân
      ctx.strokeStyle = 'rgba(255, 0, 50, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 16, 42, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.isCaught) {
      // Vẽ vầng sáng hào quang nếu bị khóa laser
      ctx.save();
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 35;
      ctx.fillStyle = 'rgba(255, 0, 50, 0.4)';
      ctx.beginPath();
      ctx.arc(this.x, this.y + 4, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Vẽ nhân vật đầy đủ chi tiết với ngoại hình riêng biệt
    drawFullSquidCharacter(ctx, this.x, this.y, 1.05, {
      number: this.number,
      isRunning: this.isRunning,
      runCycle: this.runCycle,
      isTrembling: this.isTrembling,
      isCaught: this.isCaught,
      isFakeoutTarget: this.isFakeoutTarget,
      isFallen: this.isFallen,
      sweatTimer: this.sweatTimer,
      profile: this.profile
    });

    // Vẽ Bảng Tên Học Sinh Rõ Ràng (Khoảng cách an toàn)
    this.drawNameTag(ctx, this.x, this.y);
  }

  drawNameTag(ctx, renderX, renderY) {
    ctx.save();
    const genderIcon = this.profile.gender === 'female' ? '👧 ' : '👦 ';
    let tagText = `${this.number} - ${genderIcon}${this.name}`;
    if (this.isFallen) {
      tagText = `❌ ${this.number} - ${this.name} (ĐÃ BỊ BẮN HẠ)`;
    }

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(tagText).width;
    const tagPadding = 8;
    const tagHeight = 20;
    const tagY = this.isFallen ? renderY - 35 : renderY - 54;

    // Nền bảng tên
    if (this.isFallen) {
      ctx.fillStyle = '#b91c1c';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
    } else if (this.isCaught) {
      ctx.fillStyle = '#ff0033';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 14;
    } else if (this.isFakeoutTarget) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = 'rgba(10, 15, 26, 0.94)';
    }

    ctx.beginPath();
    ctx.roundRect(renderX - textWidth / 2 - tagPadding, tagY - tagHeight / 2, textWidth + tagPadding * 2, tagHeight, 6);
    ctx.fill();

    // Viền bảng tên sắc nét (Hồng cho Nữ, Xanh Mint cho Nam, Trắng khi bị bắt)
    if (this.isFallen || this.isCaught) {
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.strokeStyle = this.profile.gender === 'female' ? '#ff477e' : '#0fd1b2';
    }
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Chữ tên học sinh
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, renderX, tagY);

    ctx.restore();
  }
}

export class StudentManager {
  constructor() {
    this.characters = [];
    this.dustParticles = [];
  }

  calculateStaggeredGrid(studentCount, canvasWidth, canvasHeight) {
    if (studentCount === 0) return [];

    const groundY = Math.floor(canvasHeight * 0.30);
    const finishLineY = groundY + 45;
    const leftMargin = canvasWidth * 0.08;
    const availableWidth = canvasWidth * 0.84;
    // Đảm bảo học sinh ở hàng trên cùng luôn xuất phát an toàn phía dưới vạch đích
    const topMargin = finishLineY + 75;
    const bottomMargin = Math.min(canvasHeight - 95, canvasHeight * 0.88);
    const availableHeight = Math.max(120, bottomMargin - topMargin);

    // Khoảng cách an toàn để bảng tên không chạm nhau
    const minColSpacing = 150; // pixel ngang
    const minRowSpacing = 82;  // pixel dọc

    const maxCols = Math.max(2, Math.floor(availableWidth / minColSpacing));
    let cols = Math.min(maxCols, Math.max(2, Math.ceil(Math.sqrt(studentCount * 1.8))));
    let rows = Math.ceil(studentCount / cols);

    if (rows * minRowSpacing > availableHeight && rows > 1) {
      cols = Math.min(maxCols, Math.ceil(studentCount / Math.floor(availableHeight / minRowSpacing)));
      rows = Math.ceil(studentCount / cols);
    }

    const stepY = rows > 1 ? availableHeight / (rows - 1) : 0;
    const slots = [];

    let studentIndex = 0;
    for (let r = 0; r < rows; r++) {
      if (studentIndex >= studentCount) break;

      const remaining = studentCount - studentIndex;
      const countInRow = (r === rows - 1) ? remaining : Math.min(cols, remaining);

      const rowWidth = (countInRow - 1) * (availableWidth / Math.max(1, cols - 1));
      const startX = leftMargin + (availableWidth - rowWidth) / 2;
      const stepX = countInRow > 1 ? rowWidth / (countInRow - 1) : 0;

      // So le hàng lẻ
      const stagger = (r % 2 === 1 && countInRow > 1) ? (stepX * 0.25) : 0;

      for (let c = 0; c < countInRow; c++) {
        const x = countInRow === 1 ? (leftMargin + availableWidth / 2) : (startX + c * stepX + (c === 0 ? 0 : stagger));
        const y = topMargin + r * stepY;
        slots.push({ x, y });
        studentIndex++;
      }
    }

    return slots;
  }

  initFromList(studentList, canvasWidth, canvasHeight) {
    if (!studentList || studentList.length === 0) {
      this.characters = [];
      return;
    }

    const slots = this.calculateStaggeredGrid(studentList.length, canvasWidth, canvasHeight);

    this.characters = studentList.map((data, index) => {
      const slot = slots[index] || { x: canvasWidth / 2, y: canvasHeight * 0.5 };
      return new StudentCharacter(data, slot.x, slot.y);
    });
  }

  rebalanceSlots(canvasWidth, canvasHeight) {
    const slots = this.calculateStaggeredGrid(this.characters.length, canvasWidth, canvasHeight);
    this.characters.forEach((char, index) => {
      if (slots[index]) {
        char.setTargetSlot(slots[index].x, slots[index].y);
      }
    });
  }

  removeStudent(studentId) {
    // Chỉ loại bỏ học sinh đã bị loại khỏi danh sách, GIỮ NGUYÊN VỊ TRÍ ĐỨNG của các bạn còn lại (không tự ý xắp xếp lại vị trí)
    this.characters = this.characters.filter(c => c.id !== studentId);
  }

  setRunning(isRunning) {
    this.characters.forEach(char => {
      char.isRunning = isRunning;
      if (!isRunning) {
        // Đèn đỏ: Các bạn học sinh ngoan đứng im phăng phắc như tượng đá!
        char.isTrembling = false;
      }
    });
  }

  setTrembling(isTrembling) {
    this.characters.forEach(char => {
      char.isTrembling = isTrembling;
    });
  }

  update(deltaTime) {
    this.characters.forEach(c => {
      c.update(deltaTime);

      if (c.isRunning && Math.random() < 0.25) {
        this.dustParticles.push(new DustParticle(c.x, c.y + 36));
      }
    });

    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.update();
      if (p.alpha <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.dustParticles.forEach(p => p.draw(ctx));
    const sorted = [...this.characters].sort((a, b) => a.y - b.y);
    sorted.forEach(c => c.draw(ctx));
  }

  getStudentById(id) {
    return this.characters.find(c => c.id === id);
  }

  clearHighlights() {
    this.characters.forEach(c => {
      c.isCaught = false;
      c.isFakeoutTarget = false;
      c.isTrembling = false;
    });
  }
}

export const studentManager = new StudentManager();
