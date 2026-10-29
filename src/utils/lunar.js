import { Solar, HolidayUtil } from 'lunar-javascript';

/**
 * 获取指定公历日期的中国法定节假日、调休安排与农历节日信息 (100% 离线)
 * @param {number} year 公历年
 * @param {number} month 公历月 (1-12)
 * @param {number} day 公历日 (1-31)
 */
export function getChinaCalendarInfo(year, month, day) {
  try {
    const solar = Solar.fromYmd(year, month, day);
    const holiday = HolidayUtil.getHoliday(year, month, day);
    const lunar = solar.getLunar();

    let isHoliday = false;
    let isWork = false; // 是否因调休需要补班
    let holidayName = '';

    if (holiday) {
      isHoliday = true;
      isWork = holiday.isWork(); // true: 调休上班; false: 放假休息
      holidayName = holiday.getName();
    }

    // 农历与传统节日
    const lunarFestivals = lunar.getFestivals();
    const solarFestivals = solar.getFestivals();
    let displayFestival = '';

    if (holidayName) {
      displayFestival = holidayName.replace(/节$/, '');
    } else if (lunarFestivals && lunarFestivals.length > 0) {
      displayFestival = lunarFestivals[0];
    } else if (solarFestivals && solarFestivals.length > 0) {
      displayFestival = solarFestivals[0];
    }

    // 农历月日显示 (如八月十五、除夕、初一)
    const lunarDayName = lunar.getDayInChinese();
    const lunarMonthName = lunar.getMonthInChinese();

    return {
      isHoliday,
      isWork, // true: 调休【班】, false: 节假日【休】
      holidayName,
      displayFestival: displayFestival.slice(0, 4), // 限制最多4个字
      lunarText: lunarDayName === '初一' ? `${lunarMonthName}月` : lunarDayName
    };
  } catch (e) {
    console.error('获取节假日信息异常', e);
    return {
      isHoliday: false,
      isWork: false,
      holidayName: '',
      displayFestival: '',
      lunarText: ''
    };
  }
}
