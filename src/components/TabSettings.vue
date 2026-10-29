<template>
  <div>
    <!-- 1. 核心工价与单双拼价格配置 (用户重点需求) -->
    <div class="card" style="border: 1px solid var(--accent-gold);">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <Coins :size="18" style="color: var(--accent-gold);" />
          <span>计件单价与车间工价标准</span>
        </div>
        <span class="badge badge-gold" style="font-size: 10px;">记一笔时自动采用</span>
      </div>

      <!-- 单双拼价格 (双列) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <!-- 单拼单价 -->
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

        <!-- 双拼单价 -->
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

      <!-- 调机费与零工时薪 (双列) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <!-- 调机费 -->
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

        <!-- 零工时薪 -->
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
    </div>

    <!-- 2. 工龄补贴发放模式与默认规则 -->
    <div class="card">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
        <Sliders :size="18" style="color: var(--accent-gold);" />
        工龄补贴发放规则
      </div>

      <!-- 模式单选 -->
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

      <!-- 按月发输入项 -->
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

      <!-- 半年发一次输入项 -->
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

    <!-- 3. 个人与车间信息 (用于Excel对账单) -->
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

    <!-- 4. 数据备份与防丢 -->
    <div class="card">
      <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
        <ShieldCheck :size="18" style="color: var(--accent-green);" />
        数据防丢与迁移备份
      </div>

      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.6;">
        数据 100% 存放于手机本地，无需联网。换手机或月底核算时建议点击备份保存。
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <button class="btn btn-secondary" @click="handleExportJSON">
          <Download :size="16" /> 备份全部数据
        </button>

        <label class="btn btn-secondary" style="cursor: pointer; position: relative;">
          <Upload :size="16" /> 恢复备份数据
          <input 
            type="file" 
            accept=".json" 
            style="position: absolute; opacity: 0; width: 100%; height: 100%; top: 0; left: 0; cursor: pointer;"
            @change="handleImportJSON"
          />
        </label>
      </div>
    </div>

    <!-- 5. 演示与维护 -->
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

    <!-- 底部版权说明 -->
    <div style="text-align: center; padding: 18px 0; font-size: 12px; color: var(--text-sub);">
      工友记工 (单双拼与调机费专业版)<br>
      单拼0.0075 · 双拼0.015 · 调机5元 · 计时零工
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  User, Sliders, ShieldCheck, Download, Upload, 
  Wrench, Sparkles, Trash, Coins 
} from 'lucide-vue-next';
import { 
  getAppSettings, saveAppSettings, exportAllDataJSON, 
  importAllDataJSON, seedDemoData 
} from '../utils/storage';

const emit = defineEmits(['toast', 'data-changed']);

const settings = ref({
  singlePiecePrice: 0.0075,
  doublePiecePrice: 0.015,
  defaultSetupFee: 5.0,
  defaultHourlyRate: 15.0,
  seniorityMode: 'monthly',
  defaultSeniorityPay: 200,
  halfYearSeniorityAmount: 1200,
  workerName: '',
  workshop: ''
});

onMounted(() => {
  settings.value = getAppSettings();
});

function saveCurrentSettings() {
  saveAppSettings(settings.value);
  emit('data-changed');
  emit('toast', '设置已保存');
}

function handleExportJSON() {
  const jsonStr = exportAllDataJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `工友记工_单双拼备份_${d}.json`;
  a.click();
  URL.revokeObjectURL(url);
  emit('toast', '备份数据已下载保存！');
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
        emit('toast', '数据恢复成功！');
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
