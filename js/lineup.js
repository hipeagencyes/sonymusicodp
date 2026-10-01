/*
 * Reparte los artistas en diapositivas según el tamaño de pantalla.
 * Lee los artistas de #artist-source (grupos con data-section opcional) y crea
 * tantas páginas como hagan falta, rellenando cada una antes de pasar a la siguiente.
 * Se ejecuta antes de components.js para que el slider ya encuentre las diapositivas.
 */
(function () {
  var source = document.getElementById('artist-source');
  var anchor = document.getElementById('contacto');
  if (!source || !anchor) return;

  var GAP_DESKTOP = 20, GAP_MOBILE = 12;
  var MAX_CARD = 200;
  var LABEL_H = 34; // alto de la etiqueta de sección (IBERIA / LATIN)

  // Artistas en orden, cada uno con su sección
  var items = [];
  var hasSections = false;
  Array.prototype.forEach.call(source.children, function (group) {
    var section = group.getAttribute('data-section') || '';
    if (section) hasSections = true;
    Array.prototype.forEach.call(group.children, function (card) {
      items.push({ el: card, section: section });
    });
  });

  function metrics() {
    var w = window.innerWidth, h = window.innerHeight;
    var mobile = w <= 767;
    var small = Math.min(w, h) < 600;
    return {
      w: w, h: h,
      gap: mobile ? GAP_MOBILE : GAP_DESKTOP,
      padX: mobile ? 16 : (w <= 1024 ? 50 : 60),
      padTop: mobile ? 64 : 70,
      padBottom: mobile ? 56 : 70,
      minCard: small ? 88 : 140
    };
  }

  // Secciones en orden, cada una con sus artistas (una sección nunca comparte página con otra)
  var groups = [];
  items.forEach(function (it) {
    var g = groups[groups.length - 1];
    if (!g || g.section !== it.section) { g = { section: it.section, items: [] }; groups.push(g); }
    g.items.push(it);
  });

  // Tamaños de página de cada sección (repartidos por igual)
  function pageSizes(cap) {
    var sizes = [];
    groups.forEach(function (g) {
      var count = Math.ceil(g.items.length / cap);
      var per = Math.ceil(g.items.length / count);
      for (var i = 0; i < g.items.length; i += per) sizes.push(Math.min(per, g.items.length - i));
    });
    return sizes;
  }

  // Elige columnas/filas: menos páginas; luego filas completas (sin 3 sueltos abajo); luego tarjetas más grandes
  function chooseLayout(m) {
    var availW = m.w - 2 * m.padX;
    var availH = m.h - m.padTop - m.padBottom - (hasSections ? LABEL_H + m.gap : 0);
    var best = null;
    for (var c = 2; c <= 10; c++) {
      for (var r = 1; r <= 8; r++) {
        var size = Math.min(MAX_CARD, (availW - (c - 1) * m.gap) / c, (availH - (r - 1) * m.gap) / r);
        if (size < m.minCard) continue;
        var cand = { cols: c, rows: r, cap: c * r, size: Math.floor(size) };
        var sizes = pageSizes(cand.cap);
        cand.pages = sizes.length;
        cand.ragged = sizes.filter(function (n) { return n % c !== 0; }).length;
        if (!best || cand.pages < best.pages ||
            (cand.pages === best.pages && (cand.ragged < best.ragged ||
              (cand.ragged === best.ragged && cand.size > best.size)))) best = cand;
      }
    }
    if (!best) { // pantalla diminuta: lo que quepa
      var s2 = Math.floor((availW - m.gap) / 2);
      var r2 = Math.max(1, Math.floor((availH + m.gap) / (s2 + m.gap)));
      best = { cols: 2, rows: r2, cap: 2 * r2, size: s2 };
    }
    return best;
  }

  // Cada sección en las páginas que necesite, repartidas por igual (17+17 mejor que 21+13)
  function paginate(L) {
    var pages = [];
    groups.forEach(function (g) {
      var count = Math.ceil(g.items.length / L.cap);
      var per = Math.ceil(g.items.length / count);
      for (var i = 0; i < g.items.length; i += per) {
        var nodes = [];
        if (g.section) nodes.push({ label: g.section });
        g.items.slice(i, i + per).forEach(function (it) { nodes.push({ card: it.el }); });
        pages.push({ nodes: nodes });
      }
    });
    return pages;
  }

  var m = metrics();
  var L = chooseLayout(m);
  var pages = paginate(L);
  var bg = anchor.style.backgroundImage;

  pages.forEach(function (page, i) {
    var slide = document.createElement('div');
    slide.className = 'swiper-slide slider-headings__slide sony-slide';
    slide.id = 'lineup-slide-' + (i + 1);
    slide.style.cssText = 'background-image:' + bg + ';background-size:cover;background-position:center;';
    var wrap = document.createElement('div');
    wrap.className = 'sony-slide-wrapper';
    var grid = document.createElement('div');
    grid.className = 'sony-grid';
    grid.style.setProperty('--cols', L.cols);
    grid.style.setProperty('--card', L.size + 'px');
    grid.style.setProperty('--gap', m.gap + 'px');
    page.nodes.forEach(function (n) {
      if (n.label) {
        var lab = document.createElement('div');
        lab.className = 'sony-grid__label';
        lab.textContent = n.label;
        grid.appendChild(lab);
      } else {
        grid.appendChild(n.card);
      }
    });
    wrap.appendChild(grid);
    slide.appendChild(wrap);
    anchor.parentNode.insertBefore(slide, anchor);
  });
  source.parentNode.removeChild(source);

  // Si al redimensionar cambia el reparto, recarga para recalcular las páginas
  var lastW = m.w, lastH = m.h, timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      // la barra del navegador móvil cambia solo el alto unos píxeles: se ignora
      if (Math.abs(window.innerWidth - lastW) < 2 && Math.abs(window.innerHeight - lastH) < 120) return;
      var m2 = metrics(), L2 = chooseLayout(m2);
      if (L2.cols !== L.cols || L2.cap !== L.cap || Math.abs(L2.size - L.size) > 12) window.location.reload();
    }, 300);
  });

  // Nombres en una sola línea: se reduce la letra hasta que quepa; si ni así cabe, el nombre se desliza
  function fitLabels() {
    var minFont = 8;
    Array.prototype.forEach.call(document.querySelectorAll('.artist-card span'), function (label) {
      var inner = label.firstElementChild;
      if (!inner) {
        inner = document.createElement('em'); // no <span>: los estilos de .artist-card span son para la etiqueta
        inner.className = 'artist-card__name';
        inner.textContent = label.textContent;
        label.textContent = '';
        label.appendChild(inner);
      }
      label.classList.remove('is-scrolling');
      label.style.fontSize = '';
      inner.style.removeProperty('--shift');
      inner.style.removeProperty('--dur');
      var cs = getComputedStyle(label);
      var avail = label.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (avail <= 0) return;
      var size = parseFloat(cs.fontSize);
      while (inner.scrollWidth > avail && size > minFont) {
        size -= 0.5;
        label.style.fontSize = size + 'px';
      }
      var overflow = inner.scrollWidth - avail;
      if (overflow > 1) {
        label.classList.add('is-scrolling');
        inner.style.setProperty('--shift', Math.ceil(overflow) + 'px');
        inner.style.setProperty('--dur', Math.max(3, overflow / 18 + 2) + 's');
      }
    });
  }
  window.addEventListener('load', function () {
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitLabels);
  });
  var fitTimer;
  window.addEventListener('resize', function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitLabels, 200);
  });
})();
