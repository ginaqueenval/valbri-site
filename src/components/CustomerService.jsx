import { memo, useState } from "react";
import { buildCustomerMediaUrl } from "../utils/customerServiceState";
import {
  SupportIcon,
  MinimizeIcon,
  HistoryChevronIcon,
  ImageIcon,
  SendIcon,
} from "./CustomerServiceIcons";
import useCustomerService from "./useCustomerService";

const DISPLAY_ITEM_RENDER_CAP = 150;
const DISPLAY_ITEM_EXPAND_STEP = 100;

const ChatTimestamp = memo(function ChatTimestamp({ label }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] text-[#8EA0B9]">
        {label}
      </span>
    </div>
  );
});

const ChatMessage = memo(function ChatMessage({
  message, isMine, mediaUrl, apiBase, visitorToken, onImageLoad, youLabel, supportLabel, imageAlt,
}) {
  const isImage = message.contentType === "image";
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[76%] flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div className="mb-1 px-1 text-[10px] font-semibold text-[#8EA0B9]">
          {isMine ? youLabel : supportLabel}
        </div>
        <div
          className={`rounded-[10px] px-3.5 py-2 text-sm leading-5 shadow-[0_10px_20px_rgba(0,0,0,0.14)] ${
            isMine
              ? "border border-[#00FF9A]/24 bg-[#00FF9A]/10 text-[#E9FFF4]"
              : "border border-white/8 bg-white/[0.045] text-[#E7EDF7]"
          }`}
        >
          {isImage ? (
            <img
              src={mediaUrl || buildCustomerMediaUrl(apiBase, message.id, visitorToken)}
              alt={imageAlt}
              className="max-h-64 max-w-full rounded-xl border border-white/10 object-contain"
              loading="lazy"
              onLoad={onImageLoad}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
});

function ChatMessageList({
  displayItems, mediaUrls, apiBase, visitorToken, onImageLoad,
  youLabel, supportLabel, imageAlt, showEarlierLabel,
}) {
  const [renderCap, setRenderCap] = useState(DISPLAY_ITEM_RENDER_CAP);
  const total = displayItems.length;
  const capped = total > renderCap;
  const visibleItems = capped ? displayItems.slice(total - renderCap) : displayItems;

  return (
    <>
      {capped && (
        <button
          type="button"
          onClick={() => setRenderCap((cap) => cap + DISPLAY_ITEM_EXPAND_STEP)}
          className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2 text-center text-xs text-[#8EA0B9] hover:bg-white/[0.06]"
        >
          {showEarlierLabel} ({total - renderCap})
        </button>
      )}
      {visibleItems.map((item) =>
        item.type === "time" ? (
          <ChatTimestamp key={item.key} label={item.label} />
        ) : (
          <ChatMessage
            key={item.key}
            message={item.message}
            isMine={item.message.senderType !== "admin"}
            mediaUrl={mediaUrls[item.message.id]}
            apiBase={apiBase}
            visitorToken={visitorToken}
            onImageLoad={onImageLoad}
            youLabel={youLabel}
            supportLabel={supportLabel}
            imageAlt={imageAlt}
          />
        ),
      )}
    </>
  );
}

export default function CustomerService() {
  const cs = useCustomerService();
  const {
    t,
    open,
    setOpen,
    loading,
    sending,
    uploadingImage,
    mediaUrls,
    input,
    setInput,
    session,
    unread,
    setUnread,
    notice,
    polling,
    showAttachmentMenu,
    setShowAttachmentMenu,
    launcherPosition,
    dragging,
    peekEdge,
    peekActive,
    hasMoreHistory,
    loadingHistory,
    displayItems,
    launcherSize,
    isMobile,
    desktopPanelHeight,
    desktopPanelPosition,
    effectiveVisitorToken,
    messageBoxRef,
    launcherRef,
    panelRef,
    imageInputRef,
    handleLauncherPointerDown,
    handleLauncherClick,
    handleMessageBoxScroll,
    handleMessageImageLoad,
    handleSend,
    handleImageChange,
    loadOlderMessages,
    messages,
    API_BASE_URL,
    MAX_MESSAGE_LENGTH,
    DESKTOP_PANEL_WIDTH,
  } = cs;

  const launcherStyle = {
    left: `${launcherPosition.x}px`,
    top: `${launcherPosition.y}px`,
    width: `${launcherSize}px`,
    height: `${launcherSize}px`,
  };

  const desktopPanelStyle =
    desktopPanelPosition && !isMobile
      ? {
          left: `${desktopPanelPosition.x}px`,
          top: `${desktopPanelPosition.y}px`,
          width: `${DESKTOP_PANEL_WIDTH}px`,
          height: `${desktopPanelHeight}px`,
        }
      : undefined;

  const panelContent = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[#F0FFF7]">{t("cs.title")}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7BFFCA]/72">
            {polling ? t("cs.polling") : t("cs.connected")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setUnread(0);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#AAB7CB] transition-colors hover:border-[#00FF9A]/30 hover:text-[#EAFBF3]"
          aria-label={t("cs.launch")}
        >
          <MinimizeIcon />
        </button>
      </div>

      <div
        ref={messageBoxRef}
        className="customer-service-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
        onScroll={handleMessageBoxScroll}
      >
        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#9AA7BD]">
            {t("cs.loading")}
          </div>
        ) : (
          <>
            {hasMoreHistory && (
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingHistory}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-[#00FF9A]/18 bg-[#00FF9A]/[0.06] px-4 py-3 text-left text-xs font-medium text-[#7BFFCA]/84 transition-colors hover:border-[#00FF9A]/28 hover:bg-[#00FF9A]/[0.1] hover:text-[#C6FFE6]"
              >
                <span>{loadingHistory ? t("cs.loadingHistory") : t("cs.viewHistory")}</span>
                <HistoryChevronIcon />
              </button>
            )}
            {loadingHistory && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2 text-center text-xs text-[#8EA0B9]">
                {t("cs.loadingHistory")}
              </div>
            )}
            {!hasMoreHistory && messages.length > 0 && (
              <div className="px-3 py-1 text-center text-[11px] text-[#6F8099]">
                {t("cs.noMoreHistory")}
              </div>
            )}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-[#9AA7BD]">
                {t("cs.empty")}
              </div>
            ) : (
              <ChatMessageList
                displayItems={displayItems}
                mediaUrls={mediaUrls}
                apiBase={API_BASE_URL}
                visitorToken={effectiveVisitorToken}
                onImageLoad={handleMessageImageLoad}
                youLabel={t("cs.you")}
                supportLabel={t("cs.support")}
                imageAlt={t("cs.imageAlt")}
                showEarlierLabel={t("cs.viewHistory")}
              />
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 px-4 py-4">
        {notice && (
          <div className="mb-3 rounded-2xl border border-amber-400/16 bg-amber-300/[0.06] px-3 py-2 text-xs text-[#FFDFA8]">
            {notice}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onFocus={() => setShowAttachmentMenu(false)}
            placeholder={t("cs.placeholder")}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            className="customer-service-scrollbar h-[54px] max-h-[54px] flex-1 resize-none overflow-y-auto rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4 text-[16px] leading-5 text-[#E7EDF7] outline-none transition-colors placeholder:text-[#75839A] focus:border-[#00FF9A]/30 sm:text-sm"
          />
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu((current) => !current)}
              disabled={!session}
              className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-xl font-semibold leading-none text-[#8EA0B9] transition-colors hover:border-[#00FF9A]/30 hover:text-[#9EFED1] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label={t("cs.addAttachment")}
            >
              +
            </button>
            {input.trim() && (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-[#00FF9A] text-[#071017] transition-colors hover:bg-[#00E48A] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={sending ? t("cs.sending") : t("cs.send")}
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
        {showAttachmentMenu && (
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3">
            <button
              type="button"
              onClick={() => {
                imageInputRef.current?.click();
              }}
              disabled={uploadingImage || !session}
              className="inline-flex w-[64px] flex-col items-center justify-center gap-2 text-center text-xs font-semibold text-[#9AA7BD] transition-colors hover:text-[#C6FFE6] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#C6FFE6]">
                <ImageIcon />
              </span>
              <span>{t("cs.addImage")}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );

  const launcherWrapperClass = [
    "cs-launcher",
    "fixed",
    "z-40",
    peekEdge === "left" ? "cs-launcher-peek-left" : "",
    peekActive ? "cs-launcher-active" : "",
    dragging ? "cs-launcher-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        ref={launcherRef}
        className={launcherWrapperClass}
        style={launcherStyle}
      >
        <button
          type="button"
          onPointerDown={handleLauncherPointerDown}
          onClick={handleLauncherClick}
          className={`group relative flex h-full w-full touch-none select-none items-center justify-center rounded-full border border-[#00FF9A]/30 bg-[radial-gradient(circle_at_30%_30%,rgba(6,30,23,0.98),rgba(7,10,16,0.96)_70%)] text-[#00FF9A] shadow-[0_0_0_1px_rgba(0,255,154,0.06),0_18px_34px_rgba(0,0,0,0.28),0_0_24px_rgba(0,255,154,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#00FF9A]/48 hover:text-[#94FFD0] ${
            open ? "border-[#00FF9A]/52 text-[#9DFFD3] shadow-[0_0_0_1px_rgba(0,255,154,0.08),0_24px_36px_rgba(0,0,0,0.3),0_0_32px_rgba(0,255,154,0.22)]" : ""
          } ${dragging ? "scale-[1.04] cursor-grabbing" : "cursor-grab"}`}
          aria-label={t("cs.launch")}
          aria-expanded={open}
        >
          <span className="pointer-events-none absolute inset-[4px] rounded-full border border-white/6" />
          <SupportIcon className={isMobile ? "h-5 w-5" : "h-5.5 w-5.5"} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-[#00FF9A] px-1.5 py-0.5 text-center text-[11px] font-bold text-[#070A0F] shadow-[0_0_14px_rgba(0,255,154,0.28)]">
              {unread}
            </span>
          )}
        </button>
      </div>

      {open && !isMobile && (
        <div
          ref={panelRef}
          className="fixed z-50 flex flex-col overflow-hidden rounded-[30px] border border-[#00FF9A]/14 bg-[linear-gradient(180deg,rgba(7,10,16,0.98),rgba(11,18,32,0.98))] shadow-[0_28px_70px_rgba(0,0,0,0.36),0_0_28px_rgba(0,255,154,0.08)]"
          style={desktopPanelStyle}
        >
          {panelContent}
        </div>
      )}

      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
          onClick={() => {
            setOpen(false);
            setUnread(0);
          }}
        >
          <div
            ref={panelRef}
            className="absolute inset-x-0 bottom-0 flex h-[min(78vh,680px)] flex-col overflow-hidden rounded-t-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,16,0.985),rgba(11,18,32,0.98))] shadow-[0_-20px_48px_rgba(0,0,0,0.32),0_0_24px_rgba(0,255,154,0.08)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pt-3">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-white/10" />
            </div>
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
}
