/**
 * 🎨 Klinsmann - Gerador de Dados de Teste
 * 
 * Cole este código no Console do navegador (F12) enquanto estiver
 * no dashboard pra popular com dados de exemplo.
 */

function generateTestData() {
    const countries = ['BR', 'US', 'CA', 'GB', 'AU'];
    const apps = ['divinetalk', 'divinetv'];
    
    // Gerar dados dos últimos 3 meses
    const today = new Date();
    const months = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(d);
    }
    
    apps.forEach(app => {
        countries.forEach(country => {
            const data = [];
            
            months.forEach(month => {
                // Gerar ~10 dias de dados por mês
                for (let day = 1; day <= 10; day++) {
                    const date = new Date(month.getFullYear(), month.getMonth(), day);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Valores aleatórios baseados no país
                    const multiplier = {
                        'BR': 1.5,
                        'US': 1.0,
                        'CA': 0.8,
                        'GB': 0.7,
                        'AU': 0.6
                    }[country];
                    
                    const spent = Math.round((Math.random() * 500 + 200) * multiplier);
                    const installs = Math.round((Math.random() * 100 + 50) * multiplier);
                    const trials = Math.round(installs * (0.3 + Math.random() * 0.2));
                    const subscribers = Math.round(trials * (0.15 + Math.random() * 0.1));
                    const revenueApple = Math.round((Math.random() * 800 + 400) * multiplier);
                    const revenueAndroid = Math.round((Math.random() * 600 + 300) * multiplier);
                    
                    data.push({
                        date: dateStr,
                        valorGasto: spent.toString(),
                        instalacoes: installs.toString(),
                        trials: trials.toString(),
                        novosAssinantes: subscribers.toString(),
                        faturamentoApple: revenueApple.toString(),
                        faturamentoAndroid: revenueAndroid.toString()
                    });
                }
            });
            
            // Salvar no localStorage
            const key = `${app}_${country}`;
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ Dados gerados: ${key} (${data.length} linhas)`);
        });
    });
    
    // Definir orçamentos de exemplo
    months.forEach(month => {
        const yearMonth = month.toISOString().substring(0, 7);
        localStorage.setItem(`budget_${yearMonth}`, '15000');
    });
    
    console.log('\n🎉 DADOS DE TESTE GERADOS!');
    console.log('📊 Recarregue a página para ver os dados.');
    console.log('💡 Dica: Vá pra "Visão Geral" e teste o filtro de período!');
}

// Executar
generateTestData();
