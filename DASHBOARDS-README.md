# 📊 Dashboards - Análise Comparativa

## ✨ O que foi implementado

Nova aba **"📊 Dashboards"** com 7 gráficos interativos usando Chart.js para análise comparativa completa dos dados do Divine Talk e Divine TV.

---

## 🎨 Gráficos Implementados

### 1. 🌎 **País vs País** (Barras Agrupadas)
- **Métricas disponíveis**: Faturamento, Trials, Custo/Trial, Lucro
- **Países**: Brasil, EUA, Canadá, Reino Unido, Austrália
- **Toggle**: Botões para alternar entre métricas
- **Cores**: Cores únicas por país (bandeira)

### 2. 📱 **App vs App** (Barras Lado a Lado)
- **Métricas disponíveis**: Faturamento, Trials, Instalações, Novos Assinantes
- **Comparação**: Divine Talk vs Divine TV
- **Toggle**: Botões para alternar entre métricas
- **Cores**: Azul (Divine Talk) e Dourado (Divine TV)

### 3. 📈 **Evolução Mensal** (Gráfico de Linhas)
- **Período**: Últimos 6 meses
- **Linhas**:
  - Faturamento Total (verde)
  - Custos Totais (vermelho)
  - Lucro Bruto (azul)
- **Tooltip**: Detalhamento por mês
- **Width**: Full-width (ocupa toda a linha)

### 4. 🥧 **Distribuição de Receita por País** (Donut Chart)
- **Dados**: Percentual de faturamento de cada país
- **Cores**: Uma cor única por país
- **Tooltip**: Mostra valor e percentual

### 5. 📊 **Despesas por Categoria** (Barras Horizontais)
- **Categorias**:
  - Custos Fixos
  - Custos Variáveis
  - Extrato Cartão
  - Contas a Pagar (apenas pendentes)
- **Dados**: Do período selecionado (aba Financeiro)

### 6. 📉 **Taxa de Conversão** (Barras Agrupadas)
- **Dados**: Trials vs Novos Assinantes
- **Toggle**: Por País ou Por App
- **Footer do Tooltip**: Mostra taxa de conversão (%)

### 7. 💰 **ROI por País** (Barras Coloridas)
- **Cálculo**: `(Faturamento - Valor Gasto) / Valor Gasto × 100`
- **Cores**: Verde (ROI positivo), Vermelho (ROI negativo)
- **Tooltip**: Mostra ROI em percentual

---

## 🎛️ Funcionalidades

### Filtro de Período
- **Localização**: Topo da aba Dashboards
- **Opções**: 
  - "Todo o período"
  - Meses disponíveis (gerados dinamicamente)
- **Comportamento**: Ao trocar, todos os gráficos atualizam automaticamente

### Controles de Métricas
- **Gráficos com toggle**: País vs País, App vs App, Taxa de Conversão
- **Visual**: Botões com estado ativo (azul)
- **Transições**: Suaves ao alternar métricas

---

## 🎨 Design System

### Cores por País
- 🇧🇷 Brasil: `#00A859` (verde)
- 🇺🇸 EUA: `#3C3B6E` (azul navy)
- 🇨🇦 Canadá: `#FF0000` (vermelho)
- 🇬🇧 Reino Unido: `#012169` (azul escuro)
- 🇦🇺 Austrália: `#00008B` (azul royal)

### Cores por App
- Divine Talk: `#3b82f6` (azul)
- Divine TV: `#f59e0b` (dourado)

### Espaçamento
- Grid: `minmax(500px, 1fr)` com gap de 24px
- Responsive: 1 coluna em telas menores que 1200px
- Chart container: padding de 24px

### Elevação
- Cards: `elevation-1` por padrão
- Hover: `elevation-2`
- Botões ativos: `shadow-blue`

---

## 📊 Lógica de Dados

### Fontes de Dados

1. **Divine Talk + Divine TV (todos países)**
   - localStorage: `divinetalk_{BR|US|CA|GB|AU}`, `divinetv_{BR|US|CA|GB|AU}`
   - Campos usados: 
     - `date` (filtro de período)
     - `faturamentoApple`, `faturamentoAndroid` (revenue)
     - `trials`, `instalacoes`, `novosAssinantes`
     - `valorGasto`

2. **Financeiro**
   - localStorage: `financial_{table}_{month}`
   - Tabelas: `custosFixos`, `custosVariaveis`, `extratoCartao`, `contasPagar`

### Cálculos
```javascript
Faturamento Total = sum(faturamentoApple + faturamentoAndroid)
Lucro = Faturamento - Custos Totais
ROI = (Lucro / Custos) × 100
Conversão = (Novos Assinantes / Trials) × 100
Custo por Trial = Valor Gasto / Trials
```

---

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos
1. **`dashboard-analytics.js`** (33KB)
   - Classe `DashboardAnalytics`
   - 7 métodos de renderização de gráficos
   - Helpers de formatação
   - Auto-inicialização

### Arquivos Modificados
1. **`index.html`**
   - Adicionada aba "📊 Dashboards" no nav
   - Nova view `#view-dashboards` com grid de gráficos
   - Include de `dashboard-analytics.js`

2. **`styles.css`**
   - Estilos `.dashboards-grid`
   - Estilos `.chart-container`
   - Estilos `.chart-header`, `.chart-controls`, `.metric-btn`
   - Estilos responsive
   - Estados: loading, empty, hover

---

## 🚀 Como Usar

### Para Visualizar
1. Abra `index.html` no navegador
2. Clique na aba **📊 Dashboards**
3. Use o filtro de período para selecionar o mês desejado
4. Todos os gráficos atualizam automaticamente

### Para Adicionar Dados de Teste
```javascript
// Execute no console do navegador
const script = document.createElement('script');
script.src = 'test-data-generator.js';
document.head.appendChild(script);

const script2 = document.createElement('script');
script2.src = 'test-financial-data.js';
document.head.appendChild(script2);
```

Ou use o arquivo `test-dashboards.html` que já inclui os dados de teste.

---

## 📱 Responsividade

### Desktop (> 1200px)
- Grid de 2 colunas
- Gráfico de evolução mensal full-width

### Tablet (768px - 1200px)
- Grid de 1 coluna
- Todos os gráficos ocupam largura total

### Mobile (< 768px)
- Chart headers em coluna
- Botões de controle menores
- Fonte reduzida

---

## 🎯 Estados dos Gráficos

### Loading
- Spinner animado
- Altura mínima mantida
- Cor do spinner: azul Divine

### Empty State
- Ícone grande opaco
- Mensagem "Sem dados para este período"
- Centralizado vertical e horizontalmente

### Com Dados
- Tooltips customizados
- Formatação de moeda (R$ com K/M)
- Animações suaves

---

## 🔮 Melhorias Futuras (Opcionais)

### 8. 📅 **Heatmap de Performance**
- Tipo: Calendário/heatmap
- Dados: Faturamento diário do mês
- Cores: Intensidade baseada no valor
- Implementação: Requer plugin Chart.js adicional

### Filtros Avançados
- Range de datas (start/end)
- Filtro por app individual
- Filtro por país individual
- Comparação de períodos (mês atual vs anterior)

### Exportação
- Botão "📥 Exportar Relatório PDF"
- Imagens dos gráficos
- Tabela de resumo

---

## ✅ Checklist de Implementação

- [x] HTML da aba Dashboards
- [x] CSS do grid de gráficos
- [x] Classe DashboardAnalytics
- [x] Gráfico 1: País vs País
- [x] Gráfico 2: App vs App
- [x] Gráfico 3: Evolução Mensal
- [x] Gráfico 4: Distribuição de Receita
- [x] Gráfico 5: Despesas por Categoria
- [x] Gráfico 6: Taxa de Conversão
- [x] Gráfico 7: ROI por País
- [x] Filtro de período
- [x] Toggles de métricas
- [x] Formatação de moeda
- [x] Tooltips customizados
- [x] Responsividade
- [x] Auto-inicialização
- [x] Integração com localStorage
- [x] Documentação

---

## 🎨 Klinsmann - Web Design & Data Visualization

Dashboard profissional criado com:
- **Chart.js 4** (gráficos interativos)
- **CSS Grid** (layout responsivo)
- **Design System** (variáveis CSS)
- **Performance** (lazy loading de dados)
- **UX Premium** (transições, tooltips, estados)

**Status**: ✅ Completo e pronto para produção!
