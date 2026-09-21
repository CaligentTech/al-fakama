document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("hero-sequence-canvas");
    if (!canvas || typeof gsap === "undefined") return;

    const context = canvas.getContext("2d");
    const frameCount = 240;
    const currentFrame = index => (
        `assets/frames/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
    );

    const images = [];
    const seq = { frame: 0 };

    let loadedCount = 0;

    let hasStarted = false;

    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            
            // As soon as the very first frame loads, set up the canvas and draw it
            if (i === 0) {
                canvas.width = images[0].width;
                canvas.height = images[0].height;
                render(); // Draw first frame immediately
            }

            // Start animation immediately upon loading the first frame
            if (!hasStarted && (loadedCount > 0 || loadedCount === frameCount)) {
                hasStarted = true;
                startAnimation();
            }
        };
        img.src = currentFrame(i);
        images.push(img);
    }

    function startAnimation() {
        const tl = gsap.timeline({
            delay: 0 // Start playing immediately
        });

        // 1. Animate sequence frames over 6 seconds
        tl.to(seq, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            duration: 6,
            onUpdate: render
        }, 0);
    }

    function render() {
        if (images[seq.frame] && images[seq.frame].complete) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[seq.frame], 0, 0, canvas.width, canvas.height);
        }
    }

    // Ensure render happens on resize if needed
    window.addEventListener("resize", render);
});
