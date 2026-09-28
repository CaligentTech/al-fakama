function cubicBezier(t, P0, P1, P2, P3) {
    const x = Math.pow(1 - t, 3) * P0.x + 3 * Math.pow(1 - t, 2) * t * P1.x + 3 * (1 - t) * Math.pow(t, 2) * P2.x + Math.pow(t, 3) * P3.x;
    const y = Math.pow(1 - t, 3) * P0.y + 3 * Math.pow(1 - t, 2) * t * P1.y + 3 * (1 - t) * Math.pow(t, 2) * P2.y + Math.pow(t, 3) * P3.y;
    return { x, y };
}

const curves = [
    [{x:180, y:100}, {x:650, y:100}, {x:950, y:280}, {x:850, y:480}],
    [{x:850, y:480}, {x:750, y:680}, {x:200, y:680}, {x:250, y:880}],
    [{x:250, y:880}, {x:300, y:1080}, {x:750, y:1080}, {x:920, y:1080}]
];

const targetNodes = [
    {x:180, y:100}, // Node 1 (Curve 0, t=0)
    {x:870, y:260}, // Node 2 (approx Curve 0)
    {x:780, y:520}, // Node 3 (approx Curve 1)
    {x:220, y:720}, // Node 4 (approx Curve 1)
    {x:550, y:1080}, // Node 5 (approx Curve 2)
    {x:920, y:1080} // Node 6 (Curve 2, t=1)
];

for (let i = 0; i < targetNodes.length; i++) {
    const target = targetNodes[i];
    let minT = 0, minCurve = 0, minDist = Infinity, bestPoint = null;
    
    for (let c = 0; c < curves.length; c++) {
        for (let t = 0; t <= 1; t += 0.01) {
            const p = cubicBezier(t, curves[c][0], curves[c][1], curves[c][2], curves[c][3]);
            const dist = Math.hypot(p.x - target.x, p.y - target.y);
            if (dist < minDist) {
                minDist = dist;
                minT = t;
                minCurve = c;
                bestPoint = p;
            }
        }
    }
    console.log(`Node ${i+1}: Best curve ${minCurve}, t=${minT.toFixed(2)}, coords: x=${Math.round(bestPoint.x)}, y=${Math.round(bestPoint.y)}`);
}
