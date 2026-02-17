/**
 * 🧪 Script de Teste - Dados Financeiros
 * 
 * Execute no console do navegador para popular a aba Financeiro com dados de exemplo
 * 
 * Como usar:
 * 1. Abrir index.html no navegador
 * 2. Abrir DevTools (F12)
 * 3. Ir na aba Console
 * 4. Copiar e colar todo este código
 * 5. Apertar Enter
 * 6. Recarregar a página (F5)
 * 7. Ir na aba "💰 Financeiro"
 */

const testMonth = '2026-02';

// Dados de exemplo para Contas a Pagar
const contasPagar = [
    {
        vencimento: '2026-02-05',
        descricao: 'Aluguel Escritório',
        valor: 3500,
        status: 'Pago'
    },
    {
        vencimento: '2026-02-10',
        descricao: 'Fornecedor de TI',
        valor: 2800,
        status: 'Pendente'
    },
    {
        vencimento: '2026-02-15',
        descricao: 'Energia Elétrica',
        valor: 450,
        status: 'Pendente'
    },
    {
        vencimento: '2026-02-20',
        descricao: 'Internet Empresarial',
        valor: 300,
        status: 'Pago'
    },
    {
        vencimento: '2026-02-25',
        descricao: 'Contador',
        valor: 1200,
        status: 'Pendente'
    }
];

// Dados de exemplo para Custos Fixos
const custosFixos = [
    {
        descricao: 'Salários',
        valor: 25000
    },
    {
        descricao: 'Aluguel',
        valor: 3500
    },
    {
        descricao: 'Seguros',
        valor: 800
    },
    {
        descricao: 'Software & Licenças',
        valor: 1500
    },
    {
        descricao: 'Manutenção',
        valor: 600
    }
];

// Dados de exemplo para Custos Variáveis
const custosVariaveis = [
    {
        data: '2026-02-03',
        descricao: 'Google Ads',
        valor: 4500,
        categoria: 'Marketing'
    },
    {
        data: '2026-02-05',
        descricao: 'Facebook Ads',
        valor: 3200,
        categoria: 'Marketing'
    },
    {
        data: '2026-02-07',
        descricao: 'Material de Escritório',
        valor: 320,
        categoria: 'Operacional'
    },
    {
        data: '2026-02-10',
        descricao: 'Freelancer Design',
        valor: 1800,
        categoria: 'Operacional'
    },
    {
        data: '2026-02-12',
        descricao: 'AWS Cloud',
        valor: 950,
        categoria: 'Tecnologia'
    },
    {
        data: '2026-02-15',
        descricao: 'Consultoria',
        valor: 2500,
        categoria: 'Outros'
    },
    {
        data: '2026-02-18',
        descricao: 'TikTok Ads',
        valor: 2100,
        categoria: 'Marketing'
    }
];

// Dados de exemplo para Extrato Cartão
const extratoCartao = [
    {
        data: '2026-02-02',
        descricao: 'Notion Pro',
        valor: 48,
        categoria: 'Tecnologia'
    },
    {
        data: '2026-02-04',
        descricao: 'ChatGPT Plus',
        valor: 20,
        categoria: 'Tecnologia'
    },
    {
        data: '2026-02-06',
        descricao: 'Almoço Cliente',
        valor: 180,
        categoria: 'Operacional'
    },
    {
        data: '2026-02-08',
        descricao: 'Uber Empresa',
        valor: 65,
        categoria: 'Operacional'
    },
    {
        data: '2026-02-11',
        descricao: 'Canva Pro',
        valor: 55,
        categoria: 'Marketing'
    },
    {
        data: '2026-02-13',
        descricao: 'Domínios',
        valor: 120,
        categoria: 'Tecnologia'
    },
    {
        data: '2026-02-16',
        descricao: 'Material Promocional',
        valor: 450,
        categoria: 'Marketing'
    }
];

// Salvar no localStorage
localStorage.setItem(`financial_contasPagar_${testMonth}`, JSON.stringify(contasPagar));
localStorage.setItem(`financial_custosFixos_${testMonth}`, JSON.stringify(custosFixos));
localStorage.setItem(`financial_custosVariaveis_${testMonth}`, JSON.stringify(custosVariaveis));
localStorage.setItem(`financial_extratoCartao_${testMonth}`, JSON.stringify(extratoCartao));

// Calcular totais
const totalPagar = contasPagar.filter(c => c.status === 'Pendente').reduce((sum, c) => sum + c.valor, 0);
const totalFixos = custosFixos.reduce((sum, c) => sum + c.valor, 0);
const totalVariaveis = custosVariaveis.reduce((sum, c) => sum + c.valor, 0);
const totalCartao = extratoCartao.reduce((sum, c) => sum + c.valor, 0);

console.log('✅ Dados de teste salvos no localStorage!');
console.log('');
console.log('📊 Resumo dos dados criados:');
console.log('');
console.log('💰 Total a Pagar (Pendentes): R$', totalPagar.toFixed(2));
console.log('   - Contas cadastradas:', contasPagar.length);
console.log('   - Contas pendentes:', contasPagar.filter(c => c.status === 'Pendente').length);
console.log('');
console.log('🏢 Custos Fixos: R$', totalFixos.toFixed(2));
console.log('   - Itens cadastrados:', custosFixos.length);
console.log('');
console.log('📊 Custos Variáveis: R$', totalVariaveis.toFixed(2));
console.log('   - Lançamentos:', custosVariaveis.length);
console.log('');
console.log('💳 Extrato Cartão: R$', totalCartao.toFixed(2));
console.log('   - Lançamentos:', extratoCartao.length);
console.log('');
console.log('🔄 Recarregue a página (F5) e vá na aba "💰 Financeiro"');
console.log('');
console.log('🗑️ Para limpar os dados: execute clearFinancialData() no console');

// Função helper para limpar dados
window.clearFinancialData = function() {
    localStorage.removeItem(`financial_contasPagar_${testMonth}`);
    localStorage.removeItem(`financial_custosFixos_${testMonth}`);
    localStorage.removeItem(`financial_custosVariaveis_${testMonth}`);
    localStorage.removeItem(`financial_extratoCartao_${testMonth}`);
    console.log('🗑️ Dados financeiros removidos! Recarregue a página.');
};
