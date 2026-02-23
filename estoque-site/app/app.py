# FILE: /estoque-site/app/app.py
from flask import Flask, render_template, request, redirect, url_for, flash

from db import sistema
from funcoes_estoque import (
    adicionar_produto_web,
    consultar_produto_web,
    vender_produto_web,
    relatorio_total_web,
    total_itens_web,
    produtos_baixos_web,
    adicionar_estoque_web,
)

app = Flask(__name__)
app.secret_key = "troque-essa-chave-para-uma-mais-forte"


@app.get("/")
def dashboard():
    total_itens = total_itens_web(sistema)
    total_investido = relatorio_total_web(sistema)
    qtd_produtos = len(sistema)
    baixos = produtos_baixos_web(sistema, limite=3)

    return render_template(
        "index.html",
        total_itens=total_itens,
        total_investido=total_investido,
        qtd_produtos=qtd_produtos,
        baixos=baixos,
    )


@app.get("/produtos")
def produtos():
    # Monta uma lista com totais por item para a tabela
    itens = []
    for codigo, info in sistema.items():
        total_item = float(info["Preço"]) * int(info["Quantidade"])
        itens.append(
            {
                "codigo": codigo,
                "produto": info["Produto"],
                "preco": float(info["Preço"]),
                "quantidade": int(info["Quantidade"]),
                "total": total_item,
            }
        )

    # Ordena por código
    itens.sort(key=lambda x: x["codigo"])

    return render_template("produtos.html", itens=itens)


@app.get("/adicionar")
def adicionar_get():
    return render_template("adicionar.html")


@app.post("/adicionar")
def adicionar_post():
    nome = request.form.get("nome", "").strip()
    preco_raw = request.form.get("preco", "").strip().replace(",", ".")
    quantidade_raw = request.form.get("quantidade", "").strip()

    # Validação robusta pra não quebrar form
    if not nome:
        flash("Nome do produto não pode ser vazio.", "error")
        return redirect(url_for("adicionar_get"))

    try:
        preco = float(preco_raw)
    except ValueError:
        flash("Preço inválido. Digite um número (ex: 199.90).", "error")
        return redirect(url_for("adicionar_get"))

    try:
        quantidade = int(quantidade_raw)
    except ValueError:
        flash("Quantidade inválida. Digite um número inteiro.", "error")
        return redirect(url_for("adicionar_get"))

    if preco < 0:
        flash("Preço não pode ser negativo.", "error")
        return redirect(url_for("adicionar_get"))

    if quantidade < 0:
        flash("Quantidade não pode ser negativa.", "error")
        return redirect(url_for("adicionar_get"))

    codigo, produto = adicionar_produto_web(sistema, nome, preco, quantidade)
    flash(f"Produto adicionado com sucesso! Código {codigo} ({produto['Produto']}).", "success")
    return redirect(url_for("produtos"))


@app.get("/consultar")
def consultar_get():
    return render_template("consultar.html", resultado=None)


@app.post("/consultar")
def consultar_post():
    codigo_raw = request.form.get("codigo", "").strip()

    try:
        codigo = int(codigo_raw)
    except ValueError:
        flash("Código inválido. Digite um número.", "error")
        return redirect(url_for("consultar_get"))

    produto = consultar_produto_web(sistema, codigo)
    if produto is None:
        flash("Produto não encontrado para esse código.", "error")
        return render_template("consultar.html", resultado=None)

    # prepara dados para exibir bonitinho
    resultado = {
        "codigo": codigo,
        "produto": produto["Produto"],
        "preco": float(produto["Preço"]),
        "quantidade": int(produto["Quantidade"]),
        "total": float(produto["Preço"]) * int(produto["Quantidade"]),
    }
    flash("Produto encontrado!", "success")
    return render_template("consultar.html", resultado=resultado)


@app.get("/vender")
def vender_get():
    return render_template("vender.html")


@app.post("/vender")
def vender_post():
    codigo_raw = request.form.get("codigo", "").strip()
    quantidade_raw = request.form.get("quantidade", "").strip()

    try:
        codigo = int(codigo_raw)
    except ValueError:
        flash("Código inválido. Digite um número.", "error")
        return redirect(url_for("vender_get"))

    try:
        quantidade = int(quantidade_raw)
    except ValueError:
        flash("Quantidade inválida. Digite um número inteiro.", "error")
        return redirect(url_for("vender_get"))

    ok, mensagem = vender_produto_web(sistema, codigo, quantidade)
    flash(mensagem, "success" if ok else "error")

    if ok:
        return redirect(url_for("produtos"))
    return redirect(url_for("vender_get"))

@app.get("/repor")
def repor_get():
    return render_template("repor.html")


@app.post("/repor")
def repor_post():
    codigo_raw = request.form.get("codigo", "").strip()
    quantidade_raw = request.form.get("quantidade", "").strip()

    try:
        codigo = int(codigo_raw)
    except ValueError:
        flash("Código inválido. Digite um número.", "error")
        return redirect(url_for("repor_get"))

    try:
        quantidade = int(quantidade_raw)
    except ValueError:
        flash("Quantidade inválida. Digite um número inteiro.", "error")
        return redirect(url_for("repor_get"))

    ok, msg = adicionar_estoque_web(sistema, codigo, quantidade)
    flash(msg, "success" if ok else "error")

    if ok:
        return redirect(url_for("produtos"))
    return redirect(url_for("repor_get"))

@app.get("/relatorio")
def relatorio():
    total_investido = relatorio_total_web(sistema)
    return render_template("relatorio.html", total_investido=total_investido)


if __name__ == "__main__":
    app.run(debug=True)