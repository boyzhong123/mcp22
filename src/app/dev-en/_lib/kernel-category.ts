export type KernelCategoryLabel = {
  en: string;
  zh: string;
};

/** Render only Catalog-provided category metadata. Never infer business
 * category from the current point price. */
export function kernelCategoryLabel(
  categoryCode: string | null | undefined,
  categoryName?: string | null,
): KernelCategoryLabel {
  const code = categoryCode?.trim();
  const name = categoryName?.trim();
  if (code || name) {
    const english = code
      ? code.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      : name!;
    return { en: english, zh: name || code! };
  }
  return { en: 'Unassigned', zh: '待归类' };
}
