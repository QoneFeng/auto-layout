export interface ProductCategory { id: string; label: string; category1: string; family: string; kind: string; legacyKeys: string[]; surfaces: string[]; unit: string }
export interface ProductAsset { id: string; name: string; mime: string; size: number; role: string; url: string; sha256?: string }
export interface ProductRecord {
  id?: string; revision?: number; updatedAt?: string; createdAt?: string; productFamily?: string; category?: string; price?: number | null;
  sku: string; name: string; categoryId: string; brand: string; model: string; series: string; description: string; tags: string[];
  status: string; recommended: boolean; sortOrder: number; internalNote: string; retailPrice: number | null; salePrice: number | null; costPrice: number | null;
  salesUnit: string; quantityMode: string; minOrderQty: number; orderStep: number; standardLengthMm: number | null; packQuantity: number | null;
  canPlace: boolean; canPrice: boolean; communicationProtocols: string[]; ecosystems: string[]; dimmingInterfaces: string[];
  gatewayRequirement: string; compatibilityNote: string; compatibilityStatus: string; controlFunctions: string[]; spaceCodes: string[];
  mountMethods: string[]; mountSurfaces: string[]; widthMm: number | null; depthMm: number | null; heightMm: number | null; diameterMm: number | null;
  cutoutMm: number | null; recessDepthMm: number | null; installationNote: string; geometryStatus: string; supportedRouteShapes: string[]; applications: string[];
  interfaceSeries: string; specificationNote: string; specs: Record<string, number | string | boolean | null>; parameterStatus: string; photometryStatus: string;
  geometryEvidence: string; compatibilityEvidence: string; parameterEvidence: string; source: string; isSimulated: boolean; assets: ProductAsset[];
}
export const STATUSES: string[]; export const UNITS: string[]; export const PROTOCOLS: string[]; export const ECOSYSTEMS: string[]; export const DIMMING: string[];
export const DATA_STATES: {label: string; value: string}[]; export const SURFACES: {label: string; value: string}[]; export const MOUNT_METHODS: string[]; export const ROUTES: {label: string; value: string}[];
export function blankProduct(): ProductRecord;
export function productIssues(p: ProductRecord, categories: ProductCategory[]): Record<string, string>;
export function specificationFields(kind: string): {key: string; label: string; unit: string; max: number}[];
export function categoryKind(category1: string, family: string): string;
