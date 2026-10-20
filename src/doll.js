// Búp Bê Giám Thị Khổng Lồ (Squid Game Young-hee Doll)
// Chuẩn nguyên tác phim Squid Game: Cây cổ thụ khô khẳng khiu, Búp bê to lớn uy nghiêm,
// Đôi chân mang tất trắng giày đen tiếp đất tự nhiên, 2 Lính Áo Đỏ đứng 2 bên trên cát.

export class Doll {
  constructor(canvasWidth, canvasHeight) {
    this.x = canvasWidth / 2;
    this.groundY = Math.floor(canvasHeight * 0.32);
    this.y = this.groundY - 146; // Chân búp bê tiếp đất ở groundY
    this.size = 70;
    this.angle = 0; // 0 = Quay lưng, PI = Quay mặt
    this.targetAngle = 0;
    this.turnSpeed = 0.08;

    this.state = 'FACING_AWAY'; // 'FACING_AWAY' | 'TURNING' | 'SCANNING' | 'LOCKED'
    this.laserProgress = 0;
    this.laserTarget = null;
    this.lockedStudent = null;

    this.eyeGlow = 0;
    this.scanSweepAngle = 0;

    // Lính Áo Đỏ (Pink Guards) đứng 2 bên búp bê
    this.isAiming = false;
    this.muzzleFlash = 0;
    this.recoil = 0;
    this.bulletTracer = null;
  }

  resize(canvasWidth, canvasHeight, groundY) {
    this.x = canvasWidth / 2;
    this.groundY = groundY || Math.floor(canvasHeight * 0.32);
    this.y = this.groundY - 146;
  }

  turnToFront(speed = 0.09) {
    this.targetAngle = Math.PI;
    this.turnSpeed = speed;
    this.state = 'TURNING';
  }

  turnToBack(speed = 0.06) {
    this.targetAngle = 0;
    this.turnSpeed = speed;
    this.state = 'TURNING';
    this.lockedStudent = null;
    this.laserTarget = null;
    this.isAiming = false;
  }

  triggerFire(targetX, targetY) {
    this.muzzleFlash = 1.0;
    this.recoil = 1.0;
    this.isAiming = true;

    // Lính Bắn Tỉa bên trái đứng cách búp bê 170px trên cát
    const guardWorldX = this.x - 170;
    const guardWorldY = this.y + 105;
    const dx = targetX - guardWorldX;
    const dy = targetY - guardWorldY;
    const angle = Math.atan2(dy, dx);
    const barrelLength = 48;

    const muzzleX = guardWorldX + Math.cos(angle) * barrelLength;
    const muzzleY = guardWorldY + Math.sin(angle) * barrelLength;

    this.bulletTracer = {
      fromX: muzzleX,
      fromY: muzzleY,
      toX: targetX,
      toY: targetY,
      life: 1.0
    };
  }

  update(deltaTime) {
    // Nội suy góc quay của Búp Bê
    if (Math.abs(this.angle - this.targetAngle) > 0.01) {
      if (this.angle < this.targetAngle) {
        this.angle = Math.min(this.targetAngle, this.angle + this.turnSpeed);
      } else {
        this.angle = Math.max(this.targetAngle, this.angle - this.turnSpeed);
      }
    } else {
      this.angle = this.targetAngle;
      if (this.state === 'TURNING') {
        if (this.targetAngle === Math.PI) {
          this.state = 'SCANNING';
        } else {
          this.state = 'FACING_AWAY';
        }
      }
    }

    // Hiệu ứng mắt phát sáng & laser quét
    if (this.state === 'SCANNING' || this.state === 'LOCKED') {
      this.eyeGlow = Math.min(1, this.eyeGlow + 0.1);
      this.scanSweepAngle += 0.04;
    } else {
      this.eyeGlow = Math.max(0, this.eyeGlow - 0.1);
    }

    // Giảm dần hiệu ứng lửa đầu nòng & vệt đạn
    if (this.muzzleFlash > 0) {
      this.muzzleFlash = Math.max(0, this.muzzleFlash - 0.1);
    }
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - 0.12);
    }
    if (this.bulletTracer) {
      this.bulletTracer.life = Math.max(0, this.bulletTracer.life - 0.09);
      if (this.bulletTracer.life <= 0) {
        this.bulletTracer = null;
      }
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. CÂY CỔ THỤ KHÔ KHỐC NGUYÊN BẢN PHIM (Dead Tree không lá, cành khẳng khiu giăng ngang)
    this.drawDeadTree(ctx);

    // 2. Hai Thằng Lính Mặc Áo Đỏ đứng 2 bên trên nền cát
    this.drawGuardsBesideDoll(ctx);

    // 3. Thân Búp Bê to lớn với váy cam xếp ly, chân tất trắng giày đen tiếp đất
    this.drawFullDoll(ctx);

    // 4. Đầu Búp Bê xoay theo góc `this.angle`
    this.drawHead(ctx);

    ctx.restore();

    // 5. Tia Laser đỏ quét đấu trường & Vệt đạn bắn tỉa
    if (this.angle > Math.PI * 0.7 && this.eyeGlow > 0.1) {
      this.drawLaser(ctx, canvasWidth, canvasHeight);
    }
    this.drawBulletTracer(ctx);
  }

  // CÂY CỔ THỤ KHÔ KHỐC (Hoàn toàn không có lá xanh, cành nhánh khẳng khiu uốn lượn như trong phim)
  drawDeadTree(ctx) {
    ctx.save();

    // Thân cây gỗ đen xám sần sùi với rễ bám sâu vào cát
    ctx.fillStyle = '#221a14';
    ctx.strokeStyle = '#150f0c';
    ctx.lineWidth = 2.5;

    // Gốc cây xòe rễ uốn lượn
    ctx.beginPath();
    ctx.moveTo(-44, 146);
    ctx.quadraticCurveTo(-70, 148, -100, 150);
    ctx.lineTo(-84, 146);
    ctx.quadraticCurveTo(-42, 122, -34, 45);
    ctx.quadraticCurveTo(-46, -30, -52, -90);
    ctx.lineTo(-22, -112);
    ctx.quadraticCurveTo(0, -60, 22, -112);
    ctx.lineTo(52, -90);
    ctx.quadraticCurveTo(46, -30, 34, 45);
    ctx.quadraticCurveTo(42, 122, 84, 146);
    ctx.lineTo(100, 150);
    ctx.quadraticCurveTo(70, 148, 44, 146);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hàm vẽ cành cây uốn lượn tự nhiên
    const drawBranch = (points, width) => {
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    };

    ctx.strokeStyle = '#221a14';
    // Nhánh cây lớn vươn sang TRÁI
    drawBranch([[-35, 10], [-80, -15], [-140, -35], [-210, -60], [-270, -85]], 14);
    drawBranch([[-140, -35], [-170, -75], [-230, -115], [-280, -130]], 8);
    drawBranch([[-210, -60], [-240, -40], [-290, -45]], 5);
    drawBranch([[-170, -75], [-195, -120], [-240, -150]], 4);

    // Nhánh cây lớn vươn sang PHẢI
    drawBranch([[35, 10], [80, -12], [145, -30], [215, -55], [275, -80]], 14);
    drawBranch([[145, -30], [175, -70], [235, -105], [285, -125]], 8);
    drawBranch([[215, -55], [245, -35], [295, -40]], 5);
    drawBranch([[175, -70], [200, -115], [245, -145]], 4);

    // Các nhánh nhọn vươn cao lên BẦU TRỜI
    drawBranch([[-25, -90], [-45, -140], [-65, -190], [-80, -225]], 8);
    drawBranch([[-45, -140], [-15, -185], [-20, -230]], 5);
    drawBranch([[25, -90], [45, -140], [65, -190], [85, -225]], 8);
    drawBranch([[45, -140], [15, -185], [20, -230]], 5);
    drawBranch([[0, -85], [-5, -150], [5, -210], [0, -245]], 6);

    ctx.restore();
  }

  // Vẽ 2 Thằng Lính Mặc Áo Đỏ đứng 2 bên trên nền cát (cách búp bê 170px)
  drawGuardsBesideDoll(ctx) {
    // 1. Lính Bắn Tỉa bên trái (Tam Giác △)
    this.drawSniperGuard(ctx, -170, 94);

    // 2. Lính Quản Lý bên phải (Vuông □)
    this.drawCommanderGuard(ctx, 170, 94);
  }

  drawSniperGuard(ctx, gx, gy) {
    ctx.save();
    ctx.translate(gx, gy);

    // Bóng đổ dưới chân lính
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 52, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tính toán góc nhắm bắn vào mục tiêu bị bắt
    let aimAngle = Math.PI / 2.3; // Mặc định chúc súng xuống đất
    if ((this.state === 'LOCKED' || this.isAiming) && this.laserTarget) {
      const worldGx = this.x + gx;
      const worldGy = this.y + gy + 10;
      const dx = this.laserTarget.x - worldGx;
      const dy = this.laserTarget.y - worldGy;
      aimAngle = Math.atan2(dy, dx);
    }

    // Đôi ủng đen tiếp đất vững chãi
    ctx.fillStyle = '#111827';
    ctx.fillRect(-11, 44, 9, 8);
    ctx.fillRect(2, 44, 9, 8);

    // Hai chân quần áo liền quần đỏ hồng (Pink Jumpsuit)
    ctx.fillStyle = '#ff1a60';
    ctx.fillRect(-11, 24, 9, 21);
    ctx.fillRect(2, 24, 9, 21);

    // Thân áo đỏ liền quần
    ctx.beginPath();
    ctx.roundRect(-15, -4, 30, 30, 4);
    ctx.fill();

    // Khóa kéo đen giữa áo
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 24);
    ctx.stroke();

    // Đai đen ngang hông
    ctx.fillStyle = '#111827';
    ctx.fillRect(-15, 14, 30, 5);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(-3, 14, 6, 5);

    // Dây đai đeo chéo ngực
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -2);
    ctx.lineTo(13, 18);
    ctx.stroke();

    // Mũ trùm đầu đỏ hồng
    ctx.fillStyle = '#ff1a60';
    ctx.beginPath();
    ctx.arc(0, -18, 14, 0, Math.PI * 2);
    ctx.fill();

    // Mặt nạ lưới màu đen tuyền
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(0, -18, 10.5, 0, Math.PI * 2);
    ctx.fill();

    // Biểu tượng Tam Giác Trắng (△) biểu thị LÍNH TÁC CHIẾN MANG VŨ KHÍ
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-5.5, -13);
    ctx.lineTo(5.5, -13);
    ctx.closePath();
    ctx.stroke();

    // SÚNG TRƯỜNG BẮN TỈA & TAY CẦM SÚNG
    ctx.save();
    ctx.translate(4, 10);
    const kickback = this.recoil * -6;
    ctx.translate(Math.cos(aimAngle) * kickback, Math.sin(aimAngle) * kickback);
    ctx.rotate(aimAngle);

    // Thân súng bắn tỉa (Sniper Rifle)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, -3.5, 38, 7);
    ctx.fillStyle = '#111827';
    ctx.fillRect(38, -2, 14, 4);
    ctx.fillRect(52, -3, 3, 6);

    // Ống ngắm bắn tỉa trên lưng súng (Scope)
    ctx.fillStyle = '#374151';
    ctx.fillRect(10, -7.5, 16, 4);
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(25, -6.5, 2, 2);

    // Báng súng & Hộp tiếp đạn
    ctx.fillStyle = '#111827';
    ctx.fillRect(-10, -2, 12, 6);
    ctx.fillRect(12, 3.5, 5, 8);

    // Tay áo hồng & găng tay đen cầm súng
    ctx.fillStyle = '#ff1a60';
    ctx.beginPath();
    ctx.arc(-2, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(14, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.arc(16, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // HIỆU ỨNG LỬA ĐẦU NÒNG KHI BẮN (Muzzle Flash)
    if (this.muzzleFlash > 0.05) {
      const flashSize = 22 * this.muzzleFlash;
      ctx.save();
      ctx.translate(55, 0);

      ctx.fillStyle = 'rgba(255, 69, 0, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, flashSize * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = (i % 2 === 0) ? flashSize * 1.3 : flashSize * 0.45;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, flashSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // Kết thúc súng
    ctx.restore(); // Kết thúc lính bắn tỉa
  }

  drawCommanderGuard(ctx, gx, gy) {
    ctx.save();
    ctx.translate(gx, gy);

    // Bóng đổ dưới chân
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 52, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi ủng đen
    ctx.fillStyle = '#111827';
    ctx.fillRect(-11, 44, 9, 8);
    ctx.fillRect(2, 44, 9, 8);

    // Chân áo liền quần đỏ hồng
    ctx.fillStyle = '#ff1a60';
    ctx.fillRect(-11, 24, 9, 21);
    ctx.fillRect(2, 24, 9, 21);

    // Thân áo đỏ liền quần
    ctx.beginPath();
    ctx.roundRect(-15, -4, 30, 30, 4);
    ctx.fill();

    // Khóa kéo đen giữa áo
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 24);
    ctx.stroke();

    // Đai đen quanh bụng
    ctx.fillStyle = '#111827';
    ctx.fillRect(-15, 14, 30, 5);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(-3, 14, 6, 5);

    // Hai cánh tay chắp sau lưng nghiêm trang (Chỉ huy)
    ctx.fillStyle = '#d40045';
    ctx.beginPath();
    ctx.roundRect(-18, -2, 6, 26, 3);
    ctx.roundRect(12, -2, 6, 26, 3);
    ctx.fill();

    // Mũ trùm đầu đỏ hồng
    ctx.fillStyle = '#ff1a60';
    ctx.beginPath();
    ctx.arc(0, -18, 14, 0, Math.PI * 2);
    ctx.fill();

    // Mặt nạ lưới màu đen
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(0, -18, 10.5, 0, Math.PI * 2);
    ctx.fill();

    // Biểu tượng Ô Vuông Trắng (□)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-5, -23, 10, 10);

    ctx.restore();
  }

  // Vẽ Toàn Bộ Thân Búp Bê: Váy cam xếp ly, khớp nối cơ học, đôi chân tất trắng và giày đen
  drawFullDoll(ctx) {
    ctx.save();

    // 1. ĐÔI CHÂN TẤT TRẮNG VÀ GIÀY ĐEN TIẾP ĐẤT TRÊN CÁT (Chuẩn như ảnh phim)
    const legLeftX = -12;
    const legRightX = 12;

    // Bóng đổ dưới 2 bàn chân trên cát
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 148, 38, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi chân mang tất trắng cao đến đầu gối (White Knee-High Socks)
    [legLeftX, legRightX].forEach(lx => {
      // Đùi (phần da lộ trên tất)
      ctx.fillStyle = '#ffd1b3';
      ctx.fillRect(lx - 6, 78, 12, 12);

      // Khớp đầu gối búp bê sứ
      ctx.fillStyle = '#f5be9e';
      ctx.beginPath();
      ctx.arc(lx, 89, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d49b78';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tất trắng cao cổ (White Socks)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(lx - 7.5, 94, 15, 44, [2, 2, 0, 0]);
      ctx.fill();

      // Viền gấp cổ tất
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(lx - 8, 94, 16, 4);

      // Đôi giày búp bê Mary Jane màu đen bóng
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(lx - 9, 138, 18, 9, [4, 4, 3, 3]);
      ctx.fill();

      // Quai giày đen vắt ngang
      ctx.fillStyle = '#334155';
      ctx.fillRect(lx - 8, 139, 16, 2.5);

      // Đế giày màu trắng xám
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(lx - 9, 146, 18, 2.5);
    });

    // 2. TAY ÁO VÀNG VÀ CÁNH TAY BÚP BÊ VỚI KHỚP NỐI (Ball Joints)
    // Cánh tay trái
    ctx.save();
    ctx.translate(-26, 40);
    ctx.fillStyle = '#ffd1b3';
    // Bắp tay
    ctx.fillRect(-5, 0, 10, 18);
    // Khớp khuỷu tay búp bê
    ctx.fillStyle = '#f5be9e';
    ctx.beginPath();
    ctx.arc(0, 19, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d49b78';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cẳng tay & bàn tay xòe nhẹ tự nhiên
    ctx.fillStyle = '#ffd1b3';
    ctx.fillRect(-4.5, 20, 9, 16);
    ctx.beginPath();
    ctx.ellipse(-2, 38, 5, 8, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    // Tay áo cộc màu vàng
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 14, 4);
    ctx.fill();
    ctx.restore();

    // Cánh tay phải
    ctx.save();
    ctx.translate(26, 40);
    ctx.fillStyle = '#ffd1b3';
    ctx.fillRect(-5, 0, 10, 18);
    ctx.fillStyle = '#f5be9e';
    ctx.beginPath();
    ctx.arc(0, 19, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d49b78';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffd1b3';
    ctx.fillRect(-4.5, 20, 9, 16);
    ctx.beginPath();
    ctx.ellipse(2, 38, 5, 8, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 14, 4);
    ctx.fill();
    ctx.restore();

    // 3. THÂN ÁO VÀNG VÀ VÁY YẾM CAM XẾP LY (Orange Pleated Pinafore Dress)
    // Áo vàng bên trong
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-24, 22, 48, 22, 4);
    ctx.fill();

    // Cổ áo trắng Peter Pan đặc trưng của Young-hee
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, 25, 7, 0, Math.PI);
    ctx.arc(8, 25, 7, 0, Math.PI);
    ctx.fill();

    // Thân trên váy yếm cam
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-18, 30);
    ctx.lineTo(-20, 48);
    ctx.lineTo(20, 48);
    ctx.lineTo(18, 30);
    ctx.closePath();
    ctx.fill();

    // Dây yếm cam vắt qua vai
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-17, 26, 6, 14);
    ctx.fillRect(11, 26, 6, 14);

    // Chân váy cam xòe xếp ly (Pleated Skirt)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-20, 48);
    ctx.lineTo(-38, 86);
    ctx.lineTo(38, 86);
    ctx.lineTo(20, 48);
    ctx.closePath();
    ctx.fill();

    // Các nếp gấp xếp ly của váy tạo chiều sâu 3D
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 2;
    const pleats = [-30, -22, -14, -7, 0, 7, 14, 22, 30];
    pleats.forEach(px => {
      ctx.beginPath();
      ctx.moveTo(px * 0.52, 50);
      ctx.lineTo(px, 86);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawHead(ctx) {
    ctx.save();
    const turnFactor = Math.cos(this.angle);
    const isFacingFront = turnFactor < 0;
    const headRadius = 32;

    // 2 Bím tóc 2 bên
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(-36, 14, 10, 18, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(36, 14, 10, 18, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Dây buộc tóc tím hồng
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-38, 2, 8, 6);
    ctx.fillRect(30, 2, 8, 6);

    // Khuôn mặt búp bê sứ
    ctx.fillStyle = '#ffd1b3';
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Tóc sau gáy hoặc mặt trước
    ctx.fillStyle = '#111';
    if (!isFacingFront) {
      // Quay lưng: Tóc đen phủ kín sau gáy
      ctx.beginPath();
      ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Nơ cài tóc đỏ sau đầu
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, -10, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Quay mặt: Tóc mái ngang đặc trưng
      ctx.beginPath();
      ctx.arc(0, -6, headRadius, Math.PI, 0);
      ctx.lineTo(headRadius, -4);
      ctx.lineTo(-headRadius, -4);
      ctx.fill();

      // Đôi má hồng tròn xoe
      ctx.fillStyle = 'rgba(235, 77, 75, 0.45)';
      ctx.beginPath();
      ctx.arc(-18, 10, 6, 0, Math.PI * 2);
      ctx.arc(18, 10, 6, 0, Math.PI * 2);
      ctx.fill();

      // Miệng búp bê nhỏ xíu chúm chím
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(0, 16, 4, 0, Math.PI);
      ctx.fill();

      // Mắt búp bê (Phát sáng Laser đỏ khi quét)
      const eyeOffsetX = 14;
      const eyeOffsetY = 2;

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-eyeOffsetX, eyeOffsetY, 5, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX, eyeOffsetY, 5, 0, Math.PI * 2);
      ctx.fill();

      if (this.eyeGlow > 0) {
        ctx.fillStyle = `rgba(255, 0, 50, ${this.eyeGlow})`;
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, 3.5, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX, eyeOffsetY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 18 * this.eyeGlow;
        ctx.strokeStyle = `rgba(255, 50, 80, ${this.eyeGlow})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  drawBulletTracer(ctx) {
    if (!this.bulletTracer || this.bulletTracer.life <= 0) return;
    ctx.save();
    const t = this.bulletTracer;
    const alpha = Math.min(1, t.life);

    ctx.strokeStyle = `rgba(255, 60, 0, ${alpha * 0.7})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(t.fromX, t.fromY);
    ctx.lineTo(t.toX, t.toY);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 220, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(t.fromX, t.fromY);
    ctx.lineTo(t.toX, t.toY);
    ctx.stroke();

    ctx.restore();
  }

  drawLaser(ctx, canvasWidth, canvasHeight) {
    ctx.save();

    const eyeLeft = { x: this.x - 14, y: this.y + 2 };
    const eyeRight = { x: this.x + 14, y: this.y + 2 };

    if (this.state === 'LOCKED' && this.laserTarget) {
      const target = this.laserTarget;

      [eyeLeft, eyeRight].forEach(eye => {
        ctx.strokeStyle = 'rgba(255, 0, 55, 0.9)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      });

      // Crosshair hồng ngoại
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(target.x - 35, target.y);
      ctx.lineTo(target.x + 35, target.y);
      ctx.moveTo(target.x, target.y - 35);
      ctx.lineTo(target.x, target.y + 35);
      ctx.stroke();

      ctx.fillStyle = '#ff0033';
      ctx.font = 'bold 13px Orbitron, sans-serif, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET LOCKED', target.x, target.y + 44);

    } else if (this.state === 'SCANNING') {
      const sweepX = this.x + Math.sin(this.scanSweepAngle) * (canvasWidth * 0.42);
      const sweepY = canvasHeight * 0.75;

      const grad = ctx.createRadialGradient(this.x, this.y, 10, sweepX, sweepY, canvasWidth * 0.6);
      grad.addColorStop(0, 'rgba(255, 0, 50, 0.45)');
      grad.addColorStop(0.5, 'rgba(255, 0, 50, 0.15)');
      grad.addColorStop(1, 'rgba(255, 0, 50, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 10);
      ctx.lineTo(sweepX - 160, canvasHeight);
      ctx.lineTo(sweepX + 160, canvasHeight);
      ctx.closePath();
      ctx.fill();

      [eyeLeft, eyeRight].forEach(eye => {
        ctx.strokeStyle = 'rgba(255, 20, 60, 0.7)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(sweepX, sweepY);
        ctx.stroke();
      });
    }

    ctx.restore();
  }
}
