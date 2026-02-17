// ============================================
// GLOBAL STATE
// ============================================

const COUNTRIES = {
    BR: { name: 'Brasil', flag: '🇧🇷', currency: 'R$' },
    US: { name: 'EUA', flag: '🇺🇸', currency: '$' },
    CA: { name: 'Canadá', flag: '🇨🇦', currency: '$' },
    GB: { name: 'Reino Unido', flag: '🇬🇧', currency: '$' },
    AU: { name: 'Austrália', flag: '🇦🇺', currency: '$' },
    GLOBAL: { name: 'Global', flag: '🌎', currency: '$' }
};

// ============================================
// CURRENCY FORMATTING HELPER
// ============================================

/**
 * Formata valor monetário baseado no país
 * @param {number|string} value - Valor a ser formatado
 * @param {string} countryCode - Código do país (BR, US, CA, GB, AU, GLOBAL)
 * @returns {string} - Valor formatado com símbolo de moeda
 */
function formatCurrency(value, countryCode) {
    const numValue = parseFloat(value) || 0;
    
    if (countryCode === 'BR') {
        // Brasil: R$ 1.234,56 (vírgula decimal, ponto milhar)
        return 'R$ ' + numValue.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else {
        // Outros países: $1,234.56 (ponto decimal, vírgula milhar)
        return '$' + numValue.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
}

let currentCountry = {
    divinetalk: 'BR',
    divinetv: 'BR'
};

// ============================================
// VIEW SWITCHING
// ============================================

const viewButtons = document.querySelectorAll('.view-btn');
const views = document.querySelectorAll('.view');

viewButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('active')) return;

        viewButtons.forEach(btn => btn.classList.remove('active'));
        views.forEach(view => view.classList.remove('active'));

        button.classList.add('active');
        const viewId = button.getAttribute('data-view');
        const targetView = document.getElementById(`view-${viewId}`);
        targetView.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update overview metrics when switching to it
        if (viewId === 'overview') {
            updateOverviewMetrics();
        }
    });
});

// ============================================
// COUNTRY TABS
// ============================================

const countryTabs = document.querySelectorAll('.country-tab');

countryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const app = tab.dataset.app;
        const country = tab.dataset.country;
        
        // Update active tab
        document.querySelectorAll(`.country-tab[data-app="${app}"]`).forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Update current country
        currentCountry[app] = country;
        
        // Update country label
        const countryInfo = COUNTRIES[country];
        const label = document.getElementById(`${app}-country-label`);
        if (label) {
            label.textContent = `${countryInfo.name} ${countryInfo.flag}`;
        }
        
        // Reload data for this country
        if (app === 'divinetalk') {
            tableDivineTalk.switchCountry(country);
        } else if (app === 'divinetv') {
            tableDivineTV.switchCountry(country);
        }
    });
});

// ============================================
// DAILY DATA TABLE CLASS
// ============================================

class DailyDataTable {
    constructor(appName) {
        this.appName = appName;
        this.appId = appName === 'DivineTalk' ? 'divinetalk' : 'divinetv';
        const suffix = appName === 'DivineTalk' ? 'DivineTalk' : 'DivineTV';
        this.tableBody = document.getElementById(`tableBody${suffix}`);
        this.addRowBtn = document.getElementById(`addRowBtn${suffix}`);
        this.exportCsvBtn = document.getElementById(`exportCsvBtn${suffix}`);
        this.periodFilter = document.getElementById(`periodFilter-${this.appId}`);
        this.loadMoreBtn = document.getElementById(`loadMore${suffix}`);
        this.currentCountry = 'BR';
        this.selectedPeriod = 'all';
        this.visibleRows = 5; // 🎨 Paginação: mostrar 5 linhas por padrão
        
        this.columns = [
            { key: 'date', label: 'Data', type: 'date' },
            { key: 'valorGasto', label: 'Valor Gasto', type: 'currency' },
            { key: 'instalacoes', label: 'Instalações', type: 'number' },
            { key: 'trials', label: 'Trials', type: 'number' },
            { key: 'novosAssinantes', label: 'Novos Assinantes', type: 'number' },
            { key: 'faturamentoApple', label: 'Faturamento Apple', type: 'currency' },
            { key: 'faturamentoAndroid', label: 'Faturamento Android', type: 'currency' }
        ];
        
        this.init();
    }
    
    getStorageKey() {
        return `${this.appId}_${this.currentCountry}`;
    }
    
    init() {
        this.loadData();
        this.addRowBtn.addEventListener('click', () => this.addRow());
        this.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        this.periodFilter.addEventListener('change', () => {
            this.selectedPeriod = this.periodFilter.value;
            this.visibleRows = 5; // 🎨 Resetar paginação ao trocar período
            this.updateMetrics();
        });
        
        // 🎨 Event listener do botão "Carregar mais"
        if (this.loadMoreBtn) {
            const btn = this.loadMoreBtn.querySelector('.load-more-btn');
            if (btn) {
                btn.addEventListener('click', () => this.loadMore());
            }
        }
    }
    
    switchCountry(country) {
        this.currentCountry = country;
        this.selectedPeriod = 'all';
        this.visibleRows = 5; // 🎨 Resetar paginação ao trocar país
        this.loadData();
        this.populatePeriodFilter();
        this.updateMetrics();
    }
    
    populatePeriodFilter() {
        const data = this.getData();
        const periods = new Set();
        
        data.forEach(row => {
            if (row.date) {
                // Extract YYYY-MM from date
                const yearMonth = row.date.substring(0, 7);
                periods.add(yearMonth);
            }
        });
        
        // Sort periods descending (newest first)
        const sortedPeriods = Array.from(periods).sort().reverse();
        
        // Populate dropdown
        this.periodFilter.innerHTML = '<option value="all">Todo o período</option>';
        sortedPeriods.forEach(period => {
            const [year, month] = period.split('-');
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthName = monthNames[parseInt(month) - 1];
            const option = document.createElement('option');
            option.value = period;
            option.textContent = `${monthName} ${year}`;
            this.periodFilter.appendChild(option);
        });
        
        // Reset selected period
        this.periodFilter.value = this.selectedPeriod;
    }
    
    filterDataByPeriod(data, period) {
        if (period === 'all') {
            return data;
        }
        return data.filter(row => row.date && row.date.startsWith(period));
    }
    
    loadData() {
        const data = this.getData();
        this.tableBody.innerHTML = '';
        
        if (data.length === 0) {
            this.showEmptyState();
            this.updateLoadMoreButton(0); // 🎨 Esconder botão se não há dados
        } else {
            // Sort data by date descending (most recent first)
            const sortedData = [...data].sort((a, b) => {
                const dateA = a.date || '';
                const dateB = b.date || '';
                return dateB.localeCompare(dateA);
            });
            
            // 🎨 Renderizar apenas as linhas visíveis
            const rowsToShow = sortedData.slice(0, this.visibleRows);
            rowsToShow.forEach((row, index) => this.renderRow(row, index));
            
            // 🎨 Atualizar botão "Carregar mais"
            this.updateLoadMoreButton(sortedData.length);
        }
        
        this.populatePeriodFilter();
        this.updateMetrics();
    }
    
    showEmptyState() {
        const countryInfo = COUNTRIES[this.currentCountry];
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <p>📊 Nenhum dado cadastrado para ${countryInfo.name} ${countryInfo.flag}</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary);">
                        Clique em "+ Adicionar Linha" para começar
                    </p>
                </td>
            </tr>
        `;
    }
    
    // 🎨 Atualizar botão "Carregar mais"
    updateLoadMoreButton(totalRows) {
        if (!this.loadMoreBtn) return;
        
        if (totalRows > this.visibleRows) {
            this.loadMoreBtn.style.display = 'block';
            const remaining = totalRows - this.visibleRows;
            const btn = this.loadMoreBtn.querySelector('.load-more-btn');
            if (btn) {
                btn.textContent = `📄 Carregar mais (${remaining} restantes)...`;
            }
        } else {
            this.loadMoreBtn.style.display = 'none';
        }
    }
    
    // 🎨 Carregar mais linhas
    loadMore() {
        this.visibleRows += 5;
        this.loadData();
        
        // Scroll suave pro topo da tabela (não pular pra baixo)
        const tableWrapper = this.tableBody.closest('.table-wrapper');
        if (tableWrapper) {
            const firstNewRow = this.tableBody.children[this.visibleRows - 5];
            if (firstNewRow) {
                firstNewRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
    
    renderRow(rowData, index) {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        
        this.columns.forEach(col => {
            const td = document.createElement('td');
            const input = this.createInput(col, rowData[col.key], index);
            
            // Aplicar formatação inicial para campos monetários/numéricos
            if ((col.type === 'currency' || col.type === 'number' || col.type === 'percentage') && input.value) {
                this.formatValue(input, col);
            }
            
            td.appendChild(input);
            tr.appendChild(td);
        });
        
        const actionTd = document.createElement('td');
        actionTd.className = 'actions-col';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️ Deletar';
        deleteBtn.addEventListener('click', () => this.deleteRow(index));
        actionTd.appendChild(deleteBtn);
        tr.appendChild(actionTd);
        
        this.tableBody.appendChild(tr);
    }
    
    createInput(col, value = '', index) {
        const input = document.createElement('input');
        input.type = col.type === 'date' ? 'date' : 'text';
        input.value = value || '';
        input.placeholder = col.type === 'date' ? 'DD/MM/AAAA' : '0';
        input.dataset.column = col.key;
        input.dataset.index = index;
        
        if (col.type === 'currency' || col.type === 'number' || col.type === 'percentage') {
            input.className = col.type === 'currency' || col.type === 'percentage' ? 'currency-input' : 'number-input';
            input.addEventListener('blur', (e) => this.formatValue(e.target, col));
            input.addEventListener('focus', (e) => this.unformatValue(e.target, col));
        }
        
        input.addEventListener('input', () => {
            this.saveData();
            if (input.dataset.column === 'date') {
                this.populatePeriodFilter(); // Update dropdown when date changes
            }
            this.updateMetrics();
        });
        
        return input;
    }
    
    formatValue(input, col) {
        let value = input.value.replace(/[^\d.-]/g, '');
        if (!value || value === '') return;
        
        const num = parseFloat(value);
        if (isNaN(num)) return;
        
        if (col.type === 'currency') {
            // Usar formatCurrency com o país atual
            input.value = formatCurrency(num, this.currentCountry);
        } else if (col.type === 'percentage') {
            input.value = `${num.toFixed(2)}%`;
        } else if (col.type === 'number') {
            input.value = Math.round(num).toLocaleString('pt-BR');
        }
    }
    
    unformatValue(input, col) {
        // Remover formatação ao focar (deixar só números)
        const value = input.value.replace(/[^\d.-]/g, '');
        input.value = value;
    }
    
    addRow() {
        const data = this.getData();
        const newRow = {};
        this.columns.forEach(col => newRow[col.key] = '');
        
        const today = new Date().toISOString().split('T')[0];
        newRow.date = today;
        
        data.push(newRow);
        this.setData(data);
        this.visibleRows = 5; // 🎨 Resetar paginação ao adicionar linha (mostrar do topo)
        this.loadData();
        this.populatePeriodFilter(); // Update dropdown with new months
        
        setTimeout(() => {
            this.tableBody.firstElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.tableBody.firstElementChild.querySelector('input').focus();
        }, 100);
    }
    
    deleteRow(index) {
        if (!confirm('⚠️ Tem certeza que deseja deletar esta linha?')) return;
        
        const data = this.getData();
        data.splice(index, 1);
        this.setData(data);
        this.loadData();
        this.populatePeriodFilter(); // Update dropdown after deletion
    }
    
    saveData() {
        const data = [];
        const rows = this.tableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.querySelector('.empty-state')) return;
            
            const rowData = {};
            const inputs = row.querySelectorAll('input');
            
            inputs.forEach(input => {
                const col = input.dataset.column;
                let value = input.value;
                value = value.replace(/[^\d.-]/g, '');
                rowData[col] = value;
            });
            
            data.push(rowData);
        });
        
        this.setData(data);
    }
    
    getData() {
        const stored = localStorage.getItem(this.getStorageKey());
        return stored ? JSON.parse(stored) : [];
    }
    
    setData(data) {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    }
    
    updateMetrics() {
        const allData = this.getData();
        const data = this.filterDataByPeriod(allData, this.selectedPeriod);
        
        let totalTrials = 0;
        let totalValorGasto = 0;
        let totalFaturamento = 0;
        
        data.forEach(row => {
            totalTrials += parseFloat(row.trials) || 0;
            totalValorGasto += parseFloat(row.valorGasto) || 0;
            
            const faturamentoApple = parseFloat(row.faturamentoApple) || 0;
            const faturamentoAndroid = parseFloat(row.faturamentoAndroid) || 0;
            totalFaturamento += faturamentoApple + faturamentoAndroid;
        });
        
        const custoPorTrial = totalTrials > 0 ? (totalValorGasto / totalTrials) : 0;
        const lucroBruto = totalFaturamento - totalValorGasto;
        
        // Update metric cards (only 3 now: Faturamento, Custo por Trial, Lucro Bruto)
        const faturamentoEl = document.getElementById(`${this.appId}-faturamento`);
        const custoTrialEl = document.getElementById(`${this.appId}-custoTrial`);
        const lucroBrutoEl = document.getElementById(`${this.appId}-lucroBruto`);
        
        if (faturamentoEl) {
            faturamentoEl.textContent = formatCurrency(totalFaturamento, this.currentCountry);
        }
        if (custoTrialEl) {
            custoTrialEl.textContent = formatCurrency(custoPorTrial, this.currentCountry);
        }
        if (lucroBrutoEl) {
            const isNegative = lucroBruto < 0;
            const formatted = formatCurrency(Math.abs(lucroBruto), this.currentCountry);
            lucroBrutoEl.textContent = isNegative ? `- ${formatted}` : formatted;
            lucroBrutoEl.style.color = isNegative ? 'var(--danger)' : '';
        }
        
        // Update overview if needed
        updateOverviewMetrics();
    }
    
    exportToCSV() {
        const data = this.getData();
        
        if (data.length === 0) {
            alert('⚠️ Não há dados para exportar!');
            return;
        }
        
        const headers = this.columns.map(col => col.label);
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = this.columns.map(col => {
                let value = row[col.key] || '';
                
                if (col.type === 'currency' && value) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        value = `"${formatCurrency(num, this.currentCountry)}"`;
                    }
                } else if (col.type === 'percentage' && value) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        value = `"${num.toFixed(2)}%"`;
                    }
                } else if (col.type === 'number' && value) {
                    value = Math.round(parseFloat(value));
                } else if (col.type === 'date' && value) {
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        value = `"${parts[2]}/${parts[1]}/${parts[0]}"`;
                    }
                }
                
                return value;
            });
            
            csv += values.join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];
        const countryInfo = COUNTRIES[this.currentCountry];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.appId}-${this.currentCountry}-${countryInfo.name}-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ CSV exportado: ${countryInfo.name} ${countryInfo.flag}`);
    }
}

// ============================================
// OVERVIEW PERIOD FILTER & CHART
// ============================================

let overviewSelectedPeriod = 'all';
let countryComparisonChart = null;
let currentChartMetric = 'revenue';

// Populate period dropdown for overview
function populateOverviewPeriodFilter() {
    const apps = ['divinetalk', 'divinetv'];
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    const periods = new Set();
    
    apps.forEach(app => {
        countries.forEach(country => {
            const key = `${app}_${country}`;
            const stored = localStorage.getItem(key);
            if (!stored) return;
            
            const data = JSON.parse(stored);
            data.forEach(row => {
                if (row.date) {
                    const yearMonth = row.date.substring(0, 7);
                    periods.add(yearMonth);
                }
            });
        });
    });
    
    const sortedPeriods = Array.from(periods).sort().reverse();
    const periodFilter = document.getElementById('periodFilterOverview');
    
    if (!periodFilter) return;
    
    periodFilter.innerHTML = '<option value="all">Todo o período</option>';
    sortedPeriods.forEach(period => {
        const [year, month] = period.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthName = monthNames[parseInt(month) - 1];
        const option = document.createElement('option');
        option.value = period;
        option.textContent = `${monthName} ${year}`;
        periodFilter.appendChild(option);
    });
    
    periodFilter.value = overviewSelectedPeriod;
}

// Get filtered data for a country+app in selected period
function getFilteredData(app, country, period) {
    const key = `${app}_${country}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    if (period === 'all') return data;
    
    return data.filter(row => row.date && row.date.startsWith(period));
}

// Calculate aggregated metrics for all countries
function calculateOverviewMetrics(period) {
    const apps = ['divinetalk', 'divinetv'];
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    
    let totalSpent = 0;
    let totalRevenue = 0;
    let totalTrials = 0;
    
    const countryMetrics = {};
    
    countries.forEach(country => {
        let countrySpent = 0;
        let countryRevenue = 0;
        let countryTrials = 0;
        
        apps.forEach(app => {
            const data = getFilteredData(app, country, period);
            
            data.forEach(row => {
                const spent = parseFloat(row.valorGasto) || 0;
                const trials = parseFloat(row.trials) || 0;
                const revApple = parseFloat(row.faturamentoApple) || 0;
                const revAndroid = parseFloat(row.faturamentoAndroid) || 0;
                const revenue = revApple + revAndroid;
                
                countrySpent += spent;
                countryRevenue += revenue;
                countryTrials += trials;
                
                totalSpent += spent;
                totalRevenue += revenue;
                totalTrials += trials;
            });
        });
        
        const cpt = countryTrials > 0 ? (countrySpent / countryTrials) : 0;
        const profit = countryRevenue - countrySpent;
        
        countryMetrics[country] = {
            spent: countrySpent,
            revenue: countryRevenue,
            trials: countryTrials,
            cpt: cpt,
            profit: profit
        };
    });
    
    return {
        totalSpent,
        totalRevenue,
        totalTrials,
        countryMetrics
    };
}

// Update budget card
function updateBudgetCard(period, totalSpent) {
    const budgetTotalInput = document.getElementById('budgetTotal');
    const budgetSpentEl = document.getElementById('budgetSpent');
    const budgetRemainingEl = document.getElementById('budgetRemaining');
    const budgetProgressBar = document.getElementById('budgetProgressBar');
    const budgetPercentageEl = document.getElementById('budgetPercentage');
    
    if (!budgetTotalInput) return;
    
    // Load or save budget from localStorage
    const budgetKey = `budget_${period}`;
    let budgetTotal = parseFloat(localStorage.getItem(budgetKey)) || 0;
    
    if (budgetTotal === 0 && budgetTotalInput.value) {
        budgetTotal = parseFloat(budgetTotalInput.value) || 0;
    }
    
    budgetTotalInput.value = budgetTotal || '';
    
    // Save budget when changed
    budgetTotalInput.addEventListener('input', () => {
        const newBudget = parseFloat(budgetTotalInput.value) || 0;
        localStorage.setItem(budgetKey, newBudget.toString());
        updateBudgetCard(period, totalSpent); // Recalculate
    });
    
    const remaining = budgetTotal - totalSpent;
    const percentage = budgetTotal > 0 ? (totalSpent / budgetTotal * 100) : 0;
    
    // Determine progress bar color
    let progressColor = 'var(--success)';
    if (percentage >= 95) {
        progressColor = 'var(--danger)';
    } else if (percentage >= 80) {
        progressColor = 'var(--divine-gold)';
    }
    
    budgetSpentEl.textContent = formatCurrency(totalSpent, 'BR');
    budgetRemainingEl.textContent = formatCurrency(Math.max(0, remaining), 'BR');
    budgetRemainingEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--divine-blue)';
    
    budgetProgressBar.style.setProperty('--progress-width', `${Math.min(percentage, 100)}%`);
    budgetProgressBar.style.setProperty('--progress-color', progressColor);
    budgetPercentageEl.textContent = `${percentage.toFixed(1)}%`;
}

// Update tax card
function updateTaxCard(totalRevenue) {
    const taxRevenueEl = document.getElementById('taxRevenue');
    const taxAmountEl = document.getElementById('taxAmount');
    
    if (!taxRevenueEl) return;
    
    const taxAmount = totalRevenue * 0.06;
    
    taxRevenueEl.textContent = formatCurrency(totalRevenue, 'BR');
    taxAmountEl.textContent = formatCurrency(taxAmount, 'BR');
}

// Update country comparison chart
function updateCountryChart(countryMetrics, metric) {
    const canvas = document.getElementById('countryComparisonChart');
    if (!canvas) return;
    
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    const labels = countries.map(code => COUNTRIES[code].name);
    
    let dataValues = [];
    let label = '';
    let isCurrency = true;
    
    switch (metric) {
        case 'revenue':
            dataValues = countries.map(code => countryMetrics[code].revenue);
            label = 'Faturamento';
            break;
        case 'trials':
            dataValues = countries.map(code => countryMetrics[code].trials);
            label = 'Trials';
            isCurrency = false;
            break;
        case 'cpt':
            dataValues = countries.map(code => countryMetrics[code].cpt);
            label = 'Custo por Trial';
            break;
        case 'profit':
            dataValues = countries.map(code => countryMetrics[code].profit);
            label = 'Lucro Bruto';
            break;
    }
    
    // Destroy previous chart if exists
    if (countryComparisonChart) {
        countryComparisonChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    countryComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dataValues,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',   // BR - azul
                    'rgba(16, 185, 129, 0.8)',   // US - verde
                    'rgba(245, 158, 11, 0.8)',   // CA - laranja
                    'rgba(139, 92, 246, 0.8)',   // GB - roxo
                    'rgba(236, 72, 153, 0.8)'    // AU - rosa
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed.y;
                            if (isCurrency) {
                                // Usar moeda do país (mas global usa $)
                                const countryCode = countries[context.dataIndex];
                                return `${label}: ${formatCurrency(value, countryCode)}`;
                            } else {
                                return `${label}: ${Math.round(value).toLocaleString('pt-BR')}`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        callback: function(value) {
                            if (isCurrency) {
                                // Global format
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(0) + 'K';
                                }
                                return '$' + value.toFixed(0);
                            } else {
                                return value.toLocaleString('pt-BR');
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// ============================================
// OVERVIEW METRICS
// ============================================

function updateOverviewMetrics() {
    const apps = ['divinetalk', 'divinetv'];
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    
    let globalTrials = 0;
    let globalRevenue = 0;
    let globalConversions = 0;
    let regionRevenues = {};
    
    // Calculate metrics for summary tables (always show all data)
    apps.forEach(app => {
        countries.forEach(country => {
            const key = `${app}_${country}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) {
                // Set placeholder values in summary table
                const tbody = document.getElementById(app === 'divinetalk' ? 'summaryDivineTalk' : 'summaryDivineTV');
                const cells = tbody.querySelectorAll(`[data-country="${country}"]`);
                cells.forEach(cell => {
                    cell.textContent = '—';
                });
                return;
            }
            
            const data = JSON.parse(stored);
            let spent = 0;
            let installs = 0;
            let trials = 0;
            let subscribers = 0;
            let revenue = 0;
            
            data.forEach(row => {
                spent += parseFloat(row.valorGasto) || 0;
                installs += parseFloat(row.instalacoes) || 0;
                trials += parseFloat(row.trials) || 0;
                subscribers += parseFloat(row.novosAssinantes) || 0;
                
                const revApple = parseFloat(row.faturamentoApple) || 0;
                const revAndroid = parseFloat(row.faturamentoAndroid) || 0;
                revenue += revApple + revAndroid;
            });
            
            const conversion = trials > 0 ? (subscribers / trials * 100) : 0;
            
            // Update global totals
            globalTrials += trials;
            globalRevenue += revenue;
            globalConversions += subscribers;
            
            // Track revenue by region
            regionRevenues[country] = (regionRevenues[country] || 0) + revenue;
            
            // Update summary table
            const tbody = document.getElementById(app === 'divinetalk' ? 'summaryDivineTalk' : 'summaryDivineTV');
            const spentCell = tbody.querySelector(`[data-country="${country}"][data-metric="spent"]`);
            const installsCell = tbody.querySelector(`[data-country="${country}"][data-metric="installs"]`);
            const trialsCell = tbody.querySelector(`[data-country="${country}"][data-metric="trials"]`);
            const subscribersCell = tbody.querySelector(`[data-country="${country}"][data-metric="subscribers"]`);
            const revenueCell = tbody.querySelector(`[data-country="${country}"][data-metric="revenue"]`);
            const conversionCell = tbody.querySelector(`[data-country="${country}"][data-metric="conversion"]`);
            
            // Usar formatCurrency baseado no país da linha
            if (spentCell) spentCell.textContent = formatCurrency(spent, country);
            if (installsCell) installsCell.textContent = installs.toLocaleString('pt-BR');
            if (trialsCell) trialsCell.textContent = trials.toLocaleString('pt-BR');
            if (subscribersCell) subscribersCell.textContent = subscribers.toLocaleString('pt-BR');
            if (revenueCell) revenueCell.textContent = formatCurrency(revenue, country);
            if (conversionCell) conversionCell.textContent = `${conversion.toFixed(2)}%`;
        });
    });
    
    // Update global stats
    const globalConversionRate = globalTrials > 0 ? (globalConversions / globalTrials * 100) : 0;
    const topRegion = Object.keys(regionRevenues).reduce((a, b) => 
        regionRevenues[a] > regionRevenues[b] ? a : b, 'BR'
    );
    
    const globalTrialsEl = document.getElementById('globalTrials');
    const globalRevenueEl = document.getElementById('globalRevenue');
    const globalConversionEl = document.getElementById('globalConversion');
    const topRegionEl = document.getElementById('topRegion');
    
    if (globalTrialsEl) globalTrialsEl.textContent = globalTrials.toLocaleString('pt-BR');
    // Global revenue: usar formatCurrency com 'GLOBAL' (será $)
    if (globalRevenueEl) globalRevenueEl.textContent = formatCurrency(globalRevenue, 'GLOBAL');
    if (globalConversionEl) globalConversionEl.textContent = globalConversionRate.toFixed(2);
    if (topRegionEl) topRegionEl.textContent = `${COUNTRIES[topRegion].flag} ${COUNTRIES[topRegion].name}`;
    
    // Update new overview features (budget, tax, chart) with filtered period
    const metrics = calculateOverviewMetrics(overviewSelectedPeriod);
    updateBudgetCard(overviewSelectedPeriod, metrics.totalSpent);
    updateTaxCard(metrics.totalRevenue);
    updateCountryChart(metrics.countryMetrics, currentChartMetric);
}

// ============================================
// INITIALIZE
// ============================================

let tableDivineTalk, tableDivineTV;

document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ Divine Sales Dashboard v2.0 Multi-Regional loaded!');
    
    tableDivineTalk = new DailyDataTable('DivineTalk');
    tableDivineTV = new DailyDataTable('DivineTV');
    
    console.log('📊 Tables initialized with multi-regional support');
    console.log('🌎 Countries:', Object.keys(COUNTRIES).join(', '));
    
    // Initialize Overview features
    populateOverviewPeriodFilter();
    
    // Period filter event listener
    const periodFilterOverview = document.getElementById('periodFilterOverview');
    if (periodFilterOverview) {
        periodFilterOverview.addEventListener('change', () => {
            overviewSelectedPeriod = periodFilterOverview.value;
            updateOverviewMetrics();
        });
    }
    
    // Chart metric toggle buttons
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            chartButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentChartMetric = btn.dataset.metric;
            const metrics = calculateOverviewMetrics(overviewSelectedPeriod);
            updateCountryChart(metrics.countryMetrics, currentChartMetric);
        });
    });
    
    updateOverviewMetrics();
});

document.documentElement.style.scrollBehavior = 'smooth';
