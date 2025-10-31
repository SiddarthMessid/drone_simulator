import { instance } from '@viz-js/viz';
import { readFileSync, writeFileSync } from 'fs';

async function generateDiagram() {
    try {
        const viz = await instance();
        const dotSource = readFileSync('architecture.dot', 'utf8');

        // Generate SVG - viz.render returns a string directly
        const svg = viz.renderString(dotSource);
        writeFileSync('architecture-diagram.svg', svg);
        console.log('✓ Generated architecture-diagram.svg');

    } catch (error) {
        console.error('Error generating diagram:', error);
        process.exit(1);
    }
}

generateDiagram();
