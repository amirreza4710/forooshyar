import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useListProducts,
  useListCustomers,
  useCreateOrder,
  useCreateCustomer,
  getListOrdersQueryKey,
  getListProductsQueryKey,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronUp,
  ChevronDown,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Package,
  UserPlus,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import type { Product, Customer } from "@workspace/api-client-react";

interface CartItem {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  image: string;
  stock?: number;
}

function n(v: number) {
  return v.toLocaleString("fa-IR");
}

const isRealImage = (v?: string) =>
  !!v && (v.startsWith("data:image") || v.startsWith("http"));

function ProductThumb({
  image,
  name,
  className = "w-full h-24 sm:h-28",
  iconSize = "text-3xl sm:text-4xl",
}: {
  image?: string;
  name: string;
  className?: string;
  iconSize?: string;
}) {
  if (isRealImage(image)) {
    return (
      <div className={`overflow-hidden bg-muted/30 rounded-lg flex items-center justify-center ${className}`}>
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`overflow-hidden bg-muted/30 rounded-lg flex items-center justify-center ${className}`}>
      <span className={`${iconSize} select-none`} role="img" aria-label={name}>
        {image || "📦"}
      </span>
    </div>
  );
}

export default function NewOrderPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: productsRaw, isLoading: productsLoading } = useListProducts();
  const { data: customersRaw, isLoading: customersLoading } = useListCustomers();

  const products: Product[] = Array.isArray(productsRaw) ? productsRaw : [];
  const customers: Customer[] = Array.isArray(customersRaw) ? customersRaw : [];

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه");
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartMap = useMemo(() => new Map(cart.map((c) => [c.productId, c])), [cart]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // Mobile cart drawer

  // Quick Customer Creation modal
  const [newCustModal, setNewCustModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: "", phone: "", address: "" });
  const [newCustError, setNewCustError] = useState("");

  // Completed Order Modal
  const [completedOrder, setCompletedOrder] = useState<{
    id: number;
    code?: string;
    total: number;
    customerName: string;
  } | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const categories = useMemo(
    () => ["همه", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchCat = category === "همه" || p.category === category;
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.code ?? "").toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      }),
    [products, search, category]
  );

  const createCustomer = useCreateCustomer({
    mutation: {
      onSuccess(data: any) {
        toast({ title: "✅ مشتری جدید با موفقیت ثبت شد" });
        qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setCustomerId(data.id);
        setNewCustModal(false);
        setNewCustForm({ name: "", phone: "", address: "" });
        setNewCustError("");
        setCustomerDropdownOpen(false);
      },
      onError(err: any) {
        const msg = err?.response?.data?.error || err?.message || "خطا در ثبت مشتری";
        setNewCustError(msg);
        toast({ title: "خطا در ثبت مشتری", description: msg, variant: "destructive" });
      },
    },
  });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess(data: any) {
        setCompletedOrder({
          id: data.id,
          code: data.code,
          total: data.total || total,
          customerName: selectedCustomer?.name || "مشتری",
        });
        setCart([]);
        setCustomerId(null);
        setCartOpen(false);
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError(err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "لطفاً موجودی محصولات و اطلاعات را بررسی کنید.";
        toast({
          title: "خطا در ثبت سفارش",
          description: msg,
          variant: "destructive",
        });
      },
    },
  });

  function addToCart(p: Product) {
    const stock = p.stock ?? 0;
    if (stock <= 0) {
      toast({ title: "محصول ناموجود است", variant: "destructive" });
      return;
    }

    setCart((prev) => {
      const ex = prev.find((c) => c.productId === p.id);
      if (ex) {
        if (ex.qty >= stock) {
          toast({
            title: "سقف موجودی",
            description: `حداکثر موجودی قابل سفارش ${n(stock)} عدد می‌باشد.`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map((c) =>
          c.productId === p.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          productName: p.name,
          qty: 1,
          price: p.price,
          image: p.image ?? "📦",
          stock,
        },
      ];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.productId !== productId) return [c];
        const newQty = c.qty + delta;
        if (delta > 0 && c.stock !== undefined && newQty > c.stock) {
          toast({
            title: "سقف موجودی",
            description: `بیشتر از ${n(c.stock)} عدد در انبار موجود نیست.`,
            variant: "destructive",
          });
          return [c];
        }
        return newQty <= 0 ? [] : [{ ...c, qty: newQty }];
      })
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalItemsCount = cart.reduce((s, c) => s + c.qty, 0);

  function submitOrder() {
    if (!customerId) {
      toast({ title: "لطفاً ابتدا مشتری را انتخاب کنید", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "سبد خرید خالی است", variant: "destructive" });
      return;
    }
    createOrder.mutate({
      data: {
        customerId,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          qty: c.qty,
          price: c.price,
        })),
      },
    });
  }

  function submitQuickCustomer() {
    if (!newCustForm.name.trim()) {
      setNewCustError("نام مشتری الزامی است");
      return;
    }
    if (!newCustForm.phone.trim()) {
      setNewCustError("شماره تماس الزامی است");
      return;
    }
    setNewCustError("");
    createCustomer.mutate({
      data: {
        name: newCustForm.name.trim(),
        phone: newCustForm.phone.trim(),
        address: newCustForm.address.trim() || undefined,
      },
    });
  }

  // ── Cart & Customer Sidebar ──
  const CartPanel = (
    <div className="flex flex-col h-full bg-card">
      {/* Customer Selection Section */}
      <div className="p-3.5 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User size={13} className="text-primary" />
            <span>انتخاب مشتری</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setNewCustForm({ name: "", phone: "", address: "" });
              setNewCustError("");
              setNewCustModal(true);
            }}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <UserPlus size={13} />
            <span>+ مشتری جدید</span>
          </button>
        </div>

        {selectedCustomer ? (
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground truncate">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {selectedCustomer.code}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1" dir="ltr">
                <Phone size={11} />
                <span>{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.address && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{selectedCustomer.address}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setCustomerId(null);
                setCustomerDropdownOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
              title="تغییر مشتری"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder={
                  customersLoading
                    ? "در حال بارگذاری مشتریان..."
                    : "جستجوی نام، تلفن یا کد مشتری..."
                }
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerDropdownOpen(true);
                }}
                onFocus={() => setCustomerDropdownOpen(true)}
                className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {customerDropdownOpen && (
              <div className="absolute top-full right-0 left-0 mt-1 z-30 bg-card border border-card-border rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-1">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    مشتری یافت نشد.
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustModal(true);
                        setCustomerDropdownOpen(false);
                      }}
                      className="block mx-auto mt-1 text-primary hover:underline font-medium"
                    >
                      افزودن این مشتری ←
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerDropdownOpen(false);
                        setCustomerSearch("");
                      }}
                      className="w-full text-right p-2 rounded-lg hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate" dir="ltr">
                          {c.phone}
                        </div>
                      </div>
                      {c.code && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          {c.code}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="p-3 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          اقلام سبد ({n(totalItemsCount)} قلم)
        </span>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            <span>خالی کردن</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <ShoppingCart size={32} className="opacity-25" />
            <span className="text-xs">محصولی در سبد خرید نیست</span>
            <span className="text-[11px] text-muted-foreground/70">
              از لیست سمت راست محصولات را اضافه کنید
            </span>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map((item) => (
              <li
                key={item.productId}
                className="bg-background rounded-xl p-3 border border-border flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30 shrink-0 flex items-center justify-center border border-border">
                    {isRealImage(item.image) ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg select-none">{item.image || "📦"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold leading-snug line-clamp-2">
                      {item.productName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {n(item.price)} ریال
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    aria-label="حذف"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition"
                      aria-label="کاهش"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-7 text-center font-mono">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition"
                      aria-label="افزایش"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {n(item.price * item.qty)}{" "}
                    <span className="font-normal text-[10px] text-muted-foreground">
                      ریال
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Order Footer & Checkout */}
      <div className="p-3.5 border-t border-border bg-muted/10 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>تعداد کل کالاها:</span>
            <span>{n(totalItemsCount)} عدد</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/40">
            <span>مبلغ کل سفارش:</span>
            <span className="text-primary text-base">
              {n(total)}{" "}
              <span className="text-xs font-normal text-muted-foreground">ریال</span>
            </span>
          </div>
        </div>

        <button
          onClick={submitOrder}
          disabled={createOrder.isPending || cart.length === 0 || !customerId}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
        >
          {createOrder.isPending ? (
            <span>در حال ثبت سفارش...</span>
          ) : (
            <>
              <CheckCircle size={16} />
              <span>تأیید و ثبت سفارش نهایی</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── Left / Main: Products column ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-l border-border">
        {/* Header / Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground">
                ثبت سفارش جدید
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {productsLoading
                  ? "در حال بارگذاری کاتالوگ..."
                  : `${n(products.length)} محصول در کاتالوگ`}
              </p>
            </div>

            {/* Mobile cart toggle */}
            <button
              onClick={() => setCartOpen((o) => !o)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm"
            >
              <ShoppingCart size={15} />
              <span>سبد {cart.length > 0 && `(${cart.length})`}</span>
              {cartOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                placeholder="جستجوی نام یا کد محصول..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none max-w-[140px] sm:max-w-[180px]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile cart drawer */}
        {cartOpen && (
          <div className="lg:hidden shrink-0 border-b border-border max-h-96 overflow-hidden flex flex-col shadow-inner">
            {CartPanel}
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-muted/10">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Package size={44} className="opacity-20" />
              <span className="text-sm">محصولی یافت نشد</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cartMap.get(p.id);
                const stock = p.stock ?? 0;
                const outOfStock = stock <= 0;

                return (
                  <div
                    key={p.id}
                    className={[
                      "group relative flex flex-col justify-between text-right p-3 rounded-2xl border transition-all duration-200",
                      inCart
                        ? "border-primary bg-primary/[0.03] ring-1 ring-primary shadow-sm"
                        : outOfStock
                        ? "border-border/60 bg-card/60 opacity-60"
                        : "border-card-border bg-card hover:border-primary/40 hover:shadow-md",
                    ].join(" ")}
                  >
                    {inCart && (
                      <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shadow">
                        {inCart.qty}
                      </span>
                    )}

                    <div>
                      {/* Product Image / Thumb */}
                      <ProductThumb image={p.image ?? undefined} name={p.name} />

                      {/* Product Name */}
                      <h3
                        className="text-xs font-semibold leading-snug line-clamp-2 mt-1.5 text-foreground"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {/* Pack / Code */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span className="truncate">{p.pack || p.category}</span>
                        {p.code && <span className="font-mono text-[10px]">{p.code}</span>}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs font-bold text-primary">
                          {n(p.price)}
                          <span className="text-[10px] font-normal text-muted-foreground mr-0.5">
                            {" "}ریال
                          </span>
                        </span>
                        {outOfStock ? (
                          <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            ناموجود
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            موجودی: {n(stock)}
                          </span>
                        )}
                      </div>

                      {/* Add button or Quantity stepper */}
                      {inCart ? (
                        <div className="flex items-center justify-between gap-1 bg-muted/40 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateQty(p.id, -1)}
                            className="w-7 h-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-95 transition"
                            aria-label="کاهش"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold font-mono px-1">
                            {inCart.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(p.id, 1)}
                            className="w-7 h-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-95 transition"
                            aria-label="افزایش"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          disabled={outOfStock}
                          className="w-full py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium text-xs transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1"
                        >
                          <Plus size={13} />
                          <span>افزودن به سبد</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Right Column: Cart Panel ── */}
      <div className="hidden lg:flex lg:w-96 shrink-0 flex-col h-full shadow-lg">
        {CartPanel}
      </div>

      {/* ── Quick Add Customer Modal ── */}
      {newCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">افزودن مشتری جدید</h3>
              </div>
              <button
                onClick={() => {
                  setNewCustModal(false);
                  setNewCustError("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  نام مشتری / فروشگاه *
                </label>
                <input
                  type="text"
                  value={newCustForm.name}
                  onChange={(e) => {
                    setNewCustForm((f) => ({ ...f, name: e.target.value }));
                    setNewCustError("");
                  }}
                  placeholder="مثال: سوپرمارکت بهار"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  شماره تماس / موبایل *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newCustForm.phone}
                  onChange={(e) => {
                    setNewCustForm((f) => ({ ...f, phone: e.target.value }));
                    setNewCustError("");
                  }}
                  placeholder="09123456789"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  آدرس (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={newCustForm.address}
                  onChange={(e) =>
                    setNewCustForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="تهران، خیابان ولیعصر..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {newCustError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
                  {newCustError}
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setNewCustModal(false);
                    setNewCustError("");
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={submitQuickCustomer}
                  disabled={createCustomer.isPending}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60"
                >
                  {createCustomer.isPending ? "در حال ثبت..." : "ثبت و انتخاب مشتری"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Completed Success Modal ── */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle size={36} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">
                سفارش با موفقیت ثبت شد
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                سفارش برای مشتری «{completedOrder.customerName}» با موفقیت در سیستم ثبت گردید.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2 text-right">
              {completedOrder.code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شماره پیگیری / کد:</span>
                  <span className="font-mono font-bold text-primary">
                    {completedOrder.code}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">مشتری:</span>
                <span className="font-semibold text-foreground">
                  {completedOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1.5">
                <span className="text-muted-foreground">مبلغ کل سفارش:</span>
                <span className="font-bold text-sm text-foreground">
                  {n(completedOrder.total)} ریال
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/40 transition"
              >
                ثبت سفارش جدید دیگر
              </button>
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow"
              >
                <FileText size={14} />
                <span>مشاهده در لیست سفارشات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
