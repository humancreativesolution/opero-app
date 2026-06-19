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

export type CreateLocationInput = {
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  lastCostPrice?: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  sellingPrice: Scalars['Float']['input'];
  sku?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePurchaseInput = {
  items: Array<PurchaseItemInput>;
  locationId: Scalars['ID']['input'];
  purchaseDate?: InputMaybe<Scalars['String']['input']>;
  supplierId: Scalars['ID']['input'];
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
  Sale: 'SALE'
} as const;

export type InventoryTransactionType = typeof InventoryTransactionType[keyof typeof InventoryTransactionType];
export type LocationEntity = {
  __typename?: 'LocationEntity';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  /** Tenant subdomain. Leave empty to log in as a superuser/global user on localhost. */
  subdomain?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  adjustStock: InventoryTransactionEntity;
  createLocation: LocationEntity;
  createProduct: ProductEntity;
  createPurchase: PurchaseEntity;
  createSupplier: SupplierEntity;
  createTenant: TenantEntity;
  createTenantWithOwner: CreateTenantWithOwnerResponse;
  createUser: UserEntity;
  deletePurchase: PurchaseEntity;
  login: AuthResponse;
  register: AuthResponse;
  removeLocation: LocationEntity;
  removeProduct: ProductEntity;
  removeSupplier: SupplierEntity;
  removeTenant: TenantEntity;
  removeUser: UserEntity;
  transferStock: Array<InventoryTransactionEntity>;
  updateLocation: LocationEntity;
  updateProduct: ProductEntity;
  updatePurchase: PurchaseEntity;
  updatePurchaseStatus: PurchaseEntity;
  updateSupplier: SupplierEntity;
  updateTenant: TenantEntity;
  updateUser: UserEntity;
};


export type MutationAdjustStockArgs = {
  input: StockAdjustmentInput;
};


export type MutationCreateLocationArgs = {
  createLocationInput: CreateLocationInput;
};


export type MutationCreateProductArgs = {
  createProductInput: CreateProductInput;
};


export type MutationCreatePurchaseArgs = {
  input: CreatePurchaseInput;
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


export type MutationRegisterArgs = {
  registerInput: RegisterInput;
};


export type MutationRemoveLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveProductArgs = {
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


export type MutationTransferStockArgs = {
  input: StockTransferInput;
};


export type MutationUpdateLocationArgs = {
  updateLocationInput: UpdateLocationInput;
};


export type MutationUpdateProductArgs = {
  updateProductInput: UpdateProductInput;
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

export type PaginatedLocations = {
  __typename?: 'PaginatedLocations';
  data: Array<LocationEntity>;
  meta: PaginationMeta;
};

export type PaginatedProducts = {
  __typename?: 'PaginatedProducts';
  data: Array<ProductEntity>;
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
  updatedAt: Scalars['DateTime']['output'];
};

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
  Received: 'RECEIVED'
} as const;

export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];
export type Query = {
  __typename?: 'Query';
  health: Scalars['String']['output'];
  inventoryBalances: Array<InventoryBalance>;
  inventoryTransactions: Array<InventoryTransactionEntity>;
  location?: Maybe<LocationEntity>;
  locations: PaginatedLocations;
  locationsByTenant: Array<LocationEntity>;
  me: UserResponse;
  product?: Maybe<ProductEntity>;
  products: PaginatedProducts;
  productsByTenant: Array<ProductEntity>;
  purchase: PurchaseEntity;
  purchases: Array<PurchaseEntity>;
  supplier?: Maybe<SupplierEntity>;
  suppliers: PaginatedSuppliers;
  suppliersByTenant: Array<SupplierEntity>;
  tenant?: Maybe<TenantEntity>;
  tenants: PaginatedTenants;
  user?: Maybe<UserEntity>;
  users: PaginatedUsers;
  usersByTenant: Array<UserEntity>;
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
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryProductsArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryPurchaseArgs = {
  id: Scalars['String']['input'];
};


export type QueryPurchasesArgs = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
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

export type RegisterInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role?: InputMaybe<UserRole>;
  /** Tenant subdomain. This can be auto-filled from the frontend URL. */
  subdomain: Scalars['String']['input'];
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
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastCostPrice?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
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