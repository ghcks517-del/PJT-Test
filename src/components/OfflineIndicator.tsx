import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-gray-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md md:left-auto md:right-4 md:w-auto">
      <WifiOff className="h-4 w-4 text-orange-400 animate-pulse" />
      <span>오프라인 상태입니다. 저장된 캐시 데이터로 동작합니다.</span>
    </div>
  );
};
