(function () {
  const offerNameEl = document.getElementById("offerName");
  const offerTypeEl = document.getElementById("offerType");
  const fixedCostsEl = document.getElementById("fixedCosts");
  const variableCostPerUnitEl = document.getElementById("variableCostPerUnit");
  const targetIncomeEl = document.getElementById("targetIncome");

  const hoursPerMonthEl = document.getElementById("hoursPerMonth");
  const projectsPerMonthEl = document.getElementById("projectsPerMonth");
  const hoursPerProjectEl = document.getElementById("hoursPerProject");
  const unitsPerMonthEl = document.getElementById("unitsPerMonth");
  const subscribersEl = document.getElementById("subscribers");
  const churnRateEl = document.getElementById("churnRate");

  const currentPriceEl = document.getElementById("currentPrice");

  const calculateBtn = document.getElementById("calculateBtn");
  const saveScenarioBtn = document.getElementById("saveScenarioBtn");
  const printBtn = document.getElementById("printBtn");

  const resultsContainer = document.getElementById("resultsContainer");
  const savedScenariosContainer = document.getElementById("savedScenariosContainer");

  const hourlyFields = document.getElementById("hourlyFields");
  const projectFields = document.getElementById("projectFields");
  const productFields = document.getElementById("productFields");
  const subscriptionFields = document.getElementById("subscriptionFields");

  const STORAGE_KEY = "profitpilot_scenarios_v1";

  function showConditionalFields() {
    const type = offerTypeEl.value;
    hourlyFields.style.display = type === "hourly" ? "block" : "none";
    projectFields.style.display = type === "project" ? "block" : "none";
    productFields.style.display = type === "product" ? "block" : "none";
    subscriptionFields.style.display = type === "subscription" ? "block" : "none";
  }

  offerTypeEl.addEventListener("change", showConditionalFields);
  showConditionalFields();

  function parseNumber(el) {
    const v = parseFloat(el.value);
    return isNaN(v) ? 0 : v;
  }

  function formatCurrency(value) {
    return value.toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2
    });
  }

  function formatPercent(value) {
    return `${value.toFixed(1)}%`;
  }

  function calculate() {
    const offerName = offerNameEl.value.trim() || "Offerta senza nome";
    const offerType = offerTypeEl.value;

    const fixedCosts = parseNumber(fixedCostsEl);
    const variableCostPerUnit = parseNumber(variableCostPerUnitEl);
    const targetIncome = parseNumber(targetIncomeEl);
    const currentPrice = parseNumber(currentPriceEl);

    let unitsPerMonth = 0;
    let effectiveHoursPerUnit = 0;

    if (offerType === "hourly") {
      const hoursPerMonth = Math.max(parseNumber(hoursPerMonthEl), 1);
      unitsPerMonth = hoursPerMonth;
      effectiveHoursPerUnit = 1;
    } else if (offerType === "project") {
      const projectsPerMonth = Math.max(parseNumber(projectsPerMonthEl), 1);
      const hoursPerProject = Math.max(parseNumber(hoursPerProjectEl), 1);
      unitsPerMonth = projectsPerMonth;
      effectiveHoursPerUnit = hoursPerProject;
    } else if (offerType === "product") {
      unitsPerMonth = Math.max(parseNumber(unitsPerMonthEl), 1);
      effectiveHoursPerUnit = 0;
    } else if (offerType === "subscription") {
      const subscribers = Math.max(parseNumber(subscribersEl), 1);
      const churnRate = Math.min(Math.max(parseNumber(churnRateEl), 0), 100);
      const avgLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 12;
      unitsPerMonth = subscribers;
      effectiveHoursPerUnit = 0;
    }

    const totalMonthlyCosts = fixedCosts + variableCostPerUnit * unitsPerMonth;
    const requiredMonthlyRevenue = totalMonthlyCosts + targetIncome;

    const suggestedPricePerUnit =
      unitsPerMonth > 0 ? requiredMonthlyRevenue / unitsPerMonth : currentPrice;

    const marginPerUnit = currentPrice - variableCostPerUnit;
    const marginRate =
      currentPrice > 0 ? (marginPerUnit / currentPrice) * 100 : 0;

    const monthlyRevenueAtCurrentPrice = currentPrice * unitsPerMonth;
    const monthlyProfitAtCurrentPrice = monthlyRevenueAtCurrentPrice - totalMonthlyCosts;

    const breakEvenUnits =
      currentPrice > variableCostPerUnit
        ? fixedCosts / (currentPrice - variableCostPerUnit)
        : Infinity;

    let sustainabilityTag = "";
    let sustainabilityClass = "";

    if (monthlyProfitAtCurrentPrice > targetIncome * 1.1) {
      sustainabilityTag = "Prezzo molto sostenibile (profitto > obiettivo)";
      sustainabilityClass = "pp-pill-success";
    } else if (monthlyProfitAtCurrentPrice >= targetIncome * 0.9) {
      sustainabilityTag = "Prezzo quasi in linea con l'obiettivo";
      sustainabilityClass = "pp-pill-warning";
    } else if (monthlyProfitAtCurrentPrice > 0) {
      sustainabilityTag = "Prezzo sottostimato (profitto positivo ma sotto obiettivo)";
      sustainabilityClass = "pp-pill-warning";
    } else if (monthlyProfitAtCurrentPrice === 0) {
      sustainabilityTag = "Prezzo di puro break-even (nessun profitto)";
      sustainabilityClass = "pp-pill-warning";
    } else {
      sustainabilityTag = "Prezzo non sostenibile (perdita mensile)";
      sustainabilityClass = "pp-pill-danger";
    }

    const typeLabelMap = {
      hourly: "Servizio a tariffa oraria",
      project: "Servizio a progetto",
      product: "Prodotto singolo",
      subscription: "Abbonamento / SaaS"
    };

    const typeLabel = typeLabelMap[offerType] || "Offerta";

    const html = `
      <div class="pp-pill ${sustainabilityClass}">
        <span>${typeLabel}</span>
        <span>•</span>
        <span>${sustainabilityTag}</span>
      </div>

      <div class="pp-results-grid">
        <div class="pp-result-block">
          <div class="pp-result-title">Prezzo suggerito per unità</div>
          <div class="pp-result-value">${formatCurrency(suggestedPricePerUnit)}</div>
          <div class="pp-result-tagline">
            Per coprire costi (${formatCurrency(totalMonthlyCosts)}) e raggiungere l'obiettivo (${formatCurrency(
      targetIncome
    )}) con ${unitsPerMonth} unità/mese.
          </div>
        </div>

        <div class="pp-result-block">
          <div class="pp-result-title">Margine per unità al prezzo attuale</div>
          <div class="pp-result-value">${formatCurrency(marginPerUnit)} (${formatPercent(
      marginRate
    )})</div>
          <div class="pp-result-tagline">
            Prezzo attuale: ${formatCurrency(currentPrice)} • Costi variabili per unità: ${formatCurrency(
      variableCostPerUnit
    )}
          </div>
        </div>

        <div class="pp-result-block">
          <div class="pp-result-title">Profitto mensile al prezzo attuale</div>
          <div class="pp-result-value">${formatCurrency(monthlyProfitAtCurrentPrice)}</div>
          <div class="pp-result-tagline">
            Ricavi mensili: ${formatCurrency(
              monthlyRevenueAtCurrentPrice
            )} • Costi mensili totali: ${formatCurrency(totalMonthlyCosts)}
          </div>
        </div>

        <div class="pp-result-block">
          <div class="pp-result-title">Break-even (unità necessarie)</div>
          <div class="pp-result-value">${
            breakEvenUnits === Infinity
              ? "Non calcolabile (prezzo ≤ costi variabili)"
              : breakEvenUnits.toFixed(1) + " unità/mese"
          }</div>
          <div class="pp-result-tagline">
            Numero di unità/mese necessarie per coprire i costi fissi con il prezzo attuale.
          </div>
        </div>
      </div>
    `;

    resultsContainer.innerHTML = html;

    return {
      offerName,
      offerType,
      fixedCosts,
      variableCostPerUnit,
      targetIncome,
      currentPrice,
      unitsPerMonth,
      suggestedPricePerUnit,
      marginPerUnit,
      marginRate,
      monthlyRevenueAtCurrentPrice,
      monthlyProfitAtCurrentPrice,
      breakEvenUnits,
      sustainabilityTag,
      sustainabilityClass
    };
  }

  calculateBtn.addEventListener("click", calculate);

  function loadScenarios() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        savedScenariosContainer.innerHTML =
          "<p>Nessuno scenario salvato. Dopo un calcolo, clicca <strong>Salva scenario</strong>.</p>";
        return [];
      }
      const scenarios = JSON.parse(raw);
      if (!Array.isArray(scenarios) || scenarios.length === 0) {
        savedScenariosContainer.innerHTML =
          "<p>Nessuno scenario salvato. Dopo un calcolo, clicca <strong>Salva scenario</strong>.</p>";
        return [];
      }
      renderScenarios(scenarios);
      return scenarios;
    } catch (e) {
      savedScenariosContainer.innerHTML =
        "<p>Impossibile caricare gli scenari salvati (dati corrotti). Puoi cancellare la memoria locale del browser.</p>";
      return [];
    }
  }

  function renderScenarios(scenarios) {
    if (!scenarios.length) {
      savedScenariosContainer.innerHTML =
        "<p>Nessuno scenario salvato. Dopo un calcolo, clicca <strong>Salva scenario</strong>.</p>";
      return;
    }

    const typeLabelMap = {
      hourly: "Servizio a tariffa oraria",
      project: "Servizio a progetto",
      product: "Prodotto singolo",
      subscription: "Abbonamento / SaaS"
    };

    const html = scenarios
      .map((s, index) => {
        const typeLabel = typeLabelMap[s.offerType] || "Offerta";
        const breakEvenText =
          s.breakEvenUnits === Infinity
            ? "Non calcolabile"
            : s.breakEvenUnits.toFixed(1) + " unità/mese";

        return `
          <div class="pp-scenario" data-index="${index}">
            <div class="pp-scenario-header">
              <div>
                <div class="pp-scenario-name">${s.offerName}</div>
                <div class="pp-scenario-type">${typeLabel}</div>
              </div>
              <div class="pp-pill ${s.sustainabilityClass}">
                <span>${s.sustainabilityTag}</span>
              </div>
            </div>
            <div class="pp-scenario-body">
              <div><strong>Prezzo attuale:</strong> ${formatCurrency(s.currentPrice)}</div>
              <div><strong>Prezzo suggerito:</strong> ${formatCurrency(s.suggestedPricePerUnit)}</div>
              <div><strong>Profitto mensile:</strong> ${formatCurrency(s.monthlyProfitAtCurrentPrice)}</div>
              <div><strong>Break-even:</strong> ${breakEvenText}</div>
            </div>
            <div class="pp-scenario-actions">
              <button class="pp-btn-small pp-btn-secondary" data-action="load">Carica parametri</button>
              <button class="pp-btn-small pp-btn-outline" data-action="delete">Elimina</button>
            </div>
          </div>
        `;
      })
      .join("");

    savedScenariosContainer.innerHTML = html;

    savedScenariosContainer.querySelectorAll(".pp-scenario-actions button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = btn.getAttribute("data-action");
        const scenarioEl = btn.closest(".pp-scenario");
        const index = parseInt(scenarioEl.getAttribute("data-index"), 10);
        if (isNaN(index)) return;

        const scenarios = loadScenarios();
        const scenario = scenarios[index];
        if (!scenario) return;

        if (action === "load") {
          loadScenarioIntoForm(scenario);
        } else if (action === "delete") {
          scenarios.splice(index, 1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
          renderScenarios(scenarios);
        }
      });
    });
  }

  function loadScenarioIntoForm(s) {
    offerNameEl.value = s.offerName;
    offerTypeEl.value = s.offerType;
    fixedCostsEl.value = s.fixedCosts;
    variableCostPerUnitEl.value = s.variableCostPerUnit;
    targetIncomeEl.value = s.targetIncome;
    currentPriceEl.value = s.currentPrice;

    showConditionalFields();
    calculate();
  }

  saveScenarioBtn.addEventListener("click", () => {
    const result = calculate();
    if (!result) return;

    const scenarios = loadScenarios();
    scenarios.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    renderScenarios(scenarios);
  });

  printBtn.addEventListener("click", () => {
    window.print();
  });

  loadScenarios();
})();
