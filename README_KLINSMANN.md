# 🎨 Divine Sales Dashboard - Klinsmann Refactor

## 📊 Visão Geral das Mudanças

A view "Visão Geral" foi completamente refatorada com 4 novas features:

1. **📅 Filtro de Período** - Filtra todos os dados por mês
2. **💰 Card de Orçamento** - Controle de budget mensal com barra de progresso
3. **📊 Card de Impostos** - Cálculo automático de 6% sobre faturamento
4. **📈 Gráfico de Comparação** - Chart.js comparando métricas entre países

---

## 🚀 Quick Start

### 1. Instalar e Rodar

```bash
cd /home/clawdbot/clawd/divine-sales-dashboard
python3 -m http.server 8766
```

Acesse: http://localhost:8766

### 2. Popular com Dados de Teste

No Console do navegador (F12):

```javascript
// Copiar e colar o conteúdo de test-data-generator.js
// OU carregar via script tag:
const script = document.createElement('script');
script.src = 'test-data-generator.js';
document.body.appendChild(script);
```

### 3. Explorar

1. Clique em **"📊 Visão Geral"**
2. Use o **filtro de período** no topo
3. Edite o **orçamento** no card azul
4. Veja os **impostos** calculados automaticamente
5. Alterne entre as **métricas do gráfico** (Faturamento, Trials, etc.)

---

## 📁 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `index.html` | ✅ Adicionado Chart.js CDN<br>✅ Estrutura HTML dos novos componentes |
| `script.js` | ✅ Funções de cálculo de métricas<br>✅ Lógica do Chart.js<br>✅ Event listeners |
| `styles.css` | ✅ Estilos dos cards especiais<br>✅ Estilos do gráfico<br>✅ Responsividade |

---

## 🎯 Funcionalidades Detalhadas

### 📅 Filtro de Período

**Como funciona:**
- Varre todos os dados salvos (`localStorage`)
- Extrai meses únicos das datas
- Popula dropdown ordenado (mais recente primeiro)
- Filtra métricas quando alterado

**Formato:**
- "Todo o período" (padrão)
- "Janeiro 2026"
- "Fevereiro 2026"
- etc.

---

### 💰 Card de Orçamento

**Componentes:**
- **Orçamento Total:** Input editável (R$)
- **Gasto até agora:** Soma de `valorGasto` de todos países
- **Restante:** `Orçamento - Gasto`
- **Barra de Progresso:** Visual com cores:
  - 🟢 Verde: < 80%
  - 🟡 Amarelo: 80-95%
  - 🔴 Vermelho: > 95%

**Persistência:**
```
localStorage.budget_2026-01 = "10000"
localStorage.budget_2026-02 = "15000"
```

**Como usar:**
1. Clique no campo "Orçamento Total"
2. Digite o valor (ex: 10000)
3. Salvo automaticamente
4. Métricas atualizam em tempo real

---

### 📊 Card de Impostos

**Cálculo:**
```
Faturamento Total = SUM(faturamentoApple + faturamentoAndroid)
Impostos (6%) = Faturamento Total × 0.06
```

**Agregação:**
- Todos os países (BR, US, CA, GB, AU)
- DivineTalk + DivineTV
- Filtrado pelo período selecionado

**Automático:**
- Recalculado quando:
  - Período muda
  - Dados são adicionados/editados
  - Tabelas são atualizadas

---

### 📈 Gráfico de Comparação

**Biblioteca:** Chart.js 4.x

**Métricas:**

| Botão | Métrica | Cálculo |
|-------|---------|---------|
| 💰 Faturamento | Revenue total | `SUM(faturamentoApple + faturamentoAndroid)` |
| 🚀 Trials | Trials totais | `SUM(trials)` |
| 📊 Custo/Trial | CPT médio | `SUM(valorGasto) / SUM(trials)` |
| 💵 Lucro Bruto | Profit | `Revenue - Gasto` |

**Visual:**
- 🇧🇷 Brasil: Azul
- 🇺🇸 EUA: Verde
- 🇨🇦 Canadá: Laranja
- 🇬🇧 Reino Unido: Roxo
- 🇦🇺 Austrália: Rosa

**Responsivo:**
- Desktop: 400px altura
- Tablet: 300px altura
- Mobile: 250px altura

**Interatividade:**
- Hover: Mostra valor formatado
- Click nos botões: Troca métrica com animação
- Responsivo: Adapta em mobile

---

## 🎨 Customizações CSS

### Cards Especiais

```css
.overview-special-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-lg);
}
```

### Barra de Progresso

```css
.budget-progress-bar::before {
  width: var(--progress-width, 0%);
  background: var(--progress-color, var(--success));
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Gráfico

```css
.chart-canvas-wrapper {
  height: 400px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}
```

---

## 🐛 Troubleshooting

### Filtro não popula?
- Verifique se há dados nas views DivineTalk/DivineTV
- Dados precisam ter campo `date` preenchido

### Gráfico não aparece?
- Abra o Console (F12) e veja erros
- Verifique se Chart.js carregou: `typeof Chart`
- Limpe o localStorage e recarregue

### Orçamento não salva?
- Verifique localStorage: `localStorage.getItem('budget_2026-02')`
- Tente outro navegador (modo anônimo pode bloquear)

### Métricas zeradas?
- Adicione dados nas tabelas primeiro
- Certifique-se que os dados têm valores numéricos válidos

---

## 📊 Estrutura de Dados

### localStorage Keys

```
// Dados das tabelas
divinetalk_BR = [{date, valorGasto, instalacoes, ...}, ...]
divinetalk_US = [...]
divinetv_BR = [...]
...

// Orçamentos
budget_2026-01 = "10000"
budget_2026-02 = "15000"
...
```

### Formato de Linha

```json
{
  "date": "2026-02-15",
  "valorGasto": "500",
  "instalacoes": "120",
  "trials": "35",
  "novosAssinantes": "8",
  "faturamentoApple": "850",
  "faturamentoAndroid": "620"
}
```

---

## 🚀 Features Futuras (Sugestões)

- [ ] Export do gráfico como PNG
- [ ] Comparação lado-a-lado de 2 períodos
- [ ] Metas de trials/revenue com progress ring
- [ ] Gráfico de linha temporal (evolução)
- [ ] Alertas quando orçamento > 90%
- [ ] Dashboard mobile-first separado
- [ ] Integração com API (substituir localStorage)
- [ ] Filtro por app (DivineTalk vs DivineTV)
- [ ] Dark/Light mode toggle

---

## 📚 Documentação Adicional

- **Features detalhadas:** `KLINSMANN_FEATURES.md`
- **Código original:** Versionado no Git
- **Chart.js Docs:** https://www.chartjs.org/docs/latest/

---

## ✨ Créditos

**Desenvolvido por:** 🎨 Klinsmann (Sub-Agent)  
**Solicitado por:** Adriano (via Steve)  
**Data:** 2026-02-17  
**Tech Stack:** HTML5, CSS3, Vanilla JS, Chart.js 4  
**Status:** ✅ Completo e funcional

---

## 🎯 Checklist Final

- [x] Filtro de período implementado
- [x] Card de orçamento com input editável
- [x] Card de impostos com cálculo automático
- [x] Gráfico Chart.js com 4 métricas
- [x] Toggle de métricas no gráfico
- [x] Persistência de orçamento em localStorage
- [x] Responsividade mobile
- [x] Cores Divine (azul/dourado)
- [x] Animações suaves
- [x] Documentação completa
- [x] Script de teste de dados

---

**Agora é só aproveitar! 🚀**
