// SVG optimization for assets exported from Figma.
// Run: npm run svg  (optimizes every SVG in public/images in place)
export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      params: { overrides: { removeViewBox: false } },
    },
    // Figma adds these for its own preview; they would stretch the artwork
    { name: 'removeAttrs', params: { attrs: ['svg:preserveAspectRatio', 'svg:overflow', 'svg:style'] } },
  ],
};
