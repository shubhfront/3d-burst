/* =====================================================
   KeyVault — Scroll-Driven Frame Animation with Three.js
   ===================================================== */

(() => {
    'use strict';

    // ---- Configuration ----
    const TOTAL_FRAMES = 192;
    const FRAME_PATH = (i) => `frames/output_${String(i).padStart(4, '0')}.png`;

    // ---- DOM Elements ----
    const canvas = document.getElementById('three-canvas');
    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const frameCounter = document.getElementById('frame-counter');
    const frameCurrent = document.querySelector('.frame-current');
    const progressBar = document.getElementById('scroll-progress-bar');
    const navbar = document.getElementById('main-nav');
    const heroSection = document.getElementById('hero');

    // ---- Three.js Setup ----
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        -1, 1, 1, -1, 0.1, 10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ---- Create Plane Geometry for Frame Display ----
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        depthWrite: false
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // ---- Frame Loading ----
    const textureLoader = new THREE.TextureLoader();
    const frames = new Array(TOTAL_FRAMES);
    let loadedCount = 0;
    let currentFrame = 0;
    let targetFrame = 0;
    let isLoading = true;

    // Loading indicator
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loader-content">
            <div class="loader-ring"></div>
            <div class="loader-text">LOADING EXPERIENCE</div>
            <div class="loader-progress">0%</div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Add loading styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        #loading-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #0d0c1c;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.8s ease, visibility 0.8s ease;
        }
        #loading-overlay.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        .loader-ring {
            width: 48px;
            height: 48px;
            border: 2px solid rgba(138, 76, 252, 0.15);
            border-top-color: #bd9dff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .loader-text {
            font-family: 'Inter', sans-serif;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.25em;
            color: #aca8bf;
        }
        .loader-progress {
            font-family: 'Inter', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            color: #bd9dff;
            letter-spacing: 0.05em;
        }
    `;
    document.head.appendChild(loadingStyles);

    const loaderProgress = loadingOverlay.querySelector('.loader-progress');

    // Load frames in priority order: first, last, then fill in
    function loadFrame(index) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                frames[index] = texture;
                loadedCount++;
                const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
                if (loaderProgress) loaderProgress.textContent = `${pct}%`;
                resolve();
            };
            img.onerror = () => {
                loadedCount++;
                resolve();
            };
            img.src = FRAME_PATH(index + 1);
        });
    }

    async function loadAllFrames() {
        // Load first frame immediately
        await loadFrame(0);
        if (frames[0]) {
            material.map = frames[0];
            material.needsUpdate = true;
            updatePlaneScale(frames[0]);
        }

        // Load remaining frames in batches
        const batchSize = 8;
        const remaining = [];
        for (let i = 1; i < TOTAL_FRAMES; i++) {
            remaining.push(i);
        }

        for (let i = 0; i < remaining.length; i += batchSize) {
            const batch = remaining.slice(i, i + batchSize);
            await Promise.all(batch.map(idx => loadFrame(idx)));
        }

        isLoading = false;
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
            loadingOverlay.remove();
        }, 1000);
    }

    // ---- Scale plane to COVER screen (no stretch), anchored from top ----
    function updatePlaneScale(texture) {
        if (!texture || !texture.image) return;

        const imgAspect = texture.image.width / texture.image.height;
        const screenAspect = window.innerWidth / window.innerHeight;

        if (screenAspect > imgAspect) {
            // Viewport is wider than image: fill width, overflow height downward
            const scaleY = screenAspect / imgAspect;
            plane.scale.set(1, scaleY, 1);
            // Anchor to top: shift plane so top edge sits at y=1 (top of viewport)
            plane.position.set(0, 1 - scaleY, 0);
        } else {
            // Viewport is taller than image: fill height, center horizontally
            const scaleX = imgAspect / screenAspect;
            plane.scale.set(scaleX, 1, 1);
            plane.position.set(0, 0, 0);
        }
    }

    // ---- Scroll Handler ----
    function getScrollProgress() {
        const heroHeight = heroSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        const scrollableDistance = heroHeight - viewportHeight;
        
        if (scrollableDistance <= 0) return 0;
        return Math.max(0, Math.min(1, scrollTop / scrollableDistance));
    }

    function onScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const totalProgress = scrollTop / docHeight;
        progressBar.style.width = `${totalProgress * 100}%`;

        // Frame animation within hero
        const heroProgress = getScrollProgress();
        targetFrame = Math.round(heroProgress * (TOTAL_FRAMES - 1));

        // Update frame counter
        const displayFrame = Math.min(targetFrame + 1, TOTAL_FRAMES);
        frameCurrent.textContent = String(displayFrame).padStart(3, '0');

        // Fade hero content after small scroll
        if (scrollTop > 100) {
            heroContent.classList.add('faded');
            scrollIndicator.classList.add('hidden');
        } else {
            heroContent.classList.remove('faded');
            scrollIndicator.classList.remove('hidden');
        }

        // Navbar style on scroll
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide fixed elements when past hero
        const heroBottom = heroSection.offsetHeight;
        if (scrollTop > heroBottom - window.innerHeight * 0.5) {
            canvas.style.opacity = '0';
            frameCounter.classList.add('hidden');
        } else {
            canvas.style.opacity = '1';
            frameCounter.classList.remove('hidden');
        }
    }

    // ---- Smooth Frame Interpolation ----
    function animate() {
        requestAnimationFrame(animate);

        // Lerp current frame toward target
        currentFrame += (targetFrame - currentFrame) * 0.15;
        const displayIdx = Math.round(currentFrame);

        if (frames[displayIdx] && material.map !== frames[displayIdx]) {
            material.map = frames[displayIdx];
            material.needsUpdate = true;
            updatePlaneScale(frames[displayIdx]);
        }

        renderer.render(scene, camera);
    }

    // ---- Resize Handler ----
    function onResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (material.map) {
            updatePlaneScale(material.map);
        }
    }

    // ---- Scroll Reveal (Intersection Observer) ----
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
        });

        document.querySelectorAll('.feature-card, .spec-item, .gallery-item').forEach((el, i) => {
            el.style.transitionDelay = `${i % 3 * 0.1}s`;
            observer.observe(el);
        });
    }

    // ---- Smooth Scroll for Nav Links ----
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // ---- Canvas Transition ----
    const canvasTransitionStyle = document.createElement('style');
    canvasTransitionStyle.textContent = `
        #three-canvas {
            transition: opacity 0.6s ease;
        }
    `;
    document.head.appendChild(canvasTransitionStyle);

    // ---- Initialize ----
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    animate();
    loadAllFrames();
    initScrollReveal();
    initSmoothScroll();
    onScroll(); // Initial state
})();
