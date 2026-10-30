/* Shared click-to-play wiring for .bfx-video-facade (guards double-wire). */
(function () {
    function wire(el) {
        if (!el || el.dataset.wired) return;
        el.dataset.wired = '1';
        el.addEventListener('click', function () {
            if (el.classList.contains('playing')) return;
            var src = el.getAttribute('data-src');
            if (!src) return;
            var v = document.createElement('video');
            v.src = src; v.controls = true; v.setAttribute('playsinline', ''); v.playsInline = true; v.preload = 'auto';
            v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;border:0';
            v.onerror = function () {
                el.classList.remove('playing');
                el.innerHTML = '<span class="bfx-cap" style="padding:0 22px;text-align:center;line-height:1.5">Testimonial coming soon.</span>';
            };
            el.innerHTML = ''; el.appendChild(v); el.classList.add('playing');
            var p = v.play(); if (p && p.catch) p.catch(function () {});
        });
    }
    function init() { document.querySelectorAll('.bfx-video-facade').forEach(wire); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
