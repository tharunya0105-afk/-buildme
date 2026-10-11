/**
 * Local Spot Market Calibration Engine
 * 
 * Bridges the gap between static government schedules (CPWD / TN BCCI)
 * and real-time dealer prices in Tier-2/3 Tamil Nadu towns.
 */

export interface SpotMarketRates {
  district: string;
  cementBrand: string;
  cementBagInr: number; // e.g. 390
  steelFe550PerKgInr: number; // e.g. 64
  mSandPerCftInr: number; // e.g. 55
  blueMetal20mmPerCftInr: number; // e.g. 42
  masonDailyWageInr: number; // e.g. 1100
  helperDailyWageInr: number; // e.g. 750
  lastUpdated: string;
}

export const TAMIL_NADU_SPOT_BENCHMARKS: Record<string, SpotMarketRates> = {
  coimbatore: {
    district: "Coimbatore",
    cementBrand: "UltraTech / Coromandel OPC 53",
    cementBagInr: 385,
    steelFe550PerKgInr: 65,
    mSandPerCftInr: 58,
    blueMetal20mmPerCftInr: 44,
    masonDailyWageInr: 1150,
    helperDailyWageInr: 800,
    lastUpdated: "2026-03-01",
  },
  trichy: {
    district: "Tiruchirappalli",
    cementBrand: "Dalmia / Ramco Supergrade",
    cementBagInr: 375,
    steelFe550PerKgInr: 63,
    mSandPerCftInr: 52,
    blueMetal20mmPerCftInr: 40,
    masonDailyWageInr: 1050,
    helperDailyWageInr: 720,
    lastUpdated: "2026-03-01",
  },
  salem: {
    district: "Salem",
    cementBrand: "Chettinad / ACC",
    cementBagInr: 380,
    steelFe550PerKgInr: 64,
    mSandPerCftInr: 50,
    blueMetal20mmPerCftInr: 38,
    masonDailyWageInr: 1000,
    helperDailyWageInr: 700,
    lastUpdated: "2026-03-01",
  },
  chennai: {
    district: "Chennai Metro",
    cementBrand: "UltraTech / Priya",
    cementBagInr: 410,
    steelFe550PerKgInr: 68,
    mSandPerCftInr: 65,
    blueMetal20mmPerCftInr: 48,
    masonDailyWageInr: 1300,
    helperDailyWageInr: 900,
    lastUpdated: "2026-03-01",
  },
};

/**
 * Computes a local variance multiplier relative to standard CPWD base rate.
 * Ground truth: Contractors accept estimates when calibrated to local dealer spot rates.
 */
export function getLocalVarianceFactor(district: string): {
  factor: number;
  explanation: string;
  spotRate: SpotMarketRates;
} {
  const normalized = district.toLowerCase().replace(/[^a-z]/g, "");
  const spotRate = TAMIL_NADU_SPOT_BENCHMARKS[normalized] || TAMIL_NADU_SPOT_BENCHMARKS.trichy;

  // Baseline CPWD equivalent: Cement @ 390, Steel @ 65
  const basePriceIndex = (390 * 0.4) + (65 * 10 * 0.4) + (1000 * 0.2);
  const currentPriceIndex = (spotRate.cementBagInr * 0.4) + (spotRate.steelFe550PerKgInr * 10 * 0.4) + (spotRate.masonDailyWageInr * 0.2);

  const factor = Number((currentPriceIndex / basePriceIndex).toFixed(3));

  return {
    factor,
    explanation: `Calibrated against ${spotRate.district} spot market (Cement ₹${spotRate.cementBagInr}/bag, Steel ₹${spotRate.steelFe550PerKgInr}/kg)`,
    spotRate,
  };
}
