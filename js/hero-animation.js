document.addEventListener("DOMContentLoaded", () => {
    const perfStart = performance.now();
    const logPerf = (msg) => console.log(`[PERF] ${(performance.now() - perfStart).toFixed(2)}ms: ${msg}`);
    logPerf("Page/hero JS starts");

    const canvas = document.getElementById("hero-sequence-canvas");
    if (!canvas || typeof gsap === "undefined") return;

    const context = canvas.getContext("2d");
    const frameCount = 240;
    const currentFrame = index => (
        `assets/frames/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.webp`
    );

    const images = [];
    const seq = { frame: 0 };
    let hasStarted = false;
    let lastRenderedFrame = -1;
    let mainTimeline = null;
    let isBuffering = false;
    let waitingForFrame = -1;

    // Configurable progressive loading settings
    const isMobile = window.innerWidth <= 768;
    const INITIAL_BUFFER = isMobile ? 15 : 30; // Frames to priority-load before playing
    const CONCURRENT_LOADS = 50; // Increased drastically to allow HTTP/2 multiplexing!
    const RESUME_BUFFER = 5; // Buffer ahead before resuming from a pause
    let initialLoadedCount = 0;
    let nextToLoad = 0;

    // 1. Pre-populate the images array with empty Image objects
    for (let i = 0; i < frameCount; i++) {
        images.push(new Image());
    }

    // 2. Priority-load the first chunk of frames
    function loadInitialBuffer() {
        const bufferSize = Math.min(INITIAL_BUFFER, frameCount);
        logPerf(`First frame request starts (Requesting ${bufferSize} frames)`);
        for (let i = 0; i < bufferSize; i++) {
            const img = images[i];
            const reqStart = performance.now();
            
            img.onload = () => {
                const fetchTime = performance.now() - reqStart;
                logPerf(`Frame ${i} downloaded (Fetch: ${fetchTime.toFixed(2)}ms)`);
                
                initialLoadedCount++;
                // When critical startup frames are ready, launch the animation!
                if (initialLoadedCount === bufferSize && !hasStarted) {
                    logPerf(`Initial buffer (${bufferSize} frames) is READY`);
                    hasStarted = true;
                    // Safely set native canvas dimensions
                    if (images[0]) {
                        canvas.width = images[0].width;
                        canvas.height = images[0].height;
                    }
                    startAnimation();
                    startBackgroundLoader(); // Kick off the rest smoothly
                }
            };
            img.src = currentFrame(i);
        }
        nextToLoad = bufferSize;
    }

    // 3. Progressive/sliding background loader
    function checkBufferAndResume() {
        if (!isBuffering || waitingForFrame === -1) return;
        
        let framesToCheck = Math.min(waitingForFrame + RESUME_BUFFER, frameCount - 1);
        let allReady = true;
        for (let i = waitingForFrame; i <= framesToCheck; i++) {
            if (!images[i] || !images[i].complete) {
                allReady = false;
                break;
            }
        }
        
        if (allReady) {
            isBuffering = false;
            waitingForFrame = -1;
            if (mainTimeline) {
                mainTimeline.play();
            }
        }
    }

    function loadNext() {
        if (nextToLoad >= frameCount) return; // Done loading everything
        
        let index = nextToLoad++;
        const img = images[index];
        
        img.onload = () => {
            if (isBuffering) {
                checkBufferAndResume();
            }
            // As soon as this frame finishes, fetch the next one (sliding window)
            loadNext();
        };
        img.onerror = () => {
            // If a frame fails (network blip), still try to continue loading the next
            loadNext();
        }
        img.src = currentFrame(index);
    }

    function startBackgroundLoader() {
        // Fire off a limited number of concurrent background requests
        for (let i = 0; i < CONCURRENT_LOADS; i++) {
            loadNext();
        }
    }

    function startAnimation() {
        mainTimeline = gsap.timeline({
            delay: 0
        });

        // Animate sequence frames over 6 seconds
        mainTimeline.to(seq, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            duration: 6,
            onUpdate: render
        }, 0);
    }

    function render() {
        let targetFrame = Math.round(seq.frame);
        let actualFrame = targetFrame;

        // 4. Frame Buffering System
        if (!images[targetFrame] || !images[targetFrame].complete) {
            // The exact target frame hasn't downloaded yet. Pause timeline to buffer!
            if (mainTimeline && !isBuffering) {
                mainTimeline.pause();
                isBuffering = true;
                waitingForFrame = targetFrame;
            }
            
            // Fallback to the most recently available frame so the canvas never goes blank
            while (actualFrame >= 0 && (!images[actualFrame] || !images[actualFrame].complete)) {
                actualFrame--;
            }
        }

        // Only redraw if we actually have a valid frame and it's different from what's currently on the canvas
        if (actualFrame >= 0 && actualFrame !== lastRenderedFrame) {
            if (lastRenderedFrame === -1) {
                logPerf(`First canvas animation frame rendered (Frame ${actualFrame})`);
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[actualFrame], 0, 0, canvas.width, canvas.height);
            lastRenderedFrame = actualFrame;
        }
    }

    // Start the whole process
    loadInitialBuffer();

    // Ensure render happens on resize if needed
    window.addEventListener("resize", render);
});
