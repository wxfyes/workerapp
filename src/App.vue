<template>
  <div id="app">
    <!-- 顶部统一导航栏 -->
    <header class="app-header">
      <div class="brand-badge">
        <div class="brand-logo-icon">工</div>
        <div>
          <div class="brand-title">工友记工</div>
          <div class="brand-sub">计件随心记 · 薪资随时清</div>
        </div>
      </div>

      <!-- 右侧当月速览徽标 (点击直达月度核算) -->
      <div 
        @click="activeTab = 'monthly'" 
        class="badge badge-gold" 
        style="cursor: pointer; padding: 4px 10px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 4px;"
      >
        <span style="font-size: 11px; color: var(--text-muted);">本月到手:</span>
        <span style="font-size: 13px; font-weight: 800; color: var(--accent-gold-light);">¥{{ formatMoney(currentMonthSalary) }}</span>
      </div>
    </header>

    <!-- 主视口内容区 -->
    <main class="app-content">
      <!-- 1. 今日记工 -->
      <TabDaily 
        v-show="activeTab === 'daily'"
        ref="dailyRef"
        :current-date="activeDate"
        @update-date="handleDateChanged"
        @data-changed="refreshGlobalSummary"
        @toast="showToast"
      />

      <!-- 2. 工薪日历 -->
      <TabCalendar 
        v-show="activeTab === 'calendar'"
        ref="calendarRef"
        :current-date="activeDate"
        @select-date="handleDateChanged"
        @go-daily-tab="activeTab = 'daily'"
      />

      <!-- 3. 月度核算 -->
      <TabMonthly 
        v-show="activeTab === 'monthly'"
        ref="monthlyRef"
        :current-date="activeDate"
        @toast="showToast"
      />

      <!-- 4. 数据设置 -->
      <TabSettings 
        v-show="activeTab === 'settings'"
        @toast="showToast"
        @data-changed="handleGlobalDataReload"
      />
    </main>

    <!-- 极速记工浮动大按钮 (FAB，处于今日记工或日历时展现) -->
    <button 
      v-if="activeTab === 'daily' || activeTab === 'calendar'"
      class="fab-btn"
      @click="triggerFabRecord"
    >
      <Plus :size="20" stroke-width="2.5" />
      <span>记一笔</span>
    </button>

    <!-- 底部常驻导航 TabBar -->
    <nav class="app-tabbar">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'daily' }"
        @click="switchTab('daily')"
      >
        <CalendarCheck :size="20" class="tab-icon" />
        <span class="tab-label">今日记工</span>
      </div>

      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'calendar' }"
        @click="switchTab('calendar')"
      >
        <CalendarDays :size="20" class="tab-icon" />
        <span class="tab-label">工薪日历</span>
      </div>

      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'monthly' }"
        @click="switchTab('monthly')"
      >
        <Calculator :size="20" class="tab-icon" />
        <span class="tab-label">月度核算</span>
      </div>

      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'settings' }"
        @click="switchTab('settings')"
      >
        <Settings :size="20" class="tab-icon" />
        <span class="tab-label">设置备份</span>
      </div>
    </nav>

    <!-- 浮动通知 Toast -->
    <div v-if="toastText" class="toast-msg">
      <CheckCircle2 :size="18" style="color: var(--accent-gold);" />
      <span>{{ toastText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  Plus, CalendarCheck, CalendarDays, Calculator, 
  Settings, CheckCircle2 
} from 'lucide-vue-next';
import TabDaily from './components/TabDaily.vue';
import TabCalendar from './components/TabCalendar.vue';
import TabMonthly from './components/TabMonthly.vue';
import TabSettings from './components/TabSettings.vue';
import { 
  formatDate, formatMonth, formatMoney, calculateMonthSummary 
} from './utils/storage';

const activeTab = ref('daily');
const activeDate = ref(formatDate(new Date()));
const currentMonthSalary = ref(0);

const dailyRef = ref(null);
const calendarRef = ref(null);
const monthlyRef = ref(null);

const toastText = ref('');
let toastTimer = null;

onMounted(() => {
  refreshGlobalSummary();
});

function switchTab(tab) {
  activeTab.value = tab;
  if (tab === 'calendar' && calendarRef.value) {
    calendarRef.value.refreshData();
  } else if (tab === 'monthly' && monthlyRef.value) {
    monthlyRef.value.loadMonthData();
  }
}

function handleDateChanged(newDate) {
  activeDate.value = newDate;
  refreshGlobalSummary();
}

function refreshGlobalSummary() {
  const ym = formatMonth(new Date());
  const summary = calculateMonthSummary(ym);
  currentMonthSalary.value = summary.finalSalary;
}

function handleGlobalDataReload() {
  refreshGlobalSummary();
  if (dailyRef.value && dailyRef.value.loadDayData) {
    dailyRef.value.loadDayData();
  }
  if (calendarRef.value && calendarRef.value.refreshData) {
    calendarRef.value.refreshData();
  }
  if (monthlyRef.value && monthlyRef.value.loadMonthData) {
    monthlyRef.value.loadMonthData();
  }
}

function triggerFabRecord() {
  if (activeTab.value !== 'daily') {
    activeTab.value = 'daily';
  }
  setTimeout(() => {
    if (dailyRef.value && dailyRef.value.openAddModal) {
      dailyRef.value.openAddModal();
    }
  }, 50);
}

function showToast(msg) {
  toastText.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastText.value = '';
  }, 2200);
}
</script>
