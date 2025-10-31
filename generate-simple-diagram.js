import { instance } from '@viz-js/viz';
import { readFileSync, writeFileSync } from 'fs';

async function generateDiagram() {
    try {
        const viz = await instance();
        const dotSource = readFileSync('architecture-simple.dot', 'utf8');

        // Generate SVG
        const svg = viz.renderString(dotSource);
        writeFileSync('architecture-simple.svg', svg);
        console.log('✓ Generated architecture-simple.svg');

    } catch (error) {
        console.error('Error generating diagram:', error);
        process.exit(1);
    }
}

generateDiagram();
