<template>
  <div>
    <!-- 月份选择与切换栏 -->
    <div class="card" style="padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
      <button class="btn btn-secondary btn-sm" @click="changeMonth(-1)">
        <ChevronLeft :size="16" /> 上月
      </button>

      <div style="position: relative; text-align: center; cursor: pointer;">
        <input 
          type="month" 
          v-model="selectedYearMonth" 
          style="position: absolute; opacity: 0; width: 100%; height: 100%; top: 0; left: 0; cursor: pointer;"
        />
        <div style="font-size: 16px; font-weight: 800; color: var(--accent-gold); display: flex; align-items: center; gap: 4px; justify-content: center;">
          <Calculator :size="18" />
          {{ selectedYearMonth }} 综合核算
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">
          点击切换核算月份
        </div>
      </div>

      <div style="display: flex; gap: 4px;">
        <button v-if="!isCurrentMonth" class="btn btn-secondary btn-sm" @click="goCurrentMonth" style="color: var(--accent-gold); border-color: var(--border-active);">
          本月
        </button>
        <button class="btn btn-secondary btn-sm" @click="changeMonth(1)">
          下月 <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- 核心薪资结果黄金总榜 -->
    <div class="card gold-banner-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;">
            {{ selectedYearMonth }} 月 预估实发到手总额
          </div>
          <div style="display: flex; align-items: baseline; margin-top: 6px;">
            <span style="font-size: 22px; font-weight: 700; color: var(--accent-gold); margin-right: 4px;">¥</span>
            <span style="font-size: 40px; font-weight: 900; color: #fff; letter-spacing: -0.5px; font-feature-settings: 'tnum';">
              {{ formatMoney(summary.finalSalary) }}
            </span>
            <span style="font-size: 14px; color: var(--text-muted); margin-left: 6px;">元</span>
          </div>
        </div>

        <button class="btn btn-success btn-sm" @click="exportExcel">
          <Download :size="15" /> 导出Excel
        </button>
      </div>

      <!-- 核心收支公式透视 -->
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div>
          计件/流水工钱: <b style="color: var(--text-main);">¥{{ formatMoney(summary.pieceTotal) }}</b>
        </div>
        <div>
          + 补贴福利: <b style="color: var(--accent-gold-light);">¥{{ formatMoney(summary.totalSubsidies) }}</b>
        </div>
        <div>
          - 代扣除项: <b style="color: var(--accent-red);">¥{{ formatMoney(summary.totalDeductions) }}</b>
        </div>
      </div>
    </div>

    <!-- 出勤与考勤概况指标 (含出勤、公休、年休) -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;">
      <div class="card" style="margin-bottom: 0; padding: 10px 4px; text-align: center;">
        <div style="font-size: 10px; color: var(--text-muted);">实际出勤</div>
        <div style="font-size: 17px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
          {{ summary.workDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>
      <div class="card" style="margin-bottom: 0; padding: 10px 4px; text-align: center;">
        <div style="font-size: 10px; color: #38bdf8;">公休轮休</div>
        <div style="font-size: 17px; font-weight: 800; color: #38bdf8; margin-top: 2px;">
          {{ summary.publicRestDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>
      <div class="card" style="margin-bottom: 0; padding: 10px 4px; text-align: center;">
        <div style="font-size: 10px; color: #34d399;">年休假</div>
        <div style="font-size: 17px; font-weight: 800; color: #34d399; margin-top: 2px;">
          {{ summary.annualLeaveDays }} <span style="font-size: 10px; font-weight: normal; color: var(--text-sub);">天</span>
        </div>
      </div>
      <div class="card" style="margin-bottom: 0; padding: 10px 4px; text-align: center;">
        <div style="font-size: 10px; color: var(--text-muted);">日均工钱</div>
        <div style="font-size: 16px; font-weight: 800; color: var(--accent-gold-light); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ¥{{ Math.round(summary.avgDailyIncome) }}
        </div>
      </div>
    </div>

    <!-- 本月单双拼·调机·零工生产分类汇总大卡片 -->
    <div class="card" style="padding: 12px 14px;">
      <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <Layers :size="16" style="color: var(--accent-gold);" />
          <span>本月生产直接工钱构成</span>
        </div>
        <span style="font-size: 14px; font-weight: 800; color: var(--accent-gold-light);">
          合计: ¥{{ formatMoney(summary.directWorkTotal || summary.pieceTotal) }}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <!-- 单拼 -->
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 8px 10px; border-left: 3px solid var(--accent-gold);">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>单拼计件</span>
            <span>{{ summary.singlePieceCount || 0 }}件</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
            ¥{{ formatMoney(summary.singlePieceMoney || 0) }}
          </div>
        </div>

        <!-- 双拼 -->
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 8px 10px; border-left: 3px solid #38bdf8;">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>双拼计件</span>
            <span>{{ summary.doublePieceCount || 0 }}件</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
            ¥{{ formatMoney(summary.doublePieceMoney || 0) }}
          </div>
        </div>

        <!-- 调机费 -->
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 8px 10px; border-left: 3px solid #38bdf8;">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>调机补贴</span>
            <span>{{ summary.setupCountTotal || 0 }}次</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #38bdf8; margin-top: 2px;">
            ¥{{ formatMoney(summary.setupFeeTotal || 0) }}
          </div>
        </div>

        <!-- 零工费 -->
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 8px 10px; border-left: 3px solid #34d399;">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>零工计时</span>
            <span>{{ summary.hourlyHoursTotal || 0 }}小时</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 2px;">
            ¥{{ formatMoney(summary.hourlyWorkTotal || 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 特殊计算与补贴福利配置卡片 -->
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
          <Coins :size="18" style="color: var(--accent-gold);" />
          特殊补贴福利项目
        </div>
        <span class="badge badge-gold" style="font-size: 11px;">
          小计: +¥{{ formatMoney(summary.totalSubsidies) }}
        </span>
      </div>

      <!-- 0. 出勤固定餐费补贴 (出勤自动算，不上班不计) -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px; font-weight: 700; color: var(--text-main);">🍱 出勤餐费补贴</span>
              <span class="badge badge-gold" style="font-size: 10px;">出勤全天自动计入</span>
            </div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 3px;">
              出勤 {{ summary.workDays }} 天 × ¥{{ summary.mealSubsidyDaily || 6 }} 元/天 (不上班不计)
            </div>
          </div>
          <div style="font-size: 17px; font-weight: 800; color: var(--accent-gold-light);">
            +¥{{ formatMoney(summary.mealSubsidyTotal || 0) }}
          </div>
        </div>
      </div>

      <!-- 1. 工龄补贴 (支持：按月发放 VS 半年一次不固定月份) -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px; font-weight: 700; color: var(--text-main);">工龄补贴</span>
            <span :class="['badge', configForm.seniorityMode === 'half_year' ? 'badge-blue' : 'badge-gold']" style="font-size: 10px;">
              {{ configForm.seniorityMode === 'half_year' ? '半年一次 (不固定月)' : '按月发放' }}
            </span>
          </div>

          <!-- 模式切换小链接 -->
          <button 
            type="button" 
            style="background: transparent; border: none; color: var(--accent-gold); font-size: 11px; cursor: pointer; text-decoration: underline;"
            @click="toggleSeniorityMode"
          >
            切换为{{ configForm.seniorityMode === 'half_year' ? '按月发' : '半年发' }}
          </button>
        </div>

        <!-- 场景 A: 按月发放 -->
        <div v-if="configForm.seniorityMode === 'monthly'" style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; color: var(--text-sub);">每月随工资发放工龄津贴</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 13px; color: var(--accent-gold);">+¥</span>
            <input 
              type="number" 
              v-model.number="configForm.seniorityPay" 
              @change="saveConfig"
              style="width: 80px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); font-size: 15px; font-weight: 700; border-radius: 4px; padding: 4px 6px; text-align: right;"
            />
          </div>
        </div>

        <!-- 场景 B: 半年一次 (哪个月份不固定) -->
        <div v-else>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 12px; color: configForm.seniorityPay > 0 ? '#34d399' : 'var(--text-sub)'; font-weight: 600;">
                {{ configForm.seniorityPay > 0 ? '★ 本月为半年工龄集中发放月' : '本月未发放工龄 (半年一次)' }}
              </div>
              <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
                哪个月份发放，直接在该月填入或点右侧登记
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px; color: var(--accent-gold);">+¥</span>
              <input 
                type="number" 
                v-model.number="configForm.seniorityPay" 
                @change="saveConfig"
                placeholder="0"
                style="width: 85px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--accent-gold-light); font-size: 15px; font-weight: 800; border-radius: 4px; padding: 4px 6px; text-align: right;"
              />
            </div>
          </div>

          <!-- 半年一次模式下的快捷一键登记按钮 -->
          <div style="margin-top: 8px; display: flex; gap: 6px;">
            <button 
              v-if="configForm.seniorityPay === 0"
              type="button" 
              class="btn btn-secondary btn-sm" 
              style="flex: 1; font-size: 11px; padding: 4px 0; color: var(--accent-gold); border-color: var(--border-active);"
              @click="applyHalfYearDefault"
            >
              + 本月发放半年工龄 (一键带入 ¥{{ settings.halfYearSeniorityAmount || 1200 }})
            </button>
            <button 
              v-else
              type="button" 
              class="btn btn-secondary btn-sm" 
              style="flex: 1; font-size: 11px; padding: 4px 0; color: var(--text-sub);"
              @click="clearHalfYearPay"
            >
              清空工龄 (改到其他月份发)
            </button>
          </div>
        </div>
      </div>

      <!-- 2. 高温补贴 (一年一次，也可能没有) -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px; font-weight: 600; color: var(--text-main);">高温补贴</span>
            <span class="badge badge-blue" style="font-size: 10px;">一年一次/可选</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
            {{ configForm.highTempPay > 0 ? '本月已发放高温补贴' : '本月无高温补贴 (不发填0即可)' }}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px; color: var(--accent-gold);">+¥</span>
          <input 
            type="number" 
            v-model.number="configForm.highTempPay" 
            @change="saveConfig"
            placeholder="0"
            style="width: 75px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--accent-gold-light); font-size: 15px; font-weight: 700; border-radius: 4px; padding: 4px 6px; text-align: right;"
          />
        </div>
      </div>

      <!-- 3. 全勤奖与保底底薪 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 10px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">全勤奖金</div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 12px; color: var(--accent-gold);">+¥</span>
            <input 
              type="number" 
              v-model.number="configForm.attendanceBonus" 
              @change="saveConfig"
              style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); font-size: 14px; font-weight: 600; border-radius: 4px; padding: 4px; text-align: right;"
            />
          </div>
        </div>

        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 10px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">保底底薪 (如有)</div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 12px; color: var(--accent-gold);">+¥</span>
            <input 
              type="number" 
              v-model.number="configForm.baseSalary" 
              @change="saveConfig"
              style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); font-size: 14px; font-weight: 600; border-radius: 4px; padding: 4px; text-align: right;"
            />
          </div>
        </div>
      </div>

      <!-- 4. 自定义补贴列表 -->
      <div v-if="configForm.allowances && configForm.allowances.length > 0">
        <div 
          v-for="(al, idx) in configForm.allowances" 
          :key="al.id || idx"
          style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color);"
        >
          <input 
            v-model="al.name" 
            @change="saveConfig" 
            placeholder="补贴名" 
            style="background: transparent; border: none; color: var(--text-main); font-size: 13px; font-weight: 600; width: 120px;"
          />
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px; color: var(--accent-gold);">+¥</span>
            <input 
              type="number" 
              v-model.number="al.amount" 
              @change="saveConfig" 
              style="width: 70px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); font-size: 13px; border-radius: 4px; padding: 3px; text-align: right;"
            />
            <button 
              @click="removeAllowance(idx)" 
              style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; padding: 2px;"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </div>

      <button 
        class="btn btn-secondary btn-sm" 
        style="width: 100%; margin-top: 8px; font-size: 12px;"
        @click="addAllowance"
      >
        <Plus :size="14" /> 添加其他自定义补贴 (如夜班/餐补)
      </button>
    </div>

    <!-- 支出与扣款项配置卡片 -->
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
          <Receipt :size="18" style="color: var(--accent-red);" />
          代扣除款项 (借支/水电/社保)
        </div>
        <span class="badge badge-red" style="font-size: 11px;">
          小计: -¥{{ formatMoney(summary.totalDeductions) }}
        </span>
      </div>

      <div v-if="configForm.deductions && configForm.deductions.length > 0">
        <div 
          v-for="(de, idx) in configForm.deductions" 
          :key="de.id || idx"
          style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color);"
        >
          <input 
            v-model="de.name" 
            @change="saveConfig" 
            placeholder="扣款事由" 
            style="background: transparent; border: none; color: var(--text-main); font-size: 13px; font-weight: 600; width: 120px;"
          />
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px; color: var(--accent-red);">-¥</span>
            <input 
              type="number" 
              v-model.number="de.amount" 
              @change="saveConfig" 
              style="width: 70px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--accent-red); font-size: 13px; border-radius: 4px; padding: 3px; text-align: right;"
            />
            <button 
              @click="removeDeduction(idx)" 
              style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; padding: 2px;"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </div>
      <div v-else style="font-size: 12px; color: var(--text-sub); text-align: center; padding: 8px 0;">
        暂无扣款记录（如借支预支或生活水电代扣）
      </div>

      <button 
        class="btn btn-secondary btn-sm" 
        style="width: 100%; margin-top: 8px; font-size: 12px;"
        @click="addDeduction"
      >
        <Plus :size="14" /> 添加扣款项 (借支/水电/代扣)
      </button>
    </div>

    <!-- 快捷对账分享操作 -->
    <div style="display: flex; gap: 10px; margin-top: 14px;">
      <button class="btn btn-secondary" style="flex: 1;" @click="copySummaryText">
        <Copy :size="16" /> 复制文字账单
      </button>
      <button class="btn btn-primary" style="flex: 1;" @click="exportExcel">
        <FileSpreadsheet :size="16" /> 导出Excel报表
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { 
  ChevronLeft, ChevronRight, Calculator, Download, 
  Coins, Receipt, Plus, Trash2, Copy, FileSpreadsheet, Layers 
} from 'lucide-vue-next';
import { 
  formatMonth, formatMoney, calculateMonthSummary, 
  getMonthConfig, saveMonthConfig, getAppSettings 
} from '../utils/storage';
import { exportMonthToExcel } from '../utils/excel';

const props = defineProps({
  currentDate: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['toast']);

const settings = ref(getAppSettings());
const selectedYearMonth = ref(formatMonth(new Date()));
const summary = ref({
  workDays: 0,
  publicRestDays: 0,
  annualLeaveDays: 0,
  totalPieces: 0,
  pieceTotal: 0,
  avgDailyIncome: 0,
  dailyBonusTotal: 0,
  seniorityPay: 0,
  highTempPay: 0,
  attendanceBonus: 0,
  baseSalary: 0,
  totalSubsidies: 0,
  totalDeductions: 0,
  finalSalary: 0,
  config: { allowances: [], deductions: [] }
});

const configForm = ref({
  seniorityMode: 'monthly',
  seniorityPay: 0,
  isHalfYearPaid: false,
  highTempPay: 0,
  attendanceBonus: 0,
  baseSalary: 0,
  allowances: [],
  deductions: []
});

onMounted(() => {
  settings.value = getAppSettings();
  if (props.currentDate) {
    selectedYearMonth.value = props.currentDate.slice(0, 7);
  }
  loadMonthData();
});

watch(() => props.currentDate, (val) => {
  if (val && val.slice(0, 7) !== selectedYearMonth.value) {
    selectedYearMonth.value = val.slice(0, 7);
    loadMonthData();
  }
});

watch(selectedYearMonth, () => {
  loadMonthData();
});

function loadMonthData() {
  settings.value = getAppSettings();
  const ym = selectedYearMonth.value;
  summary.value = calculateMonthSummary(ym);
  const cfg = getMonthConfig(ym);
  configForm.value = JSON.parse(JSON.stringify(cfg));
}

function saveConfig() {
  saveMonthConfig(selectedYearMonth.value, configForm.value);
  summary.value = calculateMonthSummary(selectedYearMonth.value);
  emit('toast', '核算配置已更新');
}

function toggleSeniorityMode() {
  configForm.value.seniorityMode = configForm.value.seniorityMode === 'half_year' ? 'monthly' : 'half_year';
  if (configForm.value.seniorityMode === 'monthly') {
    configForm.value.seniorityPay = Number(settings.value.defaultSeniorityPay) || 200;
  } else {
    configForm.value.seniorityPay = 0;
  }
  saveConfig();
}

function applyHalfYearDefault() {
  const amount = Number(settings.value.halfYearSeniorityAmount) || 1200;
  configForm.value.seniorityPay = amount;
  configForm.value.isHalfYearPaid = true;
  saveConfig();
  emit('toast', `已登记本月发放半年工龄 ¥${amount}`);
}

function clearHalfYearPay() {
  configForm.value.seniorityPay = 0;
  configForm.value.isHalfYearPaid = false;
  saveConfig();
  emit('toast', '已清除本月工龄');
}

const isCurrentMonth = computed(() => {
  return selectedYearMonth.value === formatMonth(new Date());
});

function changeMonth(offset) {
  const [y, m] = selectedYearMonth.value.split('-').map(Number);
  let newM = m + offset;
  let newY = y;
  if (newM < 1) {
    newM = 12;
    newY -= 1;
  } else if (newM > 12) {
    newM = 1;
    newY += 1;
  }
  selectedYearMonth.value = `${newY}-${String(newM).padStart(2, '0')}`;
}

function goCurrentMonth() {
  selectedYearMonth.value = formatMonth(new Date());
}

function addAllowance() {
  if (!configForm.value.allowances) configForm.value.allowances = [];
  configForm.value.allowances.push({
    id: 'al_' + Date.now(),
    name: '特殊补贴',
    amount: 100
  });
  saveConfig();
}

function removeAllowance(idx) {
  configForm.value.allowances.splice(idx, 1);
  saveConfig();
}

function addDeduction() {
  if (!configForm.value.deductions) configForm.value.deductions = [];
  configForm.value.deductions.push({
    id: 'de_' + Date.now(),
    name: '借支生活费',
    amount: 200
  });
  saveConfig();
}

function removeDeduction(idx) {
  configForm.value.deductions.splice(idx, 1);
  saveConfig();
}

function exportExcel() {
  try {
    const filename = exportMonthToExcel(selectedYearMonth.value);
    emit('toast', `已生成Excel: ${filename}`);
  } catch (e) {
    console.error(e);
    alert('导出Excel出错，请重试');
  }
}

function copySummaryText() {
  const s = summary.value;
  const seniorityText = s.seniorityPay > 0 
    ? `+¥${formatMoney(s.seniorityPay)}${configForm.value.seniorityMode === 'half_year' ? ' (半年一次集中发放)' : ''}` 
    : '¥0 (本月未发)';

  const text = `【工友记工】${selectedYearMonth.value} 月工资核算对账
------------------------
★ 实发到手总额: ¥${formatMoney(s.finalSalary)} 元
- 生产直接流水工钱: ¥${formatMoney(s.directWorkTotal || s.pieceTotal)} (做件: ${s.totalPieces}件, 出勤: ${s.workDays}天, 公休: ${s.publicRestDays}天, 年休: ${s.annualLeaveDays}天)
- 出勤固定餐补: +¥${formatMoney(s.mealSubsidyTotal || 0)} (出勤${s.workDays}天 × ¥${s.mealSubsidyDaily || 6}元)
- 工龄补贴: ${seniorityText}
- 高温补贴: +¥${formatMoney(s.highTempPay)}${s.highTempPay > 0 ? '' : ' (本月无)'}
- 全勤奖金: +¥${formatMoney(s.attendanceBonus)}
- 其他补贴: +¥${formatMoney(s.dailyBonusTotal + s.customAllowancesTotal)}
- 代扣除项: -¥${formatMoney(s.totalDeductions)}
------------------------
记录于 工友记工App`;

  navigator.clipboard.writeText(text).then(() => {
    emit('toast', '对账文字已复制到剪贴板！');
  }).catch(() => {
    prompt('请长按复制对账文本:', text);
  });
}

defineExpose({
  loadMonthData
});
</script>
