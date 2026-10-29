<template>
  <div>
    <!-- 1. 核心工价与单双拼价格配置 -->
    <div class="card" style="border: 1px solid var(--accent-gold);">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <Coins :size="18" style="color: var(--accent-gold);" />
          <span>计件单价与车间工价标准</span>
        </div>
        <span class="badge badge-gold" style="font-size: 10px;">记一笔时自动采用</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">单拼单价 (元/件)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px; color: var(--accent-gold);">¥</span>
            <input 
              v-model.number="settings.singlePiecePrice" 
              type="number" 
              step="0.0001"
              min="0"
              class="form-input" 
              placeholder="0.0075"
              style="font-size: 18px; font-weight: 800; color: var(--accent-gold-light); padding: 6px;"
              @change="saveCurrentSettings"
            />
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">
            默认 0.0075 元/件
          </div>
        </div>

        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">双拼单价 (元/件)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px; color: var(--accent-gold);">¥</span>
            <input 
              v-model.number="settings.doublePiecePrice" 
              type="number" 
              step="0.0001"
              min="0"
              class="form-input" 
              placeholder="0.015"
              style="font-size: 18px; font-weight: 800; color: var(--accent-gold-light); padding: 6px;"
              @change="saveCurrentSettings"
            />
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">
            默认 0.015 元/件
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">调机费标准 (元/次)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px; color: #38bdf8;">¥</span>
            <input 
              v-model.number="settings.defaultSetupFee" 
              type="number" 
              step="1"
              min="0"
              class="form-input" 
              placeholder="5.0"
              style="font-size: 18px; font-weight: 800; color: #38bdf8; padding: 6px;"
              @change="saveCurrentSettings"
            />
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">
            每干一笔默认5元
          </div>
        </div>

        <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">零工时薪 (元/小时)</label>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px; color: #34d399;">¥</span>
            <input 
              v-model.number="settings.defaultHourlyRate" 
              type="number" 
              step="1"
              min="0"
              class="form-input" 
              placeholder="15.0"
              style="font-size: 18px; font-weight: 800; color: #34d399; padding: 6px;"
              @change="saveCurrentSettings"
            />
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">
            默认 15 元/小时
          </div>
        </div>
      </div>

      <!-- 每日固定餐费补贴 (出勤自动算，不上班不计) -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <label class="form-label" style="font-size: 13px; font-weight: 700; margin-bottom: 0;">🍱 每日固定餐费补贴 (元/出勤天)</label>
          <span class="badge badge-gold" style="font-size: 10px;">出勤全天自动计入</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 16px; color: var(--accent-gold); font-weight: 700;">¥</span>
          <input 
            v-model.number="settings.mealSubsidyDaily" 
            type="number" 
            step="0.5"
            min="0"
            class="form-input" 
            placeholder="6.0"
            style="font-size: 18px; font-weight: 800; color: var(--accent-gold-light); padding: 6px;"
            @change="saveCurrentSettings"
          />
          <span style="font-size: 13px; color: var(--text-muted); margin-left: 4px;">元/天</span>
        </div>
        <div style="font-size: 11px; color: var(--text-sub); margin-top: 4px;">
          默认 6 元/天。每天出勤全天自动计入总收入，不上班（公休/请假）自动为 0，以后变动随时可改。
        </div>
      </div>
    </div>

    <!-- 2. 月度工资结算周期起止日设置 (用户重点要求：当月16日至次月15日等结算日可自定义) -->
    <div class="card">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <CalendarDays :size="18" style="color: var(--accent-gold);" />
          <span>月度工资结算日设置</span>
        </div>
        <span class="badge badge-gold" style="font-size: 11px;">
          {{ settings.salaryCycleStartDay === 1 ? '自然月结算' : `每月${settings.salaryCycleStartDay}日结算` }}
        </span>
      </div>

      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
        <label class="form-label" style="font-size: 13px; font-weight: 700; margin-bottom: 6px;">
          每月结算起始日 (号)
        </label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input 
            v-model.number="settings.salaryCycleStartDay" 
            type="number" 
            min="1" 
            max="28"
            class="form-input" 
            placeholder="16"
            style="width: 80px; font-size: 18px; font-weight: 800; text-align: center; color: var(--accent-gold-light); padding: 6px;"
            @change="saveCurrentSettings"
          />
          <span style="font-size: 13px; color: var(--text-muted);">号</span>

          <!-- 快捷预设按钮 -->
          <div style="display: flex; gap: 6px; margin-left: auto;">
            <button 
              type="button" 
              class="btn btn-sm"
              :class="settings.salaryCycleStartDay === 16 ? 'btn-primary' : 'btn-secondary'"
              style="font-size: 11px; padding: 4px 8px;"
              @click="setCycleStartDay(16)"
            >
              16号(16~次月15)
            </button>
            <button 
              type="button" 
              class="btn btn-sm"
              :class="settings.salaryCycleStartDay === 1 ? 'btn-primary' : 'btn-secondary'"
              style="font-size: 11px; padding: 4px 8px;"
              @click="setCycleStartDay(1)"
            >
              1号(自然月)
            </button>
          </div>
        </div>

        <div style="font-size: 12px; color: var(--text-sub); margin-top: 8px; line-height: 1.5;">
          <span style="color: var(--accent-gold-light); font-weight: 600;">当前计算规则：</span>
          <span v-if="settings.salaryCycleStartDay > 1">
            以当月 <b>{{ settings.salaryCycleStartDay }}</b> 日至次月 <b>{{ settings.salaryCycleStartDay - 1 }}</b> 日作为一个月度核算周期（如10月薪资周期为 10月{{ settings.salaryCycleStartDay }}日 ~ 11月{{ settings.salaryCycleStartDay - 1 }}日）。
          </span>
          <span v-else>
            以自然月（当月1日 至 当月最后一天）作为一个月度核算周期。
          </span>
        </div>
      </div>
    </div>

    <!-- 3. 工龄补贴发放模式 -->
    <div class="card">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
        <Sliders :size="18" style="color: var(--accent-gold);" />
        工龄补贴发放规则
      </div>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; gap: 10px;">
          <label :style="{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 'var(--radius-sm)',
            border: settings.seniorityMode === 'monthly' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-color)',
            background: settings.seniorityMode === 'monthly' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-input)',
            cursor: 'pointer',
            textAlign: 'center'
          }">
            <input 
              type="radio" 
              value="monthly" 
              v-model="settings.seniorityMode" 
              style="display: none;" 
              @change="saveCurrentSettings"
            />
            <div style="font-size: 13px; font-weight: 700; color: settings.seniorityMode === 'monthly' ? 'var(--accent-gold)' : 'var(--text-main)';">
              按月每月发
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              每月随工资发放
            </div>
          </label>

          <label :style="{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 'var(--radius-sm)',
            border: settings.seniorityMode === 'half_year' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-color)',
            background: settings.seniorityMode === 'half_year' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-input)',
            cursor: 'pointer',
            textAlign: 'center'
          }">
            <input 
              type="radio" 
              value="half_year" 
              v-model="settings.seniorityMode" 
              style="display: none;" 
              @change="saveCurrentSettings"
            />
            <div style="font-size: 13px; font-weight: 700; color: settings.seniorityMode === 'half_year' ? 'var(--accent-gold)' : 'var(--text-main)';">
              半年发一次
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              月份不固定
            </div>
          </label>
        </div>
      </div>

      <div v-if="settings.seniorityMode === 'monthly'" class="form-group" style="margin-bottom: 0;">
        <label class="form-label">每月默认工龄补贴金额</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input 
            v-model.number="settings.defaultSeniorityPay" 
            type="number" 
            class="form-input" 
            placeholder="200" 
            style="font-size: 18px; font-weight: 700; color: var(--accent-gold-light);"
            @change="saveCurrentSettings"
          />
          <span style="color: var(--text-muted); font-size: 14px; white-space: nowrap;">元 / 月</span>
        </div>
      </div>

      <div v-else class="form-group" style="margin-bottom: 0;">
        <label class="form-label">半年集中发放参考金额</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input 
            v-model.number="settings.halfYearSeniorityAmount" 
            type="number" 
            class="form-input" 
            placeholder="1200" 
            style="font-size: 18px; font-weight: 700; color: var(--accent-gold-light);"
            @change="saveCurrentSettings"
          />
          <span style="color: var(--text-muted); font-size: 14px; white-space: nowrap;">元 / 半年</span>
        </div>
        <div style="font-size: 11px; color: var(--text-sub); margin-top: 6px;">
          平时月为0，到了集中发放的月份，在月度核算中点击一键登记即可入账。
        </div>
      </div>
    </div>

    <!-- 3. 数据防丢与微信迁移导出 (用户重点需求升级) -->
    <div class="card" style="border: 1px solid rgba(16, 185, 129, 0.3);">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <ShieldCheck :size="18" style="color: var(--accent-green);" />
          <span>数据防丢与微信/换手机迁移</span>
        </div>
        <span class="badge badge-green" style="font-size: 10px;">换手机无缝恢复</span>
      </div>

      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.6;">
        数据存放于手机本地。建议定期将数据<b>发到微信“文件传输助手”或微信收藏</b>保存，换手机时粘贴或导入即可 100% 还原！
      </div>

      <!-- 导出/备份操作区 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <button class="btn btn-primary" style="padding: 10px;" @click="shareToWeChat">
          <Share2 :size="16" /> 发送/分享到微信
        </button>

        <button class="btn btn-secondary" style="padding: 10px;" @click="copyBackupText">
          <Copy :size="16" /> 复制微信备份口令
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <button class="btn btn-secondary btn-sm" @click="handleExportJSON">
          <Download :size="14" /> 下载本地备份文件
        </button>

        <button class="btn btn-secondary btn-sm" @click="openPasteRestoreModal">
          <ClipboardPaste :size="14" /> 粘贴微信口令恢复
        </button>
      </div>

      <!-- 文件恢复 -->
      <label class="btn btn-secondary btn-sm btn-block" style="cursor: pointer; position: relative;">
        <Upload :size="14" /> 从手机备份文件恢复 (.json)
        <input 
          type="file" 
          accept=".json" 
          style="position: absolute; opacity: 0; width: 100%; height: 100%; top: 0; left: 0; cursor: pointer;"
          @change="handleImportJSON"
        />
      </label>
    </div>

    <!-- 4. 在线版本更新检测 (GitHub Releases 通道) -->
    <div class="card" style="border: 1px solid rgba(56, 189, 248, 0.3);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
          <RefreshCw :size="18" style="color: #38bdf8;" />
          <span>软件版本与在线更新</span>
        </div>
        <span class="badge badge-blue" style="font-size: 11px;">
          当前版本: {{ CURRENT_APP_VERSION }}
        </span>
      </div>

      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5;">
        连接 GitHub Releases 官方通道，点击可自动检测最新版 APK 安装包并一键在线下载升级。
      </div>

      <button 
        class="btn btn-secondary btn-block" 
        style="border-color: #38bdf8; color: #38bdf8; font-weight: 700;"
        :disabled="checkingUpdate"
        @click="checkUpdate"
      >
        <RefreshCw :size="16" :class="{ 'spin-anim': checkingUpdate }" />
        {{ checkingUpdate ? '正在检查最新版本...' : '检查在线新版本' }}
      </button>
    </div>

    <!-- 5. 个人与车间信息 -->
    <div class="card">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
        <User :size="18" style="color: var(--accent-gold);" />
        个人与车间信息 (用于Excel对账单)
      </div>

      <div class="form-group">
        <label class="form-label">您的姓名 / 称呼</label>
        <input 
          v-model="settings.workerName" 
          type="text" 
          class="form-input" 
          placeholder="如：老王、张师傅" 
          @change="saveCurrentSettings"
        />
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">所属车间 / 班组 (选填)</label>
        <input 
          v-model="settings.workshop" 
          type="text" 
          class="form-input" 
          placeholder="如：注塑二车间、贴片班组" 
          @change="saveCurrentSettings"
        />
      </div>
    </div>

    <!-- 6. 演示与维护工具 -->
    <div class="card" style="border-color: rgba(255, 255, 255, 0.05);">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
        <Wrench :size="16" />
        体验与维护工具
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary btn-sm" style="flex: 1;" @click="handleSeedDemo">
          <Sparkles :size="14" style="color: var(--accent-gold);" /> 填充单双拼演示数据
        </button>
        <button class="btn btn-danger btn-sm" style="flex: 1;" @click="handleClearAll">
          <Trash :size="14" /> 清空所有数据
        </button>
      </div>
    </div>

    <div style="text-align: center; padding: 18px 0; font-size: 12px; color: var(--text-sub);">
      工友记工 (单双拼与调机费专业版) · {{ CURRENT_APP_VERSION }}<br>
      单拼0.0075 · 双拼0.015 · 调机5元 · 计时零工
    </div>

    <!-- 粘贴口令恢复弹窗 -->
    <div v-if="showPasteModal" class="modal-overlay" @click.self="showPasteModal = false">
      <div class="modal-sheet">
        <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <ClipboardPaste :size="18" style="color: var(--accent-green);" />
          粘贴微信口令恢复数据
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
          请将在微信中接收到的备份口令文本粘贴在下方，点击“确认恢复”即可瞬间恢复所有记工记录：
        </div>
        <textarea 
          v-model="pasteCodeInput" 
          class="form-input" 
          rows="6" 
          placeholder="在此长按粘贴备份口令文本..."
          style="font-size: 12px; line-height: 1.4; resize: none; margin-bottom: 14px;"
        ></textarea>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" style="flex: 1;" @click="showPasteModal = false">取消</button>
          <button class="btn btn-primary" style="flex: 1;" @click="submitPasteRestore">确认恢复</button>
        </div>
      </div>
    </div>

    <!-- 在线更新升级提示弹窗 -->
    <div v-if="showUpdateModal" class="modal-overlay" @click.self="showUpdateModal = false">
      <div class="modal-sheet">
        <div style="font-size: 17px; font-weight: 800; color: var(--accent-gold-light); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <Sparkles :size="20" style="color: var(--accent-gold);" />
          {{ updateInfo.hasUpdate ? '发现全新版本更新！' : '当前已是最新版本' }}
        </div>

        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          当前版本: <b>{{ CURRENT_APP_VERSION }}</b> | 最新版本: <b style="color: #38bdf8;">{{ updateInfo.latestVersion }}</b>
        </div>

        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px; max-height: 220px; overflow-y: auto;">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
            {{ updateInfo.releaseTitle }}
          </div>
          <div style="font-size: 12px; color: var(--text-muted); white-space: pre-wrap; line-height: 1.6;">
            {{ updateInfo.releaseNotes || '常规功能优化与性能提升。' }}
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" style="flex: 1;" @click="showUpdateModal = false">
            {{ updateInfo.hasUpdate ? '稍后再说' : '关闭' }}
          </button>
          <a 
            v-if="updateInfo.hasUpdate"
            :href="updateInfo.downloadUrl" 
            target="_blank" 
            class="btn btn-primary" 
            style="flex: 1; text-decoration: none;"
          >
            <Download :size="16" /> 立即下载新版APK
          </a>
          <button 
            v-else
            class="btn btn-primary" 
            style="flex: 1;"
            @click="showUpdateModal = false"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  User, Sliders, ShieldCheck, Download, Upload, 
  Wrench, Sparkles, Trash, Coins, Share2, Copy, 
  ClipboardPaste, RefreshCw, CalendarDays 
} from 'lucide-vue-next';
import { 
  getAppSettings, saveAppSettings, exportAllDataJSON, 
  importAllDataJSON, seedDemoData, CURRENT_APP_VERSION, 
  checkForAppUpdate, exportBackupBase64, importBackupBase64 
} from '../utils/storage';

const emit = defineEmits(['toast', 'data-changed']);

const settings = ref({
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
});

const checkingUpdate = ref(false);
const showUpdateModal = ref(false);
const updateInfo = ref({});

const showPasteModal = ref(false);
const pasteCodeInput = ref('');

onMounted(() => {
  settings.value = getAppSettings();
});

function setCycleStartDay(day) {
  settings.value.salaryCycleStartDay = day;
  saveCurrentSettings();
  emit('toast', `月度结算日已切换为【每月 ${day} 号】`);
}

function saveCurrentSettings() {
  saveAppSettings(settings.value);
  emit('data-changed');
  emit('toast', '设置已保存');
}

// 1. 发送到微信 / 系统分享
async function shareToWeChat() {
  const jsonStr = exportAllDataJSON();
  const d = new Date().toISOString().slice(0, 10);
  const fileName = `工友记工_数据备份_${d}.json`;

  try {
    const file = new File([jsonStr], fileName, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: '工友记工数据备份',
        text: '这是我的工友记工账本数据备份，可发到微信文件传输助手保存。',
        files: [file]
      });
      emit('toast', '已唤起系统分享，请选择微信！');
      return;
    }
  } catch (err) {
    console.log('系统文件分享不可用，使用下载和口令模式');
  }

  // Fallback: 自动下载文件并复制口令
  handleExportJSON();
  copyBackupText();
  emit('toast', '已为您下载备份文件并复制了口令，可直接发到微信！');
}

// 2. 复制微信备份口令
function copyBackupText() {
  const code = exportBackupBase64();
  const text = `【工友记工·数据备份口令】请长按全部复制，在新手机打开App进入设置粘贴即可还原：\n\n${code}`;
  navigator.clipboard.writeText(text).then(() => {
    emit('toast', '备份口令已复制！直接去微信粘贴发送即可。');
  }).catch(() => {
    prompt('请全选并长按复制此备份口令，发到微信保存:', code);
  });
}

function openPasteRestoreModal() {
  pasteCodeInput.value = '';
  showPasteModal.value = true;
}

function submitPasteRestore() {
  let code = pasteCodeInput.value.trim();
  if (!code) {
    alert('请粘贴备份口令');
    return;
  }
  // 过滤提示词
  if (code.includes('【工友记工·数据备份口令】')) {
    const parts = code.split('\n\n');
    code = parts[parts.length - 1].trim();
  }

  const res = importBackupBase64(code);
  if (res.success) {
    showPasteModal.value = false;
    settings.value = getAppSettings();
    emit('data-changed');
    emit('toast', '口令还原成功！所有工单数据已恢复！');
  } else {
    alert('口令无效或已损坏，请确保完整复制');
  }
}

// 3. 在线检查更新
async function checkUpdate() {
  checkingUpdate.value = true;
  try {
    const res = await checkForAppUpdate();
    checkingUpdate.value = false;
    if (res.success) {
      updateInfo.value = res;
      showUpdateModal.value = true;
    } else {
      alert(`检查更新提示: ${res.error || '未能连接到 GitHub 更新通道，请检查网络或稍后重试'}`);
    }
  } catch (e) {
    checkingUpdate.value = false;
    alert('连接更新通道超时，请确保手机有网络');
  }
}

function handleExportJSON() {
  const jsonStr = exportAllDataJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `工友记工_备份_${d}.json`;
  a.click();
  URL.revokeObjectURL(url);
  emit('toast', '备份文件已保存到手机下载目录！');
}

function handleImportJSON(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const content = evt.target.result;
      const res = importAllDataJSON(content);
      if (res.success) {
        settings.value = getAppSettings();
        emit('data-changed');
        emit('toast', '数据文件恢复成功！');
      } else {
        alert('导入失败，文件格式有误');
      }
    } catch (err) {
      alert('解析备份文件出错');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function handleSeedDemo() {
  if (confirm('确认填充本月的单拼/双拼/调机费/零工体验数据吗？')) {
    seedDemoData();
    emit('data-changed');
    emit('toast', '已成功填充体验数据，可查看今日与月核算！');
  }
}

function handleClearAll() {
  if (confirm('【危险操作】确定要清空所有记工流水和配置数据吗？此操作不可撤销！')) {
    localStorage.clear();
    settings.value = getAppSettings();
    emit('data-changed');
    emit('toast', '所有本地数据已清空');
  }
}
</script>

<style scoped>
.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
