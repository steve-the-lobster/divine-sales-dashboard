// ============================================
// GLOBAL STATE
// ============================================

const COUNTRIES = {
    BR: { name: 'Brasil', flag: '🇧🇷', currency: 'R$' },
    US: { name: 'EUA', flag: '🇺🇸', currency: '$' },
    CA: { name: 'Canadá', flag: '🇨🇦', currency: '$' },
    GB: { name: 'Reino Unido', flag: '🇬🇧', currency: '$' },
    AU: { name: 'Austrália', flag: '🇦🇺', currency: '$' },
    GLOBAL: { name: 'Global', flag: '🌎', currency: '$' },
    ALL: { name: 'Todos os Países', flag: '🌎', currency: 'R$' }
};

// Countries to aggregate when ALL is selected
const ALL_COUNTRIES = ['BR', 'US', 'CA', 'GB', 'AU'];
const FX_RATE = 5.4; // Taxa de conversão USD/CAD/GBP/AUD → R$

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
        
        // Disable/enable add row button for ALL mode
        if (this.addRowBtn) {
            this.addRowBtn.disabled = (country === 'ALL');
            this.addRowBtn.style.opacity = (country === 'ALL') ? '0.4' : '';
            this.addRowBtn.title = (country === 'ALL') ? 'Não é possível adicionar no modo Todos os Países' : '';
        }
        
        // Update country label
        const countryInfo = COUNTRIES[country] || COUNTRIES['BR'];
        const label = document.getElementById(`${this.appId}-country-label`);
        if (label) {
            label.textContent = `${countryInfo.name} ${countryInfo.flag}`;
        }
        
        this.loadData();
        // populatePeriodFilter is called inside loadData (including ALL mode)
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
    
    updateTableHeader(showCountryCol) {
        // Find the thead of this table
        const suffix = this.appName === 'DivineTalk' ? 'DivineTalk' : 'DivineTV';
        const table = document.getElementById(`dailyDataTable${suffix}`);
        if (!table) return;
        const thead = table.querySelector('thead tr');
        if (!thead) return;
        
        // Remove existing country header if present
        const existingCountryTh = thead.querySelector('th.country-col');
        if (existingCountryTh) existingCountryTh.remove();
        
        if (showCountryCol) {
            const th = document.createElement('th');
            th.textContent = 'País';
            th.className = 'country-col';
            thead.insertBefore(th, thead.firstChild);
        }
    }
    
    loadData() {
        this.tableBody.innerHTML = '';
        
        // ALL mode: aggregate from all countries (read-only)
        if (this.currentCountry === 'ALL') {
            this.updateTableHeader(true);
            const allData = [];
            ALL_COUNTRIES.forEach(country => {
                const key = `${this.appId}_${country}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const data = JSON.parse(stored);
                    data.forEach(row => allData.push({ ...row, _country: country }));
                }
            });
            
            // Show all rows (period filter only affects metric cards, same as non-ALL mode)
            const sorted = allData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            
            if (sorted.length === 0) {
                this.tableBody.innerHTML = `<tr><td colspan="9" class="empty-state"><p>🌎 Nenhum dado cadastrado</p></td></tr>`;
                this.updateLoadMoreButton(0);
            } else {
                const rowsToShow = sorted.slice(0, this.visibleRows);
                rowsToShow.forEach(row => this.renderReadOnlyRow(row));
                this.updateLoadMoreButton(sorted.length);
            }
            this.populatePeriodFilterAll(allData);
            this.updateMetrics();
            return;
        }
        
        // Remove country column if switching back from ALL
        this.updateTableHeader(false);
        
        const data = this.getData();
        
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
    
    // Render a read-only row for ALL mode (includes country column)
    renderReadOnlyRow(rowData) {
        const countryInfo = COUNTRIES[rowData._country] || { name: rowData._country, flag: '' };
        const tr = document.createElement('tr');
        
        // Country cell
        const tdCountry = document.createElement('td');
        tdCountry.textContent = `${countryInfo.flag} ${countryInfo.name}`;
        tdCountry.style.fontWeight = '600';
        tr.appendChild(tdCountry);
        
        this.columns.forEach(col => {
            const td = document.createElement('td');
            let val = rowData[col.key] || '';
            const num = parseFloat(val);
            if (col.type === 'currency' && !isNaN(num)) {
                // Convert non-BR to R$ equivalent for display
                td.textContent = formatCurrency(num, rowData._country);
            } else if (col.type === 'number' && !isNaN(num)) {
                td.textContent = Math.round(num).toLocaleString('pt-BR');
            } else if (col.type === 'date' && val) {
                const parts = val.split('-');
                td.textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : val;
            } else {
                td.textContent = val || '—';
            }
            tr.appendChild(td);
        });
        
        // Empty actions cell
        const tdActions = document.createElement('td');
        tdActions.className = 'actions-col';
        tdActions.textContent = '—';
        tr.appendChild(tdActions);
        
        this.tableBody.appendChild(tr);
    }
    
    // Populate period filter for ALL mode
    populatePeriodFilterAll(allData) {
        const periods = new Set();
        allData.forEach(row => {
            if (row.date) periods.add(row.date.substring(0, 7));
        });
        const sortedPeriods = Array.from(periods).sort().reverse();
        this.periodFilter.innerHTML = '<option value="all">Todo o período</option>';
        sortedPeriods.forEach(period => {
            const [year, month] = period.split('-');
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const option = document.createElement('option');
            option.value = period;
            option.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
            this.periodFilter.appendChild(option);
        });
        this.periodFilter.value = this.selectedPeriod;
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
        let data;
        let displayCountry = this.currentCountry;
        
        if (this.currentCountry === 'ALL') {
            // Aggregate from all countries
            const allRaw = [];
            ALL_COUNTRIES.forEach(country => {
                const key = `${this.appId}_${country}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const rows = JSON.parse(stored);
                    rows.forEach(row => allRaw.push({ ...row, _country: country }));
                }
            });
            data = this.filterDataByPeriod(allRaw, this.selectedPeriod);
            displayCountry = 'BR'; // display in R$
        } else {
            const allData = this.getData();
            data = this.filterDataByPeriod(allData, this.selectedPeriod);
        }
        
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
        
        // Para BR: usar valorGasto × 1.13 no cálculo do Lucro Bruto
        let valorGastoParaLucro = totalValorGasto;
        let valorGastoComImposto = 0;
        const isBR = this.currentCountry === 'BR';
        
        if (isBR) {
            valorGastoComImposto = totalValorGasto * 1.13;
            valorGastoParaLucro = valorGastoComImposto;
        }
        
        const lucroBruto = totalFaturamento - valorGastoParaLucro;
        
        // Update metric cards
        const faturamentoEl = document.getElementById(`${this.appId}-faturamento`);
        const custoTrialEl = document.getElementById(`${this.appId}-custoTrial`);
        const lucroBrutoEl = document.getElementById(`${this.appId}-lucroBruto`);
        const valorGastoEl = document.getElementById(`${this.appId}-valorGasto`);
        const impostoSection = document.getElementById(`${this.appId}-imposto-section`);
        const valorGastoComImpostoEl = document.getElementById(`${this.appId}-valorGastoComImposto`);
        
        if (faturamentoEl) {
            faturamentoEl.textContent = formatCurrency(totalFaturamento, displayCountry);
        }
        if (custoTrialEl) {
            custoTrialEl.textContent = formatCurrency(custoPorTrial, displayCountry);
        }
        if (lucroBrutoEl) {
            const isNegative = lucroBruto < 0;
            const formatted = formatCurrency(Math.abs(lucroBruto), displayCountry);
            lucroBrutoEl.textContent = isNegative ? `- ${formatted}` : formatted;
            lucroBrutoEl.style.color = isNegative ? 'var(--danger)' : '';
        }
        
        // 4th card: Valor Gasto em Ads
        if (valorGastoEl) {
            valorGastoEl.textContent = formatCurrency(totalValorGasto, displayCountry);
        }
        if (impostoSection) {
            if (isBR) {
                impostoSection.style.display = 'block';
                if (valorGastoComImpostoEl) {
                    valorGastoComImpostoEl.textContent = formatCurrency(valorGastoComImposto, 'BR');
                }
            } else {
                impostoSection.style.display = 'none';
            }
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
let overviewAppFilter = 'all';
let dashboardsAppFilter = 'all';
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
function calculateOverviewMetrics(period, appFilter) {
    const allApps = ['divinetalk', 'divinetv'];
    const apps = (appFilter && appFilter !== 'all') ? [appFilter] : allApps;
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

// Calculate total ads spent across all apps/countries (in R$)
function calculateTotalAdsSpent() {
    const apps = ['divinetalk', 'divinetv'];
    let adsBR = 0;
    let adsOthers = 0;
    
    apps.forEach(app => {
        // BR: valor já em R$
        const brKey = `${app}_BR`;
        const brStored = localStorage.getItem(brKey);
        if (brStored) {
            const brData = JSON.parse(brStored);
            brData.forEach(row => {
                adsBR += parseFloat(row.valorGasto) || 0;
            });
        }
        
        // Outros países: converter × FX_RATE
        ['US', 'CA', 'GB', 'AU'].forEach(country => {
            const key = `${app}_${country}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const data = JSON.parse(stored);
                data.forEach(row => {
                    adsOthers += (parseFloat(row.valorGasto) || 0) * FX_RATE;
                });
            }
        });
    });
    
    return { adsBR, adsOthers, total: adsBR + adsOthers };
}

// Update budget DRE card
function updateBudgetDRE(month) {
    const budgetTotalInput = document.getElementById('budgetTotal');
    const expenseCustosFixosEl = document.getElementById('expenseCustosFixos');
    const expenseCustosVariaveisEl = document.getElementById('expenseCustosVariaveis');
    const expenseExtratoCartaoEl = document.getElementById('expenseExtratoCartao');
    const totalGastoEl = document.getElementById('totalGasto');
    const budgetRemainingEl = document.getElementById('budgetRemaining');
    const budgetProgressBar = document.getElementById('budgetProgressBar');
    const budgetProgressLabel = document.getElementById('budgetProgressLabel');
    const adsSpentBREl = document.getElementById('adsSpentBR');
    const adsSpentOthersEl = document.getElementById('adsSpentOthers');
    const adsSpentTotalEl = document.getElementById('adsSpentTotal');
    
    if (!budgetTotalInput) return;
    
    // Load or save budget from localStorage
    const budgetKey = `budget_${month}`;
    let budgetTotal = parseFloat(localStorage.getItem(budgetKey)) || 20000;
    
    if (budgetTotal === 0 && budgetTotalInput.value) {
        budgetTotal = parseFloat(budgetTotalInput.value) || 20000;
    }
    
    budgetTotalInput.value = budgetTotal || 20000;
    
    // Save budget when changed — remove old handler, add new one with current month
    if (budgetTotalInput._budgetHandler) {
        budgetTotalInput.removeEventListener('input', budgetTotalInput._budgetHandler);
    }
    budgetTotalInput._budgetHandler = function() {
        const newBudget = parseFloat(budgetTotalInput.value) || 0;
        localStorage.setItem(budgetKey, newBudget.toString());
        updateBudgetDRE(month); // Recalculate
    };
    budgetTotalInput.addEventListener('input', budgetTotalInput._budgetHandler);
    
    // Buscar dados da aba Financeiro (sem contasPagar)
    const custosFixos = JSON.parse(localStorage.getItem(`financial_custosFixos_${month}`) || '[]');
    const custosVariaveis = JSON.parse(localStorage.getItem(`financial_custosVariaveis_${month}`) || '[]');
    const extratoCartao = JSON.parse(localStorage.getItem(`financial_extratoCartao_${month}`) || '[]');
    
    // Calcular totais (sem contasPagar)
    const totalCustosFixos = custosFixos.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    const totalCustosVariaveis = custosVariaveis.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    const totalExtratoCartao = extratoCartao.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    
    const totalGasto = totalCustosFixos + totalCustosVariaveis + totalExtratoCartao;
    const restante = budgetTotal - totalGasto;
    const percentGasto = budgetTotal > 0 ? (totalGasto / budgetTotal) * 100 : 0;
    
    // Atualizar DOM
    if (expenseCustosFixosEl) expenseCustosFixosEl.textContent = formatCurrency(totalCustosFixos, 'BR');
    if (expenseCustosVariaveisEl) expenseCustosVariaveisEl.textContent = formatCurrency(totalCustosVariaveis, 'BR');
    if (expenseExtratoCartaoEl) expenseExtratoCartaoEl.textContent = formatCurrency(totalExtratoCartao, 'BR');
    if (totalGastoEl) totalGastoEl.textContent = formatCurrency(totalGasto, 'BR');
    if (budgetRemainingEl) budgetRemainingEl.textContent = formatCurrency(restante, 'BR');
    
    // Gastos em Ads
    const adsData = calculateTotalAdsSpent();
    if (adsSpentBREl) adsSpentBREl.textContent = formatCurrency(adsData.adsBR, 'BR');
    if (adsSpentOthersEl) adsSpentOthersEl.textContent = formatCurrency(adsData.adsOthers, 'BR');
    if (adsSpentTotalEl) adsSpentTotalEl.textContent = formatCurrency(adsData.total, 'BR');
    
    // Atualizar barra de progresso
    if (budgetProgressBar) {
        budgetProgressBar.style.width = `${Math.min(percentGasto, 100)}%`;
        
        // Cores da barra (verde < 80%, amarelo 80-95%, vermelho > 95%)
        if (percentGasto < 80) {
            budgetProgressBar.style.backgroundColor = 'var(--success)';
        } else if (percentGasto < 95) {
            budgetProgressBar.style.backgroundColor = 'var(--warning)';
        } else {
            budgetProgressBar.style.backgroundColor = 'var(--danger)';
        }
    }
    
    if (budgetProgressLabel) {
        budgetProgressLabel.textContent = `${percentGasto.toFixed(1)}%`;
    }
    
    // Update net profit card too
    updateNetProfitCard(month);
}

// Legacy function - redirect to new DRE version
function updateBudgetCard(period, totalSpent) {
    // This is kept for backward compatibility
    updateBudgetDRE(period);
}

// Update Net Profit card (replaces old tax card)
function updateNetProfitCard(month) {
    const netRevenueEl = document.getElementById('netRevenue');
    const netAdsSpentEl = document.getElementById('netAdsSpent');
    const netGrossProfitEl = document.getElementById('netGrossProfit');
    const netCustosFixosEl = document.getElementById('netCustosFixos');
    const netCustosVariaveisEl = document.getElementById('netCustosVariaveis');
    const netImpostosEl = document.getElementById('netImpostos');
    const netProfitEl = document.getElementById('netProfit');
    
    if (!netProfitEl) return;
    
    // Total faturamento de todos os apps/países
    const apps = ['divinetalk', 'divinetv'];
    const allCountries = ['BR', 'US', 'CA', 'GB', 'AU'];
    let totalRevenue = 0;
    
    apps.forEach(app => {
        allCountries.forEach(country => {
            const key = `${app}_${country}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const data = JSON.parse(stored);
                data.forEach(row => {
                    totalRevenue += (parseFloat(row.faturamentoApple) || 0) + (parseFloat(row.faturamentoAndroid) || 0);
                });
            }
        });
    });
    
    // Gastos em ads convertidos para R$
    const adsData = calculateTotalAdsSpent();
    const totalAdsR$ = adsData.total;
    
    // Lucro Bruto = Faturamento - Ads (em R$)
    const lucroBruto = totalRevenue - totalAdsR$;
    
    // Buscar custos fixos e variáveis do mês atual do FinancialManager
    const currentMonth = month || new Date().toISOString().substring(0, 7);
    const custosFixos = JSON.parse(localStorage.getItem(`financial_custosFixos_${currentMonth}`) || '[]');
    const custosVariaveis = JSON.parse(localStorage.getItem(`financial_custosVariaveis_${currentMonth}`) || '[]');
    
    const totalCustosFixos = custosFixos.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    const totalCustosVariaveis = custosVariaveis.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
    
    // Impostos: 6% do faturamento
    const impostos = totalRevenue * 0.06;
    
    // Lucro Líquido
    const lucroLiquido = lucroBruto - totalCustosFixos - totalCustosVariaveis - impostos;
    
    if (netRevenueEl) netRevenueEl.textContent = formatCurrency(totalRevenue, 'BR');
    if (netAdsSpentEl) netAdsSpentEl.textContent = formatCurrency(totalAdsR$, 'BR');
    if (netGrossProfitEl) {
        netGrossProfitEl.textContent = formatCurrency(Math.abs(lucroBruto), 'BR');
        netGrossProfitEl.style.color = lucroBruto < 0 ? 'var(--danger)' : '';
    }
    if (netCustosFixosEl) netCustosFixosEl.textContent = formatCurrency(totalCustosFixos, 'BR');
    if (netCustosVariaveisEl) netCustosVariaveisEl.textContent = formatCurrency(totalCustosVariaveis, 'BR');
    if (netImpostosEl) netImpostosEl.textContent = formatCurrency(impostos, 'BR');
    if (netProfitEl) {
        const isNeg = lucroLiquido < 0;
        netProfitEl.textContent = (isNeg ? '- ' : '') + formatCurrency(Math.abs(lucroLiquido), 'BR');
        netProfitEl.style.color = isNeg ? 'var(--danger)' : 'var(--success)';
    }
}

// Legacy compat
function updateTaxCard(totalRevenue) {
    // Now handled by updateNetProfitCard
    updateNetProfitCard(overviewSelectedPeriod);
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
                    'rgba(59, 130, 246, 0.85)',   // BR - azul
                    'rgba(16, 185, 129, 0.85)',   // US - verde
                    'rgba(245, 158, 11, 0.85)',   // CA - laranja
                    'rgba(139, 92, 246, 0.85)',   // GB - roxo
                    'rgba(236, 72, 153, 0.85)'    // AU - rosa
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)'
                ],
                borderWidth: 2,
                borderRadius: 12,
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
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(10, 15, 30, 0.96)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(59, 130, 246, 0.6)',
                    borderWidth: 2,
                    padding: 16,
                    cornerRadius: 12,
                    titleFont: {
                        size: 14,
                        weight: '700',
                        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        weight: '600',
                        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    },
                    displayColors: true,
                    boxWidth: 12,
                    boxHeight: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        title: function(context) {
                            return `${COUNTRIES[countries[context[0].dataIndex]].flag} ${context[0].label}`;
                        },
                        label: function(context) {
                            let value = context.parsed.y;
                            if (isCurrency) {
                                const countryCode = countries[context.dataIndex];
                                return ` ${label}: ${formatCurrency(value, countryCode)}`;
                            } else {
                                return ` ${label}: ${Math.round(value).toLocaleString('pt-BR')}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(51, 65, 85, 0.25)',
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: '600',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                        },
                        padding: 8,
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
    const allApps = ['divinetalk', 'divinetv'];
    const apps = (overviewAppFilter && overviewAppFilter !== 'all') ? [overviewAppFilter] : allApps;
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
    if (topRegionEl && Object.keys(regionRevenues).length > 0) {
        topRegionEl.textContent = `${COUNTRIES[topRegion].flag} ${COUNTRIES[topRegion].name}`;
    }
    
    // Show/hide regional summary tables based on app filter
    const sectionTalk = document.getElementById('regionalSummaryDivineTalk');
    const sectionTV = document.getElementById('regionalSummaryDivineTV');
    if (sectionTalk) sectionTalk.style.display = (overviewAppFilter === 'divinetv') ? 'none' : '';
    if (sectionTV) sectionTV.style.display = (overviewAppFilter === 'divinetalk') ? 'none' : '';
    
    // Update new overview features (budget, lucro líquido, chart) with filtered period
    const metrics = calculateOverviewMetrics(overviewSelectedPeriod, overviewAppFilter);
    updateBudgetDRE(overviewSelectedPeriod); // Updated to DRE version
    updateNetProfitCard(overviewSelectedPeriod);
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
    
    // App filter - Overview
    const appFilterOverview = document.getElementById('appFilterOverview');
    if (appFilterOverview) {
        appFilterOverview.addEventListener('change', () => {
            overviewAppFilter = appFilterOverview.value;
            updateOverviewMetrics();
        });
    }
    
    // App filter - Dashboards
    const appFilterDashboards = document.getElementById('appFilterDashboards');
    if (appFilterDashboards) {
        appFilterDashboards.addEventListener('change', () => {
            dashboardsAppFilter = appFilterDashboards.value;
            // Re-render dashboards with new filter (if dashboard-analytics.js supports it)
            if (typeof renderDashboards === 'function') {
                renderDashboards();
            }
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

// ============================================
// ACCORDION TOGGLE
// ============================================

function toggleAccordion(bodyId, arrowId) {
    const body = document.getElementById(bodyId);
    const arrow = document.getElementById(arrowId);
    if (!body) return;
    
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '▶' : '▼';
}

// ============================================
// FINANCIAL MANAGER
// ============================================

class FinancialManager {
    constructor() {
        this.currentMonth = new Date().toISOString().substring(0, 7);
        this.tables = {
            contasPagar: [],
            custosFixos: [],
            custosVariaveis: [],
            extratoCartao: []
        };
        this.categories = ['Marketing', 'Operacional', 'Tecnologia', 'Outros'];
        this.init();
    }

    init() {
        this.populatePeriodFilter();
        this.loadData(this.currentMonth);
        this.renderAllTables();
        this.updateSummary();
        this.attachEventListeners();
    }

    populatePeriodFilter() {
        const select = document.getElementById('periodFilterFinanceiro');
        if (!select) return;

        const currentDate = new Date();
        const options = [];

        // Generate last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthYear = date.toISOString().substring(0, 7);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            options.push(`<option value="${monthYear}">${capitalizedMonth}</option>`);
        }

        select.innerHTML = options.join('');
        select.value = this.currentMonth;
    }

    loadData(month) {
        for (const table in this.tables) {
            const key = `financial_${table}_${month}`;
            const data = localStorage.getItem(key);
            this.tables[table] = data ? JSON.parse(data) : [];
        }
    }

    saveData(tableName) {
        const key = `financial_${tableName}_${this.currentMonth}`;
        localStorage.setItem(key, JSON.stringify(this.tables[tableName]));
        this.updateSummary();
    }

    renderAllTables() {
        this.renderContasPagar();
        this.renderCustosFixos();
        this.renderCustosVariaveis();
        this.renderExtratoCartao();
    }

    renderContasPagar() {
        const tbody = document.getElementById('tbodyContasPagar');
        if (!tbody) return;

        if (this.tables.contasPagar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma conta cadastrada</td></tr>';
            return;
        }

        tbody.innerHTML = this.tables.contasPagar.map((item, index) => `
            <tr>
                <td><input type="date" value="${item.vencimento}" data-table="contasPagar" data-index="${index}" data-field="vencimento"></td>
                <td><input type="text" value="${item.descricao}" data-table="contasPagar" data-index="${index}" data-field="descricao" placeholder="Descrição"></td>
                <td><input type="number" value="${item.valor}" data-table="contasPagar" data-index="${index}" data-field="valor" placeholder="0.00" step="0.01"></td>
                <td>
                    <select class="status-select ${item.status === 'Pago' ? 'status-pago' : 'status-pendente'}" data-table="contasPagar" data-index="${index}" data-field="status">
                        <option value="Pendente" ${item.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Pago" ${item.status === 'Pago' ? 'selected' : ''}>Pago</option>
                    </select>
                </td>
                <td class="actions-col">
                    <button class="delete-btn" data-table="contasPagar" data-index="${index}">🗑️ Deletar</button>
                </td>
            </tr>
        `).join('');

        this.attachTableEventListeners('contasPagar');
    }

    renderCustosFixos() {
        const tbody = document.getElementById('tbodyCustosFixos');
        if (!tbody) return;

        if (this.tables.custosFixos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum custo fixo cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.tables.custosFixos.map((item, index) => `
            <tr>
                <td><input type="text" value="${item.descricao}" data-table="custosFixos" data-index="${index}" data-field="descricao" placeholder="Ex: Aluguel"></td>
                <td><input type="number" value="${item.valor}" data-table="custosFixos" data-index="${index}" data-field="valor" placeholder="0.00" step="0.01"></td>
                <td class="actions-col">
                    <button class="delete-btn" data-table="custosFixos" data-index="${index}">🗑️ Deletar</button>
                </td>
            </tr>
        `).join('');

        this.attachTableEventListeners('custosFixos');
    }

    renderCustosVariaveis() {
        const tbody = document.getElementById('tbodyCustosVariaveis');
        if (!tbody) return;

        if (this.tables.custosVariaveis.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum custo variável cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.tables.custosVariaveis.map((item, index) => `
            <tr>
                <td><input type="date" value="${item.data}" data-table="custosVariaveis" data-index="${index}" data-field="data"></td>
                <td><input type="text" value="${item.descricao}" data-table="custosVariaveis" data-index="${index}" data-field="descricao" placeholder="Descrição"></td>
                <td><input type="number" value="${item.valor}" data-table="custosVariaveis" data-index="${index}" data-field="valor" placeholder="0.00" step="0.01"></td>
                <td>
                    <select data-table="custosVariaveis" data-index="${index}" data-field="categoria">
                        ${this.categories.map(cat => `<option value="${cat}" ${item.categoria === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </td>
                <td class="actions-col">
                    <button class="delete-btn" data-table="custosVariaveis" data-index="${index}">🗑️ Deletar</button>
                </td>
            </tr>
        `).join('');

        this.attachTableEventListeners('custosVariaveis');
    }

    renderExtratoCartao() {
        const tbody = document.getElementById('tbodyExtratoCartao');
        if (!tbody) return;

        if (this.tables.extratoCartao.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum lançamento cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.tables.extratoCartao.map((item, index) => `
            <tr>
                <td><input type="date" value="${item.data}" data-table="extratoCartao" data-index="${index}" data-field="data"></td>
                <td><input type="text" value="${item.descricao}" data-table="extratoCartao" data-index="${index}" data-field="descricao" placeholder="Descrição"></td>
                <td><input type="number" value="${item.valor}" data-table="extratoCartao" data-index="${index}" data-field="valor" placeholder="0.00" step="0.01"></td>
                <td>
                    <select data-table="extratoCartao" data-index="${index}" data-field="categoria">
                        ${this.categories.map(cat => `<option value="${cat}" ${item.categoria === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </td>
                <td class="actions-col">
                    <button class="delete-btn" data-table="extratoCartao" data-index="${index}">🗑️ Deletar</button>
                </td>
            </tr>
        `).join('');

        this.attachTableEventListeners('extratoCartao');
    }

    attachTableEventListeners(tableName) {
        // Input change listeners
        const inputs = document.querySelectorAll(`[data-table="${tableName}"]`);
        inputs.forEach(input => {
            if (input.tagName === 'INPUT' || input.tagName === 'SELECT') {
                input.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const field = e.target.dataset.field;
                    
                    if (field === 'status' && e.target.tagName === 'SELECT') {
                        // Update status class
                        e.target.className = e.target.value === 'Pago' ? 'status-select status-pago' : 'status-select status-pendente';
                    }
                    
                    this.tables[tableName][index][field] = e.target.value;
                    this.saveData(tableName);
                });
            }
        });

        // Delete button listeners
        const deleteButtons = document.querySelectorAll(`button[data-table="${tableName}"]`);
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Tem certeza que deseja deletar este item?')) {
                    this.tables[tableName].splice(index, 1);
                    this.saveData(tableName);
                    this.renderTable(tableName);
                }
            });
        });
    }

    renderTable(tableName) {
        switch(tableName) {
            case 'contasPagar':
                this.renderContasPagar();
                break;
            case 'custosFixos':
                this.renderCustosFixos();
                break;
            case 'custosVariaveis':
                this.renderCustosVariaveis();
                break;
            case 'extratoCartao':
                this.renderExtratoCartao();
                break;
        }
    }

    addRow(tableName) {
        const today = new Date().toISOString().substring(0, 10);
        
        const newRow = {
            contasPagar: {
                vencimento: today,
                descricao: '',
                valor: 0,
                status: 'Pendente'
            },
            custosFixos: {
                descricao: '',
                valor: 0
            },
            custosVariaveis: {
                data: today,
                descricao: '',
                valor: 0,
                categoria: 'Outros'
            },
            extratoCartao: {
                data: today,
                descricao: '',
                valor: 0,
                categoria: 'Outros'
            }
        };

        this.tables[tableName].push(newRow[tableName]);
        this.saveData(tableName);
        this.renderTable(tableName);
    }

    updateSummary() {
        // Total a Pagar (apenas contas pendentes)
        const totalPagar = this.tables.contasPagar
            .filter(item => item.status === 'Pendente')
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
        
        // Custos Fixos
        const totalFixos = this.tables.custosFixos
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
        
        // Custos Variáveis
        const totalVariaveis = this.tables.custosVariaveis
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
        
        // Extrato Cartão
        const totalCartao = this.tables.extratoCartao
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);

        // Update UI
        document.getElementById('totalContasPagar').textContent = formatCurrency(totalPagar, 'BR');
        document.getElementById('totalCustosFixos').textContent = formatCurrency(totalFixos, 'BR');
        document.getElementById('totalCustosVariaveis').textContent = formatCurrency(totalVariaveis, 'BR');
        document.getElementById('totalExtratoCartao').textContent = formatCurrency(totalCartao, 'BR');
        
        // Update Budget DRE in Overview
        updateBudgetDRE(this.currentMonth);
    }

    attachEventListeners() {
        // Period filter
        const periodFilter = document.getElementById('periodFilterFinanceiro');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                this.loadData(this.currentMonth);
                this.renderAllTables();
                this.updateSummary();
            });
        }

        // Add buttons
        document.getElementById('addContasPagar')?.addEventListener('click', () => this.addRow('contasPagar'));
        document.getElementById('addCustosFixos')?.addEventListener('click', () => this.addRow('custosFixos'));
        document.getElementById('addCustosVariaveis')?.addEventListener('click', () => this.addRow('custosVariaveis'));
        document.getElementById('addExtratoCartao')?.addEventListener('click', () => this.addRow('extratoCartao'));
    }
}

// Initialize Financial Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.financialManager = new FinancialManager();
        console.log('💰 Financial Manager initialized');
    });
} else {
    window.financialManager = new FinancialManager();
    console.log('💰 Financial Manager initialized');
}

// ============================================
// CALCULADORA DE UNIT ECONOMICS
// ============================================

/**
 * Formata número como moeda BRL
 */
function formatBRL(value) {
    return 'R$ ' + value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formata número inteiro com separador de milhar (pt-BR)
 */
function formatIntBR(value) {
    return Math.round(value).toLocaleString('pt-BR');
}

/**
 * Lê um input numérico pelo id, retornando 0 se vazio/inválido
 */
function readInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const val = parseFloat(el.value);
    return isNaN(val) ? 0 : val;
}

/**
 * Escreve texto em um elemento pelo id
 */
function setOutput(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/**
 * Função principal: lê todos os inputs e atualiza todos os outputs
 */
function calcularMetricas() {
    // --- Valores dos planos ---
    const planWeekly   = readInput('plan-weekly');
    const planMonthly  = readInput('plan-monthly');
    const planBiannual = readInput('plan-biannual');
    const planAnnual   = readInput('plan-annual');

    // --- Mix de planos (em %) ---
    const mixWeekly   = readInput('mix-weekly');
    const mixMonthly  = readInput('mix-monthly');
    const mixBiannual = readInput('mix-biannual');
    const mixAnnual   = readInput('mix-annual');

    const mixTotal = mixWeekly + mixMonthly + mixBiannual + mixAnnual;

    // Indicador de mix total
    const mixTotalEl = document.getElementById('mix-total-value');
    const mixContainer = mixTotalEl ? mixTotalEl.closest('.calc-mix-total') : null;
    if (mixTotalEl) {
        mixTotalEl.textContent = mixTotal.toFixed(0) + '%';
    }
    if (mixContainer) {
        if (Math.round(mixTotal) === 100) {
            mixContainer.classList.remove('invalid');
        } else {
            mixContainer.classList.add('invalid');
        }
    }

    // --- Funil de conversão (em %) ---
    const paywallPct    = readInput('funnel-paywall');
    const trialPct      = readInput('funnel-trial');
    const conversionPct = readInput('funnel-conversion');

    const paywallRate    = paywallPct / 100;
    const trialRate      = trialPct / 100;
    const conversionRate = conversionPct / 100;

    // --- LTV Médio (soma ponderada) ---
    // Para cada plano: planValue × (mix/100)
    // Divide pelo total do mix pra evitar distorção se não somar 100%
    let ltv = 0;
    if (mixTotal > 0) {
        ltv = (planWeekly   * (mixWeekly   / mixTotal) +
               planMonthly  * (mixMonthly  / mixTotal) +
               planBiannual * (mixBiannual / mixTotal) +
               planAnnual   * (mixAnnual   / mixTotal));
    }

    // --- CPA Máximo = LTV Médio ---
    const cpaMax = ltv;

    // --- CPT Máximo = LTV × conversionRate ---
    const cptMax = conversionRate > 0 ? ltv * conversionRate : null;

    // --- CPI Máximo = LTV × paywall × trial × conversion ---
    const fullFunnel = paywallRate * trialRate * conversionRate;
    const cpiMax = fullFunnel > 0 ? ltv * fullFunnel : null;

    // --- Receita por 1.000 downloads ---
    const rev1k = fullFunnel > 0 ? ltv * fullFunnel * 1000 : 0;

    // --- Metas: downloads/dia ---
    // Fórmula: meta_reais ÷ (LTV × fullFunnel) / 30 (pra mensal) ou /365 (anual)
    const revenuePerDownload = ltv * fullFunnel; // receita por download

    function downloadsPerDay(targetMonthly) {
        if (revenuePerDownload <= 0) return null;
        return (targetMonthly / 30) / revenuePerDownload;
    }

    const dlFor100k  = downloadsPerDay(100000);
    const dlFor500k  = downloadsPerDay(500000);
    const dlFor1m    = downloadsPerDay(1000000);
    const dlFor1mYr  = revenuePerDownload > 0 ? (1000000 / 365) / revenuePerDownload : null;

    // --- Margem líquida: 100% - 30% Apple/Google - 6% impostos = 64% ---
    const marginPct = 64;

    // --- Simulador de escala ---
    const investment = readInput('sim-investment');

    let simInstalls  = null;
    let simTrials    = null;
    let simPayers    = null;
    let simRevenue   = null;
    let simProfit    = null;
    let simROI       = null;

    if (cpiMax && cpiMax > 0 && investment > 0) {
        simInstalls = investment / cpiMax;
        simTrials   = simInstalls * paywallRate * trialRate;
        simPayers   = simTrials * conversionRate;
        simRevenue  = simPayers * ltv;
        simProfit   = simRevenue - investment;
        simROI      = investment > 0 ? (simProfit / investment) * 100 : null;
    }

    // ==================
    // ATUALIZAR OUTPUTS
    // ==================

    // Cards principais
    setOutput('out-ltv', formatBRL(ltv));
    setOutput('out-cpi', cpiMax !== null ? formatBRL(cpiMax) : '—');
    setOutput('out-cpt', cptMax !== null ? formatBRL(cptMax) : '—');
    setOutput('out-cpa', formatBRL(cpaMax));

    // Receita por 1k downloads
    setOutput('out-rev1k', revenuePerDownload > 0 ? formatBRL(rev1k) : '—');

    // Margem líquida (sempre 64%, mas mostramos baseado no LTV)
    setOutput('out-margin', `${marginPct}%`);
    setOutput('out-margin-desc', `De cada R$100 gerado, você fica com R$${marginPct}`);

    // Tabela de metas
    const effStr = revenuePerDownload > 0
        ? (fullFunnel * 100).toFixed(2) + '%'
        : '—';

    setOutput('goal-100k',     dlFor100k  !== null ? formatIntBR(dlFor100k)  + ' downloads/dia' : '—');
    setOutput('goal-100k-eff', effStr);
    setOutput('goal-500k',     dlFor500k  !== null ? formatIntBR(dlFor500k)  + ' downloads/dia' : '—');
    setOutput('goal-500k-eff', effStr);
    setOutput('goal-1m',       dlFor1m    !== null ? formatIntBR(dlFor1m)    + ' downloads/dia' : '—');
    setOutput('goal-1m-eff',   effStr);
    setOutput('goal-1m-yr',    dlFor1mYr  !== null ? formatIntBR(dlFor1mYr) + ' downloads/dia' : '—');
    setOutput('goal-1m-yr-eff', effStr);

    // Simulador
    setOutput('sim-installs', simInstalls !== null ? formatIntBR(simInstalls) : '—');
    setOutput('sim-trials',   simTrials   !== null ? formatIntBR(simTrials)   : '—');
    setOutput('sim-payers',   simPayers   !== null ? formatIntBR(simPayers)   : '—');
    setOutput('sim-revenue',  simRevenue  !== null ? formatBRL(simRevenue)    : '—');

    if (simProfit !== null) {
        const profitEl = document.getElementById('sim-profit');
        if (profitEl) {
            profitEl.textContent = formatBRL(Math.abs(simProfit));
            profitEl.style.color = simProfit >= 0
                ? 'var(--success)'
                : 'var(--danger)';
            if (simProfit < 0) {
                profitEl.textContent = '- ' + formatBRL(Math.abs(simProfit));
            }
        }
    } else {
        setOutput('sim-profit', '—');
        const profitEl = document.getElementById('sim-profit');
        if (profitEl) profitEl.style.color = '';
    }

    if (simROI !== null) {
        const roiEl = document.getElementById('sim-roi');
        if (roiEl) {
            roiEl.textContent = simROI.toFixed(1) + '%';
            roiEl.style.color = simROI >= 0
                ? 'var(--success)'
                : 'var(--danger)';
        }
    } else {
        setOutput('sim-roi', '—');
        const roiEl = document.getElementById('sim-roi');
        if (roiEl) roiEl.style.color = '';
    }
}

/**
 * Inicializa a calculadora: atribui event listeners e faz o cálculo inicial
 */
function initCalculadora() {
    const calcInputIds = [
        'plan-weekly', 'plan-monthly', 'plan-biannual', 'plan-annual',
        'mix-weekly', 'mix-monthly', 'mix-biannual', 'mix-annual',
        'funnel-paywall', 'funnel-trial', 'funnel-conversion',
        'sim-investment'
    ];

    calcInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calcularMetricas);
        }
    });

    // Calcular na inicialização com os valores padrão
    calcularMetricas();
    console.log('🧮 Calculadora de Unit Economics inicializada');
}

// Inicializar calculadora quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculadora);
} else {
    initCalculadora();
}

// Recalcular quando a aba calculadora for ativada (para garantir valores corretos)
document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.querySelector('.view-btn[data-view="calculadora"]');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            // Pequeno delay pra garantir que a view ficou visível
            requestAnimationFrame(calcularMetricas);
        });
    }
});
