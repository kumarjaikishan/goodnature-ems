/**
 * Scheme Interest & Maturity Calculator Utility
 * Implements Standard Banking & NBFC compounding formulas for RD and FD.
 */

const COMPOUND_PERIODS = {
  YEARLY: 1,
  HALF_YEARLY: 2,
  QUARTERLY: 4,
};

/**
 * Calculates Maturity Return % based on compounding frequency on monthly installments.
 * Defaults to YEARLY compounding.
 *
 * @param {number|string} annualRate - Annual interest rate in percent (e.g. 11.286)
 * @param {number|string} tenureMonths - Total tenure in months (e.g. 24, 36)
 * @param {'YEARLY'|'HALF_YEARLY'|'QUARTERLY'} compoundMode - Compounding frequency (defaults to YEARLY)
 * @returns {number} Return % (e.g. 112 for 24M @ 11.286% Yearly)
 */
export function calculateRdReturnPercent(annualRate, tenureMonths, compoundMode = 'YEARLY') {
  const r = Number(annualRate);
  const m = Number(tenureMonths);
  if (!r || r <= 0 || !m || m <= 0) return 0;

  const n = COMPOUND_PERIODS[compoundMode] || 1;
  const P = 100; // Base reference installment amount
  const periodRate = r / (100 * n);
  let totalMaturity = 0;

  for (let k = 1; k <= m; k++) {
    const yearsInvested = (m - k + 1) / 12;
    totalMaturity += P * Math.pow(1 + periodRate, n * yearsInvested);
  }

  const totalPrincipal = P * m;
  const returnPct = (totalMaturity / totalPrincipal) * 100;
  return Number(returnPct.toFixed(2));
}

/**
 * Reverse-calculates Annual Interest Rate (% p.a.) from a target Return % and tenure.
 *
 * @param {number|string} returnPercent - Target maturity return % (e.g. 112)
 * @param {number|string} tenureMonths - Total tenure in months (e.g. 24)
 * @param {'YEARLY'|'HALF_YEARLY'|'QUARTERLY'} compoundMode - Compounding frequency (defaults to YEARLY)
 * @returns {number} Annual interest rate % p.a. (rounded to 3 decimal places)
 */
export function calculateRateFromReturnPercent(returnPercent, tenureMonths, compoundMode = 'YEARLY') {
  const target = Number(returnPercent);
  const m = Number(tenureMonths);
  if (!target || target <= 100 || !m || m <= 0) return 0;

  let low = 0;
  let high = 200;
  for (let i = 0; i < 45; i++) {
    const mid = (low + high) / 2;
    const calc = calculateRdReturnPercent(mid, m, compoundMode);
    if (calc < target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Number(((low + high) / 2).toFixed(3));
}

/**
 * Calculates FD (Fixed Deposit / One-Time) Maturity Return %
 * Standard banking uses Quarterly Compounding (4 times a year).
 * 
 * Formula (Quarterly):
 * A = P * (1 + r / 400)^(tenureMonths / 3)
 * Return % = (A / P) * 100 = 100 * (1 + r / 400)^(tenureMonths / 3)
 * 
 * Formula (Yearly):
 * A = P * (1 + r / 100)^(tenureMonths / 12)
 * 
 * @param {number|string} annualRate - Annual interest rate in percent (e.g. 10.5 for 10.5% p.a.)
 * @param {number|string} tenureMonths - Total tenure in months (e.g. 12, 24, 28, 36)
 * @param {'QUARTERLY'|'YEARLY'} compoundMode - Compounding frequency (defaults to QUARTERLY as per bank standard)
 * @returns {number} Return % (e.g. 123.03 for 24M @ 10.5%)
 */
export function calculateFdReturnPercent(annualRate, tenureMonths, compoundMode = 'QUARTERLY') {
  const r = Number(annualRate);
  const m = Number(tenureMonths);
  if (!r || r <= 0 || !m || m <= 0) return 0;

  const years = m / 12;
  let returnPct = 100;

  if (compoundMode === 'YEARLY') {
    returnPct = 100 * Math.pow(1 + r / 100, years);
  } else {
    // Quarterly compound standard (matches standard Indian banking FD calculators)
    returnPct = 100 * Math.pow(1 + r / 400, years * 4);
  }

  return Number(returnPct.toFixed(2));
}
