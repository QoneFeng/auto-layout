import { describe, expect, it } from 'vitest';
import { listPlatformProducts, platformProductDraft } from './platform-catalog.mjs';

describe('offline platform product catalog', () => {
  it('exposes a read-only offline mirror with category and platform filters', () => {
    const all = listPlatformProducts({ page:1, pageSize:100 });
    expect(all.catalogVersion).toBe('2026.11-offline');
    expect(all.total).toBeGreaterThanOrEqual(10);
    expect(all.products.every(item => item.isSimulated && item.status === '平台参考')).toBe(true);
    const selected = all.products[0];
    expect(listPlatformProducts({ category:selected.categoryId }).products.every(item => item.categoryId === selected.categoryId)).toBe(true);
    expect(listPlatformProducts({ ecosystem:selected.ecosystems[0] }).products.length).toBeGreaterThan(0);
  });

  it('copies a platform item as a reviewable store draft instead of auto-listing it', () => {
    const source = listPlatformProducts({ page:1, pageSize:1 }).products[0];
    const draft = platformProductDraft(source.id);
    expect(draft).toMatchObject({ name:source.name, status:'草稿', isSimulated:true });
    expect(draft.sku).not.toBe(source.sku);
    expect(draft.internalNote).toContain('审核后方可上架');
  });
});

