import { useState, useMemo } from "react";
import { useListProducts, useListCustomers, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Plus, Minus, Trash2, ChevronDown } from "lucide-react";
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

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const cats = ["همه", ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = category === "همه" || p.category === category;
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, search, category]);

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess() {
        toast({ title: "سفارش ثبت شد", description: "سفارش با موفقیت ثبت گردید." });
        setCart([]);
        setCustomerId(null);
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError() {
        toast({ title: "خطا", description: "ثبت سفارش با مشکل مواجه شد.", variant: "destructive" });
      },
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
    if (!customerId) { toast({ title: "خطا", description: "مشتری را انتخاب کنید.", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "خطا", description: "حداقل یک محصول انتخاب کنید.", variant: "destructive" }); return; }
    createOrder.mutate({ data: { customerId, items: cart } });
  }

  return (
    <div className="flex h-full">
      {/* Products side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border">
          <h1 className="text-lg font-bold mb-4">ثبت سفارش جدید</h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="جستجوی محصول..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">محصولی یافت نشد</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(p => {
                const inCart = cart.find(c => c.productId === p.id);
                const outOfStock = (p.stock ?? 0) <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !outOfStock && addToCart(p)}
                    disabled={outOfStock}
                    className={`relative text-right p-3 rounded-xl border transition-all ${
                      inCart
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : outOfStock
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-card-border bg-card hover:border-primary/50 hover:bg-card/80"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                        {inCart.qty}
                      </span>
                    )}
                    <div className="text-2xl mb-2">{p.image ?? "📦"}</div>
                    <div className="text-xs font-medium leading-snug mb-1">{p.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">{p.pack}</div>
                    <div className="text-xs font-bold text-primary">{n(p.price)} ریال</div>
                    {outOfStock
                      ? <div className="text-xs text-destructive mt-1">ناموجود</div>
                      : <div className="text-xs text-muted-foreground mt-1">موجودی: {n(p.stock ?? 0)}</div>
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart side */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">سبد خرید</h2>
            {cart.length > 0 && (
              <span className="mr-auto bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <select
            value={customerId ?? ""}
            onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">انتخاب مشتری...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-10">محصولی انتخاب نشده</div>
          ) : (
            <ul className="space-y-2">
              {cart.map(item => (
                <li key={item.productId} className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{item.image}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium leading-snug">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{n(item.price)} ریال</div>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="text-xs font-bold">{n(item.price * item.qty)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-border">
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
    </div>
  );
}
