document.addEventListener("DOMContentLoaded", () => {
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

    // Configurable progressive loading settings
    const INITIAL_BUFFER = 30; // Frames to priority-load before playing
    const CONCURRENT_LOADS = 5; // Sliding window size for background loading
    let initialLoadedCount = 0;
    let nextToLoad = 0;

    // 1. Pre-populate the images array with empty Image objects
    for (let i = 0; i < frameCount; i++) {
        images.push(new Image());
    }

    // 2. Priority-load the first chunk of frames
    function loadInitialBuffer() {
        const bufferSize = Math.min(INITIAL_BUFFER, frameCount);
        for (let i = 0; i < bufferSize; i++) {
            const img = images[i];
            img.onload = () => {
                initialLoadedCount++;
                // When critical startup frames are ready, launch the animation!
                if (initialLoadedCount === bufferSize && !hasStarted) {
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
    function loadNext() {
        if (nextToLoad >= frameCount) return; // Done loading everything
        
        let index = nextToLoad++;
        const img = images[index];
        
        img.onload = () => {
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
        const tl = gsap.timeline({
            delay: 0
        });

        // Animate sequence frames over 6 seconds
        tl.to(seq, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            duration: 6,
            onUpdate: render
        }, 0);
    }

    function render() {
        let targetFrame = Math.round(seq.frame);

        // 4. Fallback rendering: If the exact target frame hasn't downloaded yet, 
        // fallback to the most recently available frame so the canvas never goes blank.
        while (targetFrame >= 0 && (!images[targetFrame] || !images[targetFrame].complete)) {
            targetFrame--;
        }

        // Only redraw if we actually have a valid frame and it's different from what's currently on the canvas
        if (targetFrame >= 0 && targetFrame !== lastRenderedFrame) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[targetFrame], 0, 0, canvas.width, canvas.height);
            lastRenderedFrame = targetFrame;
        }
    }

    // Start the whole process
    loadInitialBuffer();

    // Ensure render happens on resize if needed
    window.addEventListener("resize", render);
});
