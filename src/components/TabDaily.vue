<template>
  <div>
    <!-- 日期导航栏 -->
    <div class="card" style="padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
      <button class="btn btn-secondary btn-sm" @click="changeDay(-1)">
        <ChevronLeft :size="16" /> 前一天
      </button>

      <div style="position: relative; text-align: center; cursor: pointer;">
        <input 
          type="date" 
          v-model="selectedDate" 
          style="position: absolute; opacity: 0; width: 100%; height: 100%; top: 0; left: 0; cursor: pointer;"
        />
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px; justify-content: center;">
          <CalendarIcon :size="16" style="color: var(--accent-gold);" />
          {{ displayDateText }}
        </div>
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; justify-content: center;">
          <span>{{ isToday ? '今天' : dayOfWeekText }}</span>
          <span v-if="chinaHoliday.holidayName" style="color: #f87171; font-weight: 700;">
            · {{ chinaHoliday.holidayName }}{{ chinaHoliday.isWork ? '(补班)' : '(放假)' }}
          </span>
          <span v-else style="color: var(--text-sub);">
            · 农历{{ chinaHoliday.lunarText }}
          </span>
        </div>
      </div>

      <div style="display: flex; gap: 4px;">
        <button v-if="!isToday" class="btn btn-secondary btn-sm" @click="goToday" style="color: var(--accent-gold); border-color: var(--border-active);">
          今天
        </button>
        <button class="btn btn-secondary btn-sm" @click="changeDay(1)">
          后一天 <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- 考勤状态快捷切换栏 (正常出工 / 公休 / 年休 / 调休等) -->
    <div class="card" style="padding: 10px 12px; margin-bottom: 12px;">
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 600;">今日考勤状态:</span>
        <span :class="['badge', getAttendanceBadgeClass(record.attendanceType)]">
          {{ getAttendanceLabel(record.attendanceType) }}
        </span>
      </div>

      <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
        <button 
          v-for="(cfg, key) in ATTENDANCE_CONFIG" 
          :key="key"
          type="button"
          :class="['btn btn-sm', record.attendanceType === key ? 'btn-primary' : 'btn-secondary']"
          :style="{
            padding: '5px 10px',
            fontSize: '12px',
            borderColor: record.attendanceType === key ? 'var(--accent-gold)' : 'var(--border-color)'
          }"
          @click="selectAttendanceType(key)"
        >
          {{ cfg.label }}
        </button>
      </div>

      <!-- 年休假带薪补贴提醒 -->
      <div v-if="record.attendanceType === 'annual_leave'" style="margin-top: 10px; padding: 8px 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 12px; color: #34d399;">
          🌴 处于<b>年休假</b>状态，如有带薪补贴可填入右侧:
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 11px; color: #34d399;">+¥</span>
          <input 
            type="number" 
            v-model.number="bonusInput" 
            @change="saveDailyExtras"
            placeholder="0"
            style="width: 65px; background: var(--bg-card); border: 1px solid rgba(16, 185, 129, 0.4); color: #fff; font-size: 13px; font-weight: 700; border-radius: 4px; padding: 2px 4px; text-align: right;"
          />
        </div>
      </div>

      <!-- 公休提示 -->
      <div v-else-if="record.attendanceType === 'public_rest'" style="margin-top: 10px; padding: 6px 10px; background: rgba(56, 189, 248, 0.1); border-radius: 6px; font-size: 12px; color: #38bdf8;">
        ☕ 今日已标记为<b>公休轮休</b>。
      </div>
    </div>

    <!-- 当日收入核心总榜大看板 -->
    <div class="card gold-banner-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;">
            今日预估总收入 (计件+调机+零工+餐补)
          </div>
          <div style="display: flex; align-items: baseline; margin-top: 6px;">
            <span style="font-size: 20px; font-weight: 700; color: var(--accent-gold); margin-right: 4px;">¥</span>
            <span style="font-size: 38px; font-weight: 900; color: #fff; letter-spacing: -0.5px; font-feature-settings: 'tnum';">
              {{ formatMoney(dayTotalMoney) }}
            </span>
            <span style="font-size: 14px; color: var(--text-muted); margin-left: 6px;">元</span>
          </div>
        </div>

        <button 
          class="btn btn-primary btn-sm" 
          style="padding: 8px 14px; border-radius: var(--radius-full);"
          @click="openAddModal"
        >
          <Plus :size="16" /> 记一款
        </button>
      </div>

      <!-- 出勤餐费补贴状态条 (全天出勤自动计入6元，不上班不计) -->
      <div style="margin-top: 10px; padding: 6px 10px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>🍱</span>
          <span v-if="record.attendanceType === 'work'" style="color: var(--accent-gold-light); font-weight: 600;">
            出勤餐补: <b>+¥{{ formatMoney(dayMealSubsidy) }}</b> (出勤全天自动计入)
          </span>
          <span v-else style="color: var(--text-sub);">
            今日为【{{ getAttendanceLabel(record.attendanceType) }}】，不上班不计餐费
          </span>
        </div>
        <span style="color: var(--text-muted); font-size: 10px;">
          {{ record.attendanceType === 'work' ? '标准可在设置调整' : '出勤全天自动+¥6' }}
        </span>
      </div>

      <!-- 当日核心指标拆解 -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
        <div>
          <div style="font-size: 10px; color: var(--text-muted);">计件纯工钱</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-top: 2px;">
            ¥{{ formatMoney(dayPieceMoney) }}
          </div>
        </div>
        <div>
          <div style="font-size: 10px; color: #38bdf8;">调机费 ({{ totalSetupCount }}次)</div>
          <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-top: 2px;">
            ¥{{ formatMoney(daySetupFeeTotal) }}
          </div>
        </div>
        <div>
          <div style="font-size: 10px; color: #34d399;">零工费 ({{ record.hourlyWork?.hours || 0 }}时)</div>
          <div style="font-size: 14px; font-weight: 700; color: #34d399; margin-top: 2px;">
            ¥{{ formatMoney(record.hourlyWork?.total || 0) }}
          </div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--accent-gold);">生产总件数</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--accent-gold-light); margin-top: 2px;">
            {{ totalPieceCount }} <span style="font-size: 10px; font-weight: normal; color: var(--text-muted);">件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 零工记录框 (用户重点要求：如1小时零工 15元) -->
    <div class="card" style="padding: 12px 14px; margin-bottom: 14px; border: 1px solid rgba(52, 211, 153, 0.3);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #34d399;">
          <Clock :size="16" />
          <span>今日零工记录框 (计时点工)</span>
        </div>
        <div v-if="(record.hourlyWork?.total || 0) > 0" class="badge badge-green" style="font-size: 11px;">
          零工收入: +¥{{ formatMoney(record.hourlyWork.total) }}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
        <!-- 零工工时 -->
        <div>
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">零工工时 (小时)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <input 
              type="number" 
              step="0.5" 
              min="0"
              v-model.number="hourlyInput.hours" 
              @change="updateHourlyWork"
              placeholder="0"
              class="form-input"
              style="font-size: 18px; font-weight: 800; text-align: center; padding: 8px;"
            />
            <span style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">小时</span>
          </div>
          <!-- 快捷工时 -->
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 2px 0; font-size: 11px;" @click="addHourlyHour(0.5)">+0.5</button>
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 2px 0; font-size: 11px;" @click="addHourlyHour(1)">+1时</button>
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 2px 0; font-size: 11px;" @click="addHourlyHour(2)">+2时</button>
          </div>
        </div>

        <!-- 零工时薪 -->
        <div>
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">时薪 (元/小时)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px; color: var(--accent-gold);">¥</span>
            <input 
              type="number" 
              step="1" 
              min="0"
              v-model.number="hourlyInput.rate" 
              @change="updateHourlyWork"
              placeholder="15"
              class="form-input"
              style="font-size: 18px; font-weight: 800; text-align: center; padding: 8px; color: var(--accent-gold-light);"
            />
            <span style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">元/时</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); text-align: center; margin-top: 8px;">
            默认15元/小时，可改
          </div>
        </div>
      </div>

      <!-- 零工备注 -->
      <div style="display: flex; gap: 8px; align-items: center;">
        <input 
          type="text" 
          v-model="hourlyInput.note" 
          @change="updateHourlyWork"
          placeholder="零工事由 (如：车间打扫、临时搬货、清料)" 
          class="form-input"
          style="font-size: 12px; padding: 6px 10px;"
        />
        <button 
          v-if="hourlyInput.hours > 0"
          type="button" 
          class="btn btn-secondary btn-sm" 
          style="color: var(--text-sub); white-space: nowrap;"
          @click="clearHourlyWork"
        >
          清空零工
        </button>
      </div>
    </div>

    <!-- 当日干的多款清单 (支持一天干4~5款单双拼灵活添加) -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin: 18px 2px 10px 2px;">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
        <Layers :size="18" style="color: var(--accent-gold);" />
        今日干的各款单双拼 ({{ (record.items || []).length }}款)
      </div>
      <span style="font-size: 12px; color: var(--text-sub);">支持做一款加一款</span>
    </div>

    <!-- 空状态 -->
    <div 
      v-if="!record.items || record.items.length === 0" 
      class="card" 
      style="text-align: center; padding: 28px 16px; border-style: dashed;"
    >
      <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--bg-secondary); margin: 0 auto 10px auto; display: flex; align-items: center; justify-content: center; color: var(--text-sub);">
        <Layers :size="22" />
      </div>
      <div style="font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
        今天还没有添加单拼/双拼记录
      </div>
      <div style="font-size: 12px; color: var(--text-sub); margin-bottom: 14px;">
        支持一天干 4~5 款连续录入，每款自动计算调机费 5 元
      </div>
      <button class="btn btn-primary btn-sm" @click="openAddModal">
        <Plus :size="16" /> 开始添加第 1 款
      </button>
    </div>

    <!-- 多款流水列表 -->
    <div v-else>
      <div 
        v-for="(item, idx) in record.items" 
        :key="item.id || idx" 
        class="card"
        style="margin-bottom: 10px; padding: 12px 14px;"
      >
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1; cursor: pointer;" @click="editItem(item)">
            <!-- 工序类型与款号 -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <span :class="['badge', item.name === '双拼' ? 'badge-blue' : 'badge-gold']" style="font-size: 13px; font-weight: 800; padding: 3px 8px;">
                {{ item.name }}
              </span>
              <span v-if="item.modelName" style="font-size: 15px; font-weight: 700; color: var(--text-main);">
                {{ item.modelName }}
              </span>
              <span v-else style="font-size: 14px; color: var(--text-muted);">
                第 {{ idx + 1 }} 款
              </span>
              <span v-if="item.remark" class="badge badge-blue" style="font-size: 11px;">
                {{ item.remark }}
              </span>
            </div>

            <!-- 件数、单价、调机费说明 -->
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 6px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
              <span>数量: <b style="color: var(--text-main);">{{ item.count }}</b> 件</span>
              <span>单价: <b style="color: var(--accent-gold-light);">¥{{ item.price }}</b></span>
              <span v-if="item.setupFee > 0" style="color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 1px 6px; border-radius: 4px; font-size: 11px;">
                调机 {{ item.setupCount }}次 (+¥{{ item.setupFee }})
              </span>
            </div>
          </div>

          <!-- 右侧小计金额与操作 -->
          <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
            <div>
              <div style="font-size: 18px; font-weight: 900; color: var(--accent-gold-light);">
                ¥{{ formatMoney(item.total) }}
              </div>
              <div style="font-size: 11px; color: var(--text-sub);">
                本款合计
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <button 
                @click.stop="editItem(item)" 
                style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"
                title="修改"
              >
                <Pencil :size="16" />
              </button>
              <button 
                @click.stop="deleteItem(item.id)" 
                style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; padding: 4px;"
                title="删除"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 极其便捷的继续添加下一款大按钮 -->
      <button 
        type="button"
        class="btn btn-secondary btn-block" 
        style="padding: 12px; margin-top: 6px; border-style: dashed; border-color: var(--accent-gold); color: var(--accent-gold-light); font-weight: 700;"
        @click="openAddModal"
      >
        <Plus :size="18" /> 继续添加下一款 (单拼 / 双拼)
      </button>
    </div>

    <!-- 当日附加随班补贴与记事折叠区 -->
    <div class="card" style="margin-top: 14px; padding: 14px;">
      <div 
        style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;"
        @click="showBonusSettings = !showBonusSettings"
      >
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--text-muted);">
          <Coins :size="16" style="color: var(--accent-gold);" />
          <span>其他随班补贴与记事备忘</span>
          <span v-if="record.dailyBonus > 0" class="badge badge-gold" style="font-size: 10px;">
            +¥{{ record.dailyBonus }}
          </span>
        </div>
        <ChevronDown 
          :size="18" 
          :style="{ transform: showBonusSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--text-sub)' }" 
        />
      </div>

      <div v-show="showBonusSettings" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color);">
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 10px;">
          <div>
            <label class="form-label">其他补贴(元)</label>
            <input 
              v-model.number="bonusInput" 
              type="number" 
              step="1" 
              class="form-input" 
              placeholder="0"
              style="font-size: 15px; padding: 8px 10px;"
            />
          </div>
          <div>
            <label class="form-label">补贴原因</label>
            <input 
              v-model="bonusNoteInput" 
              type="text" 
              class="form-input" 
              placeholder="如：带薪年休、临时奖励"
              style="font-size: 14px; padding: 8px 10px;"
            />
          </div>
        </div>

        <div>
          <label class="form-label">今日记事 (选填)</label>
          <input 
            v-model="notesInput" 
            type="text" 
            class="form-input" 
            placeholder="如：下午设备检修、模具试模"
            style="font-size: 14px; padding: 8px 10px;"
          />
        </div>

        <button 
          class="btn btn-secondary btn-sm" 
          style="margin-top: 10px; width: 100%; border-color: var(--border-active);"
          @click="saveDailyExtras"
        >
          保存附加信息
        </button>
      </div>
    </div>

    <!-- 弹出的极速记工录入弹窗 -->
    <FastInputModal 
      v-if="modalVisible" 
      :initial-item="editingItem"
      @close="modalVisible = false"
      @save="handleSaveItem"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Pencil, Trash2, Layers, Coins, ChevronDown, Clock 
} from 'lucide-vue-next';
import FastInputModal from './FastInputModal.vue';
import { 
  formatDate, formatMoney, getDayRecord, saveDayRecord, 
  ATTENDANCE_CONFIG, getAppSettings 
} from '../utils/storage';
import { getChinaCalendarInfo } from '../utils/lunar';

const props = defineProps({
  currentDate: {
    type: String,
    default: () => formatDate(new Date())
  }
});

const emit = defineEmits(['update-date', 'data-changed', 'toast']);

const settings = ref(getAppSettings());
const selectedDate = ref(props.currentDate);
const record = ref({
  date: selectedDate.value,
  attendanceType: 'work',
  items: [],
  hourlyWork: { hours: 0, rate: 15, total: 0, note: '' },
  dailyBonus: 0,
  bonusNote: '',
  notes: ''
});

const hourlyInput = ref({ hours: 0, rate: 15, note: '' });

const modalVisible = ref(false);
const editingItem = ref(null);
const showBonusSettings = ref(false);

const bonusInput = ref(0);
const bonusNoteInput = ref('');
const notesInput = ref('');

watch(() => props.currentDate, (newDate) => {
  if (newDate && newDate !== selectedDate.value) {
    selectedDate.value = newDate;
    loadDayData();
  }
});

watch(selectedDate, (newDate) => {
  emit('update-date', newDate);
  loadDayData();
});

onMounted(() => {
  settings.value = getAppSettings();
  loadDayData();
});

function loadDayData() {
  settings.value = getAppSettings();
  const data = getDayRecord(selectedDate.value);
  record.value = JSON.parse(JSON.stringify(data));

  const hw = data.hourlyWork || {};
  hourlyInput.value = {
    hours: hw.hours || 0,
    rate: hw.rate !== undefined ? hw.rate : (settings.value.defaultHourlyRate || 15),
    note: hw.note || ''
  };

  bonusInput.value = data.dailyBonus || 0;
  bonusNoteInput.value = data.bonusNote || '';
  notesInput.value = data.notes || '';
  if (data.dailyBonus > 0 || data.notes) {
    showBonusSettings.value = true;
  }
}

function reloadAndNotify() {
  loadDayData();
  emit('data-changed');
}

const chinaHoliday = computed(() => {
  if (!selectedDate.value) return { isHoliday: false, holidayName: '', lunarText: '' };
  const [y, m, d] = selectedDate.value.split('-').map(Number);
  return getChinaCalendarInfo(y, m, d);
});

// 纯计件总金额
const dayPieceMoney = computed(() => {
  return (record.value.items || []).reduce((sum, it) => {
    const p = it.pieceMoney !== undefined ? Number(it.pieceMoney) : (Number(it.count) * Number(it.price));
    return sum + (p || 0);
  }, 0);
});

// 调机费总金额
const daySetupFeeTotal = computed(() => {
  return (record.value.items || []).reduce((sum, it) => sum + (Number(it.setupFee) || 0), 0);
});

// 调机总次数
const totalSetupCount = computed(() => {
  return (record.value.items || []).reduce((sum, it) => sum + (Number(it.setupCount) || 0), 0);
});

// 完成总件数
const totalPieceCount = computed(() => {
  return (record.value.items || []).reduce((sum, it) => sum + (Number(it.count) || 0), 0);
});

// 出勤餐费补贴 (每天出勤全天自动+6元，不上班为0)
const dayMealSubsidy = computed(() => {
  if (record.value.attendanceType === 'work') {
    return Number(settings.value?.mealSubsidyDaily !== undefined ? settings.value.mealSubsidyDaily : 6.0);
  }
  return 0;
});

// 当日预估总收入 = 计件工钱 + 调机费 + 零工工钱 + 出勤餐补 + 附加补贴
const dayTotalMoney = computed(() => {
  const hTotal = Number(record.value.hourlyWork?.total) || 0;
  const bonus = Number(record.value.dailyBonus) || 0;
  return dayPieceMoney.value + daySetupFeeTotal.value + hTotal + dayMealSubsidy.value + bonus;
});

const isToday = computed(() => {
  return selectedDate.value === formatDate(new Date());
});

const dayOfWeekText = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(selectedDate.value);
  return days[d.getDay()] || '';
});

const displayDateText = computed(() => {
  return selectedDate.value;
});

function getAttendanceLabel(type) {
  return (ATTENDANCE_CONFIG[type] && ATTENDANCE_CONFIG[type].label) || '出勤';
}

function getAttendanceBadgeClass(type) {
  return (ATTENDANCE_CONFIG[type] && ATTENDANCE_CONFIG[type].badgeClass) || 'badge-gold';
}

function selectAttendanceType(type) {
  record.value.attendanceType = type;
  if (type === 'annual_leave' && !bonusNoteInput.value) {
    bonusNoteInput.value = '带薪年休假补贴';
  }
  saveDayRecord(selectedDate.value, record.value);
  reloadAndNotify();
  emit('toast', `今日考勤已切换为【${getAttendanceLabel(type)}】`);
}

function updateHourlyWork() {
  const hours = Math.max(0, Number(hourlyInput.value.hours) || 0);
  const rate = Math.max(0, Number(hourlyInput.value.rate) || 15);
  record.value.hourlyWork = {
    hours,
    rate,
    total: Number((hours * rate).toFixed(2)),
    note: (hourlyInput.value.note || '').trim()
  };
  saveDayRecord(selectedDate.value, record.value);
  reloadAndNotify();
  emit('toast', '零工记录已保存');
}

function addHourlyHour(val) {
  hourlyInput.value.hours = Number(((Number(hourlyInput.value.hours) || 0) + val).toFixed(1));
  updateHourlyWork();
}

function clearHourlyWork() {
  hourlyInput.value.hours = 0;
  hourlyInput.value.note = '';
  updateHourlyWork();
}

function changeDay(offset) {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + offset);
  selectedDate.value = formatDate(d);
}

function goToday() {
  selectedDate.value = formatDate(new Date());
}

function openAddModal() {
  editingItem.value = null;
  modalVisible.value = true;
}

function editItem(item) {
  editingItem.value = JSON.parse(JSON.stringify(item));
  modalVisible.value = true;
}

function deleteItem(itemId) {
  if (!confirm('确认删除本款记工记录吗？')) return;
  record.value.items = (record.value.items || []).filter(it => it.id !== itemId);
  saveDayRecord(selectedDate.value, record.value);
  reloadAndNotify();
  emit('toast', '已删除一款记录');
}

function handleSaveItem({ item, close }) {
  const currentItems = record.value.items || [];
  if (item.id) {
    const idx = currentItems.findIndex(it => it.id === item.id);
    if (idx !== -1) {
      currentItems[idx] = item;
    }
  } else {
    currentItems.push(item);
  }

  record.value.items = currentItems;
  if (record.value.attendanceType !== 'work') {
    record.value.attendanceType = 'work';
  }

  saveDayRecord(selectedDate.value, record.value);
  reloadAndNotify();

  if (close) {
    modalVisible.value = false;
    emit('toast', '记工保存成功！');
  } else {
    emit('toast', '已保存本款，请录入下一款');
  }
}

function saveDailyExtras() {
  record.value.dailyBonus = Math.max(0, Number(bonusInput.value) || 0);
  record.value.bonusNote = bonusNoteInput.value.trim();
  record.value.notes = notesInput.value.trim();
  saveDayRecord(selectedDate.value, record.value);
  reloadAndNotify();
  emit('toast', '附加信息已保存');
}

defineExpose({
  openAddModal,
  loadDayData
});
</script>
