
from __future__ import annotations


def adicionar_produto_web(sistema: dict, nome: str, preco: float, quantidade: int) -> tuple[int, dict]:
    """
    Adiciona produto ao dicionário (mutação) e retorna (codigo, produto_dict).
    Regra: novo código = max(sistema.keys()) + 1
    """
    novo_codigo = max(sistema.keys(), default=0) + 1
    sistema[novo_codigo] = {"Produto": nome, "Preço": float(preco), "Quantidade": int(quantidade)}
    return novo_codigo, sistema[novo_codigo]


def consultar_produto_web(sistema: dict, codigo: int) -> dict | None:
    """
    Retorna o produto_dict se existir, senão None.
    """
    return sistema.get(int(codigo))


def vender_produto_web(sistema: dict, codigo: int, quantidade: int) -> tuple[bool, str]:
    """
    Faz baixa no estoque (mutação). Retorna (ok, mensagem).
    Validações:
      - código existe
      - quantidade > 0
      - estoque suficiente
      - impedir estoque negativo
    """
    try:
        codigo = int(codigo)
        quantidade = int(quantidade)
    except ValueError:
        return False, "Código/quantidade inválidos."

    if codigo not in sistema:
        return False, "Código não existe."

    if quantidade <= 0:
        return False, "Quantidade inválida (precisa ser maior que 0)."

    estoque_atual = int(sistema[codigo]["Quantidade"])
    if quantidade > estoque_atual:
        return False, f"Estoque insuficiente. Em estoque: {estoque_atual}."

    sistema[codigo]["Quantidade"] = estoque_atual - quantidade
    return True, f"Venda realizada! {quantidade}x '{sistema[codigo]['Produto']}' (estoque agora: {sistema[codigo]['Quantidade']})."


def relatorio_total_web(sistema: dict) -> float:
    """
    Soma (preço * quantidade) de todos os produtos.
    """
    total = 0.0
    for info in sistema.values():
        total += float(info["Preço"]) * int(info["Quantidade"])
    return float(total)


def total_itens_web(sistema: dict) -> int:
    """
    Soma total de itens (soma das quantidades).
    """
    return sum(int(info["Quantidade"]) for info in sistema.values())


def produtos_baixos_web(sistema: dict, limite: int = 3) -> list[dict]:
    """
    Retorna lista de produtos com estoque <= limite (para alerta no dashboard).
    """
    baixos = []
    for codigo, info in sistema.items():
        qtd = int(info["Quantidade"])
        if qtd <= limite:
            baixos.append(
                {
                    "codigo": codigo,
                    "produto": info["Produto"],
                    "preco": float(info["Preço"]),
                    "quantidade": qtd,
                }
            )
    baixos.sort(key=lambda x: x["quantidade"])
    return baixos

def adicionar_estoque_web(sistema: dict, codigo: int, quantidade: int) -> tuple[bool, str]:
    """
    Soma quantidade ao estoque existente (reposição).
    Valida:
      - código existe
      - quantidade > 0
    """
    try:
        codigo = int(codigo)
        quantidade = int(quantidade)
    except ValueError:
        return False, "Código/quantidade inválidos."

    if codigo not in sistema:
        return False, "Código não existe."

    if quantidade <= 0:
        return False, "Quantidade inválida (precisa ser maior que 0)."

    sistema[codigo]["Quantidade"] = int(sistema[codigo]["Quantidade"]) + quantidade
    return True, f"Estoque atualizado! +{quantidade} em '{sistema[codigo]['Produto']}' (agora: {sistema[codigo]['Quantidade']})."