import * as XLSX from 'xlsx';
import { calculateMonthSummary, getAppSettings, formatMoney, ATTENDANCE_CONFIG } from './storage';

/**
 * 导出指定月份的对账单为 Excel (.xlsx)
 * @param {string} yearMonth 'YYYY-MM'
 */
export function exportMonthToExcel(yearMonth) {
  const summary = calculateMonthSummary(yearMonth);
  const settings = getAppSettings();

  const wb = XLSX.utils.book_new();

  const seniorityNote = summary.config.seniorityMode === 'half_year' 
    ? (summary.seniorityPay > 0 ? '半年一次集中发放' : '半年发一次(本月未发)') 
    : '按月正常发放';

  // 1. 汇总表
  const summaryData = [
    ['【工友记工】月度工资对账汇总表'],
    ['核算月份：', `${yearMonth} (${summary.cycleRange?.startDateStr || ''} 至 ${summary.cycleRange?.endDateStr || ''})`, '记录人：', settings.workerName || '本人', '所属车间/班组：', settings.workshop || '-'],
    ['生成日期：', new Date().toLocaleDateString('zh-CN'), '', '', '', ''],
    [],
    ['=== 考勤天数概况 ===', '', '', '', '', ''],
    ['指标项目', '数值', '单位', '备注说明'],
    ['实际出工天数', summary.workDays, '天', '有产值或流水的工作天数'],
    ['公休轮休天数', summary.publicRestDays, '天', '例行休息排班'],
    ['带薪年休天数', summary.annualLeaveDays, '天', '年休假天数'],
    ['其他请假天数', summary.otherLeaveDays, '天', '调休/事假/病假等'],
    [],
    ['=== 生产直接报酬构成 (单双拼·调机·零工) ===', '', '', '', '', ''],
    ['项目分类', '完成数量', '所得金额(元)', '单价/说明'],
    ['单拼计件', `${summary.singlePieceCount || 0} 件`, Number(formatMoney(summary.singlePieceMoney || 0)), `单价: ${settings.singlePiecePrice || 0.0075}元/件`],
    ['双拼计件', `${summary.doublePieceCount || 0} 件`, Number(formatMoney(summary.doublePieceMoney || 0)), `单价: ${settings.doublePiecePrice || 0.015}元/件`],
    ['调机补贴', `${summary.setupCountTotal || 0} 次`, Number(formatMoney(summary.setupFeeTotal || 0)), `标准: ${settings.defaultSetupFee || 5.0}元/次`],
    ['零工计时', `${summary.hourlyHoursTotal || 0} 小时`, Number(formatMoney(summary.hourlyWorkTotal || 0)), `标准: ${settings.defaultHourlyRate || 15.0}元/小时`],
    ['生产直接报酬合计', `${summary.totalPieces} 件计件`, Number(formatMoney(summary.directWorkTotal || summary.pieceTotal)), '计件 + 调机 + 零工'],
    [],
    ['=== 补贴与福利加项 ===', '', '', '', '', ''],
    ['出勤餐费补贴', Number(formatMoney(summary.mealSubsidyTotal)), '元', `出勤 ${summary.workDays} 天，每天 ${summary.mealSubsidyDaily || 6} 元 (全天出勤自动计入)`],
    ['日附加补贴小计', Number(formatMoney(summary.dailyBonusTotal)), '元', '每日年休带薪/加点零星补贴'],
    ['工龄补贴', Number(formatMoney(summary.seniorityPay)), '元', seniorityNote],
    ['高温补贴', Number(formatMoney(summary.highTempPay)), '元', summary.highTempPay > 0 ? '当月发放高温补贴' : '本月无高温补贴(一年一次)'],
    ['全勤奖金', Number(formatMoney(summary.attendanceBonus)), '元', '月度出勤奖励'],
    ['保底/基本底薪', Number(formatMoney(summary.baseSalary)), '元', '基础固定薪资']
  ];

  if (summary.config.allowances && summary.config.allowances.length > 0) {
    summary.config.allowances.forEach(al => {
      summaryData.push([`补贴：${al.name}`, Number(formatMoney(al.amount)), '元', '其他自定义补贴加项']);
    });
  }

  summaryData.push(['补贴福利加项合计', Number(formatMoney(summary.totalSubsidies)), '元', '所有补贴与福利汇总']);
  summaryData.push([]);

  // 扣款项
  summaryData.push(['=== 支出与代扣除项 ===', '', '', '', '', '']);
  if (summary.config.deductions && summary.config.deductions.length > 0) {
    summary.config.deductions.forEach(de => {
      summaryData.push([`扣款：${de.name}`, Number(formatMoney(de.amount)), '元', '代扣或预支项目']);
    });
  } else {
    summaryData.push(['无额外扣款', 0, '元', '无借支/水电扣款']);
  }
  summaryData.push(['各项扣款合计', Number(formatMoney(summary.totalDeductions)), '元', '当月扣减总计']);
  summaryData.push([]);

  // 最终核算大字
  summaryData.push(['★ 本月实发应得总额 ★', Number(formatMoney(summary.finalSalary)), '元 (RMB)', '直接工钱 + 补贴福利 - 扣款']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 32 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, '月度汇总总表');

  // 2. 每日详细流水表
  const detailHeaders = [
    '记工日期',
    '考勤状态',
    '工序类型',
    '款号/标识',
    '数量(件)',
    '单价(元)',
    '计件工钱(元)',
    '调机(次)',
    '调机费(元)',
    '本款合计(元)',
    '今日零工(元)',
    '零工说明',
    '出勤餐补(元)',
    '今日总收入(元)',
    '备注'
  ];

  const detailRows = [detailHeaders];

  (summary.dayRecords || []).forEach(day => {
    const attLabel = (ATTENDANCE_CONFIG[day.attendanceType] && ATTENDANCE_CONFIG[day.attendanceType].label) || '出勤';
    const hw = day.hourlyWork || {};
    const hwText = hw.hours > 0 ? `${hw.hours}时×¥${hw.rate}=¥${hw.total}` : '-';
    const hwNote = hw.note || '';
    const mealText = day.dayMealSubsidy > 0 ? Number(formatMoney(day.dayMealSubsidy)) : 0;

    if (!day.items || day.items.length === 0) {
      detailRows.push([
        day.date,
        attLabel,
        day.attendanceType === 'work' ? '(无计件)' : `【${attLabel}】`,
        '-',
        '-',
        '-',
        0,
        0,
        0,
        0,
        hw.total || 0,
        hwText,
        mealText,
        day.dayTotalMoney || 0,
        day.notes || ''
      ]);
      return;
    }

    day.items.forEach((it, idx) => {
      const isFirst = idx === 0;
      const hwCol = isFirst ? (hw.total || 0) : '';
      const hwNoteCol = isFirst ? hwText : '';
      const mealCol = isFirst ? mealText : '';
      const dayTotalCol = isFirst ? day.dayTotalMoney : '';
      const dayNotesCol = isFirst ? (day.notes || '') : '';

      detailRows.push([
        day.date,
        isFirst ? attLabel : '',
        it.name || (it.type === 'double' ? '双拼' : '单拼'),
        it.modelName || `第${idx + 1}款`,
        it.count,
        it.price,
        it.pieceMoney || Number((it.count * it.price).toFixed(2)),
        it.setupCount || 0,
        it.setupFee || 0,
        it.total,
        hwCol,
        hwNoteCol,
        mealCol,
        dayTotalCol,
        it.remark || dayNotesCol
      ]);
    });
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, '每日工序明细清单');

  const filename = `工友记工对账单_${yearMonth}_${settings.workerName ? settings.workerName + '_' : ''}${Date.now().toString().slice(-4)}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}
