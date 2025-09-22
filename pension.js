import 'bootstrap/dist/css/bootstrap.min.css';
import './css.css';
import 'bootstrap';                 // JS components
import '@popperjs/core';            // needed for tooltips/dropdowns
import Chart from 'chart.js/auto';

// ---- Formatting helpers ----
const euroFmt = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
const pctFmt = (x) => `${x.toFixed(1)}%`;

// ---- Constants ----
const AGE_MIN = 30;
const INFLATION = 0.035;
document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM ----
    const els = {
        ageRange: document.getElementById('ageRange'),
        ageInput: document.getElementById('ageInput'),
        pensionAgeInput: document.getElementById('pensionAgeInput'),
        pensionAgeRange: document.getElementById('pensionAgeRange'),
        yearsTo65Label: document.getElementById('yearsTo65Label'),
        spendRange: document.getElementById('spendRange'),
        spendInput: document.getElementById('spendInput'),
        monthlyPensionRange: document.getElementById('monthlyPensionRange'),
        monthlyPensionInput: document.getElementById('monthlyPensionInput'),
        retireCanvas: document.getElementById('retireChart'),
        pieCanvas: document.getElementById('pensionCoverageChart'),
        inflationAdjustedSpending: document.getElementById('inflationAdjustedSpending')
    };

    function clamp(v, lo, hi) {return Math.min(Math.max(v, lo), hi);}

    function getInputs() {
        const age = clamp(parseInt(els.ageInput.value || els.ageRange.value, 10), +els.ageInput.min, +els.ageInput.max);
        const pensionAge = clamp(parseInt(els.pensionAgeInput.value || els.pensionAgeRange.value, 10), +els.pensionAgeInput.min, +els.pensionAgeInput.max);
        const withdrawalYearly = clamp(parseFloat(els.spendInput.value || els.spendRange.value), +els.spendInput.min, +els.spendInput.max);
        const inflation = INFLATION;
        const monthlyPension = clamp(parseFloat(els.monthlyPensionInput.value || els.monthlyPensionRange.value), +els.monthlyPensionInput.min, +els.monthlyPensionInput.max);
        const pensionYearly = monthlyPension * 12;

        return {age, pensionAge, withdrawalYearly, pensionYearly, inflation};
    }

    // Function to calculate inflation-adjustment
    function adjustForInflation(withdrawalYearlyToday, yearsToRetirement, inflation) {
        return withdrawalYearlyToday * Math.pow(1 + inflation, yearsToRetirement);
    }

    ['input', 'change'].forEach(evt => {
        // age pair
        els.ageRange.addEventListener(evt, () => {
            els.ageInput.value = els.ageRange.value;
            syncAndRender();
        });
        els.ageInput.addEventListener(evt, () => {
            els.ageRange.value = els.ageInput.value;
            syncAndRender();
        });

        // pension age pair
        els.pensionAgeRange.addEventListener(evt, () => {
            els.pensionAgeInput.value = els.pensionAgeRange.value;
            syncAndRender();
        });
        els.pensionAgeInput.addEventListener(evt, () => {
            els.pensionAgeRange.value = els.pensionAgeInput.value;
            syncAndRender();
        });

        // spend pair
        els.spendRange.addEventListener(evt, () => {
            els.spendInput.value = els.spendRange.value;
            syncAndRender();
        });
        els.spendInput.addEventListener(evt, () => {
            els.spendRange.value = els.spendInput.value;
            syncAndRender();
        });

        els.monthlyPensionRange.addEventListener(evt, () => {
            els.monthlyPensionInput.value = els.monthlyPensionRange.value;
            syncAndRender();
        });
        els.monthlyPensionInput.addEventListener(evt, () => {
            els.monthlyPensionRange.value = els.monthlyPensionInput.value;
            syncAndRender();
        });

    });
    // ---- Chart setup ----
    const retireCtx = els.retireCanvas.getContext('2d');
    const gradient = retireCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 119, 190, 0.15)');
    gradient.addColorStop(1, 'rgba(30, 144, 255, 0.05)');

    const retireChart = new Chart(retireCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Required Saving',
                    data: [],
                    borderWidth: 3,
                    borderColor: '#0077be',
                    backgroundColor: gradient,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#0077be',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {mode: 'nearest', intersect: false},
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Retire in Year',
                        color: '#525252',
                        font: {
                            weight: 600,
                            size: 12
                        }
                    },
                    ticks: {
                        precision: 0,
                        color: '#737373',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#3f3f46',
                        lineWidth: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Required Amount (€)',
                        color: '#525252',
                        font: {
                            weight: 600,
                            size: 12
                        }
                    },
                    ticks: {
                        callback: (v) => euroFmt.format(v),
                        color: '#737373',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#3f3f46',
                        lineWidth: 1
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#525252',
                        font: {
                            weight: 500,
                            size: 12
                        }
                    }
                },
                title: {
                    display: false,
                    text: 'Required Savings to Retire',
                    color: '#262626',
                    font: {
                        weight: 700,
                        size: 16
                    },
                    padding: 20
                },
                subtitle: {
                    display: true,
                    text: '',
                    color: '#737373',
                    font: {
                        size: 11
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(39, 39, 42, 0.95)',
                    titleColor: '#d4d4d8',
                    bodyColor: '#d4d4d8',
                    borderColor: '#3b9eff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        title: (ctx) => {
                            const {age} = getInputs();
                            const currentAge = age + ctx[0].dataIndex;
                            return `Year= ${ctx[0].label} Age= ${currentAge}`;
                        },
                        label: (ctx) => ` ${ctx.dataset.label}: ${euroFmt.format(ctx.parsed.y)}`
                    }
                }
            }
        }
    });

    // ---- Pie Chart Setup ----
    const pieCtx = els.pieCanvas.getContext('2d');
    const pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pension Coverage', 'Savings'],
            datasets: [{
                data: [50, 50],
                backgroundColor: [
                    '#3b9eff', // Ocean blue
                    '#52525b'  // Dark grey
                ],
                borderColor: [
                    '#2590ff',
                    '#71717a'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    '#60b2ff',
                    '#a1a1aa'
                ],
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#525252',
                        font: {
                            weight: 500,
                            size: 12
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: false,
                    text: 'Annual Spending Coverage',
                    color: '#262626',
                    font: {
                        weight: 700,
                        size: 16
                    },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(39, 39, 42, 0.95)',
                    titleColor: '#d4d4d8',
                    bodyColor: '#d4d4d8',
                    borderColor: '#3b9eff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            const {withdrawalYearly, pensionYearly, age, pensionAge, inflation} = getInputs();
                            const yearsToRetirement = pensionAge - age;
                            const spendAtRetirement = adjustForInflation(withdrawalYearly, yearsToRetirement, inflation);
                            const aowAtRetirement = adjustForInflation(pensionYearly, yearsToRetirement, inflation);

                            const percentage = ctx.parsed;
                            if (ctx.dataIndex === 0) {
                                return `Pension: ${euroFmt.format(aowAtRetirement)} (${percentage.toFixed(1)}%)`;
                            } else {
                                const gap = Math.max(0, spendAtRetirement - aowAtRetirement);
                                return `Savings: ${euroFmt.format(gap)} (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        }
    });

    function updateRetireSubtitle() {
        const {age, pensionAge, withdrawalYearly, pensionYearly, inflation} = getInputs();
        const yearsToRetirement = pensionAge - age;
        const spendAtRetirement = adjustForInflation(withdrawalYearly, yearsToRetirement, inflation);
        const aowAtRetirement = adjustForInflation(pensionYearly, yearsToRetirement, inflation);
        const gapAtRetirement = Math.max(0, spendAtRetirement - aowAtRetirement);
        const targetAtRetirement = gapAtRetirement * 25; // 4% rule target

        retireChart.options.plugins.subtitle.text =
            `Target saving@${pensionAge}=${euroFmt.format(targetAtRetirement)} | `
            + `Pension@${pensionAge}=${euroFmt.format(aowAtRetirement)} p.y. | `
            + `Spending@${pensionAge}=${euroFmt.format(spendAtRetirement)} | `
            + `Gap@${pensionAge}=${euroFmt.format(gapAtRetirement)}`
    }

    function updatePieChart() {
        const {withdrawalYearly, pensionYearly, age, pensionAge, inflation} = getInputs();
        const yearsToRetirement = pensionAge - age;

        // Calculate inflation-adjusted values at retirement
        const spendAtRetirement = adjustForInflation(withdrawalYearly, yearsToRetirement, inflation);
        const aowAtRetirement = adjustForInflation(pensionYearly, yearsToRetirement, inflation);

        const pensionCoverage = Math.min(100, (aowAtRetirement / spendAtRetirement) * 100);
        const savingsNeeded = Math.max(0, 100 - pensionCoverage);

        pieChart.data.datasets[0].data = [pensionCoverage, savingsNeeded];
        pieChart.update();
    }

    function updateSummaryBanner() {
        const {pensionAge, withdrawalYearly, pensionYearly, age, inflation} = getInputs();
        const yearsToRetirement = pensionAge - age;

        // Calculate inflation-adjusted values at retirement
        const spendAtRetirement = adjustForInflation(withdrawalYearly, yearsToRetirement, inflation);
        const aowAtRetirement = adjustForInflation(pensionYearly, yearsToRetirement, inflation);
        const additionalNeeded = Math.max(0, spendAtRetirement - aowAtRetirement) * 25; // 4% rule

        document.getElementById('retireAgeDisplay').textContent = pensionAge;
        document.getElementById('additionalAmountDisplay').textContent = euroFmt.format(additionalNeeded);
        document.getElementById('annualSpendingDisplay').textContent =
            euroFmt.format(spendAtRetirement);

        // Update inflation-adjusted spending display
        els.inflationAdjustedSpending.textContent = euroFmt.format(spendAtRetirement);
    }

    /**
     * Start value with growth r, inflation i, and inflation-adjusted withdrawal each step.
     * The `withdrawalToday` is the amount in today's money (real terms).
     *
     * @param {number} finalAmount - Target final nominal amount (X)
     * @param {number} rate - Growth per step (e.g., 0.10 for 10%)
     * @param {number} steps - Number of steps (n)
     * @param {number} inflation - Inflation per step (e.g., 0.035 for 3.5%)
     * @param {number} withdrawalToday - Withdrawal per step in today's money (inflation-adjusted nominally)
     * @returns {number} Required starting value (S)
     */
    function startValueInflAdjWithdrawal(finalAmount, rate, steps, inflation, withdrawalToday) {
        const g = (1 + rate) / (1 + inflation); // net real growth per step

        if (Math.abs(g - 1) < 1e-12) {
            // No net real growth: X = S - n*w  =>  S = X + n*w
            return finalAmount + withdrawalToday * steps;
        }

        const gPow = Math.pow(g, steps);
        const seriesFactor = (gPow - 1) / (g - 1);

        // S = (X + w * ((g^n - 1)/(g - 1))) / g^n
        return (finalAmount + withdrawalToday * seriesFactor) / gPow;
    }

    function buildSeries(withdrawalYearly, rate, age, pensionAge, inflation, pensionYearly) {
        const startAge = Math.max(AGE_MIN, age);
        const years = [];
        const required = [];
        const currentYear = new Date().getFullYear();

        // Calculate inflation-adjusted values at retirement
        const yearsToPension = pensionAge - age;
        const spendAtRetirement = adjustForInflation(withdrawalYearly, yearsToPension, inflation);
        const aowAtRetirement = adjustForInflation(pensionYearly, yearsToPension, inflation);
        const additionalNeeded = Math.max(0, spendAtRetirement - aowAtRetirement) * 25; // 4% rule

        for (let i = yearsToPension; 0 <= i; i--) {
            const nthFromToday = yearsToPension - i;
            years.push(currentYear + nthFromToday);

            required.push(startValueInflAdjWithdrawal(additionalNeeded, rate, i, inflation, spendAtRetirement));
        }
        return {years, required};
    }

    // ---- Sync + Render ----
    function syncAndRender() {
        // two-way binding
        els.ageRange.value = els.ageInput.value;
        els.spendRange.value = els.spendInput.value;
        els.pensionAgeRange.value = els.pensionAgeInput.value;
        els.monthlyPensionRange.value = els.monthlyPensionInput.value;

        const {age, pensionAge, withdrawalYearly, pensionYearly, inflation} = getInputs();

        console.log("Inputs:", {
            age,
            pensionAge,
            withdrawalYearly,
            pensionYearly,
            inflation,
        });

        const yrs = Math.max(0, pensionAge - age);
        els.yearsTo65Label.textContent = yrs;
        console.log("years to pension: " + yrs);

        const {years, required} = buildSeries(withdrawalYearly, 0.04, age, pensionAge, inflation, pensionYearly);
        retireChart.data.labels = years;
        retireChart.data.datasets[0].data = required;
        updateRetireSubtitle();
        retireChart.update();

        // Update pie chart
        updatePieChart();

        // Update summary banner
        updateSummaryBanner();
    }

    // First render
    syncAndRender();
});
