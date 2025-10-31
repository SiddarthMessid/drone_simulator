/**
 * Generate Control Gain Sensitivity Analysis Graphs
 * Creates SVG visualizations using D3-like approach
 */

import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('gain-analysis-data.json', 'utf8'));

// SVG helper functions
function createSVG(width, height, title) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: bold 18px Arial; fill: #333; }
      .axis-label { font: 14px Arial; fill: #666; }
      .tick-label { font: 12px Arial; fill: #666; }
      .grid-line { stroke: #e0e0e0; stroke-width: 1; }
      .axis-line { stroke: #333; stroke-width: 2; }
      .legend-text { font: 12px Arial; fill: #333; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="30" class="title" text-anchor="middle">${title}</text>
`;
}

function closeSVG() {
    return '</svg>';
}

function drawAxes(x, y, width, height, xLabel, yLabel) {
    let svg = '';

    // X axis
    svg += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" class="axis-line"/>\n`;
    svg += `<text x="${x + width / 2}" y="${y + height + 40}" class="axis-label" text-anchor="middle">${xLabel}</text>\n`;

    // Y axis
    svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" class="axis-line"/>\n`;
    svg += `<text x="${x - 50}" y="${y + height / 2}" class="axis-label" text-anchor="middle" transform="rotate(-90, ${x - 50}, ${y + height / 2})">${yLabel}</text>\n`;

    return svg;
}

function drawGrid(x, y, width, height, xTicks, yTicks) {
    let svg = '';

    // Vertical grid lines
    for (let i = 0; i <= xTicks; i++) {
        const xPos = x + (width / xTicks) * i;
        svg += `<line x1="${xPos}" y1="${y}" x2="${xPos}" y2="${y + height}" class="grid-line"/>\n`;
    }

    // Horizontal grid lines
    for (let i = 0; i <= yTicks; i++) {
        const yPos = y + (height / yTicks) * i;
        svg += `<line x1="${x}" y1="${yPos}" x2="${x + width}" y2="${yPos}" class="grid-line"/>\n`;
    }

    return svg;
}

function drawLine(points, color, width = 2) {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }

    return `<path d="${path}" stroke="${color}" stroke-width="${width}" fill="none"/>\n`;
}

function drawLegend(x, y, items) {
    let svg = '';
    items.forEach((item, i) => {
        const yPos = y + i * 25;
        svg += `<line x1="${x}" y1="${yPos}" x2="${x + 30}" y2="${yPos}" stroke="${item.color}" stroke-width="3"/>\n`;
        svg += `<text x="${x + 40}" y="${yPos + 5}" class="legend-text">${item.label}</text>\n`;
    });
    return svg;
}

// Generate Kp Sensitivity Graph
function generateKpGraph() {
    const width = 1000;
    const height = 600;
    const margin = { top: 60, right: 150, bottom: 80, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    let svg = createSVG(width, height, 'Proportional Gain (Kp) Sensitivity Analysis');

    // Draw grid and axes
    svg += drawGrid(margin.left, margin.top, plotWidth, plotHeight, 10, 10);
    svg += drawAxes(margin.left, margin.top, plotWidth, plotHeight, 'Kp Value', 'Metric Value');

    // Scale data
    const kpValues = data.kp.map(d => d.kp);
    const kpMin = Math.min(...kpValues);
    const kpMax = Math.max(...kpValues);

    const scaleX = (kp) => margin.left + ((kp - kpMin) / (kpMax - kpMin)) * plotWidth;

    // Plot Rise Time
    const riseTimeMax = Math.max(...data.kp.map(d => d.riseTime));
    const scaleRiseTime = (val) => margin.top + plotHeight - (val / riseTimeMax) * plotHeight;
    const riseTimePoints = data.kp.map(d => ({ x: scaleX(d.kp), y: scaleRiseTime(d.riseTime) }));
    svg += drawLine(riseTimePoints, '#2196F3', 3);

    // Plot Overshoot
    const overshootMax = Math.max(...data.kp.map(d => d.overshoot));
    const scaleOvershoot = (val) => margin.top + plotHeight - (val / overshootMax) * plotHeight;
    const overshootPoints = data.kp.map(d => ({ x: scaleX(d.kp), y: scaleOvershoot(d.overshoot) }));
    svg += drawLine(overshootPoints, '#F44336', 3);

    // Plot Settling Time (normalized)
    const settlingMax = 10.0;
    const scaleSettling = (val) => margin.top + plotHeight - (val / settlingMax) * plotHeight;
    const settlingPoints = data.kp.map(d => ({ x: scaleX(d.kp), y: scaleSettling(d.settlingTime) }));
    svg += drawLine(settlingPoints, '#4CAF50', 3);

    // X-axis labels
    kpValues.forEach((kp, i) => {
        const x = scaleX(kp);
        svg += `<text x="${x}" y="${margin.top + plotHeight + 20}" class="tick-label" text-anchor="middle">${kp.toFixed(1)}</text>\n`;
    });

    // Y-axis labels
    for (let i = 0; i <= 10; i++) {
        const y = margin.top + (plotHeight / 10) * i;
        const val = (10 - i);
        svg += `<text x="${margin.left - 10}" y="${y + 5}" class="tick-label" text-anchor="end">${val}</text>\n`;
    }

    // Legend
    svg += drawLegend(width - margin.right + 20, margin.top + 50, [
        { color: '#2196F3', label: 'Rise Time (s)' },
        { color: '#F44336', label: 'Overshoot (%)' },
        { color: '#4CAF50', label: 'Settling Time (s)' }
    ]);

    // Optimal zone indicator
    svg += `<rect x="${scaleX(0.3)}" y="${margin.top}" width="${scaleX(0.5) - scaleX(0.3)}" height="${plotHeight}" fill="#90EE90" opacity="0.2"/>\n`;
    svg += `<text x="${scaleX(0.4)}" y="${margin.top - 10}" class="legend-text" text-anchor="middle">Optimal Range</text>\n`;

    svg += closeSVG();
    writeFileSync('gain-sensitivity-kp.svg', svg);
    console.log('✓ Generated gain-sensitivity-kp.svg');
}

// Generate Kd Sensitivity Graph
function generateKdGraph() {
    const width = 1000;
    const height = 600;
    const margin = { top: 60, right: 150, bottom: 80, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    let svg = createSVG(width, height, 'Derivative Gain (Kd) Sensitivity Analysis');

    svg += drawGrid(margin.left, margin.top, plotWidth, plotHeight, 10, 10);
    svg += drawAxes(margin.left, margin.top, plotWidth, plotHeight, 'Kd Value', 'Metric Value');

    const kdValues = data.kd.map(d => d.kd);
    const kdMin = Math.min(...kdValues);
    const kdMax = Math.max(...kdValues);

    const scaleX = (kd) => margin.left + ((kd - kdMin) / (kdMax - kdMin)) * plotWidth;

    // Plot Overshoot (primary metric for Kd)
    const overshootMax = Math.max(...data.kd.map(d => d.overshoot));
    const scaleOvershoot = (val) => margin.top + plotHeight - (val / overshootMax) * plotHeight;
    const overshootPoints = data.kd.map(d => ({ x: scaleX(d.kd), y: scaleOvershoot(d.overshoot) }));
    svg += drawLine(overshootPoints, '#F44336', 3);

    // Plot Rise Time
    const riseTimeMax = Math.max(...data.kd.map(d => d.riseTime));
    const scaleRiseTime = (val) => margin.top + plotHeight - (val / riseTimeMax) * plotHeight;
    const riseTimePoints = data.kd.map(d => ({ x: scaleX(d.kd), y: scaleRiseTime(d.riseTime) }));
    svg += drawLine(riseTimePoints, '#2196F3', 3);

    // Plot Steady-State Error
    const ssErrorMax = Math.max(...data.kd.map(d => d.steadyStateError));
    const scaleSSError = (val) => margin.top + plotHeight - (val / ssErrorMax) * plotHeight;
    const ssErrorPoints = data.kd.map(d => ({ x: scaleX(d.kd), y: scaleSSError(d.steadyStateError) }));
    svg += drawLine(ssErrorPoints, '#FF9800', 3);

    // X-axis labels
    kdValues.forEach((kd, i) => {
        const x = scaleX(kd);
        svg += `<text x="${x}" y="${margin.top + plotHeight + 20}" class="tick-label" text-anchor="middle">${kd.toFixed(1)}</text>\n`;
    });

    // Y-axis labels
    for (let i = 0; i <= 10; i++) {
        const y = margin.top + (plotHeight / 10) * i;
        const val = (10 - i);
        svg += `<text x="${margin.left - 10}" y="${y + 5}" class="tick-label" text-anchor="end">${val}</text>\n`;
    }

    svg += drawLegend(width - margin.right + 20, margin.top + 50, [
        { color: '#F44336', label: 'Overshoot (%)' },
        { color: '#2196F3', label: 'Rise Time (s)' },
        { color: '#FF9800', label: 'SS Error' }
    ]);

    // Optimal zone
    svg += `<rect x="${scaleX(0.3)}" y="${margin.top}" width="${scaleX(0.7) - scaleX(0.3)}" height="${plotHeight}" fill="#90EE90" opacity="0.2"/>\n`;
    svg += `<text x="${scaleX(0.5)}" y="${margin.top - 10}" class="legend-text" text-anchor="middle">Optimal Range</text>\n`;

    svg += closeSVG();
    writeFileSync('gain-sensitivity-kd.svg', svg);
    console.log('✓ Generated gain-sensitivity-kd.svg');
}

// Generate Combined Comparison Graph
function generateComparisonGraph() {
    const width = 1200;
    const height = 800;
    const margin = { top: 60, right: 50, bottom: 80, left: 80 };

    let svg = createSVG(width, height, 'PID Gain Effects Comparison');

    // Create 3 subplots
    const plotHeight = (height - margin.top - margin.bottom - 40) / 3;
    const plotWidth = width - margin.left - margin.right;

    // Subplot 1: Kp Effect on Overshoot
    const y1 = margin.top;
    svg += `<text x="${margin.left + plotWidth / 2}" y="${y1 - 10}" class="axis-label" text-anchor="middle">Kp Effect on Overshoot</text>\n`;
    svg += drawGrid(margin.left, y1, plotWidth, plotHeight, 8, 5);
    svg += drawAxes(margin.left, y1, plotWidth, plotHeight, 'Kp', 'Overshoot (%)');

    const kpValues = data.kp.map(d => d.kp);
    const scaleKpX = (kp) => margin.left + ((kp - 0.1) / 0.9) * plotWidth;
    const overshootMax1 = 60;
    const scaleKpY = (val) => y1 + plotHeight - (val / overshootMax1) * plotHeight;
    const kpOvershootPoints = data.kp.map(d => ({ x: scaleKpX(d.kp), y: scaleKpY(d.overshoot) }));
    svg += drawLine(kpOvershootPoints, '#F44336', 3);

    // Subplot 2: Kd Effect on Overshoot
    const y2 = y1 + plotHeight + 20;
    svg += `<text x="${margin.left + plotWidth / 2}" y="${y2 - 10}" class="axis-label" text-anchor="middle">Kd Effect on Overshoot</text>\n`;
    svg += drawGrid(margin.left, y2, plotWidth, plotHeight, 8, 5);
    svg += drawAxes(margin.left, y2, plotWidth, plotHeight, 'Kd', 'Overshoot (%)');

    const kdValues = data.kd.map(d => d.kd);
    const scaleKdX = (kd) => margin.left + (kd / 1.5) * plotWidth;
    const scaleKdY = (val) => y2 + plotHeight - (val / overshootMax1) * plotHeight;
    const kdOvershootPoints = data.kd.map(d => ({ x: scaleKdX(d.kd), y: scaleKdY(d.overshoot) }));
    svg += drawLine(kdOvershootPoints, '#2196F3', 3);

    // Subplot 3: Ki Effect on Overshoot
    const y3 = y2 + plotHeight + 20;
    svg += `<text x="${margin.left + plotWidth / 2}" y="${y3 - 10}" class="axis-label" text-anchor="middle">Ki Effect on Overshoot</text>\n`;
    svg += drawGrid(margin.left, y3, plotWidth, plotHeight, 8, 5);
    svg += drawAxes(margin.left, y3, plotWidth, plotHeight, 'Ki', 'Overshoot (%)');

    const kiValues = data.ki.map(d => d.ki);
    const scaleKiX = (ki) => margin.left + (ki / 0.2) * plotWidth;
    const overshootMax3 = 100;
    const scaleKiY = (val) => y3 + plotHeight - (val / overshootMax3) * plotHeight;
    const kiOvershootPoints = data.ki.map(d => ({ x: scaleKiX(d.ki), y: scaleKiY(d.overshoot) }));
    svg += drawLine(kiOvershootPoints, '#4CAF50', 3);

    svg += closeSVG();
    writeFileSync('gain-sensitivity-comparison.svg', svg);
    console.log('✓ Generated gain-sensitivity-comparison.svg');
}

// Generate all graphs
console.log('\nGenerating sensitivity analysis graphs...\n');
generateKpGraph();
generateKdGraph();
generateComparisonGraph();
console.log('\n✓ All graphs generated successfully!');
console.log('\nGenerated files:');
console.log('  - gain-sensitivity-kp.svg');
console.log('  - gain-sensitivity-kd.svg');
console.log('  - gain-sensitivity-comparison.svg');
