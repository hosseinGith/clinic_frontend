/**
 * Maps backend error codes to clear, professional Persian messages.
 * Specially handles PLAN_LIMIT_EXCEEDED, INVOICE_ALREADY_PAID, etc.
 */
export function getBillingErrorMessage(error: any): string {
  const backendMessage =
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    '';

  const stringMsg = typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage);

  if (stringMsg.includes('maxMonthlyAppointments')) {
    return 'سقف نوبت‌های ماهانه کلینیک در پلن جاری پر شده است. لطفاً برای ثبت نوبت جدید اشتراک را ارتقا دهید.';
  }

  if (stringMsg.includes('maxDoctors')) {
    return 'سقف تعداد پزشکان فعال در پلن فعلی تکمیل شده است. لطفاً برای افزودن پزشک جدید پلن اشتراک خود را ارتقا دهید.';
  }

  if (stringMsg.includes('monthlySmsQuota')) {
    return 'سهمیه پیامک ماهانه کلینیک به اتمام رسیده است.';
  }

  if (stringMsg.includes('PLAN_LIMIT_EXCEEDED')) {
    return 'سقف مجاز مصرف در پلن فعلی تکمیل شده است. لطفاً پلن اشتراک خود را ارتقا دهید.';
  }

  if (stringMsg.includes('SUBSCRIPTION_EXPIRED')) {
    return 'اشتراک کلینیک منقضی شده است. لطفاً جهت فعال‌سازی مجدد نسبت به تمدید یا تسویه فاکتور اقدام کنید.';
  }

  if (stringMsg.includes('INVOICE_ALREADY_PAID')) {
    return 'این فاکتور قبلاً پرداخت شده است.';
  }

  if (stringMsg.includes('INVOICE_VOID')) {
    return 'این فاکتور باطل شده است و امکان ثبت پرداخت روی آن وجود ندارد.';
  }

  if (stringMsg.includes('PAID_INVOICE_CANNOT_BE_VOIDED')) {
    return 'فاکتور پرداخت‌شده قابل ابطال نیست.';
  }

  if (stringMsg.includes('PAYMENT_AMOUNT_MISMATCH')) {
    return 'مبلغ واریزی با مبلغ فاکتور یکسان نیست.';
  }

  return stringMsg || 'خطایی در پردازش عملیات رخ داده است.';
}
