/**
 * Scheme Interest & Maturity Calculator Utility
 * Implements Standard Banking & NBFC compounding formulas for RD and FD.
 */

/**
 * Calculates RD (Recurring Deposit) Maturity Return % based on YEARLY COMPOUNDING
 * As requested: RD uses Yearly Compounding on regular monthly installments.
 * 
 * Formula:
 * For each monthly installment k (1 to M), holding period in years is: (M - k + 1) / 12
 * Compounded annually: Amount_k = P * (1 + annualRate / 100)^((M - k + 1) / 12)
 * Total Maturity = Sum(Amount_k)
 * Return % = (Total Maturity / (P * M)) * 100
 * 
 * @param {number|string} annualRate - Annual interest rate in percent (e.g. 10.5 for 10.5% p.a.)
 * @param {number|string} tenureMonths - Total tenure in months (e.g. 12, 24, 28, 36)
 * @returns {number} Return % (e.g. 111.14 for 24M @ 10.5%)
 */
export function calculateRdReturnPercent(annualRate, tenureMonths) {
  const r = Number(annualRate);
  const m = Number(tenureMonths);
  if (!r || r <= 0 || !m || m <= 0) return 0;

  const P = 100; // Base reference installment amount
  const rateFraction = r / 100;
  let totalMaturity = 0;

  for (let k = 1; k <= m; k++) {
    const yearsInvested = (m - k + 1) / 12;
    totalMaturity += P * Math.pow(1 + rateFraction, yearsInvested);
  }

  const totalPrincipal = P * m;
  const returnPct = (totalMaturity / totalPrincipal) * 100;
  return Number(returnPct.toFixed(2));
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
