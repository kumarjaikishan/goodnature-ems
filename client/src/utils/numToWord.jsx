const ones = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen'
];

const tens = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty',
  'sixty', 'seventy', 'eighty', 'ninety'
];

function convertBelowThousand(n) {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (str !== '') str += 'and ';
    if (n < 20) {
      str += ones[n] + ' ';
    } else {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) {
        str += ' ' + ones[n % 10];
      }
      str += ' ';
    }
  }
  return str;
}

/**
 * Converts a positive integer into Indian numbering words (crore, lakh, thousand, hundred).
 * Recursively handles numbers above 100 Crore without overflow.
 */
export function convertNumberToIndianWords(n) {
  if (n === 0) return 'zero';
  if (n < 0) return 'minus ' + convertNumberToIndianWords(Math.abs(n));

  let str = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const remainder = n;

  if (crore > 0) {
    str += convertNumberToIndianWords(crore) + ' crore ';
  }
  if (lakh > 0) {
    str += (ones[lakh] || (tens[Math.floor(lakh / 10)] + (lakh % 10 > 0 ? ' ' + ones[lakh % 10] : ''))) + ' lakh ';
  }
  if (thousand > 0) {
    str += (ones[thousand] || (tens[Math.floor(thousand / 10)] + (thousand % 10 > 0 ? ' ' + ones[thousand % 10] : ''))) + ' thousand ';
  }
  if (remainder > 0) {
    str += convertBelowThousand(remainder);
  }

  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Standard number to words converter (backwards compatible).
 * Returns lowercase words string, e.g. "ten lakh" or "one crore fifty lakh".
 */
export function numberToWords(num) {
  if (num === null || num === undefined || num === '') return '';
  const cleanStr = String(num).replace(/,/g, '').trim();
  const n = Number(cleanStr);
  if (isNaN(n)) return '';

  const [rupeesPart, paisePart] = cleanStr.split('.');
  const rupees = parseInt(rupeesPart, 10) || 0;
  const paise = paisePart ? parseInt(paisePart.padEnd(2, '0').slice(0, 2), 10) : 0;

  let result = '';
  if (rupees > 0) {
    result += convertNumberToIndianWords(rupees);
  } else if (rupees === 0 && paise === 0) {
    return 'zero';
  }

  if (paise > 0) {
    result += (result ? ' and ' : '') + convertNumberToIndianWords(paise) + ' paise';
  }

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Common formatting function for displaying currency amounts in words across all inputs and forms.
 * @param {number|string} num - Amount to convert
 * @param {object} options
 * @param {string} options.case - 'title' (default), 'upper', 'lower'
 * @param {boolean} options.only - Append "Only" at the end (default false)
 * @param {boolean} options.noCurrency - Do not append Rupee/Rupees (default false)
 * @returns {string} e.g. "Ten Lakh Rupees" or "Fourteen Lakh Ninety-Nine Thousand Nine Hundred And Ninety-Nine Rupees"
 */
export function amountInWords(num, options = {}) {
  if (num === null || num === undefined || num === '') return '';
  const cleanStr = String(num).replace(/,/g, '').trim();
  const n = Number(cleanStr);
  if (isNaN(n) || n <= 0) return '';

  const rawWords = numberToWords(cleanStr);
  if (!rawWords || rawWords === 'zero') return '';

  const c = options.case || 'title';
  let formatted = rawWords;
  if (c === 'title') {
    formatted = rawWords
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } else if (c === 'upper') {
    formatted = rawWords.toUpperCase();
  }

  const [rupeesPart] = cleanStr.split('.');
  const rupees = parseInt(rupeesPart, 10) || 0;
  const currencyStr = rupees === 1 ? 'Rupee' : 'Rupees';

  if (options.noCurrency) {
    return options.only ? `${formatted} Only` : formatted;
  }

  if (options.only) {
    return `${formatted} ${currencyStr} Only`;
  }

  return `${formatted} ${currencyStr}`;
}

/**
 * Formats a number or string into Indian currency comma format (e.g. 1,12,529 or 10,00,000).
 * Handles decimals and preserves valid formatting in real-time as users type.
 */
export function formatIndianNumber(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/,/g, '').trim();
  if (!str) return '';
  if (isNaN(Number(str))) return str;

  const parts = str.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }

  // Remove leading zeros except when integer is just "0"
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '') || '0';
  }

  if (integerPart.length <= 3) {
    return (isNegative ? '-' : '') + integerPart + decimalPart;
  }

  const lastThree = integerPart.slice(-3);
  const remaining = integerPart.slice(0, -3);
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return (isNegative ? '-' : '') + formattedRemaining + ',' + lastThree + decimalPart;
}

export function parseIndianNumber(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/,/g, '').trim();
}

/**
 * Real-time Indian currency input event handler with stable cursor positioning.
 * Automatically strips commas before updating state, preserving the cursor position.
 */
export function handleFormattedNumberInput(e, onChange) {
  const input = e.target;
  const oldVal = input.value || '';
  const selectionStart = input.selectionStart || 0;
  const rawBeforeCursor = oldVal.slice(0, selectionStart).replace(/,/g, '').length;
  const rawValue = oldVal.replace(/,/g, '');

  onChange(rawValue);

  requestAnimationFrame(() => {
    if (!input) return;
    const newVal = input.value || '';
    let newCursor = newVal.length;
    let nonCommaSeen = 0;
    if (rawBeforeCursor === 0) {
      newCursor = 0;
    } else {
      for (let i = 0; i < newVal.length; i++) {
        if (newVal[i] !== ',') {
          nonCommaSeen++;
        }
        if (nonCommaSeen === rawBeforeCursor) {
          newCursor = i + 1;
          break;
        }
      }
    }
    input.setSelectionRange(newCursor, newCursor);
  });
}

numberToWords.amountInWords = amountInWords;
numberToWords.formatIndianNumber = formatIndianNumber;
numberToWords.parseIndianNumber = parseIndianNumber;
numberToWords.handleFormattedNumberInput = handleFormattedNumberInput;
export default numberToWords;

