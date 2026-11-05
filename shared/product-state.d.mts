export type ProductStatus = '草稿' | '在售' | '下架' | '归档';
export interface ProductTransition {
  action: string;
  label: string;
  from: ProductStatus[];
  to: ProductStatus;
  tone: string;
  requiresReason: boolean;
  validatesProduct: boolean;
}
export const PRODUCT_STATUSES: ProductStatus[];
export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; tone: string; description: string }>;
export const PRODUCT_TRANSITIONS: ProductTransition[];
export const PRODUCT_TRANSITION_BY_ACTION: Record<string, ProductTransition>;
export function productTransitionsFrom(status: string): ProductTransition[];
export function productTransitionFor(status: string, action: string): ProductTransition | null;
export function productTransitionLabel(from: string, to: string): string;
