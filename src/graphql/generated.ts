/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: unknown; output: unknown; }
};

/** Type of stock adjustment */
export const AdjustmentType = {
  In: 'IN',
  Out: 'OUT'
} as const;

export type AdjustmentType = typeof AdjustmentType[keyof typeof AdjustmentType];
export type AuthResponse = {
  __typename?: 'AuthResponse';
  accessToken: Scalars['String']['output'];
  user: UserResponse;
};

export type CashSummary = {
  __typename?: 'CashSummary';
  byMethod: Array<PaymentMethodSummary>;
  cashTotal: Scalars['Float']['output'];
  nonCashTotal: Scalars['Float']['output'];
};

export type CashierShiftEntity = {
  __typename?: 'CashierShiftEntity';
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  closedByUserId?: Maybe<Scalars['ID']['output']>;
  closedByUserName?: Maybe<Scalars['String']['output']>;
  countedCash?: Maybe<Scalars['Float']['output']>;
  expectedCash: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  openedAt: Scalars['DateTime']['output'];
  openedByUserId: Scalars['ID']['output'];
  openedByUserName: Scalars['String']['output'];
  openingCash: Scalars['Float']['output'];
  status: CashierShiftStatus;
  variance?: Maybe<Scalars['Float']['output']>;
};

export type CashierShiftFilterInput = {
  locationId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<CashierShiftStatus>;
};

/** Status of cashier shift */
export const CashierShiftStatus = {
  Closed: 'CLOSED',
  Open: 'OPEN'
} as const;

export type CashierShiftStatus = typeof CashierShiftStatus[keyof typeof CashierShiftStatus];
export type CloseCashierShiftInput = {
  countedCash: Scalars['Float']['input'];
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type CreateLocationInput = {
  name: Scalars['String']['input'];
  type: LocationType;
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  lastCostPrice?: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  sellingPrice: Scalars['Float']['input'];
  sku?: InputMaybe<Scalars['String']['input']>;
  type?: ProductType;
};

export type CreatePromotionInput = {
  applyToAllProducts?: Scalars['Boolean']['input'];
  channel?: PromotionChannel;
  defaultLocationId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  discountValue: Scalars['Float']['input'];
  discountValueType: DiscountValueType;
  endsAt?: InputMaybe<Scalars['String']['input']>;
  locationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  minQty?: InputMaybe<Scalars['Int']['input']>;
  minSubtotal?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  productIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  startsAt: Scalars['String']['input'];
  status?: PromotionStatus;
  type: PromotionType;
};

export type CreatePurchaseInput = {
  items: Array<PurchaseItemInput>;
  locationId: Scalars['ID']['input'];
  purchaseDate?: InputMaybe<Scalars['String']['input']>;
  supplierId: Scalars['ID']['input'];
};

export type CreateSaleInput = {
  items: Array<SaleItemInput>;
  locationId: Scalars['ID']['input'];
  paidAmount?: InputMaybe<Scalars['Float']['input']>;
  payments?: InputMaybe<Array<SalePaymentInput>>;
};

export type CreateSaleReturnInput = {
  items: Array<SaleReturnItemInput>;
  reason: Scalars['String']['input'];
  referenceSaleId: Scalars['ID']['input'];
  refundAmount?: InputMaybe<Scalars['Float']['input']>;
  refundPayment?: InputMaybe<SaleRefundPaymentInput>;
};

export type CreateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTenantInput = {
  /** Additional domains for the tenant, e.g. pos.client.com or client.com */
  domains?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  /** Tenant subdomain, e.g. acme for acme.app.com */
  subdomain?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTenantWithOwnerInput = {
  /** Additional domains for the tenant, e.g. pos.client.com or client.com */
  domains?: InputMaybe<Array<Scalars['String']['input']>>;
  ownerEmail: Scalars['String']['input'];
  ownerFullName: Scalars['String']['input'];
  ownerPassword: Scalars['String']['input'];
  /** Tenant subdomain, e.g. kree for kree.app.com */
  subdomain: Scalars['String']['input'];
  tenantName: Scalars['String']['input'];
};

export type CreateTenantWithOwnerResponse = {
  __typename?: 'CreateTenantWithOwnerResponse';
  owner: UserEntity;
  tenant: TenantEntity;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role?: UserRole;
};

export type DashboardSummary = {
  __typename?: 'DashboardSummary';
  cash: CashSummary;
  inventory: InventorySummary;
  purchases: PurchaseSummary;
  sales: SalesSummary;
};

export type DashboardSummaryFilterInput = {
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
};

export const DiscountValueType = {
  Amount: 'AMOUNT',
  Percent: 'PERCENT'
} as const;

export type DiscountValueType = typeof DiscountValueType[keyof typeof DiscountValueType];
export type InitialStockItemInput = {
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
};

export type InventoryBalance = {
  __typename?: 'InventoryBalance';
  balance: Scalars['Int']['output'];
  barcode?: Maybe<Scalars['String']['output']>;
  location: Scalars['String']['output'];
  locationId: Scalars['ID']['output'];
  product: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  sku?: Maybe<Scalars['String']['output']>;
};

export type InventoryFilterInput = {
  locationId?: InputMaybe<Scalars['ID']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
};

export type InventorySummary = {
  __typename?: 'InventorySummary';
  lowStockCount: Scalars['Int']['output'];
  outOfStockCount: Scalars['Int']['output'];
};

export type InventoryTransactionEntity = {
  __typename?: 'InventoryTransactionEntity';
  balanceAfter: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  location: Scalars['String']['output'];
  locationId: Scalars['ID']['output'];
  product: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  qtyIn: Scalars['Int']['output'];
  qtyOut: Scalars['Int']['output'];
  referenceId: Scalars['String']['output'];
  referenceType: Scalars['String']['output'];
  transactionType: InventoryTransactionType;
};

/** Type of inventory transaction */
export const InventoryTransactionType = {
  Adjustment: 'ADJUSTMENT',
  Purchase: 'PURCHASE',
  Sale: 'SALE',
  SaleReturn: 'SALE_RETURN'
} as const;

export type InventoryTransactionType = typeof InventoryTransactionType[keyof typeof InventoryTransactionType];
export type LocationEntity = {
  __typename?: 'LocationEntity';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  type: LocationType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LocationFilterInput = {
  type?: InputMaybe<LocationType>;
};

/** Type of business location */
export const LocationType = {
  Outlet: 'OUTLET',
  Warehouse: 'WAREHOUSE'
} as const;

export type LocationType = typeof LocationType[keyof typeof LocationType];
export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  /** Tenant subdomain. Leave empty to log in as a superuser/global user on localhost. */
  subdomain?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  adjustStock: InventoryTransactionEntity;
  closeCashierShift: CashierShiftEntity;
  createLocation: LocationEntity;
  createProduct: ProductEntity;
  createPromotion: PromotionEntity;
  createPurchase: PurchaseEntity;
  createSale: SaleEntity;
  createSaleReturn: SaleEntity;
  createSupplier: SupplierEntity;
  createTenant: TenantEntity;
  createTenantWithOwner: CreateTenantWithOwnerResponse;
  createUser: UserEntity;
  deletePurchase: PurchaseEntity;
  login: AuthResponse;
  openCashierShift: CashierShiftEntity;
  receivePurchase: PurchaseEntity;
  register: AuthResponse;
  removeLocation: LocationEntity;
  removeProduct: ProductEntity;
  removePromotion: PromotionEntity;
  removeSupplier: SupplierEntity;
  removeTenant: TenantEntity;
  removeUser: UserEntity;
  setInitialStock: Array<InventoryTransactionEntity>;
  transferStock: Array<InventoryTransactionEntity>;
  updateLocation: LocationEntity;
  updateProduct: ProductEntity;
  updatePromotion: PromotionEntity;
  updatePurchase: PurchaseEntity;
  updatePurchaseStatus: PurchaseEntity;
  updateSupplier: SupplierEntity;
  updateTenant: TenantEntity;
  updateUser: UserEntity;
};


export type MutationAdjustStockArgs = {
  input: StockAdjustmentInput;
};


export type MutationCloseCashierShiftArgs = {
  input: CloseCashierShiftInput;
};


export type MutationCreateLocationArgs = {
  createLocationInput: CreateLocationInput;
};


export type MutationCreateProductArgs = {
  createProductInput: CreateProductInput;
};


export type MutationCreatePromotionArgs = {
  createPromotionInput: CreatePromotionInput;
};


export type MutationCreatePurchaseArgs = {
  input: CreatePurchaseInput;
};


export type MutationCreateSaleArgs = {
  createSaleInput: CreateSaleInput;
};


export type MutationCreateSaleReturnArgs = {
  createSaleReturnInput: CreateSaleReturnInput;
};


export type MutationCreateSupplierArgs = {
  createSupplierInput: CreateSupplierInput;
};


export type MutationCreateTenantArgs = {
  createTenantInput: CreateTenantInput;
};


export type MutationCreateTenantWithOwnerArgs = {
  input: CreateTenantWithOwnerInput;
};


export type MutationCreateUserArgs = {
  createUserInput: CreateUserInput;
};


export type MutationDeletePurchaseArgs = {
  id: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  loginInput: LoginInput;
};


export type MutationOpenCashierShiftArgs = {
  input: OpenCashierShiftInput;
};


export type MutationReceivePurchaseArgs = {
  input: ReceivePurchaseInput;
};


export type MutationRegisterArgs = {
  registerInput: RegisterInput;
};


export type MutationRemoveLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemovePromotionArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSupplierArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveTenantArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationSetInitialStockArgs = {
  input: SetInitialStockInput;
};


export type MutationTransferStockArgs = {
  input: StockTransferInput;
};


export type MutationUpdateLocationArgs = {
  updateLocationInput: UpdateLocationInput;
};


export type MutationUpdateProductArgs = {
  updateProductInput: UpdateProductInput;
};


export type MutationUpdatePromotionArgs = {
  updatePromotionInput: UpdatePromotionInput;
};


export type MutationUpdatePurchaseArgs = {
  input: UpdatePurchaseInput;
};


export type MutationUpdatePurchaseStatusArgs = {
  input: UpdatePurchaseStatusInput;
};


export type MutationUpdateSupplierArgs = {
  updateSupplierInput: UpdateSupplierInput;
};


export type MutationUpdateTenantArgs = {
  updateTenantInput: UpdateTenantInput;
};


export type MutationUpdateUserArgs = {
  updateUserInput: UpdateUserInput;
};

export type OpenCashierShiftInput = {
  locationId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  openingCash: Scalars['Float']['input'];
};

export type PaginatedCashierShifts = {
  __typename?: 'PaginatedCashierShifts';
  data: Array<CashierShiftEntity>;
  meta: PaginationMeta;
};

export type PaginatedLocations = {
  __typename?: 'PaginatedLocations';
  data: Array<LocationEntity>;
  meta: PaginationMeta;
};

export type PaginatedPosProducts = {
  __typename?: 'PaginatedPosProducts';
  data: Array<PosProduct>;
  meta: PaginationMeta;
};

export type PaginatedProducts = {
  __typename?: 'PaginatedProducts';
  data: Array<ProductEntity>;
  meta: PaginationMeta;
};

export type PaginatedPromotions = {
  __typename?: 'PaginatedPromotions';
  data: Array<PromotionEntity>;
  meta: PaginationMeta;
};

export type PaginatedSales = {
  __typename?: 'PaginatedSales';
  data: Array<SaleEntity>;
  meta: PaginationMeta;
};

export type PaginatedSalesReportItems = {
  __typename?: 'PaginatedSalesReportItems';
  data: Array<SalesReportItemEntity>;
  meta: PaginationMeta;
};

export type PaginatedSalesReportTransactions = {
  __typename?: 'PaginatedSalesReportTransactions';
  data: Array<SalesReportTransactionEntity>;
  meta: PaginationMeta;
};

export type PaginatedSuppliers = {
  __typename?: 'PaginatedSuppliers';
  data: Array<SupplierEntity>;
  meta: PaginationMeta;
};

export type PaginatedTenants = {
  __typename?: 'PaginatedTenants';
  data: Array<TenantEntity>;
  meta: PaginationMeta;
};

export type PaginatedUsers = {
  __typename?: 'PaginatedUsers';
  data: Array<UserEntity>;
  meta: PaginationMeta;
};

export type PaginationMeta = {
  __typename?: 'PaginationMeta';
  hasNextPage: Scalars['Boolean']['output'];
  hasPrevPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaymentMethodSummary = {
  __typename?: 'PaymentMethodSummary';
  amount: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  method: SalesReportPaymentMethod;
};

export type PosProduct = {
  __typename?: 'PosProduct';
  barcode?: Maybe<Scalars['String']['output']>;
  discountAmount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  originalPrice: Scalars['Float']['output'];
  promotionId?: Maybe<Scalars['ID']['output']>;
  promotionName?: Maybe<Scalars['String']['output']>;
  sellingPrice: Scalars['Float']['output'];
  sku?: Maybe<Scalars['String']['output']>;
  stockOnHand: Scalars['Int']['output'];
  trackInventory: Scalars['Boolean']['output'];
  type: ProductType;
};

export type PosProductFilterInput = {
  inStockOnly?: Scalars['Boolean']['input'];
  limit?: Scalars['Int']['input'];
  locationId: Scalars['ID']['input'];
  page?: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};

export type PreviewSalePricingInput = {
  items: Array<SaleItemInput>;
  locationId: Scalars['ID']['input'];
};

export type ProductEntity = {
  __typename?: 'ProductEntity';
  barcode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  lastCostPrice: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  sellingPrice: Scalars['Float']['output'];
  sku?: Maybe<Scalars['String']['output']>;
  tenantId: Scalars['String']['output'];
  trackInventory: Scalars['Boolean']['output'];
  type: ProductType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Catalog item type */
export const ProductType = {
  Service: 'SERVICE',
  Stock: 'STOCK'
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];
export const PromotionChannel = {
  All: 'ALL',
  Pos: 'POS',
  SalesOrder: 'SALES_ORDER'
} as const;

export type PromotionChannel = typeof PromotionChannel[keyof typeof PromotionChannel];
export type PromotionEntity = {
  __typename?: 'PromotionEntity';
  applyToAllProducts: Scalars['Boolean']['output'];
  channel: PromotionChannel;
  createdAt: Scalars['DateTime']['output'];
  defaultLocationId?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  discountValue: Scalars['Float']['output'];
  discountValueType: DiscountValueType;
  endsAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  locationIds: Array<Scalars['ID']['output']>;
  minQty?: Maybe<Scalars['Int']['output']>;
  minSubtotal?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  productIds: Array<Scalars['ID']['output']>;
  startsAt: Scalars['DateTime']['output'];
  status: PromotionStatus;
  type: PromotionType;
  updatedAt: Scalars['DateTime']['output'];
};

export type PromotionFilterInput = {
  activeAt?: InputMaybe<Scalars['String']['input']>;
  channel?: InputMaybe<PromotionChannel>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PromotionStatus>;
  type?: InputMaybe<PromotionType>;
};

export const PromotionStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE'
} as const;

export type PromotionStatus = typeof PromotionStatus[keyof typeof PromotionStatus];
export const PromotionType = {
  MinQtyDiscount: 'MIN_QTY_DISCOUNT',
  MinTransactionDiscount: 'MIN_TRANSACTION_DISCOUNT',
  ProductDiscount: 'PRODUCT_DISCOUNT'
} as const;

export type PromotionType = typeof PromotionType[keyof typeof PromotionType];
export type PurchaseEntity = {
  __typename?: 'PurchaseEntity';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  items: Array<PurchaseItemEntity>;
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  purchaseDate: Scalars['DateTime']['output'];
  purchaseNo: Scalars['String']['output'];
  status: PurchaseStatus;
  supplierId: Scalars['ID']['output'];
  supplierName: Scalars['String']['output'];
  totalAmount: Scalars['Float']['output'];
};

export type PurchaseItemEntity = {
  __typename?: 'PurchaseItemEntity';
  costPrice: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  qty: Scalars['Int']['output'];
  subtotal: Scalars['Float']['output'];
};

export type PurchaseItemInput = {
  costPrice: Scalars['Float']['input'];
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
};

/** Status of purchase order */
export const PurchaseStatus = {
  Cancelled: 'CANCELLED',
  Confirmed: 'CONFIRMED',
  Draft: 'DRAFT',
  PartiallyReceived: 'PARTIALLY_RECEIVED',
  Received: 'RECEIVED'
} as const;

export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];
export type PurchaseSummary = {
  __typename?: 'PurchaseSummary';
  partiallyReceivedPurchaseCount: Scalars['Int']['output'];
  pendingPurchaseCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  cashierShift: CashierShiftEntity;
  cashierShifts: PaginatedCashierShifts;
  currentCashierShift?: Maybe<CashierShiftEntity>;
  dashboardSummary: DashboardSummary;
  health: Scalars['String']['output'];
  inventoryBalances: Array<InventoryBalance>;
  inventoryTransactions: Array<InventoryTransactionEntity>;
  location?: Maybe<LocationEntity>;
  locations: PaginatedLocations;
  locationsByTenant: Array<LocationEntity>;
  me: UserResponse;
  posProducts: PaginatedPosProducts;
  previewSalePricing: SalePricingPreviewEntity;
  product?: Maybe<ProductEntity>;
  products: PaginatedProducts;
  productsByTenant: Array<ProductEntity>;
  promotion?: Maybe<PromotionEntity>;
  promotions: PaginatedPromotions;
  promotionsByTenant: Array<PromotionEntity>;
  purchase: PurchaseEntity;
  purchases: Array<PurchaseEntity>;
  sale?: Maybe<SaleEntity>;
  sales: PaginatedSales;
  salesReportItems: PaginatedSalesReportItems;
  salesReportItemsCsv: Scalars['String']['output'];
  salesReportSummary: SalesReportSummaryEntity;
  salesReportTransactions: PaginatedSalesReportTransactions;
  salesReportTransactionsCsv: Scalars['String']['output'];
  supplier?: Maybe<SupplierEntity>;
  suppliers: PaginatedSuppliers;
  suppliersByTenant: Array<SupplierEntity>;
  tenant?: Maybe<TenantEntity>;
  tenants: PaginatedTenants;
  user?: Maybe<UserEntity>;
  users: PaginatedUsers;
  usersByTenant: Array<UserEntity>;
};


export type QueryCashierShiftArgs = {
  id: Scalars['String']['input'];
};


export type QueryCashierShiftsArgs = {
  filter?: InputMaybe<CashierShiftFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryCurrentCashierShiftArgs = {
  locationId: Scalars['String']['input'];
};


export type QueryDashboardSummaryArgs = {
  filter?: InputMaybe<DashboardSummaryFilterInput>;
};


export type QueryInventoryBalancesArgs = {
  filter?: InputMaybe<InventoryFilterInput>;
};


export type QueryInventoryTransactionsArgs = {
  filter?: InputMaybe<InventoryFilterInput>;
};


export type QueryLocationArgs = {
  id: Scalars['String']['input'];
};


export type QueryLocationsArgs = {
  filter?: InputMaybe<LocationFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryLocationsByTenantArgs = {
  filter?: InputMaybe<LocationFilterInput>;
};


export type QueryPosProductsArgs = {
  filter: PosProductFilterInput;
};


export type QueryPreviewSalePricingArgs = {
  previewSalePricingInput: PreviewSalePricingInput;
};


export type QueryProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryProductsArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryPromotionArgs = {
  id: Scalars['String']['input'];
};


export type QueryPromotionsArgs = {
  filter?: InputMaybe<PromotionFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryPromotionsByTenantArgs = {
  filter?: InputMaybe<PromotionFilterInput>;
};


export type QueryPurchaseArgs = {
  id: Scalars['String']['input'];
};


export type QueryPurchasesArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QuerySaleArgs = {
  id: Scalars['String']['input'];
};


export type QuerySalesArgs = {
  filter?: InputMaybe<SaleFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QuerySalesReportItemsArgs = {
  filter?: InputMaybe<SalesReportFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QuerySalesReportItemsCsvArgs = {
  filter?: InputMaybe<SalesReportFilterInput>;
};


export type QuerySalesReportSummaryArgs = {
  filter?: InputMaybe<SalesReportFilterInput>;
};


export type QuerySalesReportTransactionsArgs = {
  filter?: InputMaybe<SalesReportFilterInput>;
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QuerySalesReportTransactionsCsvArgs = {
  filter?: InputMaybe<SalesReportFilterInput>;
};


export type QuerySupplierArgs = {
  id: Scalars['String']['input'];
};


export type QuerySuppliersArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryTenantArgs = {
  id: Scalars['String']['input'];
};


export type QueryTenantsArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};

export type ReceivePurchaseInput = {
  items: Array<ReceivePurchaseItemInput>;
  purchaseId: Scalars['ID']['input'];
};

export type ReceivePurchaseItemInput = {
  costPrice?: InputMaybe<Scalars['Float']['input']>;
  purchaseItemId: Scalars['ID']['input'];
  receivedQty: Scalars['Int']['input'];
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role?: InputMaybe<UserRole>;
  /** Tenant subdomain. This can be auto-filled from the frontend URL. */
  subdomain: Scalars['String']['input'];
};

export type SaleDiscountEntity = {
  __typename?: 'SaleDiscountEntity';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  promotionId?: Maybe<Scalars['ID']['output']>;
};

export type SaleEntity = {
  __typename?: 'SaleEntity';
  cashierShiftId?: Maybe<Scalars['ID']['output']>;
  changeAmount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  discounts: Array<SaleDiscountEntity>;
  id: Scalars['ID']['output'];
  invoiceNo: Scalars['String']['output'];
  items: Array<SaleItemEntity>;
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  paidAmount: Scalars['Float']['output'];
  payments: Array<SalePaymentEntity>;
  reason?: Maybe<Scalars['String']['output']>;
  referenceSaleId?: Maybe<Scalars['ID']['output']>;
  status: SaleStatus;
  totalAmount: Scalars['Float']['output'];
  type: SaleType;
  updatedAt: Scalars['DateTime']['output'];
};

export type SaleFilterInput = {
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
};

export type SaleItemEntity = {
  __typename?: 'SaleItemEntity';
  costSnapshot: Scalars['Float']['output'];
  discountAmount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  originalPrice: Scalars['Float']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  profit: Scalars['Float']['output'];
  promotionId?: Maybe<Scalars['ID']['output']>;
  promotionName?: Maybe<Scalars['String']['output']>;
  qty: Scalars['Int']['output'];
  sellingPrice: Scalars['Float']['output'];
};

export type SaleItemInput = {
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
};

export type SalePaymentEntity = {
  __typename?: 'SalePaymentEntity';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  method: SalesReportPaymentMethod;
  notes?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  referenceNo?: Maybe<Scalars['String']['output']>;
};

export type SalePaymentInput = {
  amount: Scalars['Float']['input'];
  method: SalesReportPaymentMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  referenceNo?: InputMaybe<Scalars['String']['input']>;
};

export type SalePricingPreviewDiscountEntity = {
  __typename?: 'SalePricingPreviewDiscountEntity';
  amount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  promotionId?: Maybe<Scalars['ID']['output']>;
};

export type SalePricingPreviewEntity = {
  __typename?: 'SalePricingPreviewEntity';
  discounts: Array<SalePricingPreviewDiscountEntity>;
  isStockSufficient: Scalars['Boolean']['output'];
  items: Array<SalePricingPreviewItemEntity>;
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  subtotal: Scalars['Float']['output'];
  totalAmount: Scalars['Float']['output'];
  transactionDiscount: Scalars['Float']['output'];
};

export type SalePricingPreviewItemEntity = {
  __typename?: 'SalePricingPreviewItemEntity';
  availableStock: Scalars['Int']['output'];
  discountAmount: Scalars['Float']['output'];
  isStockSufficient: Scalars['Boolean']['output'];
  lineSubtotal: Scalars['Float']['output'];
  originalPrice: Scalars['Float']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  promotionId?: Maybe<Scalars['ID']['output']>;
  promotionName?: Maybe<Scalars['String']['output']>;
  qty: Scalars['Int']['output'];
  sellingPrice: Scalars['Float']['output'];
  trackInventory: Scalars['Boolean']['output'];
};

export type SaleRefundPaymentInput = {
  method: SalesReportPaymentMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  referenceNo?: InputMaybe<Scalars['String']['input']>;
};

export type SaleReturnItemInput = {
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
};

/** Status of sales transaction */
export const SaleStatus = {
  Cancelled: 'CANCELLED',
  Completed: 'COMPLETED'
} as const;

export type SaleStatus = typeof SaleStatus[keyof typeof SaleStatus];
/** Type of sales transaction */
export const SaleType = {
  Return: 'RETURN',
  Sale: 'SALE'
} as const;

export type SaleType = typeof SaleType[keyof typeof SaleType];
export type SalesReportFilterInput = {
  cashierShiftId?: InputMaybe<Scalars['ID']['input']>;
  cashierUserId?: InputMaybe<Scalars['ID']['input']>;
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  paymentMethod?: InputMaybe<SalesReportPaymentMethod>;
  saleType?: InputMaybe<SaleType>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type SalesReportItemEntity = {
  __typename?: 'SalesReportItemEntity';
  barcode?: Maybe<Scalars['String']['output']>;
  cogs: Scalars['Float']['output'];
  discountTotal: Scalars['Float']['output'];
  grossProfit: Scalars['Float']['output'];
  grossSales: Scalars['Float']['output'];
  netSales: Scalars['Float']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  qtySold: Scalars['Int']['output'];
  sku?: Maybe<Scalars['String']['output']>;
};

export const SalesReportPaymentMethod = {
  Card: 'CARD',
  Cash: 'CASH',
  Qris: 'QRIS',
  Transfer: 'TRANSFER'
} as const;

export type SalesReportPaymentMethod = typeof SalesReportPaymentMethod[keyof typeof SalesReportPaymentMethod];
export type SalesReportSummaryEntity = {
  __typename?: 'SalesReportSummaryEntity';
  cogs: Scalars['Float']['output'];
  grossProfit: Scalars['Float']['output'];
  grossSales: Scalars['Float']['output'];
  itemDiscountTotal: Scalars['Float']['output'];
  itemQtySold: Scalars['Int']['output'];
  netSales: Scalars['Float']['output'];
  returnAmount: Scalars['Float']['output'];
  returnCount: Scalars['Int']['output'];
  saleCount: Scalars['Int']['output'];
  totalDiscount: Scalars['Float']['output'];
  transactionCount: Scalars['Int']['output'];
  transactionDiscountTotal: Scalars['Float']['output'];
};

export type SalesReportTransactionEntity = {
  __typename?: 'SalesReportTransactionEntity';
  cashierName?: Maybe<Scalars['String']['output']>;
  cashierShiftId?: Maybe<Scalars['ID']['output']>;
  cashierUserId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  grossAmount: Scalars['Float']['output'];
  grossProfit: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  invoiceNo: Scalars['String']['output'];
  itemCount: Scalars['Int']['output'];
  itemDiscountTotal: Scalars['Float']['output'];
  locationId: Scalars['ID']['output'];
  locationName: Scalars['String']['output'];
  paidAmount: Scalars['Float']['output'];
  payments: Array<SalesReportTransactionPaymentEntity>;
  totalAmount: Scalars['Float']['output'];
  totalQty: Scalars['Int']['output'];
  transactionDiscountTotal: Scalars['Float']['output'];
  type: SaleType;
};

export type SalesReportTransactionPaymentEntity = {
  __typename?: 'SalesReportTransactionPaymentEntity';
  amount: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  method: SalesReportPaymentMethod;
};

export type SalesSummary = {
  __typename?: 'SalesSummary';
  grossProfit: Scalars['Float']['output'];
  grossSales: Scalars['Float']['output'];
  netSales: Scalars['Float']['output'];
  returnAmount: Scalars['Float']['output'];
  returnCount: Scalars['Int']['output'];
  saleCount: Scalars['Int']['output'];
  transactionCount: Scalars['Int']['output'];
};

export type SetInitialStockInput = {
  items: Array<InitialStockItemInput>;
  locationId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type StockAdjustmentInput = {
  adjustmentType: AdjustmentType;
  locationId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
};

export type StockTransferInput = {
  fromLocationId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['ID']['input'];
  qty: Scalars['Int']['input'];
  toLocationId: Scalars['ID']['input'];
};

export type SupplierEntity = {
  __typename?: 'SupplierEntity';
  address?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TenantEntity = {
  __typename?: 'TenantEntity';
  createdAt: Scalars['DateTime']['output'];
  domains?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  subdomain?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateLocationInput = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<LocationType>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastCostPrice?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ProductType>;
};

export type UpdatePromotionInput = {
  applyToAllProducts?: InputMaybe<Scalars['Boolean']['input']>;
  channel?: InputMaybe<PromotionChannel>;
  defaultLocationId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  discountValue?: InputMaybe<Scalars['Float']['input']>;
  discountValueType?: InputMaybe<DiscountValueType>;
  endsAt?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  locationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  minQty?: InputMaybe<Scalars['Int']['input']>;
  minSubtotal?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  productIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  startsAt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PromotionStatus>;
  type?: InputMaybe<PromotionType>;
};

export type UpdatePurchaseInput = {
  id: Scalars['ID']['input'];
  items?: InputMaybe<Array<PurchaseItemInput>>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  purchaseDate?: InputMaybe<Scalars['String']['input']>;
  supplierId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePurchaseStatusInput = {
  id: Scalars['ID']['input'];
  status: PurchaseStatus;
};

export type UpdateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTenantInput = {
  /** Additional domains for the tenant, e.g. pos.client.com or client.com */
  domains?: InputMaybe<Array<Scalars['String']['input']>>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  /** Tenant subdomain, e.g. acme for acme.app.com */
  subdomain?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<UserRole>;
};

export type UserEntity = {
  __typename?: 'UserEntity';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  role?: Maybe<UserRole>;
  tenantId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  authType: Scalars['String']['output'];
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isSuperuser: Scalars['Boolean']['output'];
  permissions: Array<Scalars['String']['output']>;
  role: Scalars['String']['output'];
};

export const UserRole = {
  Admin: 'ADMIN',
  Cashier: 'CASHIER',
  Manager: 'MANAGER',
  Owner: 'OWNER',
  Purchasing: 'PURCHASING',
  Warehouse: 'WAREHOUSE'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];