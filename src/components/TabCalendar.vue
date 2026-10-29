<template>
  <div>
    <!-- 月历切换工具栏 -->
    <div class="card" style="padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
      <button class="btn btn-secondary btn-sm" @click="changeMonth(-1)">
        <ChevronLeft :size="16" /> 上月
      </button>

      <div style="text-align: center;">
        <div style="font-size: 16px; font-weight: 800; color: var(--accent-gold); display: flex; align-items: center; gap: 6px; justify-content: center;">
          <CalendarDays :size="18" />
          {{ currentYear }} 年 {{ currentMonth }} 月
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
          🇨🇳 内置中国法定休班与农历日历
        </div>
      </div>

      <button class="btn btn-secondary btn-sm" @click="changeMonth(1)">
        下月 <ChevronRight :size="16" />
      </button>
    </div>

    <!-- 当月宏观考勤与产值小指标条 -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;">
      <div class="card" style="margin-bottom: 0; padding: 8px 4px; text-align: center;">
        <div style="font-size: 10px; color: var(--text-muted);">实际出勤</div>
        <div style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
          {{ monthSummary.workDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>

      <div class="card" style="margin-bottom: 0; padding: 8px 4px; text-align: center;">
        <div style="font-size: 10px; color: #38bdf8;">公休轮休</div>
        <div style="font-size: 15px; font-weight: 800; color: #38bdf8; margin-top: 2px;">
          {{ monthSummary.publicRestDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>

      <div class="card" style="margin-bottom: 0; padding: 8px 4px; text-align: center;">
        <div style="font-size: 10px; color: #34d399;">年休假</div>
        <div style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 2px;">
          {{ monthSummary.annualLeaveDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>

      <div class="card" style="margin-bottom: 0; padding: 8px 4px; text-align: center;">
        <div style="font-size: 10px; color: var(--accent-gold);">生产总收入</div>
        <div style="font-size: 15px; font-weight: 800; color: var(--accent-gold-light); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ¥{{ Math.round(monthSummary.directWorkTotal || monthSummary.pieceTotal) }}
        </div>
      </div>
    </div>

    <!-- 日历主网格 -->
    <div class="card" style="padding: 10px 6px;">
      <!-- 星期表头 -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
        <div style="color: var(--accent-red);">日</div>
        <div>一</div>
        <div>二</div>
        <div>三</div>
        <div>四</div>
        <div>五</div>
        <div style="color: var(--accent-blue);">六</div>
      </div>

      <!-- 日历网格单元 -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        <div 
          v-for="(cell, index) in calendarCells" 
          :key="index"
          @click="selectCell(cell)"
          :style="{
            minHeight: '62px',
            position: 'relative',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 2px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            cursor: cell.isCurrentMonth ? 'pointer' : 'default',
            opacity: cell.isCurrentMonth ? 1 : 0.22,
            background: cell.dateStr === selectedDateStr ? 'rgba(245, 158, 11, 0.2)' : (cell.isToday ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-input)'),
            border: cell.dateStr === selectedDateStr ? '1.5px solid var(--accent-gold)' : (cell.isToday ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)'),
            transition: 'all 0.15s ease'
          }"
        >
          <!-- 官方真实法定节假日 [休] / [班] 调休红蓝角标 -->
          <div 
            v-if="cell.holidayInfo.isHoliday" 
            :style="{
              position: 'absolute',
              top: '1px',
              right: '1px',
              fontSize: '8px',
              fontWeight: '900',
              padding: '1px 3px',
              borderRadius: '2px',
              lineHeight: 1,
              background: cell.holidayInfo.isWork ? '#2563eb' : '#dc2626',
              color: '#fff',
              zIndex: 2
            }"
          >
            {{ cell.holidayInfo.isWork ? '班' : '休' }}
          </div>

          <!-- 日期号与农历/节气名称 -->
          <div style="text-align: center; line-height: 1.1; margin-top: 1px;">
            <div :style="{
              fontSize: '13px',
              fontWeight: (cell.isToday || cell.dateStr === selectedDateStr) ? '800' : '600',
              color: cell.isToday ? 'var(--accent-blue)' : (cell.dateStr === selectedDateStr ? 'var(--accent-gold-light)' : 'var(--text-main)')
            }">
              {{ cell.dayNum }}
            </div>
            <div :style="{
              fontSize: '9px',
              color: cell.holidayInfo.displayFestival ? '#f87171' : 'var(--text-sub)',
              fontWeight: cell.holidayInfo.displayFestival ? '700' : 'normal',
              transform: 'scale(0.92)'
            }">
              {{ cell.holidayInfo.displayFestival || cell.holidayInfo.lunarText }}
            </div>
          </div>

          <!-- 个人考勤状态与每日工钱标签 (含计件+调机+零工完整总额) -->
          <div style="margin-top: auto; width: 100%; text-align: center;">
            <!-- 1. 年休假 -->
            <div 
              v-if="cell.attendanceType === 'annual_leave'" 
              style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.18); border-radius: 3px; padding: 1px 0;"
            >
              年休{{ cell.totalMoney > 0 ? ` ¥${Math.round(cell.totalMoney)}` : '' }}
            </div>

            <!-- 2. 公休轮休 -->
            <div 
              v-else-if="cell.attendanceType === 'public_rest'" 
              style="font-size: 10px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.18); border-radius: 3px; padding: 1px 0;"
            >
              公休
            </div>

            <!-- 3. 其他请假 -->
            <div 
              v-else-if="cell.attendanceType !== 'work'" 
              style="font-size: 9px; font-weight: 700; color: #f87171; background: rgba(248, 113, 113, 0.18); border-radius: 3px; padding: 1px 0;"
            >
              {{ getAttendanceLabel(cell.attendanceType) }}
            </div>

            <!-- 4. 正常出工记工工钱 (含调机费与零工) -->
            <div 
              v-else-if="cell.totalMoney > 0" 
              style="font-size: 10px; font-weight: 800; color: var(--accent-gold-light); background: rgba(245, 158, 11, 0.16); border-radius: 3px; padding: 1px 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
            >
              ¥{{ Math.round(cell.totalMoney) }}
            </div>

            <!-- 5. 纯休息/无记录 -->
            <div v-else-if="cell.isCurrentMonth && cell.isPast">
              <span style="font-size: 9px; color: var(--text-sub); opacity: 0.6;">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的详细信息与明细卡片 (已优化：透出调机费与零工明细) -->
    <div class="card" style="margin-top: 12px; padding: 14px;">
      <!-- 卡片头部与总金额 -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
            <span>{{ selectedDateStr }}</span>
            <span :class="['badge', getAttendanceBadgeClass(selectedDayRecord.attendanceType)]" style="font-size: 11px;">
              {{ getAttendanceLabel(selectedDayRecord.attendanceType) }}
            </span>
          </div>

          <!-- 节假日说明 -->
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center; gap: 8px;">
            <span v-if="selectedDayHoliday.holidayName" style="color: #f87171; font-weight: 700;">
              🇨🇳 {{ selectedDayHoliday.holidayName }} ({{ selectedDayHoliday.isWork ? '调休补班' : '法定放假' }})
            </span>
            <span style="color: var(--text-sub);">农历: {{ selectedDayHoliday.lunarText }}</span>
          </div>

          <!-- 当日总额大字呈现 -->
          <div style="display: flex; align-items: baseline; margin-top: 6px;">
            <span style="font-size: 13px; color: var(--text-muted); margin-right: 4px;">当天总计:</span>
            <span style="font-size: 24px; font-weight: 900; color: var(--accent-gold-light);">¥{{ formatMoney(selectedDayRecord.dayTotalMoney) }}</span>
            <span style="font-size: 12px; color: var(--text-muted); margin-left: 2px;">元</span>
          </div>

          <!-- 当日收入构成小标签 -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px;">
            <span v-if="selectedDayRecord.dayPieceMoney > 0" style="color: var(--text-main); background: var(--bg-input); padding: 2px 6px; border-radius: 4px;">
              计件: ¥{{ formatMoney(selectedDayRecord.dayPieceMoney) }}
            </span>
            <span v-if="selectedDayRecord.daySetupFee > 0" style="color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              调机: +¥{{ formatMoney(selectedDayRecord.daySetupFee) }} ({{ selectedDayRecord.daySetupCount }}次)
            </span>
            <span v-if="selectedDayRecord.dayHourlyTotal > 0" style="color: #34d399; background: rgba(52, 211, 153, 0.12); padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              零工: +¥{{ formatMoney(selectedDayRecord.dayHourlyTotal) }} ({{ selectedDayRecord.hourlyWork?.hours }}时)
            </span>
            <span v-if="selectedDayRecord.dayMealSubsidy > 0" style="color: #fbbf24; background: rgba(251, 191, 36, 0.12); padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              餐补: +¥{{ formatMoney(selectedDayRecord.dayMealSubsidy) }}
            </span>
            <span v-if="selectedDayRecord.dailyBonus > 0" style="color: var(--accent-gold); background: rgba(245, 158, 11, 0.12); padding: 2px 6px; border-radius: 4px;">
              补贴: +¥{{ selectedDayRecord.dailyBonus }}
            </span>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" @click="goToDayRecord(selectedDateStr)">
          去记工/改状态
        </button>
      </div>

      <!-- 1. 当日各款单双拼流水明细 (带调机费清晰透视) -->
      <div v-if="selectedDayRecord.items && selectedDayRecord.items.length > 0" style="margin-bottom: 10px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
          <Layers :size="14" style="color: var(--accent-gold);" />
          单双拼各款明细 ({{ selectedDayRecord.items.length }}款):
        </div>

        <div 
          v-for="(it, i) in selectedDayRecord.items" 
          :key="i"
          style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;"
        >
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span :class="['badge', it.name === '双拼' ? 'badge-blue' : 'badge-gold']" style="font-size: 11px; padding: 2px 6px;">
                {{ it.name }}
              </span>
              <span v-if="it.modelName" style="font-size: 13px; font-weight: 700; color: var(--text-main);">
                {{ it.modelName }}
              </span>
              <span v-else style="font-size: 12px; color: var(--text-sub);">
                第 {{ i + 1 }} 款
              </span>
            </div>

            <!-- 计件工钱 与 调机费明细拆解 -->
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
              <span>{{ it.count }}件 × ¥{{ it.price }} = ¥{{ (it.pieceMoney !== undefined ? it.pieceMoney : (it.count * it.price)).toFixed(2) }}</span>
              <!-- 显式标出调机费 -->
              <span v-if="it.setupFee > 0" style="color: #38bdf8; font-weight: 600;">
                (含调机 {{ it.setupCount || 1 }}次 +¥{{ it.setupFee }})
              </span>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="color: var(--accent-gold-light); font-weight: 800; font-size: 15px;">
              ¥{{ formatMoney(it.total) }}
            </div>
            <div style="font-size: 10px; color: var(--text-sub);">本款小计</div>
          </div>
        </div>
      </div>

      <!-- 2. 当日零工明细 (重点展示) -->
      <div v-if="selectedDayRecord.hourlyWork && selectedDayRecord.hourlyWork.hours > 0" style="margin-bottom: 10px;">
        <div style="font-size: 12px; font-weight: 700; color: #34d399; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
          <Clock :size="14" />
          今日零工计时记录:
        </div>

        <div style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.25); border-radius: var(--radius-sm); padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #34d399;">
              零工 {{ selectedDayRecord.hourlyWork.hours }} 小时 × ¥{{ selectedDayRecord.hourlyWork.rate }}/时
            </div>
            <div v-if="selectedDayRecord.hourlyWork.note" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              事由: {{ selectedDayRecord.hourlyWork.note }}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 900; color: #34d399;">
              +¥{{ formatMoney(selectedDayRecord.hourlyWork.total) }}
            </div>
            <div style="font-size: 10px; color: var(--text-sub);">零工收入</div>
          </div>
        </div>
      </div>

      <!-- 3. 空状态展示 -->
      <div v-if="(!selectedDayRecord.items || selectedDayRecord.items.length === 0) && (!selectedDayRecord.hourlyWork || selectedDayRecord.hourlyWork.hours === 0)">
        <div v-if="selectedDayRecord.attendanceType === 'annual_leave'" style="text-align: center; padding: 12px; color: #34d399; font-size: 13px;">
          🌴 今日状态为【年休假】{{ selectedDayRecord.dailyBonus > 0 ? ` (已发放带薪年休补贴 ¥${selectedDayRecord.dailyBonus})` : '' }}
        </div>
        <div v-else-if="selectedDayRecord.attendanceType === 'public_rest'" style="text-align: center; padding: 12px; color: #38bdf8; font-size: 13px;">
          ☕ 今日状态为【公休轮休】，好好休息充电
        </div>
        <div v-else style="text-align: center; padding: 12px; color: var(--text-sub); font-size: 13px;">
          该日暂无单双拼计件或零工记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronLeft, ChevronRight, CalendarDays, Layers, Clock } from 'lucide-vue-next';
import { 
  formatDate, formatMoney, getAllDays, calculateMonthSummary, 
  ATTENDANCE_CONFIG, getAppSettings 
} from '../utils/storage';
import { getChinaCalendarInfo } from '../utils/lunar';

const props = defineProps({
  currentDate: {
    type: String,
    default: () => formatDate(new Date())
  }
});

const emit = defineEmits(['select-date', 'go-daily-tab']);

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const selectedDateStr = ref(props.currentDate);

const appSettings = ref(getAppSettings());
const allDaysData = ref({});
const monthSummary = ref({ 
  workDays: 0, 
  publicRestDays: 0, 
  annualLeaveDays: 0, 
  pieceTotal: 0, 
  directWorkTotal: 0,
  totalPieces: 0 
});

onMounted(() => {
  refreshData();
});

watch(() => props.currentDate, (val) => {
  if (val) {
    selectedDateStr.value = val;
    const [y, m] = val.split('-');
    currentYear.value = Number(y);
    currentMonth.value = Number(m);
    refreshData();
  }
});

function refreshData() {
  appSettings.value = getAppSettings();
  allDaysData.value = getAllDays();
  const ym = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`;
  monthSummary.value = calculateMonthSummary(ym);
}

function changeMonth(offset) {
  let m = currentMonth.value + offset;
  let y = currentYear.value;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  currentYear.value = y;
  currentMonth.value = m;
  refreshData();
}

function getAttendanceLabel(type) {
  return (ATTENDANCE_CONFIG[type] && ATTENDANCE_CONFIG[type].label) || '出勤';
}

function getAttendanceBadgeClass(type) {
  return (ATTENDANCE_CONFIG[type] && ATTENDANCE_CONFIG[type].badgeClass) || 'badge-gold';
}

// 构建带真实中国放假调休与个人考勤的月历网格
const calendarCells = computed(() => {
  const y = currentYear.value;
  const m = currentMonth.value;
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);

  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];
  const todayStr = formatDate(new Date());

  // 1. 上月补齐
  const prevLastDay = new Date(y, m - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const dStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holidayInfo = getChinaCalendarInfo(prevYear, prevMonth, d);
    cells.push({
      dayNum: d,
      dateStr: dStr,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isPast: dStr < todayStr,
      attendanceType: 'work',
      totalMoney: 0,
      holidayInfo
    });
  }

  // 2. 本月各天 (正确计算计件+调机费+零工总和)
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRecord = allDaysData.value[dStr];
    let totalMoney = 0;
    let attendanceType = 'work';

    if (dayRecord) {
      attendanceType = dayRecord.attendanceType || 'work';
      // 计件纯金额 + 调机费合计
      const itemsTotal = (dayRecord.items || []).reduce((sum, it) => sum + (Number(it.total) || 0), 0);
      // 零工总金额
      const hwTotal = Number(dayRecord.hourlyWork?.total) || 0;
      // 附加补贴
      const bonus = Number(dayRecord.dailyBonus) || 0;
      // 餐费补贴: 出勤全天自动计入6元，不上班为0
      const mealRate = Number(appSettings.value?.mealSubsidyDaily !== undefined ? appSettings.value.mealSubsidyDaily : 6.0);
      const mealSubsidy = attendanceType === 'work' ? mealRate : 0;
      totalMoney = itemsTotal + hwTotal + mealSubsidy + bonus;
    }

    const holidayInfo = getChinaCalendarInfo(y, m, d);

    cells.push({
      dayNum: d,
      dateStr: dStr,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      isPast: dStr < todayStr,
      attendanceType,
      totalMoney,
      holidayInfo
    });
  }

  // 3. 下月补齐
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      const dStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holidayInfo = getChinaCalendarInfo(nextYear, nextMonth, d);
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isPast: false,
        attendanceType: 'work',
        totalMoney: 0,
        holidayInfo
      });
    }
  }

  return cells;
});

// 当前选中日期的详细信息 (彻底补齐零工、调机费与餐费补贴透视)
const selectedDayRecord = computed(() => {
  const dStr = selectedDateStr.value;
  const dayRecord = allDaysData.value[dStr] || { 
    date: dStr, 
    attendanceType: 'work', 
    items: [], 
    hourlyWork: { hours: 0, rate: 15, total: 0, note: '' },
    dailyBonus: 0 
  };

  // 计件纯工钱 (不含调机)
  const dayPieceMoney = (dayRecord.items || []).reduce((sum, it) => {
    const p = it.pieceMoney !== undefined ? Number(it.pieceMoney) : (Number(it.count) * Number(it.price));
    return sum + (p || 0);
  }, 0);

  // 调机费合计
  const daySetupFee = (dayRecord.items || []).reduce((sum, it) => sum + (Number(it.setupFee) || 0), 0);
  const daySetupCount = (dayRecord.items || []).reduce((sum, it) => sum + (Number(it.setupCount) || 0), 0);

  // 零工总金额
  const dayHourlyTotal = Number(dayRecord.hourlyWork?.total) || 0;

  // 出勤餐费补贴
  const mealRate = Number(appSettings.value?.mealSubsidyDaily !== undefined ? appSettings.value.mealSubsidyDaily : 6.0);
  const dayMealSubsidy = (dayRecord.attendanceType || 'work') === 'work' ? mealRate : 0;

  // 当日总金额 = 计件工钱 + 调机费 + 零工工钱 + 餐费补贴 + 附加补贴
  const dayTotalMoney = dayPieceMoney + daySetupFee + dayHourlyTotal + dayMealSubsidy + (Number(dayRecord.dailyBonus) || 0);

  return {
    ...dayRecord,
    dayPieceMoney,
    daySetupFee,
    daySetupCount,
    dayHourlyTotal,
    dayMealSubsidy,
    dayTotalMoney
  };
});

const selectedDayHoliday = computed(() => {
  if (!selectedDateStr.value) return { isHoliday: false, holidayName: '', lunarText: '' };
  const [y, m, d] = selectedDateStr.value.split('-').map(Number);
  return getChinaCalendarInfo(y, m, d);
});

function selectCell(cell) {
  selectedDateStr.value = cell.dateStr;
  emit('select-date', cell.dateStr);
}

function goToDayRecord(dStr) {
  emit('select-date', dStr);
  emit('go-daily-tab');
}

defineExpose({
  refreshData
});
</script>
