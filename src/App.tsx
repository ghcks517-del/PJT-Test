import React, { useState } from 'react';
import SafetyTest from './components/SafetyTest';
import AdminDashboard from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ShieldCheck, ClipboardList, Info } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'landing' | 'test' | 'admin'>('landing');

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col"
          >
            {/* Simple Header */}
            <header className="border-b border-gray-100 px-6 py-4">
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-orange-500 p-1.5 text-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-gray-900">SAFE MASTER</span>
                </div>
                <button
                  onClick={() => setView('admin')}
                  className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  관리자 모드
                </button>
              </div>
            </header>

            {/* Hero Section */}
            <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl"
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-bold text-orange-600">
                  <Info className="h-4 w-4" /> 협력업체 관리감독자 필수 교육
                </div>
                <h1 className="mb-12 text-5xl font-black leading-tight tracking-tight text-gray-900 md:text-7xl">
                  PJT 협력업체 <br />
                  <span className="text-orange-500">사전 안전 학습 Test</span>
                </h1>

                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => setView('test')}
                    className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-gray-900 p-8 text-white transition-all hover:bg-black active:scale-[0.98]"
                  >
                    <div className="rounded-2xl bg-orange-500 p-4 transition-transform group-hover:scale-110">
                      <ClipboardList className="h-8 w-8" />
                    </div>
                    <div className="text-left w-full">
                      <p className="text-sm font-medium text-gray-400">시작하기</p>
                      <h3 className="text-xl font-bold">안전진단 테스트 응시</h3>
                    </div>
                  </button>

                  <div className="flex flex-col items-start justify-center rounded-3xl bg-gray-50 p-8 text-left ring-1 ring-gray-100">
                    <p className="mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider">안내사항</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 출제 문항 : 20개 문항</li>
                      <li>• 합격 점수 : 70점 이상(14개 이상 정답 시)</li>
                      <li>• 불합격시 PJT 참여 제한</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-50 bg-gray-50 py-10 px-6">
              <div className="mx-auto max-w-6xl text-center space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Safety First & Management System</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setView('admin')}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 underline underline-offset-4"
                  >
                    관리자 설정
                  </button>
                </div>
              </div>
            </footer>
          </motion.div>
        )}

        {view === 'test' && (
          <motion.div
            key="test"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <SafetyTest 
              onComplete={() => setView('landing')} 
              onBack={() => setView('landing')}
            />
          </motion.div>
        )}

        {view === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AdminDashboard onBack={() => setView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
