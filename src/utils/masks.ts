// Masks & Formatters for Brazilian Dates, Times, and WhatsApp Numbers

// 1. Phone / WhatsApp Mask & Formatter
export function formatPhoneBR(rawPhone: string | undefined | null): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return rawPhone;

  // If number starts with country code 55 and has 12 or 13 digits (e.g. 5511987654321)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  // 11 digits (DDD + 9 digits cell) -> (11) 98765-4321
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // 10 digits (DDD + 8 digits landline) -> (11) 3333-4444
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return rawPhone;
}

// Auto-mask typed phone input
export function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4, 13);
    if (rest.length > 5) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `+55 (${ddd}) ${rest}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// 2. Date Formatters (convert YYYY-MM-DD -> DD/MM/YYYY)
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return dateStr;
}

// Mask DD/MM/YYYY input while typing
export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

// 3. Extract First Name for Messages & Bot
export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

// Convert DD/MM/YYYY to YYYY-MM-DD for storage / backend
export function parseBRDateToYMD(brDate: string): string {
  if (!brDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(brDate)) return brDate;

  const parts = brDate.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return brDate;
}

// 3. Time Formatter & Mask (HH:mm)
export function formatTime(timeStr: string | undefined | null): string {
  if (!timeStr) return '';
  const digits = timeStr.replace(/\D/g, '').slice(0, 4);
  if (!digits) return timeStr;

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function maskTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';

  let hh = digits.slice(0, 2);
  if (parseInt(hh, 10) > 23) hh = '23';

  let mm = digits.slice(2, 4);
  if (mm.length === 2 && parseInt(mm, 10) > 59) mm = '59';

  if (digits.length <= 2) return hh;
  return `${hh}:${mm}`;
}

// 4. Timestamp Formatter: DD/MM/YYYY às HH:mm
export function formatDateTimeBR(isoString: string | undefined | null): string {
  if (!isoString) return '';
  const parsed = new Date(isoString);
  if (isNaN(parsed.getTime())) return isoString;

  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} às ${hh}:${min}`;
}

// 5. Currency / BRL Value Masks & Formatters
export function parseCurrencyToNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  if (!str) return 0;

  // Remove currency symbols, non-breaking spaces, R$
  const clean = str.replace(/[R$\s]/gi, '').trim();
  if (!clean) return 0;

  // If both dots and commas exist, check position of decimal separator
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // Brazilian format: 1.250,50
      const norm = clean.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(norm);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      // US format: 1,250.50
      const norm = clean.replace(/,/g, '');
      const parsed = parseFloat(norm);
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  // If only comma is used as decimal separator (e.g. 35,00 or 1250,50)
  if (clean.includes(',')) {
    const normalized = clean.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Standard float e.g. 35.00 or 35
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyBR(value: number | string | null | undefined): string {
  const num = parseCurrencyToNumber(value);
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Auto-mask currency typing input (e.g., 3500 -> "35,00" or "R$ 35,00")
export function maskCurrencyInput(rawInput: string | number): string {
  if (typeof rawInput === 'number') {
    return rawInput.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const str = String(rawInput);
  // If user already typed "35.00" or "35,00", handle digits
  const digits = str.replace(/\D/g, '');
  if (!digits) return '0,00';

  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

