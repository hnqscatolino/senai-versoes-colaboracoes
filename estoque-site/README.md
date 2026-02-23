# Estoque Site (Flask)

Web app simples para controle de estoque (dicionário em memória).

## 📁 Estrutura
- `app/app.py`: rotas Flask e controllers
- `app/db.py`: "banco" em memória (`sistema`)
- `app/funcoes_estoque.py`: regras de negócio (sem input/print)
- `app/templates/`: HTML (Jinja)
- `app/static/`: CSS e JS

## ✅ Funcionalidades
- Dashboard (resumo + alerta de estoque baixo <= 3)
- Listar produtos (tabela com total por item)
- Adicionar produto
- Consultar por código
- Vender produto (não permite estoque negativo)
- Relatório total investido

## ⚙️ Como rodar
1) Instale dependências:
```bash
pip install -r requirements.txt