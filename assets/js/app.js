/**
 * Estoque (GitHub Pages)
 * - Sem backend: tudo em LocalStorage
 * - Seed inicial em /assets/data/seed.json
 * - Rotas por hash: #/produtos, #/adicionar, etc.
 */

const STORAGE_KEY = "estoque_site_v1";

function fmtBRL(n) {
  const num = Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toNumberStrict(v) {
  const s = String(v ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toIntStrict(v) {
  const n = Number(String(v ?? "").trim());
  return Number.isInteger(n) ? n : null;
}

function flash(msg, type = "success") {
  const stack = document.getElementById("flashStack");
  const el = document.createElement("div");
  el.className = `flash ${type}`;
  el.textContent = msg;
  stack.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-4px)";
    el.style.transition = "200ms ease";
    setTimeout(() => el.remove(), 250);
  }, 3500);
}

async function loadSeed() {
  const res = await fetch("./assets/data/seed.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar seed.json");
  return await res.json();
}

function readDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function ensureDB(db) {
  // normaliza tipos
  const out = {};
  for (const [k, v] of Object.entries(db)) {
    const code = Number(k);
    out[code] = {
      Produto: String(v.Produto ?? ""),
      "Preço": Number(v["Preço"] ?? 0),
      Quantidade: Number(v.Quantidade ?? 0),
    };
  }
  return out;
}

function getAll(db) {
  const items = Object.entries(db).map(([codigo, info]) => {
    const preco = Number(info["Preço"]);
    const qtd = Number(info.Quantidade);
    return {
      codigo: Number(codigo),
      produto: info.Produto,
      preco,
      quantidade: qtd,
      total: preco * qtd,
    };
  });

  items.sort((a, b) => a.codigo - b.codigo);
  return items;
}

function totals(db) {
  const items = getAll(db);
  const totalItens = items.reduce((acc, it) => acc + it.quantidade, 0);
  const totalInvestido = items.reduce((acc, it) => acc + it.total, 0);
  const produtosCadastrados = items.length;
  const baixos = items
    .filter((it) => it.quantidade <= 3)
    .sort((a, b) => a.quantidade - b.quantidade);

  return { totalItens, totalInvestido, produtosCadastrados, baixos, items };
}

function nextCode(db) {
  const keys = Object.keys(db).map(Number);
  return (keys.length ? Math.max(...keys) : 0) + 1;
}

function setActiveNav(route) {
  const nav = document.getElementById("nav");
  for (const a of nav.querySelectorAll("a[data-route]")) {
    a.classList.toggle("active", a.getAttribute("data-route") === route);
  }
}

function pageHeader(title, subtitle) {
  return `
    <section class="page-header">
      <h1>${title}</h1>
      <p class="muted">${subtitle || ""}</p>
    </section>
  `;
}

// ----------------------
// Renderizações (pages)
// ----------------------

function renderDashboard(db) {
  const { totalItens, totalInvestido, produtosCadastrados, baixos } = totals(db);

  const lowRows = baixos.length
    ? baixos
        .map(
          (p) => `
    <tr class="low-stock">
      <td>${p.codigo}</td>
      <td>${p.produto}</td>
      <td>${fmtBRL(p.preco)}</td>
      <td><span class="pill pill-danger">${p.quantidade}</span></td>
    </tr>
  `
        )
        .join("")
    : `
    <tr>
      <td colspan="4" class="muted">Nenhum produto com estoque baixo no momento ✅</td>
    </tr>
  `;

  return `
    ${pageHeader("Dashboard", "Resumo do estoque e alertas de baixa quantidade.")}
    <section class="grid">
      <div class="card">
        <div class="card-label">Total de itens</div>
        <div class="card-value">${totalItens}</div>
      </div>

      <div class="card">
        <div class="card-label">Total investido</div>
        <div class="card-value">${fmtBRL(totalInvestido)}</div>
      </div>

      <div class="card">
        <div class="card-label">Produtos cadastrados</div>
        <div class="card-value">${produtosCadastrados}</div>
      </div>
    </section>

    <section class="card mt">
      <div class="card-head">
        <h2>⚠️ Estoque baixo (<= 3)</h2>
        <a class="btn btn-secondary" href="#/produtos">Ver todos</a>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Preço</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>${lowRows}</tbody>
        </table>
      </div>

      <p class="muted mt-sm small">
        Dica: use <span class="kbd">Repor</span> para aumentar estoque sem criar produto novo.
      </p>
    </section>
  `;
}

function renderProdutos(db) {
  const { items } = totals(db);

  const rows = items
    .map((it) => {
      const isLow = it.quantidade <= 3;
      return `
        <tr class="${isLow ? "low-stock" : ""}">
          <td>${it.codigo}</td>
          <td>${it.produto}</td>
          <td>${fmtBRL(it.preco)}</td>
          <td>${
            isLow
              ? `<span class="pill pill-danger">${it.quantidade}</span>`
              : `<span class="pill pill-ok">${it.quantidade}</span>`
          }</td>
          <td><strong>${fmtBRL(it.total)}</strong></td>
        </tr>
      `;
    })
    .join("");

  return `
    ${pageHeader("Produtos", "Tabela completa com total por item.")}
    <div class="actions">
      <div class="muted small">Os dados ficam salvos no navegador (LocalStorage).</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="btnReset">Resetar dados</button>
        <a class="btn" href="#/adicionar">+ Adicionar produto</a>
      </div>
    </div>

    <section class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Preço</th>
              <th>Quantidade</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAdicionar() {
  return `
    ${pageHeader("Adicionar produto", "Cadastre um novo item no estoque.")}
    <section class="card">
      <form class="form" id="formAdd">
        <div class="form-row">
          <label for="nome">Produto</label>
          <input id="nome" name="nome" type="text" placeholder="Ex: Mouse Gamer" required />
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label for="preco">Preço (R$)</label>
            <input id="preco" name="preco" type="text" inputmode="decimal" placeholder="Ex: 199.90" required />
          </div>

          <div class="form-row">
            <label for="quantidade">Quantidade</label>
            <input id="quantidade" name="quantidade" type="number" min="0" step="1" placeholder="Ex: 10" required />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn" type="submit">Salvar</button>
          <a class="btn btn-secondary" href="#/produtos">Cancelar</a>
        </div>
      </form>
    </section>
  `;
}

function renderConsultar() {
  return `
    ${pageHeader("Consultar produto", "Busque um produto pelo código.")}
    <section class="card">
      <form class="form" id="formConsultar">
        <div class="form-grid">
          <div class="form-row">
            <label for="codigo">Código</label>
            <input id="codigo" name="codigo" type="number" min="1" step="1" placeholder="Ex: 10" required />
          </div>
          <div class="form-row">
            <label>&nbsp;</label>
            <button class="btn" type="submit">Consultar</button>
          </div>
        </div>
      </form>

      <hr class="sep" />
      <div id="resultadoConsultar" class="muted">Digite um código e consulte.</div>
    </section>
  `;
}

function renderVender() {
  return `
    ${pageHeader("Vender produto", "Baixa no estoque (não permite negativo).")}
    <section class="card">
      <form class="form" id="formVender">
        <div class="form-grid">
          <div class="form-row">
            <label for="codigo">Código</label>
            <input id="codigo" name="codigo" type="number" min="1" step="1" placeholder="Ex: 10" required />
          </div>

          <div class="form-row">
            <label for="quantidade">Quantidade</label>
            <input id="quantidade" name="quantidade" type="number" min="1" step="1" placeholder="Ex: 2" required />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-danger" type="submit">Vender</button>
          <a class="btn btn-secondary" href="#/produtos">Voltar</a>
        </div>
      </form>

      <p class="muted mt-sm small">Confirmação aparece antes de concluir a venda.</p>
    </section>
  `;
}

function renderRepor(db) {
  const { baixos, items } = totals(db);

  const options = items
    .map((it) => {
      const tag = it.quantidade <= 3 ? " (baixo)" : "";
      return `<option value="${it.codigo}">${it.codigo} — ${it.produto}${tag}</option>`;
    })
    .join("");

  const lowHint = baixos.length
    ? `Produtos em baixa: ${baixos.map((b) => `${b.codigo} (${b.quantidade})`).join(", ")}`
    : "Nenhum produto em baixa no momento.";

  return `
    ${pageHeader("Repor estoque", "Adicionar quantidade a um produto já cadastrado.")}
    <section class="card">
      <form class="form" id="formRepor">
        <div class="form-row">
          <label for="codigo">Produto</label>
          <select id="codigo" name="codigo">${options}</select>
          <div class="muted small mt-sm">${lowHint}</div>
        </div>

        <div class="form-row">
          <label for="quantidade">Quantidade a adicionar</label>
          <input id="quantidade" name="quantidade" type="number" min="1" step="1" placeholder="Ex: 5" required />
        </div>

        <div class="form-actions">
          <button class="btn" type="submit">Repor</button>
          <a class="btn btn-secondary" href="#/produtos">Voltar</a>
        </div>
      </form>
    </section>
  `;
}

function renderRelatorio(db) {
  const { totalInvestido } = totals(db);

  return `
    ${pageHeader("Relatório", "Total investido no estoque (quantidade × preço).")}
    <section class="card">
      <div class="report">
        <div class="report-label">Total investido</div>
        <div class="report-value">${fmtBRL(totalInvestido)}</div>
      </div>

      <div class="actions mt">
        <a class="btn btn-secondary" href="#/produtos">Ver produtos</a>
        <a class="btn" href="#/">Voltar ao dashboard</a>
      </div>
    </section>
  `;
}

// ----------------------
// Handlers (forms/buttons)
// ----------------------

function attachHandlers(route, db) {
  if (route === "/produtos") {
    const btn = document.getElementById("btnReset");
    if (btn) {
      btn.addEventListener("click", async () => {
        const ok = confirm("Resetar para os 15 produtos iniciais? Isso apaga as alterações.");
        if (!ok) return;

        const seed = await loadSeed();
        const clean = ensureDB(seed);
        writeDB(clean);

        flash("Dados resetados com sucesso!", "success");
        navigate("/produtos");
      });
    }
  }

  if (route === "/adicionar") {
    const form = document.getElementById("formAdd");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = form.nome.value.trim();
      const preco = toNumberStrict(form.preco.value);
      const qtd = toIntStrict(form.quantidade.value);

      if (!nome) return flash("Nome do produto não pode ser vazio.", "error");
      if (preco === null || preco < 0) return flash("Preço inválido.", "error");
      if (qtd === null || qtd < 0) return flash("Quantidade inválida.", "error");

      const code = nextCode(db);
      db[code] = { Produto: nome, "Preço": Number(preco), Quantidade: Number(qtd) };

      writeDB(db);
      flash(`Produto adicionado! Código ${code} (${nome}).`, "success");
      navigate("/produtos");
    });
  }

  if (route === "/consultar") {
    const form = document.getElementById("formConsultar");
    const out = document.getElementById("resultadoConsultar");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const codigo = toIntStrict(form.codigo.value);
      if (codigo === null || codigo <= 0) return flash("Código inválido.", "error");

      const p = db[codigo];
      if (!p) {
        out.innerHTML = `<div class="muted">Produto não encontrado.</div>`;
        return flash("Produto não encontrado.", "error");
      }

      const preco = Number(p["Preço"]);
      const qtd = Number(p.Quantidade);
      const total = preco * qtd;

      out.innerHTML = `
        <div class="result">
          <h2>Resultado</h2>
          <div class="result-grid">
            <div><span class="muted">Código</span><br><strong>${codigo}</strong></div>
            <div><span class="muted">Produto</span><br><strong>${p.Produto}</strong></div>
            <div><span class="muted">Preço</span><br><strong>${fmtBRL(preco)}</strong></div>
            <div><span class="muted">Quantidade</span><br><strong>${qtd}</strong></div>
            <div><span class="muted">Total</span><br><strong>${fmtBRL(total)}</strong></div>
          </div>
        </div>
      `;

      flash("Produto encontrado!", "success");
    });
  }

  if (route === "/vender") {
    const form = document.getElementById("formVender");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const codigo = toIntStrict(form.codigo.value);
      const qtd = toIntStrict(form.quantidade.value);

      if (codigo === null || codigo <= 0) return flash("Código inválido.", "error");
      if (qtd === null || qtd <= 0) return flash("Quantidade inválida.", "error");

      const p = db[codigo];
      if (!p) return flash("Código não existe.", "error");

      const estoque = Number(p.Quantidade);
      if (qtd > estoque) return flash(`Estoque insuficiente. Em estoque: ${estoque}.`, "error");

      const ok = confirm(`Confirmar venda?\nProduto: ${p.Produto}\nQuantidade: ${qtd}`);
      if (!ok) return;

      p.Quantidade = estoque - qtd;
      writeDB(db);

      flash(`Venda realizada! ${qtd}x '${p.Produto}' (estoque agora: ${p.Quantidade}).`, "success");
      navigate("/produtos");
    });
  }

  if (route === "/repor") {
    const form = document.getElementById("formRepor");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const codigo = toIntStrict(form.codigo.value);
      const qtd = toIntStrict(form.quantidade.value);

      if (codigo === null || codigo <= 0) return flash("Código inválido.", "error");
      if (qtd === null || qtd <= 0) return flash("Quantidade inválida.", "error");

      const p = db[codigo];
      if (!p) return flash("Código não existe.", "error");

      p.Quantidade = Number(p.Quantidade) + qtd;
      writeDB(db);

      flash(`Estoque atualizado! +${qtd} em '${p.Produto}' (agora: ${p.Quantidade}).`, "success");
      navigate("/produtos");
    });
  }
}

// ----------------------
// Router (hash)
// ----------------------

function renderRoute(route, db) {
  setActiveNav(route);

  if (route === "/") return renderDashboard(db);
  if (route === "/produtos") return renderProdutos(db);
  if (route === "/adicionar") return renderAdicionar();
  if (route === "/consultar") return renderConsultar();
  if (route === "/vender") return renderVender();
  if (route === "/repor") return renderRepor(db);
  if (route === "/relatorio") return renderRelatorio(db);

  return `
    <div class="card">
      ${pageHeader("404", "Página não encontrada.")}
      <a class="btn btn-secondary" href="#/">Voltar</a>
    </div>
  `;
}

function getRoute() {
  const hash = location.hash || "#/";
  const route = hash.replace(/^#/, "");
  return route === "" ? "/" : route;
}

function navigate(route) {
  location.hash = `#${route}`;
}

// ----------------------
// Boot
// ----------------------

async function init() {
  let db = readDB();

  if (!db) {
    const seed = await loadSeed();
    db = ensureDB(seed);
    writeDB(db);
  } else {
    db = ensureDB(db);
    writeDB(db);
  }

  const app = document.getElementById("app");

  function rerender() {
    const route = getRoute();
    app.innerHTML = renderRoute(route, db);
    attachHandlers(route, db);
  }

  window.addEventListener("hashchange", rerender);
  rerender();
}

init().catch((err) => {
  console.error(err);
  flash("Falha ao iniciar o app. Veja o console.", "error");
});