const imageModules = import.meta.glob('../images/*.{jpg,jpeg,png,gif,webp}', {
  eager: true,
  as: 'url',
});

export const imageAssets = Object.entries(imageModules)
  .map(([path, url]) => {
    const filename = path.split('/').pop();
    return { filename, url };
  })
  .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' }));
