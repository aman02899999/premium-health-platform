// Royal Supplements store: shared types. Money is whole rupees.

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  discountPct: number;
  sort: number;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  active: boolean;
};

export type NutritionRow = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string | null;
  sku: string | null;
  listPrice: number;
  /** Overrides the category discount when not null. */
  discountPct: number | null;
  stock: number;
  size: string;
  flavours: string[];
  images: string[];
  shortDescription: string;
  description: string;
  highlights: string[];
  nutrition: NutritionRow[];
  howToUse: string;
  warnings: string;
  featured: boolean;
  active: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type ComboItem = { productId: string; qty: number };

export type Combo = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  items: ComboItem[];
  extraPct: number;
  featured: boolean;
  active: boolean;
  updatedAt: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  categorySlug: string | null;
  tags: string[];
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShopSettings = {
  storeName: string;
  tagline: string;
  announcement: string;
  heroTitle: string;
  heroHighlight: string;
  heroText: string;
  heroImage: string;
  /** Optional photos for the three home-page promo banners; designed artwork is used when empty. */
  banner1Image: string;
  banner2Image: string;
  banner3Image: string;
  /** Orders are emailed here (comma-separated for several). */
  orderEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  /** Legal name of the food business, exactly as on the FSSAI certificate. */
  sellerName: string;
  /** FSSAI basic/State registration or a licence: decides the label shown to buyers. */
  fssaiType: "registration" | "licence";
  /** The 14-digit FSSAI registration or licence number. */
  fssaiLicence: string;
  gstin: string;
  /** Flat delivery charge; 0 = free delivery. */
  shippingFee: number;
  /** Delivery is free from this cart total; 0 = always charge shippingFee. */
  freeShippingOver: number;
  dispatchText: string;
  returnPolicy: string;
  seoTitle: string;
  seoDescription: string;
};

export type CartLine = { kind: "product"; id: string; qty: number; flavour?: string } | { kind: "combo"; id: string; qty: number };

export type Address = { line1: string; line2: string; landmark: string; city: string; state: string; pincode: string };

export type OrderItem = {
  kind: "product" | "combo";
  id: string;
  slug: string;
  name: string;
  flavour?: string;
  qty: number;
  unitList: number;
  unitPrice: number;
  /** For combos: what is inside. */
  contents?: { productId?: string; name: string; qty: number }[];
};

export type Fulfilment = "new" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: "created" | "paid" | "failed";
  fulfilment: Fulfilment;
  name: string;
  email: string;
  phone: string;
  address: Address;
  items: OrderItem[];
  listTotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  note: string;
  courier: string;
  tracking: string;
  adminNotes: string;
  paidAt: string | null;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
};
