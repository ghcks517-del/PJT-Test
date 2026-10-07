import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, MoreVertical } from 'lucide-react';

interface Props {
  variant?: 'button' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallPrompt: React.FC<Props> = ({ variant = 'button', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // If already installed in standalone mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Handle direct install or show modal guide
  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        // If browser dismissed or fallback needed
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // 1. Banner variant (for top or bottom of mobile screen)
  if (variant === 'banner') {
    if (isBannerDismissed) return null;
    return (
      <>
        <div className={`relative flex items-center justify-between gap-3 border-b border-orange-200 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-4 py-2.5 text-white shadow-md ${className}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-black uppercase tracking-wider text-orange-100">모바일 앱 설치</p>
              <p className="text-xs font-medium text-white truncate">
                홈 화면에 앱으로 추가하여 빠르게 접속하세요!
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-orange-600 shadow-sm transition-all hover:bg-orange-50 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>앱 설치</span>
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              title="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showGuideModal && <InstallGuideModal onClose={() => setShowGuideModal(false)} isIOS={isIOS} />}
      </>
    );
  }

  // 2. Card variant (for Landing Hero Section)
  if (variant === 'card') {
    return (
      <>
        <div className={`group relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 text-left shadow-sm transition-all hover:shadow-md ${className}`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
              PWA 앱 지원
            </span>
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-black text-gray-900">모바일 앱으로 다운로드</h4>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              스마트폰 바탕화면에 앱 아이콘을 추가하고 주소창 없이 앱처럼 간편하게 테스트를 응시하세요.
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{isInstallable ? '앱 바로 설치하기' : '스마트폰에 앱 다운로드'}</span>
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 active:scale-95"
            >
              방법 안내
            </button>
          </div>
        </div>

        {showGuideModal && <InstallGuideModal onClose={() => setShowGuideModal(false)} isIOS={isIOS} />}
      </>
    );
  }

  // 3. Default Header Button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition-all hover:bg-orange-100 active:scale-95 ${className}`}
        title="스마트폰에 앱으로 다운로드 및 설치"
      >
        <Download className="h-3.5 w-3.5 text-orange-600" />
        <span>앱 다운로드</span>
      </button>

      {showGuideModal && <InstallGuideModal onClose={() => setShowGuideModal(false)} isIOS={isIOS} />}
    </>
  );
};

// Modal providing step-by-step installation instructions for both iOS and Android
const InstallGuideModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  const [tab, setTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-orange-500 p-2 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">모바일 앱 설치 안내</h3>
              <p className="text-xs text-gray-500">휴대폰 홈 화면에 앱으로 추가하는 방법</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTab('android')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              tab === 'android'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            안드로이드 (갤럭시 / 크롬)
          </button>
          <button
            onClick={() => setTab('ios')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              tab === 'ios'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            아이폰 (iOS 사파리)
          </button>
        </div>

        {/* Instructions Body */}
        <div className="mt-4 space-y-3">
          {tab === 'android' ? (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  1
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">브라우저 메뉴 열기</p>
                  <p className="mt-0.5 text-gray-600">
                    Chrome 또는 삼성 인터넷 우측 상단/하단의 <strong className="inline-flex items-center gap-0.5 text-orange-600"><MoreVertical className="inline h-3.5 w-3.5" />더보기(⋮)</strong> 메뉴를 누릅니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  2
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">[앱 설치] 또는 [홈 화면에 추가] 선택</p>
                  <p className="mt-0.5 text-gray-600">
                    메뉴 목록에서 <strong className="text-orange-600">‘앱 설치’</strong> 또는 <strong className="text-orange-600">‘현재 페이지 추가 &gt; 홈 화면’</strong>을 터치합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  3
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">설치 완료 및 앱 실행</p>
                  <p className="mt-0.5 text-gray-600">
                    스마트폰 바탕화면에 <strong className="text-gray-900">‘안전테스트’</strong> 아이콘이 생성되어 독립 앱으로 실행할 수 있습니다.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  1
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">Safari 공유 버튼 터치</p>
                  <p className="mt-0.5 text-gray-600">
                    Safari 브라우저 하단 툴바 중앙의 <strong className="inline-flex items-center gap-1 text-blue-600"><Share className="inline h-3.5 w-3.5" /> 공유 아이콘</strong>(네모 상자 위쪽 화살표)을 터치합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  2
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">[홈 화면에 추가] 선택</p>
                  <p className="mt-0.5 text-gray-600">
                    스크롤을 조금 내려 <strong className="inline-flex items-center gap-1 text-gray-900"><PlusSquare className="inline h-3.5 w-3.5" /> ‘홈 화면에 추가’</strong>를 선택합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-orange-50/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
                  3
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">우측 상단 [추가] 터치</p>
                  <p className="mt-0.5 text-gray-600">
                    화면 우측 상단의 <strong className="text-orange-600">‘추가’</strong> 버튼을 누르면 아이폰 홈 화면에 바로 앱 아이콘이 등록됩니다.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefits notice */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>앱으로 설치하면 주소창 없이 전체화면으로 빠르게 시험을 볼 수 있습니다.</span>
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-900 py-3 text-xs font-bold text-white transition-all hover:bg-black active:scale-[0.98]"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
