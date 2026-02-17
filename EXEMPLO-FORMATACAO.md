# 🎨 Exemplo Visual - Formatação de Moeda por País

## Cards de Métricas

### 🇧🇷 Brasil
```
💰 Faturamento: R$ 1.234,56
📊 Custo por Trial: R$ 12,34
💵 Lucro Bruto: R$ 567,89
```

### 🇺🇸 EUA
```
💰 Faturamento: $1,234.56
📊 Custo por Trial: $12.34
💵 Lucro Bruto: $567.89
```

### 🇨🇦 Canadá
```
💰 Faturamento: $5,678.90
📊 Custo por Trial: $23.45
💵 Lucro Bruto: $890.12
```

### 🇬🇧 Reino Unido
```
💰 Faturamento: $9,999.99
📊 Custo por Trial: $45.67
💵 Lucro Bruto: $1,234.56
```

### 🇦🇺 Austrália
```
💰 Faturamento: $123.45
📊 Custo por Trial: $6.78
💵 Lucro Bruto: $90.12
```

### 🌎 Global
```
💰 Faturamento: $10,000.00
📊 Custo por Trial: $50.00
💵 Lucro Bruto: $5,000.00
```

---

## Tabela Editável - Visão Detalhada

### 🇧🇷 Brasil (Divine Talk)

| Data | Valor Gasto | Faturamento Apple | Faturamento Android |
|------|-------------|-------------------|---------------------|
| 15/02/2026 | R$ 1.234,56 | R$ 2.345,67 | R$ 3.456,78 |
| 14/02/2026 | R$ 500,00 | R$ 800,00 | R$ 1.200,00 |

### 🇺🇸 EUA (Divine Talk)

| Data | Valor Gasto | Faturamento Apple | Faturamento Android |
|------|-------------|-------------------|---------------------|
| 15/02/2026 | $1,234.56 | $2,345.67 | $3,456.78 |
| 14/02/2026 | $500.00 | $800.00 | $1,200.00 |

---

## Visão Geral - Tabelas Consolidadas

### 📊 Resumo Regional - Divine Talk

| País | Valor Gasto | Faturamento Total |
|------|-------------|-------------------|
| 🇧🇷 Brasil | R$ 5.234,56 | R$ 8.345,67 |
| 🇺🇸 EUA | $3,456.78 | $5,678.90 |
| 🇨🇦 Canadá | $1,234.56 | $2,345.67 |
| 🇬🇧 Reino Unido | $9,999.99 | $12,345.67 |
| 🇦🇺 Austrália | $567.89 | $890.12 |

---

## 🔍 Diferenças Importantes

### Brasil (pt-BR):
- **Separador decimal:** vírgula (`,`)
- **Separador de milhar:** ponto (`.`)
- **Símbolo:** R$ (com espaço)
- **Exemplo:** R$ 1.234,56

### Outros países (en-US):
- **Separador decimal:** ponto (`.`)
- **Separador de milhar:** vírgula (`,`)
- **Símbolo:** $ (sem espaço)
- **Exemplo:** $1,234.56

---

## 💾 Armazenamento (localStorage)

Os valores são salvos **SEM formatação** (só números):
```json
{
  "date": "2026-02-15",
  "valorGasto": "1234.56",
  "faturamentoApple": "2345.67",
  "faturamentoAndroid": "3456.78"
}
```

A formatação é aplicada **apenas na exibição**, facilitando:
- ✅ Cálculos matemáticos
- ✅ Edição (sem precisar limpar símbolos)
- ✅ Export/Import de dados
