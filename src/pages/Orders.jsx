import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getOrderList } from "../api/order";
import { getPlayerToken } from "../utils/request";

const fmtK = (n) => {
  if (!n) return "0";
  if (n < 1000) return String(n);
  const k = Math.round(n / 1000);
  return k.toLocaleString("en-US") + "K";
};

const fmtPrice = (n, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(n || 0);

const fmtTime = (t) => {
  if (!t) return "-";
  const d = new Date(t);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PAY_STATUS = [
  { value: "", label: "all" },
  { value: "0", label: "pending" },
  { value: "1", label: "paid" },
  { value: "2", label: "cancelled" },
  { value: "3", label: "refunded" },
];

const PAY_LABEL = { 0: "pending", 1: "paid", 2: "cancelled", 3: "refunded" };
const DELIVERY_LABEL = { 0: "pendingDelivery", 1: "delivering", 2: "completed" };

export default function Orders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!getPlayerToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    const params = { pageNum: page, pageSize };
    if (activeTab) params.payStatus = activeTab;
    getOrderList(params)
      .then((res) => {
        setOrders(res.rows || []);
        setTotal(res.total || 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [activeTab, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t("orders.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        {t("orders.subtitle")}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PAY_STATUS.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setActiveTab(s.value);
              setPage(1);
            }}
            className={
              "rounded-xl px-4 py-2.5 text-sm font-semibold border " +
              (activeTab === s.value
                ? "border-[#00FF9A]/40 bg-[#00FF9A]/10 text-[#00FF9A]"
                : "border-white/10 bg-white/5 text-[#E7EDF7] hover:border-[#00FF9A]/30")
            }
          >
            {t(`orders.tab.${s.label}`)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#9AA7BD]">
            {t("orders.loading")}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 py-12 text-center">
            <div className="text-sm text-[#9AA7BD]">
              {t("orders.empty")}
              <Link
                to="/fc26-coins"
                className="ml-1 text-[#00FF9A] hover:underline"
              >
                {t("orders.goBuy")}
              </Link>
            </div>
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-white/5 bg-[#0B1220]/60 p-4 sm:p-6 hover:border-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#9AA7BD]">
                      {o.orderNo}
                    </span>
                    <span
                      className={
                        "rounded-md px-2 py-0.5 text-xs font-semibold " +
                        (o.payStatus === "1"
                          ? "bg-[#00FF9A]/10 text-[#00FF9A]"
                          : o.payStatus === "2"
                            ? "bg-slate-500/10 text-slate-300"
                            : o.payStatus === "3"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400")
                      }
                    >
                      {t(
                        `orders.status.${PAY_LABEL[o.payStatus] || "pending"}`,
                      )}
                    </span>
                    <span
                      className={
                        "rounded-md px-2 py-0.5 text-xs " +
                        (o.deliveryStatus === "1"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : o.deliveryStatus === "2"
                            ? "bg-[#00FF9A]/10 text-[#00FF9A]"
                            : "bg-white/5 text-[#9AA7BD]")
                      }
                    >
                      {t(
                        `orders.delivery.${DELIVERY_LABEL[o.deliveryStatus] || "pendingDelivery"}`,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    {o.packageName && (
                      <span className="text-sm font-semibold">
                        {o.packageName}
                      </span>
                    )}
                    <span className="text-xs text-[#9AA7BD]">{o.platform}</span>
                    {o.quantity && o.quantity > 1 && (
                      <span className="rounded-md bg-[#00FF9A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00FF9A]">
                        ×{o.quantity}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-[#9AA7BD]">
                    <span>
                      {fmtK(o.coins)} {t("orders.coins")}
                    </span>
                    {o.giftCoins > 0 && (
                      <span className="text-[#00FF9A]">
                        +{fmtK(o.giftCoins)} {t("orders.gift")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-sm font-semibold">
                    {fmtPrice(o.price, o.currency)}
                  </div>
                  <div className="text-xs text-[#9AA7BD]">
                    {fmtTime(o.createTime)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm text-[#9AA7BD]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
