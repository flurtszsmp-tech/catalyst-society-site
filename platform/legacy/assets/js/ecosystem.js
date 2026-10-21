/* One reveal per document visit. Native scroll remains the source of progress. */
(function () {
  'use strict';
  var track = document.querySelector('.eco-scroll');
  if (!track) return;
  var stage = track.querySelector('.eco-stage');
  var hub = stage.querySelector('.eco-hub');
  var nodes = Array.from(stage.querySelectorAll('.node'));
  var faces = nodes.map(function (node) { return node.querySelector('.node-in'); });
  var lastAmounts = [], lastPaint = -1, lastOrb = -1;
  var orbit = stage.querySelector('.eco-orbit');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.classList.add('eco-circuits');
  svg.setAttribute('aria-hidden', 'true');
  var wires = nodes.map(function (_, i) {
    var group = document.createElementNS(ns, 'g');
    var paths = ['eco-wire', 'eco-current'].map(function (name) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('class', name);
      path.setAttribute('pathLength', '100');
      path.style.setProperty('--i', i);
      group.appendChild(path);
      return path;
    });
    svg.appendChild(group);
    return { group: group, paths: paths };
  });
  stage.prepend(svg);
  track.classList.add('is-enhanced');
  var highWater = 0, displayed = 0, raf = 0, previousTime = 0;
  var visible = false, dirty = true, geometry = [];
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (v) { return 1 - Math.pow(1 - clamp(v), 3); };

  function measure() {
    var w = stage.clientWidth, h = stage.clientHeight;
    var cx = hub.offsetLeft, cy = hub.offsetTop;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    geometry = nodes.map(function (node, i) {
      var x = node.offsetLeft, y = node.offsetTop;
      // Fixed endpoints share the same layout coordinates as the cards.
      // No random per-frame path regeneration: the current cannot jump.
      var dx = x - cx, dy = y - cy;
      var d = 'M ' + cx + ' ' + cy + ' C ' + (cx + dx * .45) + ' ' + cy + ' ' + (x - dx * .14) + ' ' + (y - dy * .2) + ' ' + x + ' ' + y;
      wires[i].paths.forEach(function (p) { p.setAttribute('d', d); });
      return { cx: cx, cy: cy, x: x, y: y, dx: dx, dy: dy };
    });
    dirty = false;
    lastPaint = -1;
    lastOrb = -1;
    lastAmounts = [];
  }
  function paint(p) {
    if (p === lastPaint) return;
    lastPaint = p;
    var orb = motion.matches ? 1 : ease(p / .25);
    if (orb !== lastOrb) {
    hub.style.opacity = orb;
    hub.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - orb) * 38) + 'px) scale(' + (.88 + .12 * orb) + ')';
    orbit.style.opacity = .45 * orb;
    hub.classList.toggle('is-settled', orb === 1);
    lastOrb = orb;
    }
    nodes.forEach(function (node, i) {
      var amount = motion.matches ? 1 : ease((p - .12 - i * .095) / .32);
      if (lastAmounts[i] === amount) return;
      lastAmounts[i] = amount;
      var g = geometry[i];
      node.style.opacity = amount;
      node.style.transform = 'translate(-50%,-50%) translate(' + (-g.dx * .15 * (1 - amount)) + 'px,' + (34 * (1 - amount)) + 'px)';
      var x = g.x - g.dx * .15 * (1 - amount), y = g.y + 34 * (1 - amount);
      var d = 'M ' + g.cx + ' ' + g.cy + ' C ' + (g.cx + (x - g.cx) * .45) + ' ' + g.cy + ' ' + (x - (x - g.cx) * .14) + ' ' + (y - (y - g.cy) * .2) + ' ' + x + ' ' + y;
      wires[i].paths.forEach(function (path) { path.setAttribute('d', d); });
      var face = faces[i];
      face.style.setProperty('--yaw', ((i % 2 ? 1 : -1) * (12 + 20 * (1 - amount))) + 'deg');
      wires[i].group.style.opacity = amount;
      wires[i].paths[0].style.strokeDasharray = '100';
      wires[i].paths[0].style.strokeDashoffset = 100 * (1 - amount);
      node.classList.toggle('is-settled', amount === 1);
    });
    track.dataset.revealProgress = p.toFixed(3);
  }
  function tick(time) {
    raf = 0;
    if (!dirty && displayed === 1) return;
    if (dirty) measure();
    var rect = track.getBoundingClientRect();
    var distance = Math.max(280, track.offsetHeight - stage.offsetHeight);
    var progress = clamp((innerHeight * .52 - rect.top) / distance);
    highWater = motion.matches ? 1 : Math.max(highWater, progress);
    var dt = previousTime ? Math.min(64, time - previousTime) : 16;
    previousTime = time;
    displayed += (highWater - displayed) * (1 - Math.exp(-dt / 65));
    if (Math.abs(highWater - displayed) < .0008) displayed = highWater;
    paint(displayed);
    if (Math.abs(highWater - displayed) > .0008 && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function schedule() { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); }
  addEventListener('scroll', function () {
    if (visible && displayed < 1) schedule();
  }, { passive: true });
  addEventListener('resize', function () { dirty = true; schedule(); }, { passive: true });
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', function () {
    track.classList.toggle('is-suspended', document.hidden);
    previousTime = 0;
    schedule();
  });
  document.addEventListener('bahasa-berubah', function () { dirty = true; schedule(); });
  motion.addEventListener('change', function () { dirty = true; schedule(); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { dirty = true; schedule(); }).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      track.classList.toggle('is-visible', visible);
      if (visible) schedule();
    }).observe(stage);
  } else { visible = true; track.classList.add('is-visible'); }
  measure();
  paint(motion.matches ? 1 : 0);
  schedule();
})();
