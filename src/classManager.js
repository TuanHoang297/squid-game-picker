// Quản lý danh sách lớp học và học sinh khảo bài
import * as XLSX from 'xlsx';
import { EXCEL_CLASSES } from './excelClassesData.js';

const STORAGE_KEY = 'squid_game_classes_v2';
const OLD_STORAGE_KEY = 'squid_game_classes_v1';
const CURRENT_CLASS_KEY = 'squid_game_current_class_id';
const EXCLUDE_EXAMINED_KEY = 'squid_game_exclude_examined';

export class ClassManager {
  constructor() {
    this.classes = this.loadClasses();
    this.currentClassId = localStorage.getItem(CURRENT_CLASS_KEY) || (this.classes[0] ? this.classes[0].id : '');
    this.excludeExamined = localStorage.getItem(EXCLUDE_EXAMINED_KEY) !== 'false'; // default true
    this.listeners = [];
  }

  loadClasses() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc localStorage:', e);
    }

    // Tự động sử dụng 22 lớp học được trích xuất từ file Excel làm dữ liệu mặc định
    const defaultList = EXCEL_CLASSES && EXCEL_CLASSES.length > 0 ? EXCEL_CLASSES : [];
    this.saveClasses(defaultList);
    return JSON.parse(JSON.stringify(defaultList));
  }

  saveClasses(classes = this.classes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch (e) {
      console.error('Lỗi lưu localStorage:', e);
    }
  }

  getCurrentClass() {
    let cls = this.classes.find(c => c.id === this.currentClassId);
    if (!cls && this.classes.length > 0) {
      cls = this.classes[0];
      this.currentClassId = cls.id;
      localStorage.setItem(CURRENT_CLASS_KEY, cls.id);
    }
    return cls;
  }

  setCurrentClass(classId) {
    if (this.classes.some(c => c.id === classId)) {
      this.currentClassId = classId;
      localStorage.setItem(CURRENT_CLASS_KEY, classId);
      this.notifyListeners();
    }
  }

  getExcludeExamined() {
    return this.excludeExamined;
  }

  setExcludeExamined(value) {
    this.excludeExamined = !!value;
    localStorage.setItem(EXCLUDE_EXAMINED_KEY, this.excludeExamined);
    this.notifyListeners();
  }

  // Lấy danh sách học sinh hợp lệ để random
  getEligibleStudents() {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return [];
    if (!this.excludeExamined) {
      return currentClass.students;
    }
    return currentClass.students.filter(s => !s.isExamined);
  }

  // Đánh dấu học sinh đã khảo bài + chấm điểm
  markExamined(studentId, score = null) {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return;
    const student = currentClass.students.find(s => s.id === studentId);
    if (student) {
      student.isExamined = true;
      student.score = score;
      student.examDate = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      this.saveClasses();
      this.notifyListeners();
    }
  }

  // Đặt lại lượt khảo (đưa tất cả về vạch xuất phát)
  resetRound() {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return;
    currentClass.students.forEach(s => {
      s.isExamined = false;
    });
    this.saveClasses();
    this.notifyListeners();
  }

  // Thêm lớp mới thủ công
  addClass(name, rawStudentNames) {
    const id = 'class_' + Date.now();
    const students = this.parseStudentNames(rawStudentNames);
    const newClass = {
      id,
      name: name.trim().toLowerCase().startsWith('lớp') ? name.trim() : `Lớp ${name.trim()}`,
      students
    };
    this.classes.push(newClass);
    this.currentClassId = id;
    this.saveClasses();
    localStorage.setItem(CURRENT_CLASS_KEY, id);
    this.notifyListeners();
    return newClass;
  }

  // Cập nhật danh sách học sinh cho lớp hiện tại
  updateCurrentClass(name, rawStudentNames) {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return;
    currentClass.name = name.trim() || currentClass.name;
    if (rawStudentNames !== undefined) {
      currentClass.students = this.parseStudentNames(rawStudentNames);
    }
    this.saveClasses();
    this.notifyListeners();
  }

  // Xóa lớp
  deleteClass(classId) {
    if (this.classes.length <= 1) {
      alert('Phải giữ lại ít nhất 1 lớp học!');
      return false;
    }
    this.classes = this.classes.filter(c => c.id !== classId);
    if (this.currentClassId === classId) {
      this.currentClassId = this.classes[0].id;
      localStorage.setItem(CURRENT_CLASS_KEY, this.currentClassId);
    }
    this.saveClasses();
    this.notifyListeners();
    return true;
  }

  // Tự động phân tích & thêm tất cả các lớp từ file Excel (.xlsx / .xls)
  importFromExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const importedClasses = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!data || data.length === 0) continue;

      let headerRowIdx = -1;
      let nameColIdx = -1;
      let sttColIdx = -1;

      // 1. Quét tìm dòng tiêu đề chứa cột Họ Tên
      for (let r = 0; r < Math.min(10, data.length); r++) {
        const row = data[r] || [];
        for (let c = 0; c < row.length; c++) {
          const cell = String(row[c] || '').trim().toLowerCase();
          if (
            cell === 'họ và tên' ||
            cell === 'họ tên' ||
            cell === 'họ và tên học sinh' ||
            cell === 'tên học sinh' ||
            cell === 'họ và chữ lót'
          ) {
            headerRowIdx = r;
            nameColIdx = c;
          }
          if (cell === 'stt' || cell === 'số tt' || cell === 'stt.') {
            sttColIdx = c;
          }
        }
        if (headerRowIdx !== -1) break;
      }

      // 2. Nếu không có dòng tiêu đề chuẩn, tìm cột chứa chuỗi họ tên người
      if (headerRowIdx === -1) {
        for (let c = 0; c < 10; c++) {
          let textCount = 0;
          for (let r = 0; r < Math.min(15, data.length); r++) {
            const val = String(data[r]?.[c] || '').trim();
            if (val.length >= 4 && val.includes(' ') && !/\d/.test(val)) textCount++;
          }
          if (textCount >= 3) {
            nameColIdx = c;
            headerRowIdx = 0;
            break;
          }
        }
      }

      const students = [];
      if (nameColIdx !== -1) {
        for (let r = headerRowIdx + 1; r < data.length; r++) {
          const row = data[r];
          if (!row) continue;
          let studentName = String(row[nameColIdx] || '').trim();

          // Kiểm tra nếu có cột Tên riêng ở bên cạnh (e.g. Cột B: Họ và chữ lót, Cột C: Tên)
          if (row[nameColIdx + 1] && typeof row[nameColIdx + 1] === 'string') {
            const nextCell = row[nameColIdx + 1].trim();
            if (nextCell && !nextCell.includes(' ') && nextCell.length < 15 && isNaN(nextCell)) {
              studentName = `${studentName} ${nextCell}`.trim();
            }
          }

          // Loại bỏ dòng tiêu đề tổng kết hoặc dòng trống
          if (
            studentName &&
            studentName.length >= 2 &&
            !studentName.toLowerCase().startsWith('tổng') &&
            !studentName.toLowerCase().startsWith('ghi chú') &&
            !studentName.toLowerCase().startsWith('danh sách') &&
            !studentName.toLowerCase().startsWith('stt')
          ) {
            const studentIndex = students.length + 1;
            students.push({
              id: `std_${sheetName}_${Date.now()}_${studentIndex}`,
              name: studentName,
              number: String(studentIndex).padStart(3, '0'),
              isExamined: false,
              score: null,
              examDate: null
            });
          }
        }
      }

      if (students.length > 0) {
        const cleanClassName = sheetName.trim().toLowerCase().startsWith('lớp') ? sheetName.trim() : `Lớp ${sheetName.trim()}`;
        importedClasses.push({
          id: `class_${sheetName}_${Date.now()}`,
          name: cleanClassName,
          students
        });
      }
    }

    if (importedClasses.length > 0) {
      // Ghép vào danh sách lớp hiện có
      importedClasses.forEach(newCls => {
        const existingIdx = this.classes.findIndex(c => c.name.toLowerCase() === newCls.name.toLowerCase());
        if (existingIdx !== -1) {
          this.classes[existingIdx] = newCls;
        } else {
          this.classes.push(newCls);
        }
      });

      this.currentClassId = importedClasses[0].id;
      this.saveClasses();
      localStorage.setItem(CURRENT_CLASS_KEY, this.currentClassId);
      this.notifyListeners();
      return importedClasses;
    }

    return [];
  }

  // Phân tích danh sách tên (hỗ trợ xuống dòng, dấu phẩy, tab từ Excel)
  parseStudentNames(rawText) {
    if (!rawText) return [];
    const lines = rawText.split(/[\r\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
    return lines.map((line, idx) => {
      const cleanName = line.replace(/^\d+[\s.\-–:]+/, '').trim() || line;
      return {
        id: `std_${Date.now()}_${idx}`,
        name: cleanName,
        number: String(idx + 1).padStart(3, '0'),
        isExamined: false,
        score: null,
        examDate: null
      };
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn(this));
  }
}

export const classManager = new ClassManager();
