import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Page, Category, Product, PaymentOption, ContactInfo, PayMethod } from "@/types/store";
import { C, font } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { AuthPage } from "@/components/auth/AuthPage";
import { CustomerAccountPage } from "@/components/auth/CustomerAccountPage";
import { ShopPage } from "@/components/shop/ShopPage";
import { ProductDetailPage } from "@/components/shop/ProductDetailPage";
import { CartPage } from "@/components/checkout/CartPage";
import { PaymentNumberPage } from "@/components/checkout/PaymentNumberPage";
import { PaymentSummaryPage } from "@/components/checkout/PaymentSummaryPage";
import { PaymentFailedPage } from "@/components/checkout/PaymentFailedPage";
import { OrderConfirmedPage } from "@/components/checkout/OrderConfirmedPage";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { IconArrowLeft } from "@/components/ui/Icons";
import { MadeToOrderProduct } from "@/components/shop/MadeToOrderProduct";
import { isPreOrder, lineTotal, dueNow } from "@/lib/preorder";
import { clearPendingOrder, loadPendingOrder, type PendingOrder } from "@/lib/pendingOrder";
import type { CreateOrderArgs } from "@/components/checkout/PaymentSummaryPage";
import { authIdentifierCredentials } from "@/lib/authIdentifier";

export default function App() {
  // ── Supabase state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [nextId, setNextId] = useState(1);

  // Load products safely from Supabase
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error loading products from Supabase:", error);
        return;
      }

      // Safeguard against missing or null fields that cause white screens/crashes
      const normalizedData: Product[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name || "UNNAMED PRODUCT",
        price: Number(p.price) || 0,
        image:
          p.image ||
          "https://images.unsplash.com/photo-1587502536263-aa47cd87e898?w=500&h=500&fit=crop&auto=format",
        category: (p.category || "OTHERS").toUpperCase() as Category,
        franchise: p.franchise || "Star Wars",
        brand: p.brand || "Others",
        scale: p.scale || "1:6",
        condition: p.condition || "Brand New",
        stock: Number(p.stock) || 0,
        details: Array.isArray(p.details) ? p.details : [],
        new: Boolean(p.new),
        description: p.description || "",
        is_available: p.is_available !== false,
        is_hidden: Boolean(p.is_hidden),
        is_featured: Boolean(p.is_featured),
        est_arrival: p.est_arrival ?? null,
        deposit_amount: p.deposit_amount != null ? Number(p.deposit_amount) : null,
        sourcing_country: p.sourcing_country ?? null,
      }));

      setProducts(normalizedData);

      if (data && data.length > 0) {
        setNextId(Math.max(...data.map((p) => p.id)) + 1);
      }
    } catch (err) {
      console.error("Unexpected error fetching products:", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ── Loading state ──
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // ── Credentials ── previous version
// ── Supabase Auth session ──
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const userRole = session?.user?.app_metadata?.role;
  const isStaffOrAdmin = userRole === "admin" || userRole === "staff";

  const loggedInCustomer =
    session?.user && !isStaffOrAdmin
      ? {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email || session.user.phone || "Customer",
          email: session.user.user_metadata?.contact_email || session.user.email || "",
          phone: session.user.user_metadata?.contact_phone || session.user.phone || "",
          contactEmail: session.user.user_metadata?.contact_email || "",
          contactPhone: session.user.user_metadata?.contact_phone || "",
          identifier: session.user.email || session.user.phone || "",
        }
      : null;
  const isAdminSession = isStaffOrAdmin;

  const customerSignUp = async (name: string, identifier: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      ...authIdentifierCredentials(identifier),
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session) return { ok: true, needsConfirmation: true };
    return { ok: true };
  };

  const customerSignIn = async (identifier: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      ...authIdentifierCredentials(identifier),
      password,
    });
    if (error) return { ok: false, error: error.message };
    const role = data.user?.app_metadata?.role;
    if (role === "admin" || role === "staff") {
      await supabase.auth.signOut();
      return { ok: false, error: "This is a staff/admin account — please use the management portal." };
    }
    return { ok: true };
  };

  const adminSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    const role = data.user?.app_metadata?.role;
    if (role !== "admin" && role !== "staff") {
      await supabase.auth.signOut();
      return { ok: false, error: "This account does not have administrator or staff access." };
    }
    return { ok: true };
  };

  const changeOwnPassword = async (identifier: string, oldPassword: string, newPassword: string) => {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      ...authIdentifierCredentials(identifier),
      password: oldPassword,
    });
    if (reauthError) return { ok: false, error: "Current password is incorrect." };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  // ── Admin state ──
  const [route, setRoute] = useState(window.location.hash);
  // ── Customer store state ──
  const [page, setPage] = useState<Page>("shop");
  const [activeCategory, setActiveCategory] = useState<Category>("HOME");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [payMethod, setPayMethod] = useState<PayMethod>("gcash");
  // Pre-order checkout choices (Lifesize items): deposit vs full payment
  const [checkoutOption, setCheckoutOption] = useState<PaymentOption>("full");
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>(
    []
  );
  const [confirmedOrder, setConfirmedOrder] = useState<PendingOrder | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [contact, setContact] = useState<ContactInfo>({ name: "", email: "", phone: "" });
  const [authForCheckout, setAuthForCheckout] = useState(false);
  // Read once on load: after a PayMongo redirect this is the order we're coming back to.
  const [returnOrder] = useState<PendingOrder | null>(() => loadPendingOrder());
  const [paymongoPublicKey, setPaymongoPublicKey] = useState("");

  useEffect(() => {
    if (authLoading || !products.length) return;
    const raw = sessionStorage.getItem("pendingCheckout");
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { productId: number; qty: number; paymentOption: PaymentOption };
      const product = products.find((item) => item.id === pending.productId);
      if (!product || !Number.isInteger(pending.qty) || pending.qty < 1) {
        sessionStorage.removeItem("pendingCheckout");
        return;
      }
      setSelectedProduct(product);
      setOrderQty(pending.qty);
      setCheckoutOption(pending.paymentOption === "deposit" ? "deposit" : "full");
      setAuthForCheckout(true);
      setPage(session?.user && !isStaffOrAdmin ? "payment-number" : "auth");
    } catch (error) {
      console.error("Could not restore checkout after account sign-in:", error);
      sessionStorage.removeItem("pendingCheckout");
    }
  }, [authLoading, products, session, isStaffOrAdmin]);

  useEffect(() => {
    const handler = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  // ── Supabase Async Handlers ──
  const addProduct = async (data: Omit<Product, "id">) => {
    const payload = {
      name: data.name,
      price: data.price,
      image: data.image,
      category: data.category,
      franchise: data.franchise,
      brand: data.brand,
      scale: data.scale,
      condition: data.condition,
      stock: data.stock,
      details: data.details,
      new: data.new,
      description: data.description,
      is_available: data.is_available,
      is_hidden: data.is_hidden,
      is_featured: data.is_featured,
      est_arrival: data.est_arrival ?? null,
      deposit_amount: data.deposit_amount ?? null,
      sourcing_country: data.sourcing_country ?? null,
    };

    const { data: inserted, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error inserting product into Supabase:", error);
      alert(`Failed to add product: ${error.message}`);
      return;
    }

    if (inserted) {
      setProducts((prev) => [...prev, inserted as Product]);
    }
  };

  const updateProduct = async (id: number, changes: Partial<Product>) => {
    const { error } = await supabase
      .from("products")
      .update(changes)
      .eq("id", id);

    if (error) {
      console.error("Error updating product in Supabase:", error);
      alert(`Failed to update product: ${error.message}`);
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product from Supabase:", error);
      alert(`Failed to delete product: ${error.message}`);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  // ── Order persistence (real orders in Supabase, used by the Revenue + Orders tabs) ──
  const createPendingOrder = async ({ product, qty, method, preorder, paymentOption, contact, customer }: CreateOrderArgs): Promise<string> => {
    const option: PaymentOption = preorder ? paymentOption : "full";
    const orderId = crypto.randomUUID();
    const { error: orderErr } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        customer_id: customer?.id ?? null,
        customer_name: customer?.name || contact.name || "Customer",
        customer_email: customer?.email || contact.email || null,
        customer_phone: contact.phone ? "+63" + contact.phone : customer?.phone || null,
        status: "pending",
        total: lineTotal(product, qty),
        amount_due_now: dueNow(product, qty, option),
        amount_paid: 0,
        payment_method: method,
        order_type: preorder ? "preorder" : "stock",
        payment_option: option,
        // Pre-orders enter the admin's "needs supplier order" queue once they're paid.
        fulfillment_status: preorder ? "awaiting_order" : null,
        est_arrival: preorder ? product.est_arrival ?? null : null,
      });

    if (orderErr) {
      throw new Error(orderErr.message || "Could not create order.");
    }

    const { error: itemErr } = await supabase.from("order_items").insert({
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      unit_price: product.price,
      quantity: qty,
    });

    if (itemErr) {
      console.error("Failed to record order item:", itemErr);
    }

    return orderId;
  };

  const markOrderStatus = async (
    orderId: string,
    status: "paid" | "deposit_paid" | "failed" | "cancelled",
    amountPaid?: number,
  ) => {
    const changes: Record<string, unknown> = { status };
    if (amountPaid !== undefined) changes.amount_paid = amountPaid;
    const { error } = await supabase.from("orders").update(changes).eq("id", orderId);
    if (error) console.error(`Failed to mark order ${status}:`, error);
  };

  const handleAddToCart = (product: Product, qty: number) => {
    setOrderQty(qty);
    setSelectedProduct(product);
    setCartItems((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      return ex
        ? prev.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
          )
        : [...prev, { product, qty }];
    });
    setPage("cart");
  };

  const goToCart = () => setPage("cart");

  // Finalize the order created before the PayMongo redirect, once we land back on
  // #/payment-success or #/payment-failed (a full page reload — this can't happen
  // synchronously during handlePay, since the browser navigates away first).
  useEffect(() => {
    const pending = loadPendingOrder();
    if (!pending) return;
    if (route === "#/payment-success") {
      markOrderStatus(pending.id, pending.paidStatus, pending.amountPaid);
      clearPendingOrder();
    } else if (route === "#/payment-failed") {
      markOrderStatus(pending.id, "failed");
      clearPendingOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

   if (loading || authLoading) return <LoadingScreen />;

  // ── Route: Admin ──
  const isAdminRoute = route === "#/admin" || route === "#/admin/";
  if (isAdminRoute) {
    if (!isAdminSession)
      return <AdminLogin onLogin={adminSignIn} />;
    return (
      <AdminDashboard
        products={products}
        onUpdate={updateProduct}
        onAdd={addProduct}
        onDelete={deleteProduct}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.hash = "/";
        }}
        onViewStore={() => {
          window.location.hash = "/";
          setPage("shop");
          setActiveCategory("ALL");
        }}
        adminEmail={session?.user?.email || ""}
        onChangeAdminPassword={(oldPass, newPass) =>
          changeOwnPassword(session!.user.email!, oldPass, newPass)
        }
        paymongoPublicKey={paymongoPublicKey}
        onChangePaymongoKey={setPaymongoPublicKey}
      />
    );
  }

  // ── Route: PayMongo redirect-back ──
  if (route === "#/payment-success") {
    return (
      <OrderConfirmedPage
        order={returnOrder}
        onBackToShop={() => {
          window.location.hash = "/";
          setPage("shop");
          setActiveCategory("ALL");
        }}
        onViewOrders={() => {
          window.location.hash = "/";
          setPage("account");
        }}
      />
    );
  }
  if (route === "#/payment-failed") {
    return (
      <PaymentFailedPage
        onRetry={() => {
          window.location.hash = "/";
          // Pre-orders skip the cart, so send them back to the product they were ordering.
          setPage(returnOrder?.preorder && selectedProduct ? "lifesize" : "cart");
        }}
        onBackToShop={() => {
          window.location.hash = "/";
          setPage("shop");
          setActiveCategory("ALL");
        }}
      />
    );
  }

  // ── Route: Customer store ──
  const goToStore = () => {
    setPage("shop");
    setActiveCategory("ALL");
  };
  const returnFromAuth = () => {
    if (authForCheckout) {
      sessionStorage.removeItem("pendingCheckout");
      setAuthForCheckout(false);
      setPage("payment-number");
    } else {
      goToStore();
    }
  };
  const cancelCheckoutAuth = () => {
    sessionStorage.removeItem("pendingCheckout");
    setAuthForCheckout(false);
    goToStore();
  };
  const continueToCheckout = (product: Product, qty: number, option: PaymentOption) => {
    setSelectedProduct(product);
    setOrderQty(qty);
    setCheckoutOption(option);
    if (loggedInCustomer) {
      setPage("payment-number");
      return;
    }
    sessionStorage.setItem("pendingCheckout", JSON.stringify({
      productId: product.id,
      qty,
      paymentOption: option,
    }));
    setAuthForCheckout(true);
    setPage("auth");
  };

  if (page === "auth")
    return (
      <AuthPage
        onLogin={async (email, password) => {
          const res = await customerSignIn(email, password);
          if (res.ok) returnFromAuth();
          return res;
        }}
        onBack={cancelCheckoutAuth}
        onSignUp={async (name, email, password) => {
          const res = await customerSignUp(name, email, password);
          if (res.ok && !res.needsConfirmation) returnFromAuth();
          return res;
        }}
        onForgotPassword={sendPasswordReset}
      />
    );

  if (page === "account" && loggedInCustomer)
    return (
      <CustomerAccountPage
        customer={loggedInCustomer}
        onChangePassword={(oldPass, newPass) =>
          changeOwnPassword(loggedInCustomer.identifier, oldPass, newPass)
        }
        onUpdateContact={async (email, phone) => {
          const { error } = await supabase.auth.updateUser({
            data: { contact_email: email || null, contact_phone: phone || null },
          });
          return error ? { ok: false, error: error.message } : { ok: true };
        }}
        onLogout={async () => {
          await supabase.auth.signOut();
          goToStore();
        }}
        onBack={goToStore}
      />
    );

  if (orderConfirmed)
    return (
      <OrderConfirmedPage
        order={confirmedOrder}
        onBackToShop={() => {
          setOrderConfirmed(false);
          goToStore();
        }}
        onViewOrders={() => {
          setOrderConfirmed(false);
          setPage("account");
        }}
      />
    );

if (page === "shop")
    return (
      <ShopPage
        products={products}
        cartCount={cartCount}
        onProductClick={(p) => {
          setSelectedProduct(p);
          setPage("lifesize");
        }}
        onCartClick={goToCart}
        onAccountClick={() =>
          loggedInCustomer ? setPage("account") : setPage("auth")
        }
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    );

  if (page === "lifesize" && selectedProduct)
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <ShopHeader
          cartCount={cartCount}
          onCartClick={goToCart}
          onAccountClick={() => (loggedInCustomer ? setPage("account") : setPage("auth"))}
          searchQuery=""
          onSearchChange={() => {}}
        />
        
        <div style={{ padding: "16px" }}>
          <button
            onClick={goToStore}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              ...font(13, 700, 2),
              color: C.gold,
              textTransform: "uppercase",
            }}
          >
            <IconArrowLeft c={C.gold} s={16} /> CONTINUE TO SHOP
          </button>
        </div>

        <MadeToOrderProduct
          product={selectedProduct}
          onCheckout={({ paymentOption, qty }) => {
            continueToCheckout(selectedProduct, qty, paymentOption);
          }}
        />
      </div>
    );

  if (page === "cart")
    return (
      <CartPage
        cartItems={cartItems}
        cartCount={cartCount}
        onBack={goToStore}
        onRemove={(id) =>
          setCartItems((prev) => prev.filter((i) => i.product.id !== id))
        }
        onUpdateQty={(id, qty) =>
          setCartItems((prev) =>
            prev.map((i) => (i.product.id === id ? { ...i, qty } : i))
          )
        }
        onCheckout={(product, qty) => {
          continueToCheckout(product, qty, "full");
        }}
        onCartClick={goToCart}
        onAccountClick={() =>
          loggedInCustomer ? setPage("account") : setPage("auth")
        }
      />
    );

  if (page === "product" && selectedProduct)
    return (
      <ProductDetailPage
        product={selectedProduct}
        cartCount={cartCount}
        onBack={goToStore}
        onAddToCart={handleAddToCart}
        onCartClick={goToCart}
        onAccountClick={() =>
          loggedInCustomer ? setPage("account") : setPage("auth")
        }
      />
    );

  if (page === "payment-number" && selectedProduct && authForCheckout && !loggedInCustomer)
    return <LoadingScreen />;

  if (page === "payment-number" && selectedProduct)
    return (
      <PaymentNumberPage
        product={selectedProduct}
        qty={orderQty}
        preorder={isPreOrder(selectedProduct)}
        paymentOption={checkoutOption}
        guest={!loggedInCustomer}
        defaultName={loggedInCustomer?.name ?? ""}
        defaultEmail={loggedInCustomer?.email ?? ""}
        defaultPhone={loggedInCustomer?.phone ?? ""}
        onNext={(m, c) => {
          setPayMethod(m);
          setContact(c);
          setPage("payment-summary");
        }}
        onBack={() => setPage(isPreOrder(selectedProduct) ? "lifesize" : "cart")}
      />
    );

  if (page === "payment-summary" && selectedProduct)
    return (
      <PaymentSummaryPage
        product={selectedProduct}
        qty={orderQty}
        method={payMethod}
        preorder={isPreOrder(selectedProduct)}
        paymentOption={checkoutOption}
        contact={contact}
        paymongoPublicKey={paymongoPublicKey}
        customer={loggedInCustomer ? { id: session!.user.id, name: loggedInCustomer.name, email: loggedInCustomer.email, phone: loggedInCustomer.phone } : null}
        onCreateOrder={createPendingOrder}
        onMarkOrderPaid={(orderId, status, amountPaid) => markOrderStatus(orderId, status, amountPaid)}
        onContinue={(info) => {
          setConfirmedOrder(info);
          setOrderConfirmed(true);
        }}
        onBack={() => setPage("payment-number")}
      />
    );

  return null;
}
