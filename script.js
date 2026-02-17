// View switching functionality
const viewButtons = document.querySelectorAll('.view-btn');
const views = document.querySelectorAll('.view');

viewButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and views
        viewButtons.forEach(btn => btn.classList.remove('active'));
        views.forEach(view => view.classList.remove('active'));

        // Add active class to clicked button and corresponding view
        button.classList.add('active');
        const viewId = button.getAttribute('data-view');
        document.getElementById(`view-${viewId}`).classList.add('active');
    });
});

// Placeholder for future API integration
async function fetchSalesData() {
    // This will be implemented in Phase 2 with App Store Connect API
    console.log('Ready for API integration');
    
    // Future implementation:
    // - Fetch data from App Store Connect API
    // - Parse trials, conversions, revenue
    // - Update DOM with real data
    // - Add charts and graphs
    // - Implement real-time updates
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ Divine Sales Dashboard loaded successfully!');
    console.log('📊 Ready for Phase 2: API integration');
    
    // Future: Call fetchSalesData() here
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// ============================================
// DAILY DATA TABLE - Editable Excel-like Table
// ============================================

class DailyDataTable {
    constructor(appName) {
        this.appName = appName;
        const suffix = appName === 'DivineTalk' ? 'DivineTalk' : 'DivineTV';
        this.tableBody = document.getElementById(`tableBody${suffix}`);
        this.addRowBtn = document.getElementById(`addRowBtn${suffix}`);
        this.exportCsvBtn = document.getElementById(`exportCsvBtn${suffix}`);
        this.storageKey = `${appName.toLowerCase()}_data`;
        
        this.columns = [
            { key: 'date', label: 'Data', type: 'date' },
            { key: 'spent', label: 'Valor Gasto', type: 'currency', prefix: 'R$' },
            { key: 'tax', label: 'Imposto', type: 'currency', prefix: 'R$' },
            { key: 'installs', label: 'Instalações', type: 'number' },
            { key: 'cpi', label: 'CPI Real', type: 'currency', prefix: 'R$' },
            { key: 'trials', label: 'Trials', type: 'number' },
            { key: 'cpt', label: 'CPT', type: 'currency', prefix: 'R$' },
            { key: 'subscribers', label: 'Novos Assinantes', type: 'number' },
            { key: 'revenueApple', label: 'Faturamento Apple', type: 'currency', prefix: '$' },
            { key: 'revenueAndroid', label: 'Faturamento Android', type: 'currency', prefix: 'R$' },
            { key: 'grossProfit', label: 'Lucro Bruto', type: 'currency', prefix: 'R$' },
            { key: 'netProfit', label: 'Lucro Líquido', type: 'currency', prefix: 'R$' },
            { key: 'cpa', label: 'CPA', type: 'currency', prefix: 'R$' },
            { key: 'profitMargin', label: 'Margem de Lucro', type: 'percentage' },
            { key: 'avgTicket', label: 'Ticket Médio', type: 'currency', prefix: 'R$' },
            { key: 'revenuePerInstall', label: 'Receita/Install', type: 'currency', prefix: 'R$' }
        ];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.addRowBtn.addEventListener('click', () => this.addRow());
        this.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
    }
    
    loadData() {
        const data = this.getData();
        this.tableBody.innerHTML = '';
        
        if (data.length === 0) {
            this.showEmptyState();
        } else {
            data.forEach((row, index) => this.renderRow(row, index));
        }
    }
    
    showEmptyState() {
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="17" class="empty-state">
                    <p>📊 Nenhum dado cadastrado ainda</p>
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
        
        // Render data cells
        this.columns.forEach(col => {
            const td = document.createElement('td');
            const input = this.createInput(col, rowData[col.key], index);
            td.appendChild(input);
            tr.appendChild(td);
        });
        
        // Render delete button
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
        
        input.addEventListener('input', () => this.saveData());
        
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
        
        // Set today's date by default
        const today = new Date().toISOString().split('T')[0];
        newRow.date = today;
        
        data.push(newRow);
        this.setData(data);
        this.loadData();
        
        // Scroll to the new row
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
                
                // Clean value for storage
                value = value.replace(/[^\d.-]/g, '');
                rowData[col] = value;
            });
            
            data.push(rowData);
        });
        
        this.setData(data);
    }
    
    getData() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }
    
    setData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    exportToCSV() {
        const data = this.getData();
        
        if (data.length === 0) {
            alert('⚠️ Não há dados para exportar!');
            return;
        }
        
        // Create CSV header
        const headers = this.columns.map(col => col.label);
        let csv = headers.join(',') + '\n';
        
        // Add data rows
        data.forEach(row => {
            const values = this.columns.map(col => {
                let value = row[col.key] || '';
                
                // Format values for CSV
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
                    // Convert YYYY-MM-DD to DD/MM/YYYY
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        value = `"${parts[2]}/${parts[1]}/${parts[0]}"`;
                    }
                }
                
                return value;
            });
            
            csv += values.join(',') + '\n';
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.appName.toLowerCase()}-daily-data-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ CSV exportado com sucesso!');
    }
}

// Initialize the tables when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const divineTalkTable = new DailyDataTable('DivineTalk');
    const divineTVTable = new DailyDataTable('DivineTV');
    console.log('📊 Daily Data Tables initialized!');
    console.log('💬 Divine Talk table ready');
    console.log('📺 Divine TV table ready');
});
