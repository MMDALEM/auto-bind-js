const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Clean
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Copy files
const files = [
  ['src/index.mjs', 'dist/index.mjs'],
  ['src/index.cjs', 'dist/index.cjs'],
  ['src/index.d.ts', 'dist/index.d.ts'],
];

for (const [src, dest] of files) {
  fs.copyFileSync(path.join(__dirname, src), path.join(__dirname, dest));
  console.log(`✓ ${src} → ${dest}`);
}

// Create react entry points (re-export autoBindReact as default)
const reactMjs = `export { autoBindReact as default, autoBindReact } from './index.mjs';\n`;
fs.writeFileSync(path.join(distDir, 'react.mjs'), reactMjs);

const reactCjs = `'use strict';\nconst { autoBindReact } = require('./index.cjs');\nmodule.exports = autoBindReact;\nmodule.exports.default = autoBindReact;\nmodule.exports.autoBindReact = autoBindReact;\n`;
fs.writeFileSync(path.join(distDir, 'react.cjs'), reactCjs);

const reactDts = `import { AutoBindOptions } from './index';\ndeclare function autoBindReact<T extends object>(self: T, options?: AutoBindOptions): T;\nexport default autoBindReact;\nexport { autoBindReact };\n`;
fs.writeFileSync(path.join(distDir, 'react.d.ts'), reactDts);

// Create decorator entry points
const decoratorMjs = `export { boundClass, bound, boundClass as default } from './index.mjs';\n`;
fs.writeFileSync(path.join(distDir, 'decorator.mjs'), decoratorMjs);

const decoratorCjs = `'use strict';\nconst { boundClass, bound } = require('./index.cjs');\nmodule.exports = boundClass;\nmodule.exports.default = boundClass;\nmodule.exports.boundClass = boundClass;\nmodule.exports.bound = bound;\n`;
fs.writeFileSync(path.join(distDir, 'decorator.cjs'), decoratorCjs);

const decoratorDts = `export { boundClass, bound, boundClass as default } from './index';\n`;
fs.writeFileSync(path.join(distDir, 'decorator.d.ts'), decoratorDts);

console.log('\\n✅ Build complete!');
