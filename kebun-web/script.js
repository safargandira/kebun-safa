// Flipbook "Bunga di Kebun": setiap halaman adalah satu lembar yang berengsel di sisi kiri.
(() => {
  const book = document.getElementById('book');
  const leaves = [...book.querySelectorAll('.leaf')];
  const N = leaves.length;
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const status = document.getElementById('status');
  const pager = document.getElementById('pager');
  let cur = 0; // jumlah lembar yang sudah dibalik = indeks halaman yang tampil

  // titik navigasi
  const dots = leaves.map((_, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ke halaman ${i + 1}`);
    b.addEventListener('click', () => go(i));
    li.append(b);
    pager.append(li);
    return b;
  });

  const restZ = (i) => (i < cur ? i : N - i);

  function render() {
    let k = 0;
    leaves.forEach((leaf, i) => {
      const flipped = i < cur;
      if (leaf.classList.contains('flipped') !== flipped) {
        leaf.style.setProperty('--d', `${k++ * 70}ms`); // balik beruntun saat lompat halaman
        leaf.style.zIndex = N + 1;
        leaf.classList.toggle('flipped', flipped);
      }
      leaf.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
    });
    dots.forEach((d, i) => d.setAttribute('aria-current', i === cur ? 'true' : 'false'));
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === N - 1;
    status.textContent = `Halaman ${cur + 1} dari ${N}`;
  }

  function go(n) {
    cur = Math.max(0, Math.min(N - 1, n));
    render();
  }

  // setelah animasi selesai, kembalikan urutan tumpukan
  leaves.forEach((leaf, i) => {
    leaf.addEventListener('transitionend', (e) => {
      if (e.target !== leaf || e.propertyName !== 'transform') return;
      leaf.style.zIndex = restZ(i);
      leaf.style.removeProperty('--d');
    });
    leaf.style.zIndex = restZ(i);
  });

  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => go(cur + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') go(cur + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(cur - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
    else return;
    e.preventDefault();
  });

  // ---- geser (drag/swipe) dan ketuk ----
  let drag = null;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  book.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    drag = { x: e.clientX, t: performance.now(), leaf: null };
  });

  book.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.leaf) {
      if (Math.abs(dx) < 8) return;
      drag.dir = dx < 0 ? 1 : -1; // geser ke kiri = maju
      drag.idx = drag.dir > 0 ? cur : cur - 1;
      if (drag.idx < 0 || drag.idx >= N) { drag = null; return; }
      drag.leaf = leaves[drag.idx];
      book.setPointerCapture(e.pointerId);
      Object.assign(drag.leaf.style, { transition: 'none', zIndex: N + 1, visibility: 'visible' });
    }
    const w = book.clientWidth * 0.9;
    drag.p = drag.dir > 0 ? clamp(-dx / w) : clamp(1 - dx / w);
    drag.leaf.style.transform = `rotateY(${-180 * drag.p}deg)`;
  });

  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.leaf) { // ketuk: separuh kiri = mundur, sisanya = maju
      const r = book.getBoundingClientRect();
      go(e.clientX - r.left < r.width * 0.35 ? cur - 1 : cur + 1);
      return;
    }
    const fast = Math.abs(e.clientX - d.x) / (performance.now() - d.t) > 0.5; // px/ms
    const done = fast || (d.dir > 0 ? d.p > 0.25 : d.p < 0.75);
    d.leaf.style.transition = '';
    d.leaf.style.transform = '';
    d.leaf.style.visibility = '';
    if (done) cur += d.dir;
    // pastikan kelas sesuai, lalu animasi lanjut dari sudut terakhir
    leaves.forEach((l, i) => l.classList.toggle('flipped', i < cur));
    leaves.forEach((l, i) => { if (l === d.leaf) l.style.zIndex = N + 1; });
    render();
  }
  book.addEventListener('pointerup', endDrag);
  book.addEventListener('pointercancel', () => {
    if (!drag) return;
    if (drag.leaf) { drag.leaf.style.cssText = ''; drag.leaf.style.zIndex = restZ(drag.idx); }
    drag = null;
  });

  render();
})();
