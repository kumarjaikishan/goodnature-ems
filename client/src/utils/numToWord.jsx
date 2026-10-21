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

numberToWords.amountInWords = amountInWords;
export default numberToWords;
