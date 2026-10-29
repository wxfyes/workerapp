<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-sheet">
      <!-- 弹窗标题栏 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 18px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 4px; height: 18px; background: var(--accent-gold); border-radius: 2px;"></span>
          {{ isEdit ? '修改本款记工' : '记一款 (单拼 / 双拼)' }}
        </div>
        <button 
          @click="$emit('close')" 
          style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"
        >
          <X :size="22" />
        </button>
      </div>

      <!-- 实时核算高亮展示区 -->
      <div style="background: linear-gradient(135deg, #1e293b, #172136); border: 1px solid var(--accent-gold); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 13px; color: var(--text-muted);">本款合计总收入</span>
          <div>
            <span style="font-size: 15px; color: var(--accent-gold); font-weight: 600; margin-right: 2px;">¥</span>
            <span style="font-size: 30px; font-weight: 900; color: var(--accent-gold-light); letter-spacing: 0.5px;">
              {{ currentTotalMoney }}
            </span>
            <span style="font-size: 13px; color: var(--text-muted); margin-left: 4px;">元</span>
          </div>
        </div>

        <!-- 费用明细构成透视 -->
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <span>计件工钱: <b style="color: var(--text-main);">¥{{ currentPieceMoney }}</b></span>
          <span>调机费: <b style="color: #38bdf8;">+¥{{ currentSetupFee }}</b> ({{ form.setupCount }}次)</span>
        </div>
      </div>

      <!-- 1. 品名工序下拉选择：单拼 VS 双拼 -->
      <div class="form-group">
        <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
          <span>品名 / 工序类型 <span style="color: var(--accent-gold);">*</span></span>
          <span style="font-size: 11px; color: var(--text-sub);">价格已固定，可在设置中调整单价</span>
        </label>
        
        <!-- 大号单双拼快捷按钮组 (比纯下拉更适合车间秒点) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
          <div 
            :style="{
              padding: '12px 10px',
              borderRadius: 'var(--radius-sm)',
              border: form.type === 'single' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
              background: form.type === 'single' ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-input)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }"
            @click="selectType('single')"
          >
            <div style="font-size: 16px; font-weight: 800; color: form.type === 'single' ? 'var(--accent-gold-light)' : 'var(--text-main)';">
              单拼
            </div>
            <div style="font-size: 12px; color: form.type === 'single' ? 'var(--accent-gold)' : 'var(--text-muted); margin-top: 2px;">
              固定单价: ¥{{ settings.singlePiecePrice || 0.0075 }}/件
            </div>
          </div>

          <div 
            :style="{
              padding: '12px 10px',
              borderRadius: 'var(--radius-sm)',
              border: form.type === 'double' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
              background: form.type === 'double' ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-input)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }"
            @click="selectType('double')"
          >
            <div style="font-size: 16px; font-weight: 800; color: form.type === 'double' ? 'var(--accent-gold-light)' : 'var(--text-main)';">
              双拼
            </div>
            <div style="font-size: 12px; color: form.type === 'double' ? 'var(--accent-gold)' : 'var(--text-muted); margin-top: 2px;">
              固定单价: ¥{{ settings.doublePiecePrice || 0.015 }}/件
            </div>
          </div>
        </div>

        <!-- 备用原生下拉框 (满足偏好下拉的用户) -->
        <select 
          v-model="form.type" 
          @change="onSelectChange"
          class="form-input"
          style="font-size: 14px; padding: 8px 10px;"
        >
          <option value="single">单拼 (固定单价: ¥{{ settings.singlePiecePrice || 0.0075 }}/件)</option>
          <option value="double">双拼 (固定单价: ¥{{ settings.doublePiecePrice || 0.015 }}/件)</option>
        </select>
      </div>

      <!-- 2. 款号标识 (选填，用于一天干4~5款区分) -->
      <div class="form-group">
        <label class="form-label" style="display: flex; justify-content: space-between;">
          <span>产品款号 / 批次 (选填)</span>
          <span style="font-size: 11px; color: var(--text-sub);">如一天干多款，可填款号方便对账</span>
        </label>
        <input 
          v-model="form.modelName"
          type="text" 
          class="form-input" 
          placeholder="例如：第1款、702款、A型、大件..."
          style="font-size: 14px; padding: 10px;"
          maxlength="20"
        />
      </div>

      <!-- 3. 数量与单价 (单价固定只读展示) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <!-- 数量 -->
        <div>
          <label class="form-label">
            数量 <span style="color: var(--accent-gold);">*</span> (件)
          </label>
          <input 
            v-model.number="form.count"
            type="number" 
            step="100"
            min="0"
            class="form-input" 
            placeholder="0"
            style="font-size: 22px; font-weight: 800; text-align: center; color: #fff;"
          />
          <!-- 快捷数量按钮 (车间量大，预设+1000,+5000,+10000) -->
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 4px 0; font-size: 11px;" @click="addCount(1000)">+1千</button>
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 4px 0; font-size: 11px;" @click="addCount(5000)">+5千</button>
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; padding: 4px 0; font-size: 11px;" @click="addCount(10000)">+1万</button>
          </div>
        </div>

        <!-- 固定单价 (锁定只读) -->
        <div>
          <label class="form-label" style="display: flex; justify-content: space-between;">
            <span>单价 (元/件)</span>
            <span style="font-size: 11px; color: var(--accent-gold);">锁定</span>
          </label>
          <div style="background: var(--bg-input); border: 1px dashed var(--border-color); border-radius: var(--radius-sm); padding: 12px 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: var(--accent-gold-light);">
              ¥{{ currentPrice }}
            </div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
              {{ form.type === 'single' ? '单拼固定' : '双拼固定' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 调机费专区 (固定 5 元一次，用户重点要求) -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
            <Wrench :size="15" style="color: #38bdf8;" />
            <span>调机费 (固定 5 元/次)</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
            每干一笔/每款调机一次补 5 元
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            style="padding: 2px 8px; font-weight: 700;"
            @click="form.setupCount = Math.max(0, form.setupCount - 1)"
          >
            -
          </button>
          <span style="font-size: 15px; font-weight: 800; color: #38bdf8; min-width: 32px; text-align: center;">
            {{ form.setupCount }}次
          </span>
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            style="padding: 2px 8px; font-weight: 700;"
            @click="form.setupCount = form.setupCount + 1"
          >
            +
          </button>
          <span style="font-size: 13px; font-weight: 700; color: var(--accent-gold); margin-left: 4px;">
            +¥{{ (form.setupCount * (settings.defaultSetupFee || 5)).toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- 5. 备注说明 (可选) -->
      <div class="form-group" style="margin-bottom: 18px;">
        <label class="form-label">备注 (可选)</label>
        <input 
          v-model="form.remark"
          type="text" 
          class="form-input" 
          placeholder="如：带班组长确认、加急模具"
          style="font-size: 13px; padding: 8px 10px;"
          maxlength="50"
        />
      </div>

      <!-- 底部操作按钮 (支持一天干4~5款，连续添加) -->
      <div style="display: flex; gap: 10px;">
        <button 
          v-if="!isEdit"
          type="button" 
          class="btn btn-secondary" 
          style="flex: 1; padding: 13px; font-size: 14px;"
          @click="submit(false)"
        >
          保存并加下一款
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          style="flex: 1; padding: 13px; font-size: 14px;"
          @click="submit(true)"
        >
          {{ isEdit ? '保存修改' : '完成保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { X, Wrench } from 'lucide-vue-next';
import { getAppSettings, formatMoney } from '../utils/storage';

const props = defineProps({
  initialItem: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => !!(props.initialItem && props.initialItem.id));
const settings = ref(getAppSettings());

const form = ref({
  id: '',
  type: 'single', // 'single' (单拼) 或 'double' (双拼)
  modelName: '',  // 款号，方便一天干多款
  count: '',      // 件数
  setupCount: 1,  // 调机次数，默认每笔调机1次 (5元)
  remark: ''
});

onMounted(() => {
  settings.value = getAppSettings();
  if (props.initialItem) {
    const item = props.initialItem;
    form.value = {
      id: item.id || '',
      type: item.type || (item.name === '双拼' ? 'double' : 'single'),
      modelName: item.modelName || '',
      count: item.count !== undefined ? item.count : '',
      setupCount: item.setupCount !== undefined ? item.setupCount : 1,
      remark: item.remark || ''
    };
  }
});

// 当前固定单价：单拼 0.0075，双拼 0.015
const currentPrice = computed(() => {
  if (form.value.type === 'double') {
    return settings.value.doublePiecePrice || 0.015;
  }
  return settings.value.singlePiecePrice || 0.0075;
});

// 纯计件工钱 = 件数 × 单价
const currentPieceMoney = computed(() => {
  const count = Number(form.value.count) || 0;
  return (count * currentPrice.value).toFixed(2);
});

// 调机费 = 调机次数 × 5元
const currentSetupFee = computed(() => {
  const setupCount = Number(form.value.setupCount) || 0;
  const unit = Number(settings.value.defaultSetupFee) || 5.0;
  return (setupCount * unit).toFixed(2);
});

// 本款合计总收入 = 计件工钱 + 调机费
const currentTotalMoney = computed(() => {
  const p = Number(currentPieceMoney.value);
  const s = Number(currentSetupFee.value);
  return formatMoney(p + s);
});

function selectType(t) {
  form.value.type = t;
}

function onSelectChange() {
  // select 下拉联动
}

function addCount(val) {
  const cur = Number(form.value.count) || 0;
  form.value.count = cur + val;
}

function submit(closeAfterSave) {
  const count = Number(form.value.count);
  if (isNaN(count) || count <= 0) {
    alert('请输入生产数量（件数需大于0）');
    return;
  }

  const typeName = form.value.type === 'double' ? '双拼' : '单拼';
  const price = currentPrice.value;
  const setupCount = Math.max(0, Number(form.value.setupCount) || 0);
  const setupFeeUnit = Number(settings.value.defaultSetupFee) || 5.0;
  const setupFee = Number((setupCount * setupFeeUnit).toFixed(2));
  const pieceMoney = Number((count * price).toFixed(4));
  const total = Number((pieceMoney + setupFee).toFixed(2));

  const savedItem = {
    id: form.value.id || undefined,
    type: form.value.type,
    name: typeName,
    modelName: form.value.modelName.trim(),
    count: Math.round(count),
    price,
    setupCount,
    setupFeeUnit,
    setupFee,
    pieceMoney,
    total,
    isDirect: false,
    remark: form.value.remark.trim()
  };

  emit('save', { item: savedItem, close: closeAfterSave });

  if (!closeAfterSave) {
    // 保存并继续添加下一款：保留调机费1次，清空数量和款号
    form.value = {
      id: '',
      type: form.value.type, // 保留当前类型或切换
      modelName: '',
      count: '',
      setupCount: 1,
      remark: ''
    };
  }
}
</script>
