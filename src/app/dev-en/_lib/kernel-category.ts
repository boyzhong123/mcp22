export type KernelCategoryLabel = {
  en: string;
  zh: string;
};

/**
 * Prefer the server-provided category. Older API versions do not return one,
 * so keep the points-per-request mapping as a backwards-compatible fallback.
 */
export function kernelCategoryLabel(
  category: string | null | undefined,
  pointsPerRequest: number,
): KernelCategoryLabel {
  const serverCategory = category?.trim();
  if (serverCategory) return { en: serverCategory, zh: serverCategory };

  if (pointsPerRequest === 1) {
    return { en: 'Words / phrases / sentences', zh: '字词句' };
  }
  if (pointsPerRequest === 2) {
    return { en: 'Paragraph', zh: '段落' };
  }
  return { en: 'Unassigned', zh: '待归类' };
}
