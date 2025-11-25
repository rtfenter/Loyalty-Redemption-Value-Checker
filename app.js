// Region & FX configuration (defaults)
// fxToBase = base currency per 1 unit of local currency (e.g., 1 EUR = 1.10 USD)
const fxConfig = {
  US: { code: "US", label: "United States (USD)", currency: "USD", fxToBase: 1.0 },
  EU: { code: "EU", label: "Europe (EUR)", currency: "EUR", fxToBase: 1.1 },
  UK: { code: "UK", label: "United Kingdom (GBP)", currency: "GBP", fxToBase: 1.27 },
  JP: { code: "JP", label: "Japan (JPY)", currency: "JPY", fxToBase: 0.007 }
};

const partners = {
  GSTAY: {
    id: "GSTAY",
    name: "GlobalStay Hotels",
    type: "Hotel",
    note: "Hotel redemptions typically anchor top-tier perceived value."
  },
  MART: {
    id: "MART",
    name: "MetroMart Retail",
    type: "Retail",
    note: "Grocery and essential retail expose everyday redemption value."
  },
  STREAM: {
    id: "STREAM",
    name: "StreamFlix Media",
    type: "Digital",
    note: "Subscription rewards surface small-value parity issues quickly."
  }
};

// DOM references
const basePointValueEl = document.getElementById("base-point-value");
const rewardNameEl = document.getElementById("reward-name");
const pointsCostEl = document.getElementById("points-cost");
const partnerEl = document.getElementById("partner");

const regionAEl = document.getElementById("region-a");
const regionBEl = document.getElementById("region-b");
const fxAEl = document.getElementById("fx-a");
const fxBEl = document.getElementById("fx-b");
const copayAEl = document.getElementById("copay-a");
const copayBEl = document.getElementById("copay-b");

const runBtn = document.getElementById("runBtn");
const loadExampleBtn = document.getElementById("load-example");
const calcStatusEl = document.getElementById("calc-status");

const summaryBadgeEl = document.getElementById("summary-badge");
const summaryTextEl = document.getElementById("summary-text");

const rewardLineEl = document.getElementById("reward-line");
const regionALineEl = document.getElementById("region-a-line");
const regionBLineEl = document.getElementById("region-b-line");

const flowPathEl = document.getElementById("flow-path");
const rawOutputEl = document.getElementById("raw-output");

// Helpers

function formatCurrency(amount, currencyCode) {
  if (isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatNumber(amount, decimals) {
  if (isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals ?? 2
  }).format(amount);
}

function updateSummaryBadge(statusKey, labelText, detailText) {
  summaryBadgeEl.classList.remove(
    "summary-badge-idle",
    "summary-badge-ok",
    "summary-badge-warn",
    "summary-badge-fail"
  );

  if (statusKey === "high") {
    summaryBadgeEl.classList.add("summary-badge-ok");
    summaryBadgeEl.textContent = labelText || "High Parity";
  } else if (statusKey === "medium") {
    summaryBadgeEl.classList.add("summary-badge-warn");
    summaryBadgeEl.textContent = labelText || "Medium Drift";
  } else if (statusKey === "broken") {
    summaryBadgeEl.classList.add("summary-badge-fail");
    summaryBadgeEl.textContent = labelText || "Broken Parity";
  } else {
    summaryBadgeEl.classList.add("summary-badge-idle");
    summaryBadgeEl.textContent = labelText || "No analysis yet.";
  }

  if (detailText) {
    summaryTextEl.textContent = detailText;
  }
}

function getFxForRegion(regionCode, explicitValue) {
  const cfg = fxConfig[regionCode];
  const fallback = cfg ? cfg.fxToBase : 1.0;

  const parsed = parseFloat(explicitValue);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function runIntegrityCheck() {
  const basePointValue = parseFloat(basePointValueEl.value);
  const pointsCost = parseFloat(pointsCostEl.value);
  const rewardNameRaw = rewardNameEl.value.trim();
  const rewardName = rewardNameRaw || "Unnamed Reward";

  const partnerId = partnerEl.value;
  const partnerMeta = partners[partnerId];

  const regionACode = regionAEl.value;
  const regionBCode = regionBEl.value;
  const regionA = fxConfig[regionACode];
  const regionB = fxConfig[regionBCode];

  const fxA = getFxForRegion(regionACode, fxAEl.value);
  const fxB = getFxForRegion(regionBCode, fxBEl.value);

  const copayALocal = parseFloat(copayAEl.value || "0") || 0;
  const copayBLocal = parseFloat(copayBEl.value || "0") || 0;

  // Basic validation
  if (isNaN(basePointValue) || basePointValue <= 0) {
    updateSummaryBadge(
      "idle",
      "No analysis yet.",
      "Enter a valid base point value greater than zero to run the check."
    );
    calcStatusEl.textContent = "Unable to calculate — invalid base point value.";
    rewardLineEl.textContent =
      "Points cost, base point value, and implied base value will appear here.";
    regionALineEl.textContent = "Region A’s effective reward value will appear here.";
    regionBLineEl.textContent = "Region B’s effective reward value will appear here.";
    flowPathEl.textContent = "No analysis yet.";
    rawOutputEl.textContent = "No analysis yet.";
    return;
  }

  if (isNaN(pointsCost) || pointsCost <= 0) {
    updateSummaryBadge(
      "idle",
      "No analysis yet.",
      "Enter a valid points cost to understand reward value across regions."
    );
    calcStatusEl.textContent = "Unable to calculate — invalid points cost.";
    return;
  }

  calcStatusEl.textContent = "";

  const pointsValueBase = pointsCost * basePointValue; // in base currency

  // Co-pays converted to base
  const copayABase = copayALocal * fxA;
  const copayBBase = copayBLocal * fxB;

  const rewardValueBaseA = pointsValueBase + copayABase;
  const rewardValueBaseB = pointsValueBase + copayBBase;

  // Effective local value (for explanation)
  const rewardValueLocalA = fxA > 0 ? rewardValueBaseA / fxA : 0;
  const rewardValueLocalB = fxB > 0 ? rewardValueBaseB / fxB : 0;

  // Drift calculation (symmetric percentage difference)
  let driftPercent = 0;
  let parityStatus = "high";

  if (rewardValueBaseA > 0 && rewardValueBaseB > 0) {
    const mean = (rewardValueBaseA + rewardValueBaseB) / 2;
    driftPercent = Math.abs(rewardValueBaseA - rewardValueBaseB) / mean * 100;

    if (driftPercent < 10) {
      parityStatus = "high";
    } else if (driftPercent < 25) {
      parityStatus = "medium";
    } else {
      parityStatus = "broken";
    }
  } else {
    parityStatus = "broken";
    driftPercent = 100;
  }

  // Who is richer?
  let richerLabel = "";
  if (rewardValueBaseA > rewardValueBaseB) {
    richerLabel = `${regionA.label} is richer`;
  } else if (rewardValueBaseB > rewardValueBaseA) {
    richerLabel = `${regionB.label} is richer`;
  } else {
    richerLabel = "Both regions are equal on this reward";
  }

  let summaryDetail = "";

  if (parityStatus === "high") {
    summaryDetail = `${rewardName} is within about ${formatNumber(
      driftPercent,
      0
    )}% parity between ${regionA.label} and ${regionB.label}. ${richerLabel} on this configuration.`;
  } else if (parityStatus === "medium") {
    summaryDetail = `${rewardName} shows moderate drift (~${formatNumber(
      driftPercent,
      0
    )}%) between ${regionA.label} and ${regionB.label}. ${richerLabel}, which may or may not be intentional.`;
  } else {
    summaryDetail = `${rewardName} has broken parity (~${formatNumber(
      driftPercent,
      0
    )}%) between ${regionA.label} and ${regionB.label}. ${richerLabel} by a wide margin.`;
  }

  const headline =
    parityStatus === "high"
      ? "High Parity"
      : parityStatus === "medium"
      ? "Medium Drift"
      : "Broken Parity";

  updateSummaryBadge(parityStatus, headline, summaryDetail);

  // Cards
  const partnerName = partnerMeta ? partnerMeta.name : "Selected Partner";
  const partnerNote = partnerMeta ? partnerMeta.note : "";

  rewardLineEl.innerHTML = `Reward <strong>${rewardName}</strong> at <strong>${formatNumber(
    pointsCost,
    0
  )}</strong> points with a base point value of <strong>${formatCurrency(
    basePointValue,
    "USD"
  )}</strong> implies about <strong>${formatCurrency(
    pointsValueBase,
    "USD"
  )}</strong> of base value before any regional co-pays.`;

  regionALineEl.innerHTML = `<strong>${regionA.label}</strong>: FX input treats 1 ${regionA.currency} as <strong>${formatNumber(
    fxA,
    4
  )}</strong> in base currency. Co-pay of <strong>${formatCurrency(
    copayALocal,
    regionA.currency
  )}</strong> lifts total reward value to roughly <strong>${formatCurrency(
    rewardValueLocalA,
    regionA.currency
  )}</strong> (≈ ${formatCurrency(rewardValueBaseA, "USD")} in base).`;

  regionBLineEl.innerHTML = `<strong>${regionB.label}</strong>: FX input treats 1 ${regionB.currency} as <strong>${formatNumber(
    fxB,
    4
  )}</strong> in base currency. Co-pay of <strong>${formatCurrency(
    copayBLocal,
    regionB.currency
  )}</strong> lifts total reward value to roughly <strong>${formatCurrency(
    rewardValueLocalB,
    regionB.currency
  )}</strong> (≈ ${formatCurrency(rewardValueBaseB, "USD")} in base).`;

  // Flow path
  const flowLines = [
    `[INPUT] Reward: ${rewardName} @ ${pointsCost} points`,
    `[INPUT] Base point value: ${basePointValue} (base currency per point)`,
    `[STEP 1] Points value in base: ${pointsCost} * ${basePointValue} = ${pointsValueBase.toFixed(
      4
    )}`,
    "",
    `[REGION A] ${regionA.label} (${regionA.currency})`,
    `          FX: 1 ${regionA.currency} = ${fxA} base`,
    `          Co-pay (local): ${copayALocal}`,
    `          Co-pay (base): ${copayABase.toFixed(4)}`,
    `          Total reward value (base): ${rewardValueBaseA.toFixed(4)}`,
    "",
    `[REGION B] ${regionB.label} (${regionB.currency})`,
    `          FX: 1 ${regionB.currency} = ${fxB} base`,
    `          Co-pay (local): ${copayBLocal}`,
    `          Co-pay (base): ${copayBBase.toFixed(4)}`,
    `          Total reward value (base): ${rewardValueBaseB.toFixed(4)}`,
    "",
    `[DRIFT] Absolute drift: ~${formatNumber(driftPercent, 1)}%`,
    `[DRIFT] Parity status: ${headline}`,
    `[DRIFT] Richer region: ${
      rewardValueBaseA > rewardValueBaseB
        ? regionA.label
        : rewardValueBaseB > rewardValueBaseA
        ? regionB.label
        : "neither (equal)"
    }`
  ];

  flowPathEl.textContent = flowLines.join("\n");

  // Raw output (compact JSON for people like you)
  const raw = {
    rewardName,
    partnerId,
    partnerName,
    basePointValue,
    pointsCost,
    regions: {
      A: {
        code: regionACode,
        label: regionA.label,
        currency: regionA.currency,
        fxToBase: fxA,
        copayLocal: copayALocal,
        copayBase: copayABase,
        rewardValueBase: rewardValueBaseA,
        rewardValueLocal: rewardValueLocalA
      },
      B: {
        code: regionBCode,
        label: regionB.label,
        currency: regionB.currency,
        fxToBase: fxB,
        copayLocal: copayBLocal,
        copayBase: copayBBase,
        rewardValueBase: rewardValueBaseB,
        rewardValueLocal: rewardValueLocalB
      }
    },
    parity: {
      status: parityStatus,
      driftPercent,
      richer:
        rewardValueBaseA > rewardValueBaseB
          ? regionA.label
          : rewardValueBaseB > rewardValueBaseA
          ? regionB.label
          : "equal"
    },
    partnerNote
  };

  rawOutputEl.textContent = JSON.stringify(raw, null, 2);
}

// Example scenario

function loadExampleScenario() {
  // Example:
  // - Base point value: $0.01
  // - Reward: Free Night
  // - 20,000 points
  // - Partner: GlobalStay
  // - Region A: US, $50 co-pay
  // - Region B: EU, €0 co-pay
  basePointValueEl.value = "0.01";
  rewardNameEl.value = "Free Night";
  pointsCostEl.value = "20000";
  partnerEl.value = "GSTAY";

  regionAEl.value = "US";
  regionBEl.value = "EU";

  fxAEl.value = fxConfig["US"].fxToBase.toString();
  fxBEl.value = fxConfig["EU"].fxToBase.toString();

  copayAEl.value = "50.00";
  copayBEl.value = "0.00";

  calcStatusEl.textContent =
    "Example scenario loaded — click “Run Integrity Check” to see parity.";
}

// Update FX input placeholders when region changes (but don't overwrite manual edits)
function syncFxPlaceholders() {
  const regionACode = regionAEl.value;
  const regionBCode = regionBEl.value;
  const cfgA = fxConfig[regionACode];
  const cfgB = fxConfig[regionBCode];

  if (cfgA && !fxAEl.value) {
    fxAEl.placeholder = cfgA.fxToBase.toString();
  }

  if (cfgB && !fxBEl.value) {
    fxBEl.placeholder = cfgB.fxToBase.toString();
  }
}

// Wire up events
runBtn.addEventListener("click", runIntegrityCheck);
loadExampleBtn.addEventListener("click", () => {
  loadExampleScenario();
  runIntegrityCheck();
});

regionAEl.addEventListener("change", syncFxPlaceholders);
regionBEl.addEventListener("change", syncFxPlaceholders);

// Initialize
loadExampleScenario();
runIntegrityCheck();
syncFxPlaceholders();
