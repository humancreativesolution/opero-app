export const PERMISSIONS = {
  dashboard: {
    view: "dashboard.view",
  },
  pos: {
    access: "pos.access",
    transaction: "pos.transaction",
  },
  receipt: {
    view: "receipt.view",
    print: "receipt.print",
  },
  reports: {
    view: "reports.view",
    export: "reports.export",
  },
  products: {
    read: "products.read",
    create: "products.create",
    update: "products.update",
    delete: "products.delete",
  },
  promotions: {
    read: "promotions.read",
    create: "promotions.create",
    update: "promotions.update",
    delete: "promotions.delete",
  },
  suppliers: {
    read: "suppliers.read",
    create: "suppliers.create",
    update: "suppliers.update",
    delete: "suppliers.delete",
  },
  purchases: {
    read: "purchases.read",
    create: "purchases.create",
    update: "purchases.update",
    delete: "purchases.delete",
  },
  stock: {
    read: "stock.read",
    adjust: "stock.adjust",
    transfer: "stock.transfer",
    initial: "stock.initial",
  },
  locations: {
    read: "locations.read",
    create: "locations.create",
    update: "locations.update",
    delete: "locations.delete",
  },
  users: {
    read: "users.read",
    create: "users.create",
    update: "users.update",
    delete: "users.delete",
  },
  roles: {
    read: "roles.read",
    create: "roles.create",
    update: "roles.update",
    delete: "roles.delete",
  },
  settings: {
    read: "settings.read",
    update: "settings.update",
  },
} as const;

export type PermissionRequirement = {
  allOf?: string[];
  anyOf?: string[];
};
