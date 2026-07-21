import { Component } from "react";
import i18n from "../i18n";

/**
 * Apple-style 全局错误边界。
 * 子组件抛错时降级显示「页面加载出错」+ 重试 + 返回首页,避免整站白屏。
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // 留存错误信息供本地排查;生产环境可接入 Sentry / 日志上报
    console.error("[ErrorBoundary] Caught:", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleGoHome = () => {
    // 项目用 HashRouter,合法路径形如 /#/home;裸 /home 在静态部署会 404。
    window.location.href = "/#/home";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isZh = i18n.language?.startsWith("zh");
    const title = isZh ? "页面加载出错" : "Something went wrong";
    const desc = isZh
      ? "页面遇到了一个错误,请尝试刷新或返回首页。"
      : "The page encountered an error. Please retry or go back home.";
    const retry = isZh ? "重试" : "Retry";
    const home = isZh ? "返回首页" : "Back to Home";

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="reveal-scale w-full max-w-md rounded-[28px] border border-red-500/22 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
              <path d="M12 2 1 21h22L12 2Zm0 6 7.5 13h-15L12 8Zm-1 4v4h2v-4h-2Zm0 5v2h2v-2h-2Z" />
            </svg>
          </div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-[#E7EDF7]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9AA7BD]">{desc}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="cta-primary min-h-[44px] px-6 py-3 text-sm"
            >
              {retry}
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#E7EDF7] transition-colors hover:border-[#00FF9A]/30"
            >
              {home}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
