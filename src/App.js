import { useState, useEffect, useMemo, useCallback } from "react";
// import supabase from "./supabaseClient"; // TEMPORARILY DISABLED FOR TESTING
import "./App.css";

// ==================== CONSTANTS ====================
const PAGES = {
  NEW_SALE: "newsale",
  DASHBOARD: "dashboard",
  HISTORY: "history",
  PRODUCTS: "products",
  KHATA: "khata"
};

const INITIAL_PRODUCT = {
  item_number: "",
  item_name: "",
  unit: "piece",
  cost_price: "",
  selling_price: "",
  current_stock: "",
  minimum_stock: "5"
};

const EMPTY_ROW = {
  id: null,
  item_number: "",
  item_name: "",
  quantity: "",
  selling_price: "",
  cost_price: "",
  current_stock: "",
  line_total: 0
};

const DATE_RANGES = {
  TODAY: 'today',
  LAST_2_DAYS: 'last_2_days',
  LAST_WEEK: 'last_week',
  LAST_MONTH: 'last_month',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

// ==================== UTILITY FUNCTIONS ====================
const getDateRangeUtil = (rangeType, customStart, customEnd) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  let start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (rangeType) {
    case DATE_RANGES.TODAY:
      break;
    case DATE_RANGES.LAST_2_DAYS:
      start.setDate(start.getDate() - 1);
      break;
    case DATE_RANGES.LAST_WEEK:
      start.setDate(start.getDate() - 6);
      break;
    case DATE_RANGES.LAST_MONTH:
      start.setDate(start.getDate() - 29);
      break;
    case DATE_RANGES.LAST_YEAR:
      start.setDate(start.getDate() - 364);
      break;
    case DATE_RANGES.CUSTOM:
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
  }

  return { start, end };
};

// ==================== MAIN APP COMPONENT ====================
function App() {
  // Auth state
  // TEMPORARY: Force logged-in state for testing (NO AUTH)
  const [session, setSession] = useState({ user: { id: "test-user", email: "test@test.com" } });
  // const [email, setEmail] = useState(""); // DISABLED
  // const [password, setPassword] = useState(""); // DISABLED

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saleMessage, setSaleMessage] = useState("");
  const [khataMessage, setKhataMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(PAGES.NEW_SALE);

  // Products state
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState(INITIAL_PRODUCT);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState(DATE_RANGES.LAST_MONTH);
  const [analyticsCustomStart, setAnalyticsCustomStart] = useState("");
  const [analyticsCustomEnd, setAnalyticsCustomEnd] = useState("");

  // Sale rows state
  const [saleRows, setSaleRows] = useState([{ ...EMPTY_ROW }]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalAmount, setFinalAmount] = useState("");

  // Autocomplete
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Dashboard state
  const [dashboardDateRange, setDashboardDateRange] = useState(DATE_RANGES.TODAY);
  const [dashboardCustomStart, setDashboardCustomStart] = useState("");
  const [dashboardCustomEnd, setDashboardCustomEnd] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    sales: 0,
    profit: 0,
    transactions: 0,
    cash: 0,
    upi: 0,
    credit: 0
  });

  // Sales chart modal
  const [showSalesChart, setShowSalesChart] = useState(false);
  const [salesChartData, setSalesChartData] = useState(null);
  const [salesChartRange, setSalesChartRange] = useState(DATE_RANGES.LAST_WEEK);
  const [salesChartCustomStart, setSalesChartCustomStart] = useState("");
  const [salesChartCustomEnd, setSalesChartCustomEnd] = useState("");

  // Sales history
  const [salesHistory, setSalesHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState({
    search: "",
    paymentMethod: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetails, setBillDetails] = useState(null);

  // Khata/Credit state
  const [customers, setCustomers] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");

  // Bill Edit & Version History state
  const [editingBill, setEditingBill] = useState(null);
  const [billVersions, setBillVersions] = useState([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editingItems, setEditingItems] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // ==================== AUTH EFFECTS ====================
  /* TEMPORARILY DISABLED - NO AUTH TESTING
  useEffect(() => {
    let mounted = true;

    // Wait for Supabase to initialize before checking session
    const initializeAuth = async () => {
      try {
        // Small delay to ensure Supabase client is ready (fixes race condition)
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mounted) return;

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) setSession(null);
        } else {
          if (mounted) setSession(session);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setSession(null);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

    */// ==================== DATA LOADING EFFECTS ====================
  useEffect(() => {
    if (!session) return;
    loadProducts();
    if (currentPage === PAGES.DASHBOARD) loadDashboardStats();
    if (currentPage === PAGES.HISTORY) loadSalesHistory();
    if (currentPage === PAGES.KHATA) loadCustomers();
  }, [session, currentPage]);

  useEffect(() => {
    if (session && currentPage === PAGES.DASHBOARD) {
      loadDashboardStats();
    }
  }, [dashboardDateRange, dashboardCustomStart, dashboardCustomEnd]);

  useEffect(() => {
    if (selectedProduct) {
      loadProductAnalytics(selectedProduct.id);
    }
  }, [selectedProduct, analyticsDateRange, analyticsCustomStart, analyticsCustomEnd]);

  useEffect(() => {
    if (showSalesChart) {
      loadSalesChartData();
    }
  }, [showSalesChart, salesChartRange, salesChartCustomStart, salesChartCustomEnd]);

  useEffect(() => {
    if (selectedBill) {
      loadBillDetails(selectedBill.id);
    }
  }, [selectedBill]);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerTransactions(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  // ==================== DATA LOADING FUNCTIONS ====================
  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("item_number");
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }, []);

  const loadProductAnalytics = async (productId) => {
    try {
      const { start, end } = getDateRangeUtil(analyticsDateRange, analyticsCustomStart, analyticsCustomEnd);

      const { data: saleItems, error } = await supabase
        .from("sale_items")
        .select("quantity, unit_price, sale_id")
        .eq("product_id", productId);

      if (error) throw error;

      if (!saleItems || saleItems.length === 0) {
        setProductAnalytics({
          salesByDate: {},
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalTransactions: 0,
          dateRange: { start, end }
        });
        return;
      }

      // Get cost price for profit calculation
      const { data: product } = await supabase
        .from("products")
        .select("cost_price")
        .eq("id", productId)
        .single();

      const costPrice = product ? parseFloat(product.cost_price) : 0;

      const saleIds = saleItems.map(item => item.sale_id);
      const { data: sales } = await supabase
        .from("sales")
        .select("id, sale_date")
        .in("id", saleIds)
        .gte("sale_date", start.toISOString())
        .lte("sale_date", end.toISOString());

      if (sales) {
        const salesByDate = {};
        saleItems.forEach(item => {
          const sale = sales.find(s => s.id === item.sale_id);
          if (sale) {
            const date = new Date(sale.sale_date).toLocaleDateString();
            if (!salesByDate[date]) {
              salesByDate[date] = { quantity: 0, revenue: 0, profit: 0 };
            }
            const qty = parseFloat(item.quantity);
            const sp = parseFloat(item.unit_price);
            salesByDate[date].quantity += qty;
            salesByDate[date].revenue += qty * sp;
            salesByDate[date].profit += (sp - costPrice) * qty;
          }
        });

        const totalQuantity = saleItems
          .filter(item => sales.find(s => s.id === item.sale_id))
          .reduce((sum, item) => sum + parseFloat(item.quantity), 0);

        const totalRevenue = saleItems
          .filter(item => sales.find(s => s.id === item.sale_id))
          .reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);

        const totalProfit = saleItems
          .filter(item => sales.find(s => s.id === item.sale_id))
          .reduce((sum, item) => sum + (parseFloat(item.unit_price) - costPrice) * parseFloat(item.quantity), 0);

        setProductAnalytics({
          salesByDate,
          totalQuantity,
          totalRevenue,
          totalProfit,
          totalTransactions: sales.length,
          dateRange: { start, end }
        });
      }
    } catch (error) {
      console.error("Error loading product analytics:", error);
    }
  };

  const loadDashboardStats = useCallback(async () => {
    try {
      const { start, end } = getDateRangeUtil(dashboardDateRange, dashboardCustomStart, dashboardCustomEnd);

      const { data: sales, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", start.toISOString())
        .lte("sale_date", end.toISOString());

      if (error) throw error;

      if (!sales || sales.length === 0) {
        setDashboardStats({
          sales: 0,
          profit: 0,
          transactions: 0,
          cash: 0,
          upi: 0,
          credit: 0
        });
        return;
      }

      const total = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const cash = sales.filter(s => s.payment_method === "cash").reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const upi = sales.filter(s => s.payment_method === "upi").reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const credit = sales.filter(s => s.payment_method === "credit").reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

      const saleIds = sales.map(s => s.id);
      const { data: items } = await supabase
        .from("sale_items")
        .select("quantity, unit_price, product_id")
        .in("sale_id", saleIds);

      let profit = 0;
      if (items && items.length > 0) {
        const productIds = [...new Set(items.map(item => item.product_id))];
        const { data: productsData } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", productIds);

        profit = items.reduce((sum, item) => {
          const product = productsData?.find(p => p.id === item.product_id);
          const costPrice = product ? parseFloat(product.cost_price) || 0 : 0;
          const sellingPrice = parseFloat(item.unit_price);
          const quantity = parseFloat(item.quantity);
          return sum + ((sellingPrice - costPrice) * quantity);
        }, 0);
      }

      setDashboardStats({
        sales: total,
        profit,
        transactions: sales.length,
        cash,
        upi,
        credit
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }, [dashboardDateRange, dashboardCustomStart, dashboardCustomEnd]);

  const loadSalesChartData = useCallback(async () => {
    try {
      const { start, end } = getDateRangeUtil(salesChartRange, salesChartCustomStart, salesChartCustomEnd);

      const { data: sales, error } = await supabase
        .from("sales")
        .select("sale_date, total_amount, id")
        .gte("sale_date", start.toISOString())
        .lte("sale_date", end.toISOString())
        .order("sale_date", { ascending: true });

      if (error) throw error;

      if (sales) {
        // Fetch all sale items for profit calculation
        const saleIds = sales.map(s => s.id);
        const { data: items } = await supabase
          .from("sale_items")
          .select("quantity, unit_price, product_id, sale_id")
          .in("sale_id", saleIds);

        const { data: productsData } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", [...new Set(items?.map(item => item.product_id) || [])]);

        const salesByDate = {};
        sales.forEach(sale => {
          const date = new Date(sale.sale_date).toLocaleDateString();
          if (!salesByDate[date]) {
            salesByDate[date] = { amount: 0, count: 0, profit: 0 };
          }

          // Calculate profit for this sale
          const saleItems = items?.filter(item => item.sale_id === sale.id) || [];
          let saleProfit = 0;
          saleItems.forEach(item => {
            const product = productsData?.find(p => p.id === item.product_id);
            const costPrice = product ? parseFloat(product.cost_price) : 0;
            const sellingPrice = parseFloat(item.unit_price);
            const quantity = parseFloat(item.quantity);
            saleProfit += (sellingPrice - costPrice) * quantity;
          });

          salesByDate[date].amount += parseFloat(sale.total_amount);
          salesByDate[date].count += 1;
          salesByDate[date].profit += saleProfit;
        });

        const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
        let totalProfit = 0;
        Object.values(salesByDate).forEach(day => {
          totalProfit += day.profit;
        });
        const totalCount = sales.length;

        setSalesChartData({
          salesByDate,
          totalAmount,
          totalCount,
          totalProfit,
          dateRange: { start, end }
        });
      }
    } catch (error) {
      console.error("Error loading sales chart data:", error);
    }
  }, [salesChartRange, salesChartCustomStart, salesChartCustomEnd]);

  const loadSalesHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setSalesHistory(data);
    } catch (error) {
      console.error("Error loading sales history:", error);
    }
  }, []);

  const loadBillDetails = async (saleId) => {
    try {
      const { data: items, error } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId)
        .order("item_number");

      if (error) throw error;
      if (items) setBillDetails(items);
    } catch (error) {
      console.error("Error loading bill details:", error);
    }
  };

  const loadBillVersions = async (saleId) => {
    setLoadingVersions(true);
    try {
      const { data, error } = await supabase
        .from("bill_history")
        .select("*")
        .eq("sale_id", saleId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      if (data) setBillVersions(data);
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  }, []);

  const loadCustomerTransactions = async (customerId) => {
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      if (data) setCustomerTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  // ==================== BILL EDITING FUNCTIONS ====================
  const startEditBill = (bill, items) => {
    setEditingBill(bill);
    setEditingItems(items.map(item => ({
      ...item,
      product_id: item.product_id || item.id,
      editing: false
    })));
    setEditReason("");
  };

  const updateEditingItem = (index, field, value) => {
    setEditingItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeEditingItem = (index) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveBillEdit = async () => {
    if (!editReason.trim()) {
      alert("Please enter a reason for editing this bill");
      return;
    }

    if (editingItems.length === 0) {
      alert("Bill must have at least one item");
      return;
    }

    setLoading(true);

    try {
      const newTotal = editingItems.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
      );

      const { data: versionData } = await supabase
        .from("bill_history")
        .select("version_number")
        .eq("sale_id", editingBill.id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = versionData && versionData.length > 0 ? versionData[0].version_number + 1 : 2;

      await supabase.from("bill_history").insert({
        sale_id: editingBill.id,
        version_number: nextVersion,
        bill_number: editingBill.bill_number,
        customer_name: editingBill.customer_name,
        customer_phone: editingBill.customer_phone,
        payment_method: editingBill.payment_method,
        payment_status: editingBill.payment_status,
        total_amount: newTotal,
        discount: editingBill.discount,
        items: editingItems,
        edited_by: session.user.email,
        edit_reason: editReason,
        is_original: false
      });

      await supabase.from("sale_items").delete().eq("sale_id", editingBill.id);

      const newItems = editingItems.map(item => ({
        sale_id: editingBill.id,
        product_id: item.product_id,
        item_number: item.item_number,
        item_name: item.item_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }));

      await supabase.from("sale_items").insert(newItems);

      await supabase
        .from("sales")
        .update({
          total_amount: newTotal,
          edited_count: (editingBill.edited_count || 0) + 1,
          last_edited_at: new Date().toISOString(),
          last_edited_by: session.user.email
        })
        .eq("id", editingBill.id);

      alert("✅ Bill updated successfully!");
      setEditingBill(null);
      setEditingItems([]);
      setEditReason("");
      loadSalesHistory();
      setSelectedBill(null);
    } catch (error) {
      console.error("Error saving bill edit:", error);
      alert("❌ Error updating bill");
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (version) => {
    if (!window.confirm(`Restore bill to version ${version.version_number}?`)) return;

    setLoading(true);

    try {
      const items = typeof version.items === 'string' ? JSON.parse(version.items) : version.items;

      await supabase.from("sale_items").delete().eq("sale_id", version.sale_id);

      const restoredItems = items.map(item => ({
        sale_id: version.sale_id,
        product_id: item.product_id,
        item_number: item.item_number,
        item_name: item.item_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }));

      await supabase.from("sale_items").insert(restoredItems);

      await supabase
        .from("sales")
        .update({
          total_amount: version.total_amount,
          discount: version.discount,
          edited_count: (editingBill.edited_count || 0) + 1,
          last_edited_at: new Date().toISOString(),
          last_edited_by: session.user.email
        })
        .eq("id", version.sale_id);

      const { data: versionData } = await supabase
        .from("bill_history")
        .select("version_number")
        .eq("sale_id", version.sale_id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = versionData[0].version_number + 1;

      await supabase.from("bill_history").insert({
        sale_id: version.sale_id,
        version_number: nextVersion,
        bill_number: version.bill_number,
        customer_name: version.customer_name,
        customer_phone: version.customer_phone,
        payment_method: version.payment_method,
        payment_status: version.payment_status,
        total_amount: version.total_amount,
        discount: version.discount,
        items: items,
        edited_by: session.user.email,
        edit_reason: `Restored to version ${version.version_number}`,
        is_original: false
      });

      alert("✅ Bill restored successfully!");
      setShowVersionHistory(false);
      loadSalesHistory();
      setSelectedBill(null);
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("❌ Error restoring bill");
    } finally {
      setLoading(false);
    }
  };

  // ==================== KHATA/CREDIT FUNCTIONS ====================
  const addCustomer = useCallback(async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      setKhataMessage("❌ Name and phone are required!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("customers").insert([{
        name: newCustomer.name,
        phone: newCustomer.phone,
        total_credit: 0,
        total_paid: 0,
        outstanding_balance: 0,
        created_by: session.user.email
      }]);

      if (error) throw error;

      setKhataMessage("✅ Customer added!");
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "" });
      loadCustomers();
    } catch (error) {
      setKhataMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [newCustomer, session, loadCustomers]);

  const addCreditSale = useCallback(async (customerId, amount, saleId) => {
    try {
      await supabase.from("credit_transactions").insert([{
        customer_id: customerId,
        transaction_type: "credit_sale",
        amount: amount,
        description: `Credit sale - Bill #${saleId}`,
        sale_id: saleId,
        created_by: session.user.email
      }]);

      const { data: customer } = await supabase
        .from("customers")
        .select("total_credit, outstanding_balance")
        .eq("id", customerId)
        .single();

      if (customer) {
        await supabase
          .from("customers")
          .update({
            total_credit: parseFloat(customer.total_credit) + amount,
            outstanding_balance: parseFloat(customer.outstanding_balance) + amount
          })
          .eq("id", customerId);
      }
    } catch (error) {
      console.error("Error creating credit sale:", error);
    }
  }, [session]);

  const recordPayment = useCallback(async () => {
    if (!selectedCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setKhataMessage("❌ Enter valid payment amount!");
      return;
    }

    setLoading(true);

    try {
      const amount = parseFloat(paymentAmount);

      await supabase.from("credit_transactions").insert([{
        customer_id: selectedCustomer.id,
        transaction_type: "payment",
        amount: amount,
        description: paymentDescription || "Payment received",
        created_by: session.user.email
      }]);

      const newPaid = parseFloat(selectedCustomer.total_paid) + amount;
      const newBalance = parseFloat(selectedCustomer.outstanding_balance) - amount;

      await supabase
        .from("customers")
        .update({
          total_paid: newPaid,
          outstanding_balance: newBalance
        })
        .eq("id", selectedCustomer.id);

      setKhataMessage("✅ Payment recorded!");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentDescription("");
      loadCustomers();
      loadCustomerTransactions(selectedCustomer.id);
    } catch (error) {
      setKhataMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, paymentAmount, paymentDescription, session, loadCustomers]);

  // ==================== AUTH HANDLERS ====================
  const handleAuth = useCallback(async (e, isSignup) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const authFunc = isSignup ? supabase.auth.signUp : supabase.auth.signInWithPassword;
      const { error } = await authFunc({ email, password });

      if (error) throw error;

      setMessage(isSignup ? "✅ Check your email to confirm!" : "✅ Login successful!");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSaleRows([{ ...EMPTY_ROW }]);
  }, []);

  // ==================== SALE ROW HANDLERS ====================
  const updateRow = useCallback((index, field, value) => {
    setSaleRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'item_number' && value) {
        const matches = products.filter(p => p.item_number.toString().startsWith(value.toString()));
        if (matches.length > 0) {
          setSuggestions(matches.slice(0, 10));
          setActiveRowIndex(index);
        } else {
          setSuggestions([]);
        }
      } else if (field === 'item_name' && value) {
        const matches = products.filter(p => p.item_name.toLowerCase().includes(value.toLowerCase()));
        if (matches.length > 0) {
          setSuggestions(matches.slice(0, 10));
          setActiveRowIndex(index);
        } else {
          setSuggestions([]);
        }
      }

      if (updated[index].quantity && updated[index].selling_price) {
        updated[index].line_total = parseFloat(updated[index].quantity) * parseFloat(updated[index].selling_price);
      }

      if (index === prev.length - 1 && (updated[index].item_number || updated[index].item_name)) {
        updated.push({ ...EMPTY_ROW });
      }

      return updated;
    });
  }, [products]);

  const selectProduct = useCallback((rowIndex, product) => {
    setSaleRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        id: product.id,
        item_number: product.item_number,
        item_name: product.item_name,
        selling_price: product.selling_price,
        cost_price: product.cost_price || 0,
        current_stock: product.current_stock,
        quantity: updated[rowIndex].quantity || "1"
      };

      if (updated[rowIndex].quantity) {
        updated[rowIndex].line_total = parseFloat(updated[rowIndex].quantity) * parseFloat(product.selling_price);
      }

      return updated;
    });

    setSuggestions([]);
    setActiveRowIndex(null);
  }, []);

  const removeRow = useCallback((index) => {
    setSaleRows(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length === 0 ? [{ ...EMPTY_ROW }] : updated;
    });
  }, []);

  const clearAllRows = useCallback(() => {
    setSaleRows([{ ...EMPTY_ROW }]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setDiscountPercent(0);
    setFinalAmount("");
    setSaleMessage("");
  }, []);

  // ==================== CALCULATIONS ====================
  const getSubtotal = useCallback(() => {
    return saleRows.reduce((sum, row) => sum + (row.line_total || 0), 0);
  }, [saleRows]);

  const getDiscountAmount = useCallback(() => {
    const subtotal = getSubtotal();
    return (subtotal * discountPercent) / 100;
  }, [getSubtotal, discountPercent]);

  const calculateTotal = useCallback(() => {
    const subtotal = getSubtotal();
    return subtotal - getDiscountAmount();
  }, [getSubtotal, getDiscountAmount]);

  const handleDiscountPercentChange = (value) => {
    const percent = parseFloat(value) || 0;
    setDiscountPercent(percent);
    setFinalAmount("");
  };

  const handleFinalAmountChange = (value) => {
    const final = parseFloat(value) || 0;
    setFinalAmount(value);

    const subtotal = getSubtotal();
    if (subtotal > 0 && final < subtotal) {
      const discountAmt = subtotal - final;
      const percent = (discountAmt / subtotal) * 100;
      setDiscountPercent(parseFloat(percent.toFixed(2)));
    } else if (final >= subtotal) {
      setDiscountPercent(0);
    }
  };

  const getDisplayTotal = () => {
    if (finalAmount && parseFloat(finalAmount) > 0) {
      return parseFloat(finalAmount).toFixed(2);
    }
    return calculateTotal().toFixed(2);
  };

  // ==================== SAVE SALE ====================
  const saveSale = useCallback(async () => {
    const validRows = saleRows.filter(row => row.id && row.quantity && row.quantity > 0);

    if (validRows.length === 0) {
      setSaleMessage("❌ Please add at least one item!");
      return;
    }

    setLoading(true);

    try {
      const { data: billData } = await supabase.rpc("generate_bill_number");
      const billNumber = billData || "KIR0001";

      const finalTotal = finalAmount && parseFloat(finalAmount) > 0 ? parseFloat(finalAmount) : calculateTotal();
      const discountAmt = getSubtotal() - finalTotal;

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([{
          bill_number: billNumber,
          customer_name: customerName || "Walk-in",
          customer_phone: customerPhone,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "credit" ? "pending" : "paid",
          total_amount: finalTotal,
          discount: discountAmt,
          created_by: session.user.email
        }])
        .select();

      if (saleError) throw saleError;

      const saleItems = validRows.map(row => ({
        sale_id: saleData[0].id,
        product_id: row.id,
        item_number: row.item_number,
        item_name: row.item_name,
        quantity: parseFloat(row.quantity),
        unit_price: parseFloat(row.selling_price)
      }));

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);

      if (itemsError) throw itemsError;

      await Promise.all(validRows.map(row =>
        supabase.from("products").update({ 
          current_stock: row.current_stock - parseFloat(row.quantity) 
        }).eq("id", row.id)
      ));

      if (paymentMethod === "credit" && customerPhone) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("*")
          .eq("phone", customerPhone)
          .single();

        let customerId;
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCust } = await supabase
            .from("customers")
            .insert([{
              name: customerName || "Walk-in",
              phone: customerPhone,
              total_credit: 0,
              total_paid: 0,
              outstanding_balance: 0,
              created_by: session.user.email
            }])
            .select()
            .single();
          customerId = newCust.id;
        }

        await addCreditSale(customerId, finalTotal, saleData[0].id);
      }

      setSaleMessage(`✅ Bill #${billNumber} saved! Total: ₹${finalTotal.toFixed(2)}`);
      clearAllRows();
      loadProducts();
    } catch (error) {
      setSaleMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [saleRows, customerName, customerPhone, paymentMethod, discountPercent, finalAmount, calculateTotal, getSubtotal, session, loadProducts, clearAllRows, addCreditSale]);

  // ==================== WHATSAPP INTEGRATION ====================
  const sendBillToWhatsApp = useCallback((billNumber, phoneNumber, customerName, items, total, discount) => {
    // Format phone number - remove any spaces, dashes, or special characters
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // Build the bill message
    let message = `🧾 *BILL ${billNumber}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `📅 Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}\n`;
    message += `👤 Customer: ${customerName || 'Walk-in'}\n\n`;

    message += `*ITEMS:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.item_name}\n`;
      message += `   ${item.quantity} x ₹${parseFloat(item.unit_price).toFixed(2)} = ₹${(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)}\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━\n`;

    const subtotalAmount = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
    message += `Subtotal: ₹${subtotalAmount.toFixed(2)}\n`;

    if (parseFloat(discount) > 0) {
      message += `Discount: -₹${parseFloat(discount).toFixed(2)}\n`;
    }

    message += `\n*TOTAL: ₹${parseFloat(total).toFixed(2)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for your business! 🙏`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL with phone number and message
    // Format: https://wa.me/PHONE?text=MESSAGE
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;

    // Open WhatsApp in new tab/window
    window.open(whatsappUrl, '_blank');
  }, []);

  // ==================== PRODUCT MANAGEMENT ====================
  const addProduct = useCallback(async () => {
    if (!newProduct.item_number || !newProduct.item_name || !newProduct.selling_price) {
      setMessage("❌ Fill required fields!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("products").insert([{
        item_number: parseInt(newProduct.item_number),
        item_name: newProduct.item_name,
        unit: newProduct.unit,
        cost_price: parseFloat(newProduct.cost_price) || 0,
        selling_price: parseFloat(newProduct.selling_price),
        current_stock: parseFloat(newProduct.current_stock) || 0,
        minimum_stock: parseFloat(newProduct.minimum_stock) || 5
      }]);

      if (error) throw error;

      setMessage("✅ Product added!");
      setShowAddProduct(false);
      setNewProduct(INITIAL_PRODUCT);
      loadProducts();
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [newProduct, loadProducts]);

  const updateProduct = useCallback(async (product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          selling_price: product.selling_price, 
          current_stock: product.current_stock,
          item_name: product.item_name,
          cost_price: product.cost_price
        })
        .eq("id", product.id);

      if (error) throw error;

      setMessage("✅ Updated!");
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      setMessage("❌ Error");
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      setMessage("✅ Deleted");
      loadProducts();
    } catch (error) {
      setMessage("❌ Error");
    }
  }, [loadProducts]);

  // ==================== FILTERED HISTORY ====================
  const filteredHistory = useMemo(() => {
    return salesHistory.filter(sale => {
      const matchesSearch = sale.bill_number.toLowerCase().includes(historyFilter.search.toLowerCase()) ||
                           sale.customer_name.toLowerCase().includes(historyFilter.search.toLowerCase());
      const matchesPayment = historyFilter.paymentMethod === "all" || sale.payment_method === historyFilter.paymentMethod;

      let matchesDate = true;
      if (historyFilter.dateFrom) {
        matchesDate = matchesDate && new Date(sale.sale_date) >= new Date(historyFilter.dateFrom);
      }
      if (historyFilter.dateTo) {
        const dateTo = new Date(historyFilter.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(sale.sale_date) <= dateTo;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [salesHistory, historyFilter]);

  // ==================== LOGIN SCREEN ====================
  if (!session) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Kirana Shop</h1>
          <p>Sign in to continue</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={e => handleAuth(e, false)} disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
          <button onClick={e => handleAuth(e, true)} disabled={loading} className="secondary">
            {loading ? "Loading..." : "Sign Up"}
          </button>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  // ==================== MAIN APP RENDER ====================
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Kirana Shop</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <nav className="app-nav">
        {Object.entries(PAGES).map(([key, value]) => (
          <button
            key={value}
            onClick={() => setCurrentPage(value)}
            className={currentPage === value ? "active" : ""}
          >
            {key === "NEW_SALE" && "New Sale"}
            {key === "DASHBOARD" && "Dashboard"}
            {key === "HISTORY" && "History"}
            {key === "PRODUCTS" && "Products"}
            {key === "KHATA" && "Khata"}
          </button>
        ))}
      </nav>

      <main className="app-content">
        {currentPage === PAGES.NEW_SALE && (
          <NewSalePage
            saleRows={saleRows}
            updateRow={updateRow}
            selectProduct={selectProduct}
            removeRow={removeRow}
            clearAllRows={clearAllRows}
            suggestions={suggestions}
            activeRowIndex={activeRowIndex}
            setSuggestions={setSuggestions}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            discountPercent={discountPercent}
            handleDiscountPercentChange={handleDiscountPercentChange}
            finalAmount={finalAmount}
            handleFinalAmountChange={handleFinalAmountChange}
            getSubtotal={getSubtotal}
            getDiscountAmount={getDiscountAmount}
            getDisplayTotal={getDisplayTotal}
            saveSale={saveSale}
            loading={loading}
            saleMessage={saleMessage}
          />
        )}

        {currentPage === PAGES.DASHBOARD && (
          <DashboardPage
            stats={dashboardStats}
            dateRange={dashboardDateRange}
            setDateRange={setDashboardDateRange}
            customStart={dashboardCustomStart}
            setCustomStart={setDashboardCustomStart}
            customEnd={dashboardCustomEnd}
            setCustomEnd={setDashboardCustomEnd}
            onShowChart={() => setShowSalesChart(true)}
          />
        )}

        {currentPage === PAGES.HISTORY && (
          <HistoryPage
            salesHistory={filteredHistory}
            historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter}
            onSelectBill={setSelectedBill}
          />
        )}

        {currentPage === PAGES.PRODUCTS && (
          <ProductsPage
            products={products}
            showAddProduct={showAddProduct}
            setShowAddProduct={setShowAddProduct}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            addProduct={addProduct}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            setSelectedProduct={setSelectedProduct}
            loading={loading}
            message={message}
          />
        )}

        {currentPage === PAGES.KHATA && (
          <KhataPage
            customers={customers}
            showAddCustomer={showAddCustomer}
            setShowAddCustomer={setShowAddCustomer}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            addCustomer={addCustomer}
            setSelectedCustomer={setSelectedCustomer}
            loading={loading}
            message={khataMessage}
          />
        )}
      </main>

      {selectedProduct && (
        <ProductAnalyticsModal
          product={selectedProduct}
          analytics={productAnalytics}
          dateRange={analyticsDateRange}
          setDateRange={setAnalyticsDateRange}
          customStart={analyticsCustomStart}
          setCustomStart={setAnalyticsCustomStart}
          customEnd={analyticsCustomEnd}
          setCustomEnd={setAnalyticsCustomEnd}
          onClose={() => {
            setSelectedProduct(null);
            setProductAnalytics(null);
          }}
        />
      )}

      {showSalesChart && (
        <SalesChartModal
          chartData={salesChartData}
          dateRange={salesChartRange}
          setDateRange={setSalesChartRange}
          customStart={salesChartCustomStart}
          setCustomStart={setSalesChartCustomStart}
          customEnd={salesChartCustomEnd}
          setCustomEnd={setSalesChartCustomEnd}
          onClose={() => setShowSalesChart(false)}
        />
      )}

      {selectedBill && billDetails && (
        <BillDetailsModal
          bill={selectedBill}
          items={billDetails}
          onClose={() => {
            setSelectedBill(null);
            setBillDetails(null);
          }}
          editingBill={editingBill}
          startEditBill={startEditBill}
          editingItems={editingItems}
          updateEditingItem={updateEditingItem}
          removeEditingItem={removeEditingItem}
          editReason={editReason}
          setEditReason={setEditReason}
          saveBillEdit={saveBillEdit}
          setEditingBill={setEditingBill}
          setEditingItems={setEditingItems}
          showVersionHistory={showVersionHistory}
          setShowVersionHistory={setShowVersionHistory}
          loadBillVersions={loadBillVersions}
          billVersions={billVersions}
          loadingVersions={loadingVersions}
          restoreVersion={restoreVersion}
          loading={loading}
        />
      )}

      {selectedCustomer && (
        <CustomerTransactionsModal
          customer={selectedCustomer}
          transactions={customerTransactions}
          onClose={() => {
            setSelectedCustomer(null);
            setCustomerTransactions([]);
          }}
          onPayment={() => setShowPaymentModal(true)}
        />
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
                <input
                  placeholder="Description (optional)"
                  value={paymentDescription}
                  onChange={e => setPaymentDescription(e.target.value)}
                />
                <button onClick={recordPayment} disabled={loading}>
                  {loading ? "Recording..." : "Record Payment"}
                </button>
              </div>
              {khataMessage && <p className="status-message">{khataMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENT DEFINITIONS ====================

const getRangeLabel = (range) => {
  switch (range) {
    case 'today': return "Today";
    case 'last_2_days': return "Last 2 Days";
    case 'last_week': return "Last 7 Days";
    case 'last_month': return "Last 30 Days";
    case 'last_year': return "Last Year";
    case 'custom': return "Custom Range";
    default: return "";
  }
};

const SalesChartModal = ({ chartData, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd, onClose }) => {
  if (!chartData) return null;

  const allDates = Object.keys(chartData.salesByDate).sort((a, b) => new Date(a) - new Date(b));
  const maxAmount = Math.max(...allDates.map(date => chartData.salesByDate[date].amount), 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Sales Overview</h2>
            <p>{getRangeLabel(dateRange)}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="date-range-selector">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="range-select">
              <option value="today">Today</option>
              <option value="last_2_days">Last 2 Days</option>
              <option value="last_week">Last 7 Days</option>
              <option value="last_month">Last 30 Days</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateRange === 'custom' && (
              <div className="custom-date-inputs">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="date-input" />
                <span>to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="date-input" />
              </div>
            )}
          </div>
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <div className="stat-value">₹{chartData.totalAmount.toFixed(2)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">₹{chartData.totalProfit?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">Total Profit</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">{chartData.totalCount}</div>
              <div className="stat-label">Transactions</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">₹{(chartData.totalAmount / chartData.totalCount).toFixed(2)}</div>
              <div className="stat-label">Avg Transaction</div>
            </div>
          </div>
          <div className="chart-container">
            <h3>Daily Sales</h3>
            <div className="bar-chart">
              {allDates.length > 0 ? allDates.map(date => {
                const amount = chartData.salesByDate[date].amount;
                const profit = chartData.salesByDate[date].profit || 0;
                const height = (amount / maxAmount) * 100;
                const profitHeight = (profit / amount) * 100;
                return (
                  <div key={date} className="bar-wrapper">
                    <div className="bar-label-top">₹{amount.toFixed(0)}</div>
                    <div className="bar" style={{ height: `${height}%` }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '4px 4px 0 0',
                        background: `linear-gradient(to top, #10B981 0%, #10B981 ${profitHeight}%, #111827 ${profitHeight}%, #111827 100%)`
                      }}></div>
                    </div>
                    <div className="bar-label">
                      {new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                );
              }) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No sales data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillDetailsModal = ({ 
  bill, 
  items, 
  onClose, 
  editingBill, 
  startEditBill, 
  editingItems, 
  updateEditingItem, 
  removeEditingItem, 
  editReason, 
  setEditReason, 
  saveBillEdit, 
  setEditingBill, 
  setEditingItems, 
  showVersionHistory, 
  setShowVersionHistory, 
  loadBillVersions, 
  billVersions, 
  loadingVersions, 
  restoreVersion, 
  loading 
}) => {
  if (!items) return null;

  const billDate = new Date(bill.sale_date);
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
  const isEdited = bill.edited_count && bill.edited_count > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bill-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              Bill #{bill.bill_number}
              {isEdited && <span className="status-badge pending" style={{marginLeft: '12px'}}>Edited {bill.edited_count}x</span>}
            </h2>
            <p>{billDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</p>
            {isEdited && bill.last_edited_at && (
              <p style={{fontSize: '12px', color: '#6B7280', marginTop: '4px'}}>
                Last edited: {new Date(bill.last_edited_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="bill-info">
            <div className="info-row"><span>Customer:</span><strong>{bill.customer_name}</strong></div>
            {bill.customer_phone && (<div className="info-row"><span>Phone:</span><strong>{bill.customer_phone}</strong></div>)}
            <div className="info-row"><span>Payment:</span><span className={`payment-badge ${bill.payment_method}`}>{bill.payment_method}</span></div>
            <div className="info-row"><span>Status:</span><span className={`status-badge ${bill.payment_status}`}>{bill.payment_status}</span></div>
          </div>

          {!editingBill && !showVersionHistory && (
            <div style={{display: 'flex', gap: '12px', marginBottom: '24px'}}>
              <button 
                onClick={() => startEditBill(bill, items)}
                style={{
                  padding: '10px 20px',
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit Bill
              </button>
              <button 
                onClick={() => {
                  loadBillVersions(bill.id);
                  setShowVersionHistory(true);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📜 Version History
              </button>
            </div>
          )}

          {editingBill && editingBill.id === bill.id ? (
            <div>
              <h3 style={{marginBottom: '16px'}}>Edit Bill Items</h3>
              <table className="bill-table">
                <thead>
                  <tr><th>#</th><th>Item Name</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {editingItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_number}</td>
                      <td>{item.item_name}</td>
                      <td>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateEditingItem(index, 'quantity', e.target.value)}
                          style={{width: '60px', padding: '4px', border: '1px solid #E5E7EB', borderRadius: '4px'}}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={item.unit_price}
                          onChange={(e) => updateEditingItem(index, 'unit_price', e.target.value)}
                          style={{width: '80px', padding: '4px', border: '1px solid #E5E7EB', borderRadius: '4px'}}
                        />
                      </td>
                      <td>₹{(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => removeEditingItem(index)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop: '16px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                  Edit Reason (Required):
                </label>
                <input 
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Quantity correction, Price update..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    marginBottom: '16px'
                  }}
                />
                <div style={{display: 'flex', gap: '12px'}}>
                  <button 
                    onClick={saveBillEdit}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingBill(null);
                      setEditingItems([]);
                      setEditReason("");
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : showVersionHistory ? (
            <div>
              <h3 style={{marginBottom: '16px'}}>Version History</h3>
              {loadingVersions ? (
                <p>Loading versions...</p>
              ) : billVersions.length === 0 ? (
                <p>No edit history available</p>
              ) : (
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                  {billVersions.map(version => {
                    const versionItems = typeof version.items === 'string' ? JSON.parse(version.items) : version.items;
                    return (
                      <div key={version.id} style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        background: version.is_original ? '#F0FDF4' : 'white'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                          <div>
                            <strong>Version {version.version_number}</strong>
                            {version.is_original && <span style={{marginLeft: '8px', fontSize: '16px'}}>⭐</span>}
                            <div style={{fontSize: '12px', color: '#6B7280', marginTop: '4px'}}>
                              {new Date(version.edited_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                            </div>
                            <div style={{fontSize: '12px', color: '#6B7280'}}>
                              By: {version.edited_by}
                            </div>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <div style={{fontSize: '18px', fontWeight: '700'}}>₹{parseFloat(version.total_amount).toFixed(2)}</div>
                            {!version.is_original && (
                              <button 
                                onClick={() => restoreVersion(version)}
                                style={{
                                  marginTop: '8px',
                                  padding: '6px 12px',
                                  background: '#F59E0B',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </div>
                        {version.edit_reason && (
                          <div style={{
                            padding: '8px 12px',
                            background: '#FEF3C7',
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginBottom: '12px'
                          }}>
                            <strong>Reason:</strong> {version.edit_reason}
                          </div>
                        )}
                        <div style={{fontSize: '13px'}}>
                          <strong>Items ({versionItems.length}):</strong>
                          <ul style={{marginTop: '4px', marginLeft: '20px'}}>
                            {versionItems.slice(0, 3).map((item, idx) => (
                              <li key={idx}>{item.item_name} × {item.quantity}</li>
                            ))}
                            {versionItems.length > 3 && <li>... and {versionItems.length - 3} more</li>}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button 
                onClick={() => setShowVersionHistory(false)}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Back to Bill
              </button>
            </div>
          ) : (
            <>
              <div className="bill-items">
                <h3>Items</h3>
                <table className="bill-table">
                  <thead>
                    <tr><th>#</th><th>Item Name</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.item_number}</td>
                        <td>{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>₹{(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bill-summary">
                <div className="summary-row"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                {parseFloat(bill.discount) > 0 && (
                  <div className="summary-row discount"><span>Discount:</span><span>-₹{parseFloat(bill.discount).toFixed(2)}</span></div>
                )}
                <div className="summary-row total"><span>Total:</span><span>₹{parseFloat(bill.total_amount).toFixed(2)}</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductAnalyticsModal = ({ product, analytics, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd, onClose }) => {
  if (!analytics) return null;

  const allDates = Object.keys(analytics.salesByDate).sort((a, b) => new Date(a) - new Date(b));
  const maxQuantity = Math.max(...allDates.map(date => analytics.salesByDate[date].quantity), 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{product.item_name}</h2>
            <p>Item #{product.item_number} - {getRangeLabel(dateRange)}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="date-range-selector">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="range-select">
              <option value="today">Today</option>
              <option value="last_2_days">Last 2 Days</option>
              <option value="last_week">Last 7 Days</option>
              <option value="last_month">Last 30 Days</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateRange === 'custom' && (
              <div className="custom-date-inputs">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="date-input" />
                <span>to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="date-input" />
              </div>
            )}
          </div>
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <div className="stat-value">{analytics.totalQuantity}</div>
              <div className="stat-label">Units Sold</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">₹{analytics.totalRevenue.toFixed(2)}</div>
              <div className="stat-label">Revenue</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">₹{analytics.totalProfit?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">Profit</div>
            </div>
            <div className="analytics-stat-card">
              <div className="stat-value">{analytics.totalTransactions}</div>
              <div className="stat-label">Transactions</div>
            </div>
          </div>
          <div className="chart-container">
            <h3>Daily Sales</h3>
            <div className="bar-chart">
              {allDates.length > 0 ? allDates.map(date => {
                const revenue = analytics.salesByDate[date].revenue;
                const profit = analytics.salesByDate[date].profit || 0;
                const maxRevenue = Math.max(...allDates.map(d => analytics.salesByDate[d].revenue), 1);
                const height = (revenue / maxRevenue) * 100;
                const profitHeight = (profit / revenue) * 100;
                return (
                  <div key={date} className="bar-wrapper">
                    <div className="bar-label-top">₹{revenue.toFixed(0)}</div>
                    <div className="bar" style={{ height: `${height}%` }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '4px 4px 0 0',
                        background: `linear-gradient(to top, #10B981 0%, #10B981 ${profitHeight}%, #111827 ${profitHeight}%, #111827 100%)`
                      }}></div>
                    </div>
                    <div className="bar-label">
                      {new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                );
              }) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No sales data available</p>
              )}
            </div>
          </div>
          <div className="product-details">
            <div className="detail-row"><span>Cost Price:</span><strong>₹{product.cost_price}</strong></div>
            <div className="detail-row"><span>Selling Price:</span><strong>₹{product.selling_price}</strong></div>
            <div className="detail-row">
              <span>Current Stock:</span>
              <strong className={product.current_stock < product.minimum_stock ? "low-stock" : ""}>
                {product.current_stock} {product.unit}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerTransactionsModal = ({ customer, transactions, onClose, onPayment }) => {
  if (!transactions) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{customer.name}</h2>
            <p>{customer.phone}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="customer-balance-card">
            <div className="balance-item">
              <span>Total Credit:</span>
              <strong>₹{parseFloat(customer.total_credit).toFixed(2)}</strong>
            </div>
            <div className="balance-item">
              <span>Total Paid:</span>
              <strong className="paid">₹{parseFloat(customer.total_paid).toFixed(2)}</strong>
            </div>
            <div className="balance-item outstanding">
              <span>Outstanding:</span>
              <strong>₹{parseFloat(customer.outstanding_balance).toFixed(2)}</strong>
            </div>
          </div>
          <button onClick={onPayment} className="payment-btn">Record Payment</button>
          <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Transaction History</h3>
          <div className="transactions-list">
            {transactions.length > 0 ? transactions.map(trans => {
              const transDate = new Date(trans.transaction_date);
              return (
                <div key={trans.id} className="transaction-item">
                  <div className="trans-left">
                    <span className={`trans-type ${trans.transaction_type}`}>
                      {trans.transaction_type === 'credit_sale' ? '📤 Credit Sale' : '💰 Payment'}
                    </span>
                    <span className="trans-date">
                      {transDate.toLocaleString('en-IN', { 
                        timeZone: 'Asia/Kolkata', 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric', 
                        hour: 'numeric', 
                        minute: 'numeric', 
                        hour12: true 
                      })}
                    </span>
                  </div>
                  <div className="trans-right">
                    <span className={`trans-amount ${trans.transaction_type}`}>
                      {trans.transaction_type === 'credit_sale' ? '+' : '-'}₹{parseFloat(trans.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NewSalePage = ({ 
  saleRows, updateRow, selectProduct, removeRow, clearAllRows, suggestions, 
  activeRowIndex, setSuggestions, customerName, setCustomerName, customerPhone, 
  setCustomerPhone, paymentMethod, setPaymentMethod, discountPercent, 
  handleDiscountPercentChange, finalAmount, handleFinalAmountChange, getSubtotal, 
  getDiscountAmount, getDisplayTotal, saveSale, loading, saleMessage 
}) => {
  const validRows = saleRows.filter(row => row.id && row.quantity);

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>New Sale</h2>
        {validRows.length > 0 && (
          <button onClick={clearAllRows} className="clear-btn">Clear All</button>
        )}
      </div>
      <div className="excel-container">
        <table className="excel-table">
          <thead>
            <tr><th>Item #</th><th>Item Name</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {saleRows.map((row, index) => (
              <tr key={index}>
                <td>
                  <input 
                    type="number" 
                    value={row.item_number} 
                    onChange={e => updateRow(index, 'item_number', e.target.value)} 
                    onFocus={() => setSuggestions([])} 
                    placeholder="e.g. 34" 
                    className="table-input small" 
                  />
                </td>
                <td className="autocomplete-cell">
                  <input 
                    type="text" 
                    value={row.item_name} 
                    onChange={e => updateRow(index, 'item_name', e.target.value)} 
                    placeholder="Search item..." 
                    className="table-input" 
                  />
                  {activeRowIndex === index && suggestions.length > 0 && (
                    <div className="suggestions">
                      {suggestions.map(product => (
                        <div 
                          key={product.id} 
                          onClick={() => selectProduct(index, product)} 
                          className="suggestion-item"
                        >
                          <strong>#{product.item_number}</strong> {product.item_name} - ₹{product.selling_price}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <input 
                    type="number" 
                    value={row.quantity} 
                    onChange={e => updateRow(index, 'quantity', e.target.value)} 
                    placeholder="1" 
                    disabled={!row.id} 
                    className="table-input small" 
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={row.selling_price} 
                    onChange={e => updateRow(index, 'selling_price', e.target.value)} 
                    disabled={!row.id} 
                    placeholder="0" 
                    className="table-input small" 
                  />
                </td>
                <td className="total-cell">₹{row.line_total.toFixed(2)}</td>
                <td>
                  {row.id && (
                    <button onClick={() => removeRow(index)} className="remove-btn">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals-section">
          <div className="total-row"><span>Subtotal:</span><span>₹{getSubtotal().toFixed(2)}</span></div>
          {(parseFloat(discountPercent) > 0 || (finalAmount && parseFloat(finalAmount) < getSubtotal())) && (
            <div className="total-row discount">
              <span>Discount ({discountPercent.toFixed(2)}%):</span>
              <span>-₹{getDiscountAmount().toFixed(2)}</span>
            </div>
          )}
          <div className="total-row final"><span>Total:</span><span>₹{getDisplayTotal()}</span></div>
        </div>
      </div>
      {validRows.length > 0 && (
        <div className="customer-section">
          <h3>Customer & Payment</h3>
          <div className="customer-grid">
            <input 
              placeholder="Customer Name (optional)" 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
            />
            <input 
              placeholder="Phone (required for credit)" 
              value={customerPhone} 
              onChange={e => setCustomerPhone(e.target.value)} 
            />
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
            </select>
            <div className="discount-input">
              <label>Discount %</label>
              <input 
                type="number" 
                value={discountPercent} 
                onChange={e => handleDiscountPercentChange(e.target.value)} 
                min="0" 
                max="100" 
                step="0.1" 
              />
            </div>
            <div className="discount-input" style={{ gridColumn: '1 / -1' }}>
              <label>Or Enter Final Amount:</label>
              <input 
                type="number" 
                value={finalAmount} 
                onChange={e => handleFinalAmountChange(e.target.value)} 
                placeholder={`Subtotal: ₹${getSubtotal().toFixed(2)}`} 
                step="0.01" 
              />
            </div>
          </div>
          <button onClick={saveSale} disabled={loading} className="save-btn">
            {loading ? "Saving..." : `Complete Sale - ₹${getDisplayTotal()}`}
          </button>
        </div>
      )}
      {saleMessage && <p className="status-message">{saleMessage}</p>}
    </div>
  );
};

const DashboardPage = ({ stats, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd, onShowChart }) => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>{getRangeLabel(dateRange)} Summary</h2>
      </div>
      <div className="date-range-selector">
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="range-select">
          <option value="today">Today</option>
          <option value="last_2_days">Last 2 Days</option>
          <option value="last_week">Last 7 Days</option>
          <option value="last_month">Last 30 Days</option>
          <option value="last_year">Last Year</option>
          <option value="custom">Custom Range</option>
        </select>
        {dateRange === 'custom' && (
          <div className="custom-date-inputs">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="date-input" />
            <span>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="date-input" />
          </div>
        )}
      </div>
      <div className="dashboard-grid">
        <div className="stat-card clickable" onClick={onShowChart}>
          <div className="stat-value">₹{stats.sales.toFixed(2)}</div>
          <div className="stat-label">Sales</div>
          <div className="stat-sub">Profit: ₹{stats.profit.toFixed(2)}</div>
          <div className="card-hint">Click to see chart →</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.transactions}</div>
          <div className="stat-label">Transactions</div>
          <div className="stat-breakdown">
            <span>Cash: ₹{stats.cash.toFixed(0)}</span>
            <span>UPI: ₹{stats.upi.toFixed(0)}</span>
            <span>Credit: ₹{stats.credit.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = ({ salesHistory, historyFilter, setHistoryFilter, onSelectBill }) => (
  <div className="page-content">
    <h2>Sales History</h2>
    <div className="filter-section">
      <input 
        type="text" 
        placeholder="Search bill # or customer..." 
        value={historyFilter.search} 
        onChange={e => setHistoryFilter({ ...historyFilter, search: e.target.value })} 
        className="filter-input" 
      />
      <select 
        value={historyFilter.paymentMethod} 
        onChange={e => setHistoryFilter({ ...historyFilter, paymentMethod: e.target.value })} 
        className="filter-select"
      >
        <option value="all">All Payments</option>
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
        <option value="card">Card</option>
        <option value="credit">Credit</option>
      </select>
      <input 
        type="date" 
        value={historyFilter.dateFrom} 
        onChange={e => setHistoryFilter({ ...historyFilter, dateFrom: e.target.value })} 
        className="filter-date" 
      />
      <input 
        type="date" 
        value={historyFilter.dateTo} 
        onChange={e => setHistoryFilter({ ...historyFilter, dateTo: e.target.value })} 
        className="filter-date" 
      />
    </div>
    <div className="excel-container">
      <table className="excel-table">
        <thead>
          <tr><th>Bill #</th><th>Date</th><th>Time</th><th>Customer</th><th>Payment</th><th>Status</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {salesHistory.length > 0 ? (
            salesHistory.map(sale => {
              const date = new Date(sale.sale_date);
              return (
                <tr key={sale.id} onClick={() => onSelectBill(sale)} className="clickable-row">
                  <td><strong>{sale.bill_number}</strong></td>
                  <td>{date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  <td>{date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</td>
                  <td>{sale.customer_name}</td>
                  <td><span className={`payment-badge ${sale.payment_method}`}>{sale.payment_method}</span></td>
                  <td><span className={`status-badge ${sale.payment_status}`}>{sale.payment_status}</span></td>
                  <td className="amount-cell">₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                No sales found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ProductsPage = ({ 
  products, showAddProduct, setShowAddProduct, newProduct, setNewProduct, addProduct, 
  editingProduct, setEditingProduct, updateProduct, deleteProduct, setSelectedProduct, 
  loading, message 
}) => (
  <div className="page-content">
    <div className="page-header">
      <h2>Products ({products.length})</h2>
      <button onClick={() => setShowAddProduct(!showAddProduct)} className="add-btn">
        {showAddProduct ? "Cancel" : "+ Add Product"}
      </button>
    </div>
    {showAddProduct && (
      <div className="form-section">
        <input 
          type="number" 
          placeholder="Item Number" 
          value={newProduct.item_number} 
          onChange={e => setNewProduct({ ...newProduct, item_number: e.target.value })} 
        />
        <input 
          placeholder="Item Name" 
          value={newProduct.item_name} 
          onChange={e => setNewProduct({ ...newProduct, item_name: e.target.value })} 
        />
        <input 
          type="number" 
          placeholder="Cost Price (CP)" 
          value={newProduct.cost_price} 
          onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })} 
        />
        <input 
          type="number" 
          placeholder="Selling Price (SP)" 
          value={newProduct.selling_price} 
          onChange={e => setNewProduct({ ...newProduct, selling_price: e.target.value })} 
        />
        <input 
          type="number" 
          placeholder="Stock" 
          value={newProduct.current_stock} 
          onChange={e => setNewProduct({ ...newProduct, current_stock: e.target.value })} 
        />
        <button onClick={addProduct} disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </div>
    )}
    <div className="excel-container">
      <table className="excel-table">
        <thead>
          <tr><th>Item #</th><th>Name</th><th>SP</th><th>Stock</th><th></th></tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
              <td><strong>#{product.item_number}</strong></td>
              <td>{product.item_name}</td>
              <td>₹{product.selling_price}</td>
              <td className={product.current_stock < product.minimum_stock ? "low-stock" : ""}>
                {product.current_stock}
              </td>
              <td onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditingProduct(product)} className="edit-btn" title="Edit">✏️</button>
                  <button onClick={() => deleteProduct(product.id)} className="remove-btn" title="Delete">×</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {editingProduct && (
      <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
        <div className="modal-content small" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Product</h2>
            <button className="modal-close" onClick={() => setEditingProduct(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-section">
              <input 
                placeholder="Item Name" 
                value={editingProduct.item_name} 
                onChange={e => setEditingProduct({ ...editingProduct, item_name: e.target.value })} 
              />
              <input 
                type="number" 
                placeholder="Cost Price (CP)" 
                value={editingProduct.cost_price} 
                onChange={e => setEditingProduct({ ...editingProduct, cost_price: e.target.value })} 
              />
              <input 
                type="number" 
                placeholder="Selling Price (SP)" 
                value={editingProduct.selling_price} 
                onChange={e => setEditingProduct({ ...editingProduct, selling_price: e.target.value })} 
              />
              <input 
                type="number" 
                placeholder="Stock" 
                value={editingProduct.current_stock} 
                onChange={e => setEditingProduct({ ...editingProduct, current_stock: e.target.value })} 
              />
              <button onClick={() => updateProduct(editingProduct)}>Update Product</button>
            </div>
          </div>
        </div>
      </div>
    )}
    {message && <p className="status-message">{message}</p>}
  </div>
);

const KhataPage = ({ 
  customers, showAddCustomer, setShowAddCustomer, newCustomer, setNewCustomer, 
  addCustomer, setSelectedCustomer, loading, message 
}) => (
  <div className="page-content">
    <div className="page-header">
      <h2>Khata - Credit Customers ({customers.length})</h2>
      <button onClick={() => setShowAddCustomer(!showAddCustomer)} className="add-btn">
        {showAddCustomer ? "Cancel" : "+ Add Customer"}
      </button>
    </div>
    {showAddCustomer && (
      <div className="form-section">
        <input 
          placeholder="Customer Name" 
          value={newCustomer.name} 
          onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
        />
        <input 
          placeholder="Mobile Number" 
          value={newCustomer.phone} 
          onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
        />
        <button onClick={addCustomer} disabled={loading} style={{ gridColumn: '1 / -1' }}>
          {loading ? "Adding..." : "Add Customer"}
        </button>
      </div>
    )}
    <div className="excel-container">
      <table className="excel-table">
        <thead>
          <tr><th>Name</th><th>Mobile</th><th>Total Credit</th><th>Total Paid</th><th>Outstanding</th><th></th></tr>
        </thead>
        <tbody>
          {customers.length > 0 ? customers.map(customer => (
            <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="clickable-row">
              <td><strong>{customer.name}</strong></td>
              <td>{customer.phone}</td>
              <td>₹{parseFloat(customer.total_credit).toFixed(2)}</td>
              <td className="paid-amount">₹{parseFloat(customer.total_paid).toFixed(2)}</td>
              <td className="outstanding-amount">₹{parseFloat(customer.outstanding_balance).toFixed(2)}</td>
              <td>
                <span className={`khata-badge ${parseFloat(customer.outstanding_balance) > 0 ? 'pending' : 'clear'}`}>
                  {parseFloat(customer.outstanding_balance) > 0 ? 'Pending' : 'Clear'}
                </span>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                No customers yet. Add your first credit customer!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {message && <p className="status-message">{message}</p>}
  </div>
);

export default App;
