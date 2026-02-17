// ============================================
// GLOBAL STATE
// ============================================

const COUNTRIES = {
    BR: { name: 'Brasil', flag: '🇧🇷', currency: 'R$' },
    US: { name: 'EUA', flag: '🇺🇸', currency: '$' },
    CA: { name: 'Canadá', flag: '🇨🇦', currency: 'CAD$' },
    GB: { name: 'Reino Unido', flag: '🇬🇧', currency: '£' },
    AU: { name: 'Austrália', flag: '🇦🇺', currency: 'AUD$' },
    GLOBAL: { name: 'Global', flag: '🌎', currency: 'USD$' }
};

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
        this.currentCountry = 'BR';
        
        this.columns = [
            { key: 'date', label: 'Data', type: 'date' },
            { key: 'valorGasto', label: 'Valor Gasto', type: 'currency', prefix: 'R$' },
            { key: 'instalacoes', label: 'Instalações', type: 'number' },
            { key: 'trials', label: 'Trials', type: 'number' },
            { key: 'novosAssinantes', label: 'Novos Assinantes', type: 'number' },
            { key: 'faturamentoApple', label: 'Faturamento Apple', type: 'currency', prefix: '$' },
            { key: 'faturamentoAndroid', label: 'Faturamento Android', type: 'currency', prefix: 'R$' }
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
    }
    
    switchCountry(country) {
        this.currentCountry = country;
        this.loadData();
        this.updateMetrics();
    }
    
    loadData() {
        const data = this.getData();
        this.tableBody.innerHTML = '';
        
        if (data.length === 0) {
            this.showEmptyState();
        } else {
            data.forEach((row, index) => this.renderRow(row, index));
        }
        
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
    
    renderRow(rowData, index) {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        
        this.columns.forEach(col => {
            const td = document.createElement('td');
            const input = this.createInput(col, rowData[col.key], index);
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
            input.value = `${col.prefix} ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        } else if (col.type === 'percentage') {
            input.value = `${num.toFixed(2)}%`;
        } else if (col.type === 'number') {
            input.value = Math.round(num).toLocaleString('pt-BR');
        }
    }
    
    unformatValue(input, col) {
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
        this.loadData();
        
        setTimeout(() => {
            this.tableBody.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.tableBody.lastElementChild.querySelector('input').focus();
        }, 100);
    }
    
    deleteRow(index) {
        if (!confirm('⚠️ Tem certeza que deseja deletar esta linha?')) return;
        
        const data = this.getData();
        data.splice(index, 1);
        this.setData(data);
        this.loadData();
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
        const data = this.getData();
        
        let totalTrials = 0;
        let totalSubscribers = 0;
        let totalRevenue = 0;
        
        data.forEach(row => {
            totalTrials += parseFloat(row.trials) || 0;
            totalSubscribers += parseFloat(row.novosAssinantes) || 0;
            
            const revenueApple = parseFloat(row.faturamentoApple) || 0;
            const revenueAndroid = parseFloat(row.faturamentoAndroid) || 0;
            totalRevenue += revenueApple + revenueAndroid;
        });
        
        const conversionRate = totalTrials > 0 ? (totalSubscribers / totalTrials * 100) : 0;
        
        // Update metric cards
        const trialsEl = document.getElementById(`${this.appId}-trials`);
        const conversionsEl = document.getElementById(`${this.appId}-conversions`);
        const revenueEl = document.getElementById(`${this.appId}-revenue`);
        const conversionEl = document.getElementById(`${this.appId}-conversion`);
        
        if (trialsEl) trialsEl.textContent = totalTrials.toLocaleString('pt-BR');
        if (conversionsEl) conversionsEl.textContent = totalSubscribers.toLocaleString('pt-BR');
        if (revenueEl) revenueEl.textContent = `R$ ${totalRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        if (conversionEl) conversionEl.textContent = conversionRate.toFixed(2);
        
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
                        value = `"${col.prefix} ${num.toFixed(2)}"`;
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
// OVERVIEW METRICS
// ============================================

function updateOverviewMetrics() {
    const apps = ['divinetalk', 'divinetv'];
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    
    let globalTrials = 0;
    let globalRevenue = 0;
    let globalConversions = 0;
    let regionRevenues = {};
    
    // Calculate metrics for summary tables
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
            
            if (spentCell) spentCell.textContent = `R$ ${spent.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            if (installsCell) installsCell.textContent = installs.toLocaleString('pt-BR');
            if (trialsCell) trialsCell.textContent = trials.toLocaleString('pt-BR');
            if (subscribersCell) subscribersCell.textContent = subscribers.toLocaleString('pt-BR');
            if (revenueCell) revenueCell.textContent = `R$ ${revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
    if (globalRevenueEl) globalRevenueEl.textContent = `R$ ${globalRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    if (globalConversionEl) globalConversionEl.textContent = globalConversionRate.toFixed(2);
    if (topRegionEl) topRegionEl.textContent = `${COUNTRIES[topRegion].flag} ${COUNTRIES[topRegion].name}`;
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
    
    updateOverviewMetrics();
});

document.documentElement.style.scrollBehavior = 'smooth';
