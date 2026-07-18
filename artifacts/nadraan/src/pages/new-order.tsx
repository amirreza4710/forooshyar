import { useState, useMemo } from "react";
import { useListProducts, useListCustomers, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Plus, Minus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Product, Customer } from "@workspace/api-client-react";

interface CartItem {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  image: string;
}

function n(v: number) { return v.toLocaleString("fa-IR"); }

export default function NewOrderPage() {
  const { data: productsRaw } = useListProducts();
  const { data: customersRaw } = useListCustomers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const products: Product[] = Array.isArray(productsRaw) ? productsRaw : [];
  const customers: Customer[] = Array.isArray(customersRaw) ? customersRaw : [];

  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("همه");
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [cartOpen, setCartOpen]   = useState(false); // mobile cart drawer

  const categories = useMemo(() => (
    ["همه", ...new Set(products.map(p => p.category).filter(Boolean))]
  ), [products]);

  const filtered = useMemo(() => products.filter(p => {
    const matchCat = category === "همه" || p.category === category;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.code ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [products, search, category]);

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess() {
        toast({ title: "✅ سفارش با موفقیت ثبت شد", description: `مبلغ کل: ${n(total)} ریال` });
        setCart([]); setCustomerId(null); setCartOpen(false);
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError() { toast({ title: "خطا در ثبت سفارش", description: "لطفاً دوباره تلاش کنید", variant: "destructive" }); },
    },
  });

  function addToCart(p: Product) {
    setCart(prev => {
      const ex = prev.find(c => c.productId === p.id);
      if (ex) return prev.map(c => c.productId === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { productId: p.id, productName: p.name, qty: 1, price: p.price, image: p.image ?? "📦" }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart(prev => prev.flatMap(c => {
      if (c.productId !== productId) return [c];
      const newQty = c.qty + delta;
      return newQty <= 0 ? [] : [{ ...c, qty: newQty }];
    }));
  }

  function removeFromCart(productId: number) {
    setCart(prev => prev.filter(c => c.productId !== productId));
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  function submit() {
    if (!customerId) { toast({ title: "مشتری را انتخاب کنید", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "حداقل یک محصول انتخاب کنید", variant: "destructive" }); return; }
    createOrder.mutate({ data: { customerId, items: cart } });
  }

  const CartPanel = (
    <div className="flex flex-col h-full bg-card">
      {/* Customer */}
      <div className="p-3 border-b border-border">
        <select
          value={customerId ?? ""}
          onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">انتخاب مشتری...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">محصولی انتخاب نشده</div>
        ) : (
          <ul className="space-y-2">
            {cart.map(item => (
              <li key={item.productId} className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{item.image}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-snug truncate">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">{n(item.price)} ریال</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 w-9 h-9 -m-1.5 rounded-lg flex items-center justify-center"
                    aria-label="حذف از سبد"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                      aria-label="کاهش تعداد"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 active:bg-primary/20 transition-colors"
                      aria-label="افزایش تعداد"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs font-bold">{n(item.price * item.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit */}
      <div className="p-3 border-t border-border">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">جمع کل:</span>
          <span className="font-bold">{n(total)} ریال</span>
        </div>
        <button
          onClick={submit}
          disabled={createOrder.isPending || cart.length === 0 || !customerId}
          className="w-full py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {createOrder.isPending ? "در حال ثبت..." : "ثبت سفارش"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full">

      {/* ── Products column ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Filters */}
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold">ثبت سفارش جدید</h1>
            {/* Mobile cart toggle */}
            <button
              onClick={() => setCartOpen(o => !o)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium"
            >
              <ShoppingCart size={14} />
              <span>سبد {cart.length > 0 && `(${cart.length})`}</span>
              {cartOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="جستجوی محصول..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-2 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none max-w-[140px] sm:max-w-[180px]"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile cart drawer */}
        {cartOpen && (
          <div className="lg:hidden shrink-0 border-b border-border max-h-80 overflow-hidden flex flex-col">
            {CartPanel}
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">محصولی یافت نشد</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {filtered.map(p => {
                const inCart = cart.find(c => c.productId === p.id);
                const outOfStock = (p.stock ?? 0) <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !outOfStock && addToCart(p)}
                    disabled={outOfStock}
                    className={[
                      "relative text-right p-2.5 sm:p-3 rounded-xl border transition-all",
                      inCart
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : outOfStock
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-card-border bg-card hover:border-primary/50",
                    ].join(" ")}
                  >
                    {inCart && (
                      <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                        {inCart.qty}
                      </span>
                    )}
                    <div className="text-xl sm:text-2xl mb-1.5">{p.image ?? "📦"}</div>
                    <div className="text-xs font-medium leading-snug mb-1 line-clamp-2">{p.name}</div>
                    <div className="text-xs text-muted-foreground mb-1 hidden sm:block truncate">{p.pack}</div>
                    <div className="text-xs font-bold text-primary">{n(p.price)}<span className="font-normal text-muted-foreground"> ر</span></div>
                    {outOfStock
                      ? <div className="text-xs text-destructive mt-0.5">ناموجود</div>
                      : <div className="text-xs text-muted-foreground mt-0.5">م: {n(p.stock ?? 0)}</div>
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile sticky checkout bar — always visible, no need to open the cart drawer */}
        {!cartOpen && cart.length > 0 && (
          <div
            className="lg:hidden shrink-0 border-t border-border bg-card p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center gap-3"
            style={{ marginBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground leading-none mb-0.5">
                {cart.length} قلم
              </div>
              <div className="text-sm font-bold leading-none">{n(total)} ریال</div>
            </div>
            <button
              onClick={() => (customerId ? submit() : setCartOpen(true))}
              disabled={createOrder.isPending}
              className="flex-1 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 active:opacity-80 transition disabled:opacity-50"
            >
              {createOrder.isPending ? "در حال ثبت..." : !customerId ? "انتخاب مشتری" : "ثبت سفارش"}
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop cart sidebar ── */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 shrink-0 border-r border-border flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
          <ShoppingCart size={15} className="text-primary" />
          <h2 className="text-sm font-semibold">سبد خرید</h2>
          {cart.length > 0 && (
            <span className="mr-auto bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {CartPanel}
        </div>
      </div>
    </div>
  );
}
