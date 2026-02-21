/* ============================================
   DASHBOARD ANALYTICS - Chart.js Implementation
   Professional data visualization and analytics
   ============================================ */

class DashboardAnalytics {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'all';
        this.currentMetrics = {
            countryComparison: 'revenue',
            appComparison: 'revenue',
            conversion: 'country'
        };
        
        // Cores por país (bandeiras)
        this.countryColors = {
            'BR': '#00A859', // Verde Brasil
            'US': '#3C3B6E', // Azul Navy EUA
            'CA': '#FF0000', // Vermelho Canadá
            'GB': '#012169', // Azul UK
            'AU': '#00008B'  // Azul Royal Austrália
        };
        
        this.countryNames = {
            'BR': '🇧🇷 Brasil',
            'US': '🇺🇸 EUA',
            'CA': '🇨🇦 Canadá',
            'GB': '🇬🇧 Reino Unido',
            'AU': '🇦🇺 Austrália'
        };
        
        this.appColors = {
            'divinetalk': '#3b82f6',
            'divinetv': '#f59e0b'
        };
        
        this.init();
    }
    
    init() {
        this.populatePeriodFilter();
        this.attachEventListeners();
        this.loadAndRenderAllCharts();
    }
    
    populatePeriodFilter() {
        const select = document.getElementById('periodFilterDashboards');
        if (!select) return;
        
        // Gerar opções de mês baseado em dados existentes
        const months = new Set();
        const apps = ['divinetalk', 'divinetv'];
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        
        apps.forEach(app => {
            countries.forEach(country => {
                const key = `${app}_${country}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const rows = JSON.parse(stored);
                    rows.forEach(row => {
                        if (row.date) {
                            const month = row.date.substring(0, 7); // YYYY-MM
                            months.add(month);
                        }
                    });
                }
            });
        });
        
        // Ordenar meses
        const sortedMonths = Array.from(months).sort().reverse();
        
        // Popular dropdown
        sortedMonths.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            option.textContent = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
            select.appendChild(option);
        });
    }
    
    attachEventListeners() {
        // Period filter
        const periodFilter = document.getElementById('periodFilterDashboards');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadAndRenderAllCharts();
            });
        }
        
        // App filter for dashboards
        const appFilter = document.getElementById('appFilterDashboards');
        if (appFilter) {
            appFilter.addEventListener('change', () => {
                this.loadAndRenderAllCharts();
            });
        }
        
        // Country Comparison metric buttons
        const countryButtons = document.querySelectorAll('#view-dashboards .chart-container:nth-child(1) .metric-btn');
        countryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                countryButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMetrics.countryComparison = e.target.dataset.metric;
                this.renderCountryComparison(this.cachedData);
            });
        });
        
        // App Comparison metric buttons
        const appButtons = document.querySelectorAll('#view-dashboards .chart-container:nth-child(2) .metric-btn');
        appButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                appButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMetrics.appComparison = e.target.dataset.metric;
                this.renderAppComparison(this.cachedData);
            });
        });
        
        // Conversion metric buttons
        const conversionButtons = document.querySelectorAll('#view-dashboards .chart-container:nth-child(6) .metric-btn');
        conversionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                conversionButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMetrics.conversion = e.target.dataset.metric;
                this.renderConversion(this.cachedData);
            });
        });
    }
    
    async loadAndRenderAllCharts() {
        const data = await this.loadAllData(this.currentPeriod);
        this.cachedData = data;
        
        this.renderCountryComparison(data);
        this.renderAppComparison(data);
        this.renderMonthlyTrend(data);
        this.renderRevenueDistribution(data);
        this.renderExpenseBreakdown(data);
        this.renderConversion(data);
        this.renderROI(data);
    }
    
    async loadAllData(period) {
        const allApps = ['divinetalk', 'divinetv'];
        // Respect global app filter from script.js
        const appFilter = (typeof dashboardsAppFilter !== 'undefined' && dashboardsAppFilter !== 'all') ? dashboardsAppFilter : null;
        const apps = appFilter ? [appFilter] : allApps;
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        
        const data = {
            apps: {},
            financial: {}
        };
        
        // Buscar dados dos apps
        apps.forEach(app => {
            data.apps[app] = {};
            countries.forEach(country => {
                const key = `${app}_${country}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    let rows = JSON.parse(stored);
                    // Filtrar por período se não for 'all'
                    if (period !== 'all') {
                        rows = rows.filter(r => r.date && r.date.startsWith(period));
                    }
                    data.apps[app][country] = rows;
                } else {
                    data.apps[app][country] = [];
                }
            });
        });
        
        // Buscar dados financeiros
        if (period !== 'all') {
            ['custosFixos', 'custosVariaveis', 'extratoCartao', 'contasPagar'].forEach(table => {
                const key = `financial_${table}_${period}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    data.financial[table] = JSON.parse(stored);
                } else {
                    data.financial[table] = [];
                }
            });
        } else {
            // Para 'all', precisamos buscar todos os meses
            data.financial = {
                custosFixos: [],
                custosVariaveis: [],
                extratoCartao: [],
                contasPagar: []
            };
        }
        
        return data;
    }
    
    // ============================================
    // 1. País vs País
    // ============================================
    renderCountryComparison(data) {
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        const metric = this.currentMetrics.countryComparison;
        
        const aggregated = {};
        countries.forEach(country => {
            aggregated[country] = {
                revenue: 0,
                trials: 0,
                spent: 0,
                subscribers: 0
            };
            
            ['divinetalk', 'divinetv'].forEach(app => {
                const rows = data.apps[app][country] || [];
                rows.forEach(row => {
                    aggregated[country].revenue += (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                    aggregated[country].trials += parseInt(row.trials) || 0;
                    aggregated[country].spent += parseFloat(row.valorGasto) || 0;
                    aggregated[country].subscribers += parseInt(row.novosAssinantes) || 0;
                });
            });
            
            // Calcular métricas derivadas
            aggregated[country].cpt = aggregated[country].trials > 0 
                ? aggregated[country].spent / aggregated[country].trials 
                : 0;
            aggregated[country].profit = aggregated[country].revenue - aggregated[country].spent;
        });
        
        const labels = countries.map(c => this.countryNames[c]);
        let values, yAxisLabel;
        
        switch (metric) {
            case 'revenue':
                values = countries.map(c => aggregated[c].revenue);
                yAxisLabel = 'Faturamento';
                break;
            case 'trials':
                values = countries.map(c => aggregated[c].trials);
                yAxisLabel = 'Trials';
                break;
            case 'cpt':
                values = countries.map(c => aggregated[c].cpt);
                yAxisLabel = 'Custo por Trial';
                break;
            case 'profit':
                values = countries.map(c => aggregated[c].profit);
                yAxisLabel = 'Lucro';
                break;
        }
        
        const chartData = {
            labels: labels,
            datasets: [{
                label: yAxisLabel,
                data: values,
                backgroundColor: countries.map(c => this.countryColors[c] + '90'),
                borderColor: countries.map(c => this.countryColors[c]),
                borderWidth: 2
            }]
        };
        
        this.destroyChart('chartCountryComparison');
        
        const ctx = document.getElementById('chartCountryComparison');
        if (!ctx) return;
        
        this.charts.chartCountryComparison = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                if (metric === 'trials' || metric === 'subscribers') {
                                    return `${yAxisLabel}: ${value.toLocaleString('pt-BR')}`;
                                } else {
                                    return `${yAxisLabel}: ${this.formatCurrency(value)}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (metric === 'trials' || metric === 'subscribers') {
                                    return value.toLocaleString('pt-BR');
                                } else {
                                    return this.formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 2. App vs App
    // ============================================
    renderAppComparison(data) {
        const apps = ['divinetalk', 'divinetv'];
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        const metric = this.currentMetrics.appComparison;
        
        const aggregated = {};
        apps.forEach(app => {
            aggregated[app] = {
                revenue: 0,
                trials: 0,
                installs: 0,
                subscribers: 0
            };
            
            countries.forEach(country => {
                const rows = data.apps[app][country] || [];
                rows.forEach(row => {
                    aggregated[app].revenue += (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                    aggregated[app].trials += parseInt(row.trials) || 0;
                    aggregated[app].installs += parseInt(row.instalacoes) || 0;
                    aggregated[app].subscribers += parseInt(row.novosAssinantes) || 0;
                });
            });
        });
        
        let values, yAxisLabel;
        
        switch (metric) {
            case 'revenue':
                values = apps.map(app => aggregated[app].revenue);
                yAxisLabel = 'Faturamento';
                break;
            case 'trials':
                values = apps.map(app => aggregated[app].trials);
                yAxisLabel = 'Trials';
                break;
            case 'installs':
                values = apps.map(app => aggregated[app].installs);
                yAxisLabel = 'Instalações';
                break;
            case 'subscribers':
                values = apps.map(app => aggregated[app].subscribers);
                yAxisLabel = 'Novos Assinantes';
                break;
        }
        
        const chartData = {
            labels: ['💬 Divine Talk', '📺 Divine TV'],
            datasets: [{
                label: yAxisLabel,
                data: values,
                backgroundColor: [
                    this.appColors.divinetalk + '90',
                    this.appColors.divinetv + '90'
                ],
                borderColor: [
                    this.appColors.divinetalk,
                    this.appColors.divinetv
                ],
                borderWidth: 2
            }]
        };
        
        this.destroyChart('chartAppComparison');
        
        const ctx = document.getElementById('chartAppComparison');
        if (!ctx) return;
        
        this.charts.chartAppComparison = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                if (metric === 'trials' || metric === 'installs' || metric === 'subscribers') {
                                    return `${yAxisLabel}: ${value.toLocaleString('pt-BR')}`;
                                } else {
                                    return `${yAxisLabel}: ${this.formatCurrency(value)}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (metric === 'trials' || metric === 'installs' || metric === 'subscribers') {
                                    return value.toLocaleString('pt-BR');
                                } else {
                                    return this.formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 3. Evolução Mensal
    // ============================================
    renderMonthlyTrend(data) {
        const apps = ['divinetalk', 'divinetv'];
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        
        // Coletar todos os meses disponíveis
        const monthlyData = {};
        
        apps.forEach(app => {
            countries.forEach(country => {
                const rows = data.apps[app][country] || [];
                rows.forEach(row => {
                    if (row.date) {
                        const month = row.date.substring(0, 7); // YYYY-MM
                        if (!monthlyData[month]) {
                            monthlyData[month] = {
                                revenue: 0,
                                spent: 0,
                                profit: 0
                            };
                        }
                        
                        const revenue = (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                        const spent = parseFloat(row.valorGasto) || 0;
                        
                        monthlyData[month].revenue += revenue;
                        monthlyData[month].spent += spent;
                        monthlyData[month].profit += (revenue - spent);
                    }
                });
            });
        });
        
        // Ordenar meses e pegar os últimos 6
        const sortedMonths = Object.keys(monthlyData).sort();
        const last6Months = sortedMonths.slice(-6);
        
        const labels = last6Months.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(-2)}`;
        });
        
        const revenueData = last6Months.map(m => monthlyData[m].revenue);
        const spentData = last6Months.map(m => monthlyData[m].spent);
        const profitData = last6Months.map(m => monthlyData[m].profit);
        
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Faturamento Total',
                    data: revenueData,
                    borderColor: '#10b981',
                    backgroundColor: '#10b98120',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Custos Totais',
                    data: spentData,
                    borderColor: '#ef4444',
                    backgroundColor: '#ef444420',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Lucro Bruto',
                    data: profitData,
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f620',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        };
        
        this.destroyChart('chartMonthlyTrend');
        
        const ctx = document.getElementById('chartMonthlyTrend');
        if (!ctx) return;
        
        this.charts.chartMonthlyTrend = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 4. Distribuição de Receita por País
    // ============================================
    renderRevenueDistribution(data) {
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        const apps = ['divinetalk', 'divinetv'];
        
        const revenueByCountry = {};
        countries.forEach(country => {
            revenueByCountry[country] = 0;
            apps.forEach(app => {
                const rows = data.apps[app][country] || [];
                rows.forEach(row => {
                    revenueByCountry[country] += (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                });
            });
        });
        
        const labels = countries.map(c => this.countryNames[c]);
        const values = countries.map(c => revenueByCountry[c]);
        const colors = countries.map(c => this.countryColors[c]);
        
        const chartData = {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.map(c => c + 'CC'),
                borderColor: colors,
                borderWidth: 2
            }]
        };
        
        this.destroyChart('chartRevenueDistribution');
        
        const ctx = document.getElementById('chartRevenueDistribution');
        if (!ctx) return;
        
        this.charts.chartRevenueDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 5. Despesas por Categoria
    // ============================================
    renderExpenseBreakdown(data) {
        const categories = {
            'Custos Fixos': 0,
            'Custos Variáveis': 0,
            'Extrato Cartão': 0,
            'Contas a Pagar': 0
        };
        
        // Custos Fixos
        if (data.financial.custosFixos) {
            data.financial.custosFixos.forEach(item => {
                categories['Custos Fixos'] += parseFloat(item.valorMensal || 0);
            });
        }
        
        // Custos Variáveis
        if (data.financial.custosVariaveis) {
            data.financial.custosVariaveis.forEach(item => {
                categories['Custos Variáveis'] += parseFloat(item.valor || 0);
            });
        }
        
        // Extrato Cartão
        if (data.financial.extratoCartao) {
            data.financial.extratoCartao.forEach(item => {
                categories['Extrato Cartão'] += parseFloat(item.valor || 0);
            });
        }
        
        // Contas a Pagar (apenas pendentes)
        if (data.financial.contasPagar) {
            data.financial.contasPagar.forEach(item => {
                if (item.status === 'Pendente') {
                    categories['Contas a Pagar'] += parseFloat(item.valor || 0);
                }
            });
        }
        
        const labels = Object.keys(categories);
        const values = Object.values(categories);
        
        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Despesas',
                data: values,
                backgroundColor: [
                    '#3b82f690',
                    '#f59e0b90',
                    '#ef444490',
                    '#8b5cf690'
                ],
                borderColor: [
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderWidth: 2
            }]
        };
        
        this.destroyChart('chartExpenseBreakdown');
        
        const ctx = document.getElementById('chartExpenseBreakdown');
        if (!ctx) return;
        
        this.charts.chartExpenseBreakdown = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${this.formatCurrency(context.parsed.x)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 6. Conversão Trial → Paid
    // ============================================
    renderConversion(data) {
        const mode = this.currentMetrics.conversion;
        
        let labels, trialsData, subscribersData;
        
        if (mode === 'country') {
            const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
            const apps = ['divinetalk', 'divinetv'];
            
            const aggregated = {};
            countries.forEach(country => {
                aggregated[country] = { trials: 0, subscribers: 0 };
                apps.forEach(app => {
                    const rows = data.apps[app][country] || [];
                    rows.forEach(row => {
                        aggregated[country].trials += parseInt(row.trials) || 0;
                        aggregated[country].subscribers += parseInt(row.novosAssinantes) || 0;
                    });
                });
            });
            
            labels = countries.map(c => this.countryNames[c]);
            trialsData = countries.map(c => aggregated[c].trials);
            subscribersData = countries.map(c => aggregated[c].subscribers);
            
        } else { // mode === 'app'
            const apps = ['divinetalk', 'divinetv'];
            const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
            
            const aggregated = {};
            apps.forEach(app => {
                aggregated[app] = { trials: 0, subscribers: 0 };
                countries.forEach(country => {
                    const rows = data.apps[app][country] || [];
                    rows.forEach(row => {
                        aggregated[app].trials += parseInt(row.trials) || 0;
                        aggregated[app].subscribers += parseInt(row.novosAssinantes) || 0;
                    });
                });
            });
            
            labels = ['💬 Divine Talk', '📺 Divine TV'];
            trialsData = ['divinetalk', 'divinetv'].map(app => aggregated[app].trials);
            subscribersData = ['divinetalk', 'divinetv'].map(app => aggregated[app].subscribers);
        }
        
        // Calcular taxas de conversão
        const conversionRates = trialsData.map((trials, i) => {
            return trials > 0 ? ((subscribersData[i] / trials) * 100).toFixed(1) : 0;
        });
        
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Trials',
                    data: trialsData,
                    backgroundColor: '#3b82f690',
                    borderColor: '#3b82f6',
                    borderWidth: 2
                },
                {
                    label: 'Novos Assinantes',
                    data: subscribersData,
                    backgroundColor: '#10b98190',
                    borderColor: '#10b981',
                    borderWidth: 2
                }
            ]
        };
        
        this.destroyChart('chartConversion');
        
        const ctx = document.getElementById('chartConversion');
        if (!ctx) return;
        
        this.charts.chartConversion = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            footer: (items) => {
                                const index = items[0].dataIndex;
                                return `Taxa de Conversão: ${conversionRates[index]}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('pt-BR')
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // 7. ROI por País
    // ============================================
    renderROI(data) {
        const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
        const apps = ['divinetalk', 'divinetv'];
        
        const aggregated = {};
        countries.forEach(country => {
            aggregated[country] = { revenue: 0, spent: 0 };
            apps.forEach(app => {
                const rows = data.apps[app][country] || [];
                rows.forEach(row => {
                    aggregated[country].revenue += (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                    aggregated[country].spent += parseFloat(row.valorGasto) || 0;
                });
            });
        });
        
        const labels = countries.map(c => this.countryNames[c]);
        const roiValues = countries.map(country => {
            const { revenue, spent } = aggregated[country];
            if (spent === 0) return 0;
            return ((revenue - spent) / spent) * 100;
        });
        
        // Cores baseadas em ROI positivo/negativo
        const colors = roiValues.map(roi => roi >= 0 ? '#10b981' : '#ef4444');
        
        const chartData = {
            labels: labels,
            datasets: [{
                label: 'ROI (%)',
                data: roiValues,
                backgroundColor: colors.map(c => c + '90'),
                borderColor: colors,
                borderWidth: 2
            }]
        };
        
        this.destroyChart('chartROI');
        
        const ctx = document.getElementById('chartROI');
        if (!ctx) return;
        
        this.charts.chartROI = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const roi = context.parsed.y;
                                return `ROI: ${roi.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                }
            }
        });
    }
    
    // ============================================
    // Helpers
    // ============================================
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }
    
    formatCurrency(value) {
        if (value === 0) return 'R$ 0';
        if (!value) return '—';
        
        const absValue = Math.abs(value);
        let formatted;
        
        if (absValue >= 1000000) {
            formatted = `R$ ${(value / 1000000).toFixed(1)}M`;
        } else if (absValue >= 1000) {
            formatted = `R$ ${(value / 1000).toFixed(1)}K`;
        } else {
            formatted = `R$ ${value.toFixed(0)}`;
        }
        
        return formatted;
    }
}

// Initialize Dashboard Analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardAnalytics = new DashboardAnalytics();
        console.log('📊 Dashboard Analytics initialized');
    });
} else {
    window.dashboardAnalytics = new DashboardAnalytics();
    console.log('📊 Dashboard Analytics initialized');
}
