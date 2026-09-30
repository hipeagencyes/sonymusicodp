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
      minCard: small ? 88 : 150
    };
  }

  // Elige columnas/filas: la mayor cantidad de tarjetas por página sin bajar del tamaño mínimo
  function chooseLayout(m) {
    var availW = m.w - 2 * m.padX;
    var availH = m.h - m.padTop - m.padBottom - (hasSections ? LABEL_H + m.gap : 0);
    var best = null;
    for (var c = 2; c <= 10; c++) {
      for (var r = 1; r <= 8; r++) {
        var size = Math.min(MAX_CARD, (availW - (c - 1) * m.gap) / c, (availH - (r - 1) * m.gap) / r);
        if (size < m.minCard) continue;
        var cap = c * r;
        if (!best || cap > best.cap || (cap === best.cap && size > best.size)) {
          best = { cols: c, rows: r, cap: cap, size: Math.floor(size) };
        }
      }
    }
    if (!best) { // pantalla diminuta: lo que quepa
      var c2 = 2, s2 = Math.floor((availW - m.gap) / 2);
      best = { cols: c2, rows: Math.max(1, Math.floor((availH + m.gap) / (s2 + m.gap))), size: s2 };
    }
    best.availH = m.h - m.padTop - m.padBottom;
    return best;
  }

  // Reparte en páginas; cada página empieza con la etiqueta de la sección que continúa
  function paginate(L, m) {
    var pages = [], cur = null;
    function newPage(section) {
      cur = { nodes: [], h: 0, col: 0, section: section };
      pages.push(cur);
      if (section) { cur.nodes.push({ label: section }); cur.h = LABEL_H; }
    }
    items.forEach(function (it) {
      if (!cur) newPage(it.section);
      if (it.section !== cur.section) {
        if (cur.h + m.gap + LABEL_H + m.gap + L.size > L.availH) newPage(it.section);
        else {
          cur.nodes.push({ label: it.section });
          cur.h += m.gap + LABEL_H;
          cur.col = 0;
          cur.section = it.section;
        }
      }
      if (cur.col === 0) {
        var need = (cur.h > 0 ? m.gap : 0) + L.size;
        if (cur.h + need > L.availH) { newPage(it.section); need = (cur.h > 0 ? m.gap : 0) + L.size; }
        cur.h += need;
      }
      cur.nodes.push({ card: it.el });
      cur.col = (cur.col + 1) % L.cols;
    });
    return pages;
  }

  var m = metrics();
  var L = chooseLayout(m);
  var pages = paginate(L, m);
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
})();
