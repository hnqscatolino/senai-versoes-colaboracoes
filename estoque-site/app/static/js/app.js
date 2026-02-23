// FILE: /estoque-site/app/static/js/app.js
(function () {
  // Confirmação ao vender (opcional)
  const form = document.querySelector('form[data-confirm="true"]');
  if (form) {
    form.addEventListener("submit", function (e) {
      const codigo = document.querySelector("#codigo")?.value || "";
      const quantidade = document.querySelector("#quantidade")?.value || "";
      const ok = confirm(`Confirmar venda?\nCódigo: ${codigo}\nQuantidade: ${quantidade}`);
      if (!ok) e.preventDefault();
    });
  }

  // (Opcional) Se quiser, dá pra fazer mais realces via JS depois.
})();