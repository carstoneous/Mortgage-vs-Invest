// Common data and parameters
const YEARS = 15;
const MONTHS = YEARS * 12;
const MONTHLY_PAYMENT = 2000;
const HOUSE_VALUE = 700000;
const INITIAL_MORTGAGE = 500000;
const DEFAULT_MORTGAGE_RATE = 0.015; // 1.5%
const DEFAULT_INVESTMENT_RETURN = 0.06; // 6%

// Function to format currency without decimals
function formatCurrency(value) {
    return Math.round(value).toLocaleString();
}

// Remove global DOM element references
// Calculations
function calculateMortgagePayoff(initialBalance, extraPayment, interestRate, months) {
    let balance = initialBalance;
    const monthlyInterestRate = interestRate / 12;
    
    // Calculate standard monthly payment (30-year mortgage)
    const regularPayment = (initialBalance * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, 360)) / 
                           (Math.pow(1 + monthlyInterestRate, 360) - 1);
    
    const totalMonthlyPayment = regularPayment + extraPayment;
    const results = [];
    let paidOff = false;
    
    // Record initial state
    results.push({
        year: 0,
        balance: balance,
        equity: HOUSE_VALUE - balance,
        investments: 0
    });
    
    for (let i = 1; i <= months; i++) {
        if (balance <= 0) {
            // If already paid off, balance stays at zero
            if (i % 12 === 0) {
                results.push({
                    year: i / 12,
                    balance: 0,
                    equity: HOUSE_VALUE,
                    investments: 0
                });
            }
            continue;
        }
        
        // Calculate interest for this month
        const interestAmount = balance * monthlyInterestRate;
        
        // Apply payment
        const principalAmount = Math.min(balance, totalMonthlyPayment - interestAmount);
        balance -= principalAmount;
        
        // Check if paid off this month
        if (balance <= 0 && !paidOff) {
            paidOff = true;
            console.log(`Mortgage paid off after ${i} months (${(i/12).toFixed(1)} years)`);
        }
        
        // Only record data at yearly intervals
        if (i % 12 === 0) {
            results.push({
                year: i / 12,
                balance: Math.max(0, balance),
                equity: HOUSE_VALUE - Math.max(0, balance),
                investments: 0
            });
        }
    }
    
    return results;
}

function calculateInvestmentPath(initialBalance, investmentAmount, mortgageRate, investmentRate, months) {
    let mortgageBalance = initialBalance;
    let investmentBalance = 0;
    const monthlyMortgageRate = mortgageRate / 12;
    const monthlyInvestmentRate = investmentRate / 12;
    
    // Standard amortization payment (30-year mortgage)
    const regularPayment = (initialBalance * monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, 360)) / 
                           (Math.pow(1 + monthlyMortgageRate, 360) - 1);
    
    const results = [];
    
    // Record initial state
    results.push({
        year: 0,
        balance: mortgageBalance,
        equity: HOUSE_VALUE - mortgageBalance,
        investments: 0
    });
    
    for (let i = 1; i <= months; i++) {
        // Mortgage calculation
        if (mortgageBalance > 0) {
            const interestAmount = mortgageBalance * monthlyMortgageRate;
            const principalAmount = Math.min(mortgageBalance, regularPayment - interestAmount);
            mortgageBalance -= principalAmount;
        }
        
        // Investment calculation - compound interest applied first, then add new investment
        investmentBalance *= (1 + monthlyInvestmentRate);
        investmentBalance += investmentAmount;
        
        // Only record data at yearly intervals
        if (i % 12 === 0) {
            results.push({
                year: i / 12,
                balance: Math.max(0, mortgageBalance),
                equity: HOUSE_VALUE - Math.max(0, mortgageBalance),
                investments: investmentBalance
            });
        }
    }
    
    return results;
}

// Common chart configuration
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'nearest',
        axis: 'x'
    },
    plugins: {
        title: {
            display: true,
            font: {
                size: 18,
                weight: 'normal'
            },
            padding: {
                top: 20,
                bottom: 30
            }
        },
        legend: {
            position: 'top',
            align: 'center',
            labels: {
                padding: 20,
                usePointStyle: true,
                boxWidth: 10,
                font: {
                    size: 14
                }
            }
        },
        tooltip: {
            padding: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#2c5282',
            bodyColor: '#2c5282',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            titleFont: {
                size: 14
            },
            bodyFont: {
                size: 14
            },
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8
        }
    },
    scales: {
        x: {
            grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
                font: {
                    size: 13
                },
                padding: 10
            }
        },
        y: {
            grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
                font: {
                    size: 13
                },
                padding: 10
            },
            beginAtZero: true
        }
    },
    layout: {
        padding: {
            top: 20,
            right: 30,
            bottom: 20,
            left: 20
        }
    },
    elements: {
        point: {
            radius: 0,
            hoverRadius: 8
        },
        line: {
            tension: 0.4
        }
    }
};

// Chart initialization functions
function initMortgageChart() {
    const ctx = document.getElementById('mortgageChart').getContext('2d');
    if (!ctx) {
        console.error('Mortgage chart canvas not found');
        return null;
    }
    
    const mortgageResults = calculateMortgagePayoff(
        INITIAL_MORTGAGE, 
        MONTHLY_PAYMENT, 
        DEFAULT_MORTGAGE_RATE, 
        MONTHS
    );
    
    const years = mortgageResults.map(data => data.year);
    const balances = mortgageResults.map(data => data.balance);
    
    // Create chart configuration
    const options = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            title: {
                ...commonChartOptions.plugins.title,
                text: 'Mortgage Balance Over Time (Path A)'
            },
            tooltip: {
                ...commonChartOptions.plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        return 'Balance: ' + formatCurrency(context.raw) + ' CHF';
                    }
                }
            }
        },
        scales: {
            ...commonChartOptions.scales,
            y: {
                ...commonChartOptions.scales.y,
                title: {
                    display: true,
                    text: 'Balance (CHF)',
                    font: { 
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value) + ' CHF';
                    }
                }
            }
        }
    };
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Mortgage Balance',
                data: balances,
                backgroundColor: 'rgba(49, 130, 206, 0.25)',
                borderColor: '#3182ce',
                borderWidth: 2.5,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 6
            }]
        },
        options: options
    });
    
    // Store chart instance for resize handling
    ctx.canvas.chart = chart;
    
    // Add resize handler
    window.addEventListener('resize', function() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            chart.resize();
            chart.update('none');
        }, 100);
    });
    
    return chart;
}

function initInvestmentChart() {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    if (!ctx) {
        console.error('Investment chart canvas not found');
        return null;
    }
    
    const investmentResults = calculateInvestmentPath(
        INITIAL_MORTGAGE, 
        MONTHLY_PAYMENT, 
        DEFAULT_MORTGAGE_RATE, 
        DEFAULT_INVESTMENT_RETURN, 
        MONTHS
    );
    
    const years = investmentResults.map(data => data.year);
    const investments = investmentResults.map(data => data.investments);
    const balances = investmentResults.map(data => data.balance);
    
    // Create chart configuration
    const options = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            title: {
                ...commonChartOptions.plugins.title,
                text: 'Investment Growth vs Mortgage Balance (Path B)'
            },
            tooltip: {
                ...commonChartOptions.plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.raw) + ' CHF';
                    }
                }
            }
        },
        scales: {
            ...commonChartOptions.scales,
            y: {
                ...commonChartOptions.scales.y,
                title: {
                    display: true,
                    text: 'Amount (CHF)',
                    font: { 
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value) + ' CHF';
                    }
                },
                min: 0,
                max: Math.max(...investments) * 1.1
            }
        }
    };
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Investment Portfolio',
                    data: investments,
                    backgroundColor: 'rgba(56, 178, 172, 0.25)',
                    borderColor: '#38b2ac',
                    borderWidth: 2.5,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 6
                },
                {
                    label: 'Mortgage Balance',
                    data: balances,
                    backgroundColor: 'rgba(49, 130, 206, 0.15)',
                    borderColor: '#3182ce',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: options
    });
    
    // Store chart instance for resize handling
    ctx.canvas.chart = chart;
    
    // Add resize handler
    window.addEventListener('resize', function() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            chart.resize();
            chart.update('none');
        }, 100);
    });
    
    return chart;
}

function initNetWorthChart() {
    const ctx = document.getElementById('netWorthChart').getContext('2d');
    if (!ctx) {
        console.error('Net worth chart canvas not found');
        return null;
    }
    
    const mortgageResults = calculateMortgagePayoff(
        INITIAL_MORTGAGE, 
        MONTHLY_PAYMENT, 
        DEFAULT_MORTGAGE_RATE, 
        MONTHS
    );
    
    const investmentResults = calculateInvestmentPath(
        INITIAL_MORTGAGE, 
        MONTHLY_PAYMENT, 
        DEFAULT_MORTGAGE_RATE, 
        DEFAULT_INVESTMENT_RETURN, 
        MONTHS
    );
    
    // Calculate net worth for both paths
    const mortgageNetWorth = mortgageResults.map(data => data.equity);
    const investmentNetWorth = investmentResults.map(data => data.equity + data.investments);
    const years = mortgageResults.map(data => data.year);
    
    // Create chart configuration
    const options = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            title: {
                ...commonChartOptions.plugins.title,
                text: 'Net Worth Comparison Over Time'
            },
            tooltip: {
                ...commonChartOptions.plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.raw) + ' CHF';
                    }
                }
            }
        },
        scales: {
            ...commonChartOptions.scales,
            x: {
                ...commonChartOptions.scales.x,
                title: {
                    display: true,
                    text: 'Years',
                    font: { 
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        top: 10
                    }
                }
            },
            y: {
                ...commonChartOptions.scales.y,
                title: {
                    display: true,
                    text: 'Net Worth (CHF)',
                    font: { 
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value) + ' CHF';
                    }
                },
                min: 0,
                max: Math.max(...investmentNetWorth) * 1.1 // Add 10% padding at the top
            }
        }
    };
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Path A: Pay Off Early',
                    data: mortgageNetWorth,
                    backgroundColor: 'rgba(49, 130, 206, 0.25)',
                    borderColor: '#3182ce',
                    borderWidth: 2.5,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 6
                },
                {
                    label: 'Path B: Invest',
                    data: investmentNetWorth,
                    backgroundColor: 'rgba(56, 178, 172, 0.25)',
                    borderColor: '#38b2ac',
                    borderWidth: 2.5,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 6
                }
            ]
        },
        options: options
    });
    
    // Store chart instance for resize handling
    ctx.canvas.chart = chart;
    
    // Add resize handler
    window.addEventListener('resize', function() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            chart.resize();
            chart.update('none');
        }, 100);
    });
    
    return chart;
}

function initRateComparisonChart() {
    const ctx = document.getElementById('rateComparisonChart').getContext('2d');
    if (!ctx) {
        console.error('Rate comparison chart canvas not found');
        return null;
    }
    
    // Create chart configuration
    const options = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            title: {
                ...commonChartOptions.plugins.title,
                text: 'Interest Rate vs Investment Return'
            },
            legend: {
                display: false
            },
            tooltip: {
                ...commonChartOptions.plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                    }
                }
            }
        },
        scales: {
            ...commonChartOptions.scales,
            x: {
                ...commonChartOptions.scales.x,
                grid: {
                    display: false
                }
            },
            y: {
                ...commonChartOptions.scales.y,
                title: {
                    display: true,
                    text: 'Rate (%)',
                    font: { 
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    },
                    font: {
                        size: 13
                    }
                },
                min: 0,
                max: 8,
                stepSize: 1
            }
        }
    };
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mortgage Interest Rate', 'Average Investment Return'],
            datasets: [{
                label: 'Annual Rate',
                data: [DEFAULT_MORTGAGE_RATE * 100, DEFAULT_INVESTMENT_RETURN * 100],
                backgroundColor: [
                    'rgba(49, 130, 206, 0.8)',
                    'rgba(56, 178, 172, 0.8)'
                ],
                borderColor: [
                    '#3182ce',
                    '#38b2ac'
                ],
                borderWidth: 1,
                borderRadius: 8,
                maxBarThickness: 100,
                barPercentage: 0.6
            }]
        },
        options: options
    });
    
    // Store chart instance for resize handling
    ctx.canvas.chart = chart;
    
    // Add resize handler
    window.addEventListener('resize', function() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            chart.resize();
            chart.update('none');
        }, 100);
    });
    
    return chart;
}

// Scroll handling for better UX
function handleScroll() {
    const steps = document.querySelectorAll('.step');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, { threshold: 0.5 });
    
    steps.forEach(step => {
        observer.observe(step);
    });
}

// Simulation code - completely rewritten for reliability
function setupSimulation() {
    console.log("Setting up simulation...");
    
    // Get UI elements
    const mortgageRateSlider = document.getElementById('mortgageRate');
    const mortgageRateValue = document.getElementById('mortgageRateValue');
    const investmentReturnSlider = document.getElementById('investmentReturn');
    const investmentReturnValue = document.getElementById('investmentReturnValue');
    const runSimulationButton = document.getElementById('runSimulation');
    const simulationChart = document.getElementById('simulationChart');
    const summaryDiv = document.getElementById('simulationSummary');
    
    // Check if elements exist
    if (!mortgageRateSlider || !mortgageRateValue || !investmentReturnSlider || 
        !investmentReturnValue || !runSimulationButton || !simulationChart || !summaryDiv) {
        console.error("Simulation elements not found");
        return;
    }
    
    // Store chart instance
    let chartInstance = null;
    
    // Update value displays when sliders change
    mortgageRateSlider.addEventListener('input', function() {
        mortgageRateValue.textContent = this.value;
    });
    
    investmentReturnSlider.addEventListener('input', function() {
        investmentReturnValue.textContent = this.value;
    });
    
    // Function to run simulation with current values
    function runSimulation() {
        console.log("Running simulation...");
        
        // Get current values from sliders
        const mortgageRate = parseFloat(mortgageRateSlider.value) / 100;
        const investmentReturn = parseFloat(investmentReturnSlider.value) / 100;
        
        console.log(`Mortgage rate: ${mortgageRate}, Investment return: ${investmentReturn}`);
        
        // Calculate results
        const mortgageResults = calculateMortgagePayoff(
            INITIAL_MORTGAGE, 
            MONTHLY_PAYMENT, 
            mortgageRate, 
            MONTHS
        );
        
        const investmentResults = calculateInvestmentPath(
            INITIAL_MORTGAGE, 
            MONTHLY_PAYMENT, 
            mortgageRate, 
            investmentReturn, 
            MONTHS
        );
        
        // Get data for chart
        const years = mortgageResults.map(data => data.year);
        const mortgageNetWorth = mortgageResults.map(data => data.equity);
        const investmentNetWorth = investmentResults.map(data => data.equity + data.investments);
        
        // Destroy previous chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Create chart options
        const options = {
            ...commonChartOptions,
            plugins: {
                ...commonChartOptions.plugins,
                title: {
                    ...commonChartOptions.plugins.title,
                    text: `Net Worth Comparison: Mortgage ${mortgageRate.toFixed(1)}% vs Investment ${investmentReturn.toFixed(1)}%`
                },
                tooltip: {
                    ...commonChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw) + ' CHF';
                        }
                    }
                }
            },
            scales: {
                ...commonChartOptions.scales,
                x: {
                    ...commonChartOptions.scales.x,
                    title: {
                        display: true,
                        text: 'Years',
                        font: { 
                            size: 14,
                            weight: 'normal'
                        },
                        padding: {
                            top: 10
                        }
                    }
                },
                y: {
                    ...commonChartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Net Worth (CHF)',
                        font: { 
                            size: 14,
                            weight: 'normal'
                        },
                        padding: {
                            bottom: 10
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value) + ' CHF';
                        }
                    },
                    min: 0,
                    max: Math.max(...investmentNetWorth) * 1.1 // Add 10% padding at the top
                }
            }
        };
        
        // Create new chart
        const ctx = simulationChart.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Pay Off Early',
                        data: mortgageNetWorth,
                        backgroundColor: 'rgba(49, 130, 206, 0.25)',
                        borderColor: '#3182ce',
                        borderWidth: 2.5,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Invest',
                        data: investmentNetWorth,
                        backgroundColor: 'rgba(56, 178, 172, 0.25)',
                        borderColor: '#38b2ac',
                        borderWidth: 2.5,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: options
        });
        
        // Store chart instance for resize handling
        ctx.canvas.chart = chartInstance;
        
        // Update summary - Create responsive table
        const finalMortgageData = mortgageResults[mortgageResults.length - 1];
        const finalInvestmentData = investmentResults[investmentResults.length - 1];
        
        const mortgageNetWorthFinal = finalMortgageData.equity;
        const investmentNetWorthFinal = finalInvestmentData.equity + finalInvestmentData.investments;
        const difference = investmentNetWorthFinal - mortgageNetWorthFinal;
        const percentageDifference = Math.round(difference / mortgageNetWorthFinal * 100);
        
        summaryDiv.innerHTML = `
            <h3>Results after ${YEARS} years:</h3>
            <div style="overflow-x:auto;">
                <table>
                    <tr>
                        <th>Strategy</th>
                        <th>Net Worth</th>
                        <th>Details</th>
                    </tr>
                    <tr>
                        <td>Pay Off Early</td>
                        <td>CHF ${formatCurrency(mortgageNetWorthFinal)}</td>
                        <td>House value (CHF ${formatCurrency(HOUSE_VALUE)}) - Remaining mortgage (CHF ${formatCurrency(finalMortgageData.balance)})</td>
                    </tr>
                    <tr>
                        <td>Invest</td>
                        <td>CHF ${formatCurrency(investmentNetWorthFinal)}</td>
                        <td>House equity (CHF ${formatCurrency(finalInvestmentData.equity)}) + Investments (CHF ${formatCurrency(finalInvestmentData.investments)})</td>
                    </tr>
                    <tr class="highlight">
                        <td>Difference</td>
                        <td>CHF ${formatCurrency(difference)}</td>
                        <td>${difference > 0 ? '+' : ''}${percentageDifference}%</td>
                    </tr>
                </table>
            </div>
            <p>${difference > 0 
                ? `Investing provides better returns by CHF ${formatCurrency(difference)} (${percentageDifference}% more).` 
                : `Paying off the mortgage is better by CHF ${formatCurrency(Math.abs(difference))} (${Math.abs(percentageDifference)}% more).`}</p>
        `;
        
        console.log("Simulation completed successfully");
    }
    
    // Attach click event to button
    runSimulationButton.addEventListener('click', runSimulation);
    
    // Run simulation immediately
    runSimulation();
    
    console.log("Simulation setup completed");
}

// Handle window resize for responsiveness
window.addEventListener('resize', function() {
    // Throttle the resize event to prevent excessive rendering
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(function() {
        // Force chart redraw for all canvases
        document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.chart) {
                canvas.chart.resize();
                canvas.chart.update('none');
            }
        });
    }, 200);
});

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    try {
        console.log("Initializing charts...");
        
        // Initialize the main charts
        initMortgageChart();
        initInvestmentChart();
        initNetWorthChart();
        initRateComparisonChart();
        
        // Setup the simulation
        setupSimulation();
        
        // Handle scroll effects
        handleScroll();
        
        console.log("Charts initialized successfully");
    } catch (error) {
        console.error("Error initializing charts:", error);
    }
}); 