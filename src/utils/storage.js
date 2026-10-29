/**
 * 工友记工 - 本地数据管理与核算引擎
 * 针对单双拼计件车间深度优化：
 * 1. 默认品名：单拼 (0.0075元/件)、双拼 (0.015元/件)，支持在设置中自定义单价；
 * 2. 调机费：固定 5 元/次 (可设置调机次数)；
 * 3. 零工计时框：工时(小时) × 时薪(默认15元/小时)；
 * 4. 工龄补贴双模式 (按月发 vs 半年一次不固定月份)；
 * 5. 真实中国日历法定节假日与公休/年休考勤。
 */

const STORAGE_KEYS = {
  DAYS: 'worker_app_days_v1',
  MONTHS: 'worker_app_months_v1',
  SETTINGS: 'worker_app_settings_v1',
  HISTORY_ITEMS: 'worker_app_history_items_v1'
};

export const ATTENDANCE_CONFIG = {
  work: { label: '出勤', color: 'var(--accent-gold-light)', badgeClass: 'badge-gold' },
  public_rest: { label: '公休', color: '#38bdf8', badgeClass: 'badge-blue' },
  annual_leave: { label: '年休', color: '#34d399', badgeClass: 'badge-green' },
  compensatory: { label: '调休', color: '#a78bfa', badgeClass: 'badge-blue' },
  personal_leave: { label: '事假', color: '#f87171', badgeClass: 'badge-red' },
  sick_leave: { label: '病假', color: '#fb923c', badgeClass: 'badge-red' },
  idle: { label: '待料', color: '#94a3b8', badgeClass: 'badge-blue' }
};

export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonth(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMoney(val) {
  const num = Number(val) || 0;
  return num.toFixed(2);
}

// 读取全局设置（单双拼默认价格、调机费、零工时薪、餐费补贴、工龄双模式、月结算日）
export function getAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const defaults = {
      // 核心单价设置 (用户要求：单拼 0.0075，双拼 0.015，调机费 5，零工 15，餐补 6)
      singlePiecePrice: 0.0075,       // 单拼单价 (元/件)
      doublePiecePrice: 0.015,        // 双拼单价 (元/件)
      defaultSetupFee: 5.0,           // 调机费 (元/次)
      defaultHourlyRate: 15.0,        // 零工时薪 (元/小时)
      mealSubsidyDaily: 6.0,          // 每日固定餐费补贴 (元/出勤天，全天出勤自动计入)
      
      // 月度工资结算周期起始日 (默认16号，即当月16号至次月15号为一个结算月；设为1则为自然月)
      salaryCycleStartDay: 16,

      // 工龄规则
      seniorityMode: 'monthly',       // 'monthly' 或 'half_year'
      defaultSeniorityPay: 200,       // 按月发金额 (元/月)
      halfYearSeniorityAmount: 1200,  // 半年一次参考金额 (元/次)

      workerName: '',
      workshop: ''
    };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (e) {
    return {
      singlePiecePrice: 0.0075,
      doublePiecePrice: 0.015,
      defaultSetupFee: 5.0,
      defaultHourlyRate: 15.0,
      mealSubsidyDaily: 6.0,
      salaryCycleStartDay: 16,
      seniorityMode: 'monthly',
      defaultSeniorityPay: 200,
      halfYearSeniorityAmount: 1200,
      workerName: '',
      workshop: ''
    };
  }
}

/**
 * 计算账单周期的日期起止范围 (例如 2026-10，若 16 号结算，则范围为 2026-10-16 至 2026-11-15)
 */
export function getMonthDateRange(yearMonth, cycleStartDay = 16) {
  const [y, m] = (yearMonth || '').split('-').map(Number);
  const startDay = Math.max(1, Math.min(28, Number(cycleStartDay) || 16));

  if (startDay === 1) {
    // 自然月模式 (1日 ~ 当月最后一天)
    const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return {
      startDateStr,
      endDateStr,
      label: `${String(m).padStart(2, '0')}/01 ~ ${String(m).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`,
      startDay: 1,
      isNaturalMonth: true
    };
  }

  // 跨月结算模式 (例如当月 16 日 至 次月 15 日)
  const startDateStr = `${y}-${String(m).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  const endDay = startDay - 1;
  const endDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  const label = `${String(m).padStart(2, '0')}/${String(startDay).padStart(2, '0')} ~ ${String(nextMonth).padStart(2, '0')}/${String(endDay).padStart(2, '0')}`;

  return {
    startDateStr,
    endDateStr,
    label,
    startDay,
    isNaturalMonth: false
  };
}

/**
 * 根据具体的某一天获取其归属的薪资核算月份
 * 例如 2026-10-29，16日结算，29 >= 16，归属 2026-10 账单月(10/16~11/15)
 * 若为 2026-10-10，10 < 16，则归属 2026-09 账单月(09/16~10/15)
 */
export function getBillMonthForDate(dateStr, cycleStartDay = 16) {
  if (!dateStr) return formatMonth(new Date());
  const [y, m, d] = dateStr.split('-').map(Number);
  const startDay = Math.max(1, Math.min(28, Number(cycleStartDay) || 16));

  if (startDay === 1) {
    return `${y}-${String(m).padStart(2, '0')}`;
  }

  if (d >= startDay) {
    return `${y}-${String(m).padStart(2, '0')}`;
  } else {
    const prevYear = m === 1 ? y - 1 : y;
    const prevMonth = m === 1 ? 12 : m - 1;
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }
}

export function saveAppSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {}
}

export function getAllDays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAYS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveAllDays(daysMap) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(daysMap));
  } catch (e) {}
}

export function getDayRecord(dateStr) {
  const all = getAllDays();
  const settings = getAppSettings();

  if (all[dateStr]) {
    const rec = all[dateStr];
    return {
      date: dateStr,
      attendanceType: rec.attendanceType || 'work',
      items: rec.items || [],
      // 零工框记录
      hourlyWork: rec.hourlyWork || {
        hours: 0,
        rate: settings.defaultHourlyRate || 15.0,
        total: 0,
        note: ''
      },
      dailyBonus: rec.dailyBonus || 0,
      bonusNote: rec.bonusNote || '',
      notes: rec.notes || ''
    };
  }
  return {
    date: dateStr,
    attendanceType: 'work',
    items: [],
    hourlyWork: {
      hours: 0,
      rate: settings.defaultHourlyRate || 15.0,
      total: 0,
      note: ''
    },
    dailyBonus: 0,
    bonusNote: '',
    notes: ''
  };
}

export function saveDayRecord(dateStr, record) {
  const all = getAllDays();
  const settings = getAppSettings();

  const items = (record.items || []).map(item => {
    const count = Math.max(0, Number(item.count) || 0);
    const price = Math.max(0, Number(item.price) || 0);
    const setupCount = Math.max(0, Number(item.setupCount !== undefined ? item.setupCount : 1));
    const setupFeeUnit = Number(item.setupFeeUnit !== undefined ? item.setupFeeUnit : (settings.defaultSetupFee || 5.0));
    const setupFee = Number((setupCount * setupFeeUnit).toFixed(2));
    
    // 总金额 = 计件金额 + 调机费
    const pieceMoney = Number((count * price).toFixed(4));
    const total = Number((pieceMoney + setupFee).toFixed(2));

    return {
      id: item.id || 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: item.type || (item.name === '双拼' ? 'double' : 'single'), // 'single' | 'double' | 'direct'
      name: (item.name || '').trim() || '单拼',
      modelName: (item.modelName || '').trim(), // 款号 (如第1款、A款)
      count,
      price,
      setupCount,      // 调机次数
      setupFeeUnit,    // 调机单价 (5元/次)
      setupFee,        // 调机费合计
      pieceMoney,      // 纯计件金额
      total,           // 本款合计 (计件 + 调机费)
      isDirect: !!item.isDirect,
      remark: item.remark || ''
    };
  });

  // 零工计算
  const hw = record.hourlyWork || {};
  const hHours = Math.max(0, Number(hw.hours) || 0);
  const hRate = Math.max(0, Number(hw.rate !== undefined ? hw.rate : (settings.defaultHourlyRate || 15.0)));
  const hTotal = Number((hHours * hRate).toFixed(2));
  const hourlyWork = {
    hours: hHours,
    rate: hRate,
    total: hTotal,
    note: (hw.note || '').trim()
  };

  const dailyBonus = Number(record.dailyBonus) || 0;
  const notes = (record.notes || '').trim();
  const bonusNote = (record.bonusNote || '').trim();
  const attendanceType = record.attendanceType || 'work';

  const hasContent = items.length > 0 || hTotal > 0 || dailyBonus > 0 || notes || bonusNote;

  if (attendanceType === 'work' && !hasContent) {
    delete all[dateStr];
  } else {
    all[dateStr] = {
      date: dateStr,
      attendanceType,
      items,
      hourlyWork,
      dailyBonus,
      bonusNote,
      notes
    };
  }

  saveAllDays(all);
  return all[dateStr];
}

export function getAllMonthConfigs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveAllMonthConfigs(configs) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(configs));
  } catch (e) {}
}

export function getMonthConfig(yearMonth) {
  const all = getAllMonthConfigs();
  const settings = getAppSettings();

  if (all[yearMonth]) {
    return all[yearMonth];
  }

  const isMonthly = settings.seniorityMode === 'monthly';
  return {
    yearMonth,
    seniorityMode: settings.seniorityMode || 'monthly',
    seniorityPay: isMonthly ? (Number(settings.defaultSeniorityPay) || 200) : 0,
    isHalfYearPaid: false,
    highTempPay: 0,
    attendanceBonus: 0,
    baseSalary: 0,
    allowances: [],
    deductions: []
  };
}

export function saveMonthConfig(yearMonth, config) {
  const all = getAllMonthConfigs();
  all[yearMonth] = {
    yearMonth,
    seniorityMode: config.seniorityMode || 'monthly',
    seniorityPay: Math.max(0, Number(config.seniorityPay) || 0),
    isHalfYearPaid: !!config.isHalfYearPaid,
    highTempPay: Math.max(0, Number(config.highTempPay) || 0),
    attendanceBonus: Math.max(0, Number(config.attendanceBonus) || 0),
    baseSalary: Math.max(0, Number(config.baseSalary) || 0),
    allowances: (config.allowances || []).map(a => ({
      id: a.id || 'al_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (a.name || '').trim() || '补贴',
      amount: Math.max(0, Number(a.amount) || 0)
    })),
    deductions: (config.deductions || []).map(d => ({
      id: d.id || 'de_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (d.name || '').trim() || '扣款',
      amount: Math.max(0, Number(d.amount) || 0)
    }))
  };
  saveAllMonthConfigs(all);
  return all[yearMonth];
}

// 【月度核算总引擎】
export function calculateMonthSummary(yearMonth) {
  const allDays = getAllDays();
  const settings = getAppSettings();
  const config = getMonthConfig(yearMonth);
  const cycleStartDay = settings.salaryCycleStartDay !== undefined ? settings.salaryCycleStartDay : 16;
  const cycleRange = getMonthDateRange(yearMonth, cycleStartDay);

  let pieceTotal = 0;       // 计件纯金额 (不含调机费)
  let setupFeeTotal = 0;    // 调机费总金额
  let setupCountTotal = 0;  // 调机总次数
  let hourlyWorkTotal = 0;  // 零工总金额
  let hourlyHoursTotal = 0; // 零工总工时

  let singlePieceCount = 0; // 单拼完成总件数
  let singlePieceMoney = 0; // 单拼纯金额
  let doublePieceCount = 0; // 双拼完成总件数
  let doublePieceMoney = 0; // 双拼纯金额

  let totalPieces = 0;      // 生产总件数 (单拼+双拼)
  let dailyBonusTotal = 0;  // 当月各日零星补贴总额
  const mealSubsidyDaily = Number(settings.mealSubsidyDaily !== undefined ? settings.mealSubsidyDaily : 6.0);
  let mealSubsidyTotal = 0; // 当月出勤餐费补贴总额 (每天出勤自动+6元)

  let workDays = 0;
  let publicRestDays = 0;
  let annualLeaveDays = 0;
  let otherLeaveDays = 0;

  const dayRecords = [];

  Object.keys(allDays).forEach(dateStr => {
    // 按照配置的结算周期起止范围准确统计 (默认当月16日至次月15日)
    if (dateStr >= cycleRange.startDateStr && dateStr <= cycleRange.endDateStr) {
      const rec = allDays[dateStr];
      const attType = rec.attendanceType || 'work';

      let dayPieceMoney = 0;
      let daySetupFee = 0;
      let daySetupCount = 0;
      let dayPieceCount = 0;

      (rec.items || []).forEach(it => {
        const count = Number(it.count) || 0;
        const pMoney = Number(it.pieceMoney !== undefined ? it.pieceMoney : (count * (Number(it.price) || 0))) || 0;
        const sFee = Number(it.setupFee) || 0;
        const sCount = Number(it.setupCount) || 0;

        dayPieceMoney += pMoney;
        daySetupFee += sFee;
        daySetupCount += sCount;
        dayPieceCount += count;

        if (it.name === '双拼' || it.type === 'double') {
          doublePieceCount += count;
          doublePieceMoney += pMoney;
        } else {
          singlePieceCount += count;
          singlePieceMoney += pMoney;
        }
      });

      // 零工部分
      const hw = rec.hourlyWork || {};
      const dayHourlyTotal = Number(hw.total) || 0;
      const dayHourlyHours = Number(hw.hours) || 0;

      hourlyWorkTotal += dayHourlyTotal;
      hourlyHoursTotal += dayHourlyHours;

      // 餐费补贴与出勤天数：有实际做工流水(计件/调机/零工/补贴)才正式计入出勤与餐补；未输入默认休班，不计入！
      const hasWorkRecord = dayPieceMoney > 0 || daySetupFee > 0 || dayHourlyTotal > 0 || (Number(rec.dailyBonus) || 0) > 0 || (rec.items && rec.items.length > 0);
      let dayMealSubsidy = 0;
      if (attType === 'work') {
        if (hasWorkRecord) {
          workDays += 1;
          dayMealSubsidy = mealSubsidyDaily;
          mealSubsidyTotal += dayMealSubsidy;
        }
      } else if (attType === 'public_rest') {
        publicRestDays += 1;
      } else if (attType === 'annual_leave') {
        annualLeaveDays += 1;
      } else {
        otherLeaveDays += 1;
      }

      // 当日总金额 = 计件工钱 + 调机费 + 零工工钱 + 餐费补贴 + 当日附加补贴
      const dayTotalMoney = dayPieceMoney + daySetupFee + dayHourlyTotal + dayMealSubsidy + (Number(rec.dailyBonus) || 0);

      pieceTotal += dayPieceMoney;
      setupFeeTotal += daySetupFee;
      setupCountTotal += daySetupCount;
      totalPieces += dayPieceCount;
      dailyBonusTotal += Number(rec.dailyBonus) || 0;

      dayRecords.push({
        ...rec,
        dayPieceMoney,
        daySetupFee,
        daySetupCount,
        dayHourlyTotal,
        dayHourlyHours,
        dayPieceCount,
        dayMealSubsidy,
        dayTotalMoney
      });
    }
  });

  dayRecords.sort((a, b) => a.date.localeCompare(b.date));

  // 流水总收入 = 计件工钱 + 调机费 + 零工工钱
  const directWorkTotal = pieceTotal + setupFeeTotal + hourlyWorkTotal;
  const avgDailyIncome = workDays > 0 ? directWorkTotal / workDays : 0;

  // 月度补贴加项计算
  let customAllowancesTotal = 0;
  (config.allowances || []).forEach(a => {
    customAllowancesTotal += Number(a.amount) || 0;
  });

  const seniorityPay = Number(config.seniorityPay) || 0;
  const highTempPay = Number(config.highTempPay) || 0;
  const attendanceBonus = Number(config.attendanceBonus) || 0;
  const baseSalary = Number(config.baseSalary) || 0;

  // 补贴总额 = 零星补贴 + 出勤餐费补贴 + 工龄 + 高温 + 全勤 + 底薪 + 其他自定义补贴
  const totalSubsidies = dailyBonusTotal + mealSubsidyTotal + seniorityPay + highTempPay + attendanceBonus + baseSalary + customAllowancesTotal;

  // 月度扣款项计算
  let totalDeductions = 0;
  (config.deductions || []).forEach(d => {
    totalDeductions += Number(d.amount) || 0;
  });

  // 最终实发应得总收入
  const finalSalary = directWorkTotal + totalSubsidies - totalDeductions;

  return {
    yearMonth,
    workDays,
    publicRestDays,
    annualLeaveDays,
    otherLeaveDays,
    totalPieces,
    
    // 单双拼细分
    singlePieceCount,
    singlePieceMoney,
    doublePieceCount,
    doublePieceMoney,

    // 调机费
    setupCountTotal,
    setupFeeTotal,

    // 零工
    hourlyHoursTotal,
    hourlyWorkTotal,

    // 餐费补贴 (出勤自动算)
    mealSubsidyDaily,
    mealSubsidyTotal,

    pieceTotal,              // 纯计件总金额
    directWorkTotal,         // 生产直接报酬 (计件+调机+零工)
    avgDailyIncome,
    dailyBonusTotal,
    seniorityPay,
    highTempPay,
    attendanceBonus,
    baseSalary,
    customAllowancesTotal,
    totalSubsidies,
    totalDeductions,
    finalSalary,
    dayRecords,
    cycleRange,
    cycleLabel: cycleRange.label,
    salaryCycleStartDay: cycleStartDay,
    config
  };
}

export function exportAllDataJSON() {
  const data = {
    version: '1.2',
    exportTime: new Date().toISOString(),
    days: getAllDays(),
    months: getAllMonthConfigs(),
    settings: getAppSettings()
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataJSON(jsonStr) {
  try {
    const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    if (data.days && typeof data.days === 'object') {
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(data.days));
    }
    if (data.months && typeof data.months === 'object') {
      localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(data.months));
    }
    if (data.settings && typeof data.settings === 'object') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function seedDemoData() {
  const today = new Date();
  const ym = formatMonth(today);
  const curDay = today.getDate();
  const settings = getAppSettings();

  const daysMap = getAllDays();

  for (let i = 1; i <= Math.min(curDay, 28); i++) {
    const dStr = `${ym}-${String(i).padStart(2, '0')}`;
    const dateObj = new Date(ym + '-' + String(i).padStart(2, '0'));
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0) {
      daysMap[dStr] = {
        date: dStr,
        attendanceType: 'public_rest',
        items: [],
        hourlyWork: { hours: 0, rate: 15, total: 0, note: '' },
        dailyBonus: 0,
        bonusNote: '',
        notes: '车间例行公休'
      };
      continue;
    }

    if (i === 12) {
      daysMap[dStr] = {
        date: dStr,
        attendanceType: 'annual_leave',
        items: [],
        hourlyWork: { hours: 0, rate: 15, total: 0, note: '' },
        dailyBonus: 150,
        bonusNote: '带薪年休假补贴',
        notes: '年休假1天'
      };
      continue;
    }

    // 模拟一天干 3~4 款单拼和双拼，并包含调机费 5 元/次
    const items = [
      {
        id: `demo_sp_${i}_1`,
        type: 'single',
        name: '单拼',
        modelName: `第1款 (801款)`,
        count: 15000,
        price: settings.singlePiecePrice || 0.0075,
        setupCount: 1,
        setupFeeUnit: 5.0,
        setupFee: 5.0,
        pieceMoney: Number((15000 * (settings.singlePiecePrice || 0.0075)).toFixed(4)),
        total: Number((15000 * (settings.singlePiecePrice || 0.0075) + 5.0).toFixed(2)),
        isDirect: false,
        remark: ''
      },
      {
        id: `demo_dp_${i}_2`,
        type: 'double',
        name: '双拼',
        modelName: `第2款 (905款)`,
        count: 12000,
        price: settings.doublePiecePrice || 0.015,
        setupCount: 1,
        setupFeeUnit: 5.0,
        setupFee: 5.0,
        pieceMoney: Number((12000 * (settings.doublePiecePrice || 0.015)).toFixed(4)),
        total: Number((12000 * (settings.doublePiecePrice || 0.015) + 5.0).toFixed(2)),
        isDirect: false,
        remark: ''
      }
    ];

    if (i % 2 === 0) {
      items.push({
        id: `demo_sp_${i}_3`,
        type: 'single',
        name: '单拼',
        modelName: `第3款 (702款)`,
        count: 8000,
        price: settings.singlePiecePrice || 0.0075,
        setupCount: 1,
        setupFeeUnit: 5.0,
        setupFee: 5.0,
        pieceMoney: Number((8000 * (settings.singlePiecePrice || 0.0075)).toFixed(4)),
        total: Number((8000 * (settings.singlePiecePrice || 0.0075) + 5.0).toFixed(2)),
        isDirect: false,
        remark: ''
      });
    }

    // 偶尔有点工 1~2 小时 (15元/小时)
    const hHours = i % 4 === 0 ? 2 : 0;
    const hRate = settings.defaultHourlyRate || 15.0;

    daysMap[dStr] = {
      date: dStr,
      attendanceType: 'work',
      items,
      hourlyWork: {
        hours: hHours,
        rate: hRate,
        total: hHours * hRate,
        note: hHours > 0 ? '临时仓库清线协助' : ''
      },
      dailyBonus: 0,
      bonusNote: '',
      notes: ''
    };
  }

  saveAllDays(daysMap);

  saveMonthConfig(ym, {
    yearMonth: ym,
    seniorityMode: 'monthly',
    seniorityPay: 200,
    isHalfYearPaid: false,
    highTempPay: 0,
    attendanceBonus: 100,
    baseSalary: 0,
    allowances: [{ id: 'demo_al_1', name: '夜班补贴', amount: 120 }],
    deductions: [{ id: 'demo_de_1', name: '水电住宿代扣', amount: 80 }]
  });

  return true;
}

// 软件版本号与在线更新配置
export const CURRENT_APP_VERSION = 'v1.0.4';
export const GITHUB_REPO = 'wxfyes/workerapp';

function compareVersions(v1, v2) {
  const p1 = (v1 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * 检查 GitHub Releases 在线更新
 */
export async function checkForAppUpdate() {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!res.ok) {
      throw new Error(`网络响应状态: ${res.status}`);
    }

    const data = await res.json();
    const latestVersion = (data.tag_name || '').trim();
    const releaseTitle = data.name || latestVersion;
    const releaseNotes = data.body || '';
    const htmlUrl = data.html_url || `https://github.com/${GITHUB_REPO}/releases`;

    // 寻找 apk 下载文件
    let downloadUrl = '';
    if (data.assets && Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(a => a.name && a.name.endsWith('.apk'));
      if (apkAsset) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }
    if (!downloadUrl) {
      downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/WorkerApp_${latestVersion}.apk`;
    }

    // 语义化版本比对
    const hasUpdate = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

    return {
      success: true,
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseTitle,
      releaseNotes,
      downloadUrl,
      htmlUrl
    };
  } catch (err) {
    console.error('检查更新失败', err);
    return {
      success: false,
      error: err.message || '网络连接异常，无法访问更新源'
    };
  }
}

/**
 * 将备份数据压缩成 Base64 文本口令，方便直接发微信
 */
export function exportBackupBase64() {
  const jsonStr = exportAllDataJSON();
  try {
    // UTF-8 to Base64
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    return btoa(jsonStr);
  }
}

/**
 * 从 Base64 文本口令恢复数据
 */
export function importBackupBase64(base64Str) {
  try {
    const cleanStr = (base64Str || '').trim();
    const jsonStr = decodeURIComponent(escape(atob(cleanStr)));
    return importAllDataJSON(jsonStr);
  } catch (e) {
    try {
      // 兼容直接粘贴的 JSON
      return importAllDataJSON(base64Str);
    } catch (err) {
      return { success: false, error: '口令解析失败，请检查格式' };
    }
  }
}
