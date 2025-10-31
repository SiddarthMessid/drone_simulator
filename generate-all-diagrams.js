import { instance } from '@viz-js/viz';
import { readFileSync, writeFileSync } from 'fs';

async function generateDiagrams() {
    try {
        const viz = await instance();

        const diagrams = [
            { input: 'architecture.dot', output: 'architecture-diagram.svg', name: 'Detailed' },
            { input: 'architecture-simple.dot', output: 'architecture-simple.svg', name: 'Simple' },
            { input: 'architecture-horizontal.dot', output: 'architecture-horizontal.svg', name: 'Horizontal' }
        ];

        for (const diagram of diagrams) {
            const dotSource = readFileSync(diagram.input, 'utf8');
            const svg = viz.renderString(dotSource);
            writeFileSync(diagram.output, svg);
            console.log(`✓ Generated ${diagram.output} (${diagram.name} layout)`);
        }

        console.log('\nAll architecture diagrams generated successfully!');
        console.log('View them in your browser or any SVG viewer.');

    } catch (error) {
        console.error('Error generating diagrams:', error);
        process.exit(1);
    }
}

generateDiagrams();
