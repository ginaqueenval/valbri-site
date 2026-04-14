import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Checkout() {
  const { t } = useTranslation();
  const location = useLocation();
  const orderData = location.state;

  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const fmtCoins = (n) => {
    const k = Math.round(n / 1000);
    return k.toLocaleString("en-US") + "K";
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t('checkout.title')}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        {t('checkout.description')}
      </p>

      {orderData ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <div className="text-lg font-bold">{t('checkout.orderSummary')}</div>
          <div className="mt-4 grid gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t('checkout.platform')}:</span>
              <span className="font-semibold">{orderData.platform}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t('checkout.coins')}:</span>
              <span className="font-semibold">{fmtCoins(orderData.coins)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t('checkout.gift')}:</span>
              <span className="font-semibold text-[#00FF9A]">+{fmtCoins(orderData.gift)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t('checkout.eta')}:</span>
              <span className="font-semibold">{orderData.eta}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-[#9AA7BD]">{t('checkout.total')}:</span>
              <span className="font-semibold text-[#00FF9A]">{fmtPrice(orderData.price)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
            {t('checkout.status')}: <span className="text-[#E7EDF7] font-semibold">{t('checkout.comingSoon')}</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <div className="text-sm text-[#9AA7BD]">
            {t('checkout.noOrder')} <Link to="/fc26-coins" className="text-[#00FF9A] hover:underline">{t('checkout.noOrderLink')}</Link>{t('checkout.noOrderEnd')}
          </div>
        </div>
      )}
    </main>
  );
}
