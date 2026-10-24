import { toPersianDigits } from './format';

/**
 * Jalali date helpers using the browser's native Intl API with 'fa-IR-u-ca-persian' calendar.
 */

export interface JalaliDay {
  dateString: string; // YYYY-MM-DD (ISO)
  dayName: string; // e.g. "شنبه"
  dayNumber: string; // e.g. "۲۶"
  monthName: string; // e.g. "مهر"
  formatted: string; // e.g. "شنبه ۲۶ مهر"
  isToday: boolean;
  isTomorrow: boolean;
  isWorkingDay: boolean;
}

const persianFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const persianFullFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const persianWeekdayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long',
});

const persianMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'long',
});

const persianDayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  day: 'numeric',
});

/**
 * Returns formatted Jalali date string for a given Date.
 */
export const formatJalaliDate = (date: Date = new Date()): string => {
  return persianFormatter.format(date);
};

/**
 * Returns long Persian date representation.
 * e.g. "یکشنبه ۲۶ مهر ۱۴۰۵"
 */
export const formatJalaliDateFull = (date: Date = new Date()): string => {
  return persianFullFormatter.format(date);
};

/**
 * Formats ISO date string (YYYY-MM-DD) to Jalali date string (e.g. "۱۴۰۵/۷/۲۶").
 */
export const formatIsoToJalali = (dateVal: string | Date | null | undefined): string => {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '';
    return persianFormatter.format(dateVal);
  }
  const dateStr = String(dateVal);
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return persianFormatter.format(date);
    }
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return persianFormatter.format(parsed);
  }
  return toPersianDigits(dateStr);
};

/**
 * Formats ISO date string (YYYY-MM-DD) or Date to full Persian date string (e.g. "یکشنبه 26 مهر 1405").
 */
export const formatIsoToJalaliFull = (dateVal: string | Date | null | undefined): string => {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '';
    return persianFullFormatter.format(dateVal);
  }
  const dateStr = String(dateVal);
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return persianFullFormatter.format(date);
    }
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return persianFullFormatter.format(parsed);
  }
  return toPersianDigits(dateStr);
};

/**
 * Generates the upcoming working days (Saturday through Thursday) for booking.
 * Friday (جمعه) is usually closed or skipped based on clinic hours.
 */
export const getUpcomingWorkingDays = (count: number = 14): JalaliDay[] => {
  const days: JalaliDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let generated = 0;

  // Search forward up to 30 days to get 'count' working days
  for (let i = 0; i < 30 && generated < count; i++) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() + i);

    const dayOfWeek = d.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const isFriday = dayOfWeek === 5;

    // Clinic is open Saturday to Thursday (skip Friday)
    if (!isFriday) {
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = persianWeekdayFormatter.format(d);
      const dayNumber = toPersianDigits(persianDayFormatter.format(d));
      const monthName = persianMonthFormatter.format(d);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      days.push({
        dateString,
        dayName,
        dayNumber,
        monthName,
        formatted: `${dayName} ${dayNumber} ${monthName}`,
        isToday,
        isTomorrow,
        isWorkingDay: true,
      });

      generated++;
    }
  }

  return days;
};

/**
 * Returns ISO date string (YYYY-MM-DD) for today.
 */
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns ISO date string (YYYY-MM-DD) for tomorrow.
 */
export const getTomorrowDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
