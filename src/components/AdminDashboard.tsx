import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Download, Search, Edit2, Trash2, LogOut, 
  Settings, Users, ShieldAlert, X, ChevronLeft, Save
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface TestResult {
  id: string;
  projectName: string;
  contractorName: string;
  supervisorName: string;
  trainingDate: string;
  score: number;
  submittedAt: string;
}

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  const [activeTab, setActiveTab] = useState<'results' | 'meta'>('results');
  const [metaData, setMetaData] = useState<{ projects: string[], contractors: string[] }>({ projects: [], contractors: [] });
  const [newProject, setNewProject] = useState('');
  const [newContractor, setNewContractor] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handlePasswordLogin = async () => {
    if (password === '0000') {
      setIsAuthenticated(true);
      fetchResults();
      fetchMeta();
    } else {
      setConfirmDialog({
        isOpen: true,
        title: '로그인 실패',
        message: '비밀번호가 틀렸습니다.',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
  };


  const fetchMeta = async () => {
    try {
      const pSnap = await getDocs(collection(db, 'projects'));
      const cSnap = await getDocs(collection(db, 'contractors'));
      setMetaData({
        projects: pSnap.docs.map(d => d.data().name || d.id),
        contractors: cSnap.docs.map(d => d.data().name || d.id)
      });
    } catch (error) {
      console.error("Error fetching meta:", error);
    }
  };

  const addProject = async () => {
    if (!newProject) return;
    await setDoc(doc(db, 'projects', newProject), { name: newProject });
    setNewProject('');
    fetchMeta();
  };

  const deleteProject = async (name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '삭제 확인',
      message: `${name} 프로젝트를 삭제하시겠습니까?`,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'projects', name));
        fetchMeta();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addContractor = async () => {
    if (!newContractor) return;
    await setDoc(doc(db, 'contractors', newContractor), { name: newContractor });
    setNewContractor('');
    fetchMeta();
  };

  const deleteContractor = async (name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '삭제 확인',
      message: `${name} 업체를 삭제하시겠습니까?`,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'contractors', name));
        fetchMeta();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const rSnap = await getDocs(collection(db, 'testResults'));
      const data: TestResult[] = rSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestResult));
      setResults(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = results.map(r => ({
      'PJT명': r.projectName,
      '협력업체명': r.contractorName,
      '관리감독자 성명': r.supervisorName,
      '교육수료일자': r.trainingDate,
      '점수': r.score,
      '제출일시': r.submittedAt ? format(new Date(r.submittedAt), 'yyyy-MM-dd HH:mm') : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "안전진단결과");
    XLSX.writeFile(wb, `safety_test_results_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const startEdit = (res: TestResult) => {
    setEditingId(res.id);
    setEditDate(res.trainingDate);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'testResults', editingId), { trainingDate: editDate });
      setEditingId(null);
      fetchResults();
      setConfirmDialog({
        isOpen: true,
        title: '알림',
        message: '교육 수료일자가 수정되었습니다.',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      console.error("Update error:", error);
      setConfirmDialog({
        isOpen: true,
        title: '알림',
        message: '수정에 실패했습니다.',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '삭제 확인',
      message: '정말 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'testResults', id));
          fetchResults();
        } catch (error) {
          console.error("Delete error:", error);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredResults = results.filter(r => 
    r.supervisorName.toLowerCase().includes(search.toLowerCase()) || 
    r.contractorName.toLowerCase().includes(search.toLowerCase()) || 
    r.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex min-h-screen items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">관리자 로그인</h2>
                <p className="mt-1 text-gray-500 text-sm">관리자 계정으로 로그인해주세요.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">관리자 비밀번호</label>
                  <input
                    type="password"
                    placeholder="****"
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-lg font-bold tracking-widest ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                  />
                </div>
                <button
                  onClick={handlePasswordLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white shadow-lg transition-all hover:bg-black active:scale-95"
                >
                  로그인하기
                </button>
                <button
                  onClick={onBack}
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> 사용자 화면으로 돌아가기
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-12"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 md:border-0 md:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-900 p-2 text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200 md:hidden"
                  >
                    <LogOut className="h-4 w-4" /> 로그아웃
                  </button>
                </div>
                
                <div className="flex flex-1 items-center justify-between md:ml-4">
                  <nav className="flex w-full items-center gap-1 overflow-x-auto pb-1 md:w-auto md:pb-0">
                    <button
                      onClick={() => setActiveTab('results')}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'results' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      테스트 결과
                    </button>
                    <button
                      onClick={() => setActiveTab('meta')}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'meta' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      기본 정보 관리
                    </button>
                  </nav>

                  <div className="hidden items-center gap-4 md:flex">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ADMIN MODE ACTIVE</span>
                      <span className="text-sm font-medium text-gray-600">Local Management</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      <LogOut className="h-4 w-4" /> 로그아웃
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-6xl px-4 pt-8 md:px-8">
              {activeTab === 'results' ? (
                <>
                  {/* Stats & Actions */}
                  <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="관리감독자 또는 협력업체 검색..."
                          className="w-full rounded-xl bg-white py-3 pl-12 pr-4 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 active:scale-95"
                      >
                        <Download className="h-5 w-5" /> Excel 다운로드
                      </button>
                      <button
                        onClick={fetchResults}
                        className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Users className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                    <div className="overflow-x-auto text-sm">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="px-6 py-4 font-bold">PJT / 협력업체</th>
                            <th className="px-6 py-4 font-bold">관리감독자 성명</th>
                            <th className="px-6 py-4 font-bold">교육 수료일자</th>
                            <th className="px-6 py-4 font-bold text-center">점수</th>
                            <th className="px-6 py-4 font-bold">제출 일시</th>
                            <th className="px-6 py-4 font-bold text-right">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                <td colSpan={6} className="px-6 py-6 h-12 bg-gray-50/50"></td>
                              </tr>
                            ))
                          ) : filteredResults.length > 0 ? (
                            filteredResults.map((res) => (
                              <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-900">{res.projectName}</div>
                                  <div className="text-xs text-gray-500">{res.contractorName}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-900 font-medium">{res.supervisorName}</td>
                                <td className="px-6 py-4">
                                  {editingId === res.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="date"
                                        className="rounded-lg border-gray-200 p-1 text-xs outline-none ring-1 ring-orange-500"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                      />
                                      <button onClick={saveEdit} className="text-blue-600 hover:text-blue-800"><Save className="h-4 w-4" /></button>
                                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="h-4 w-4" /></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group">
                                      <span className="text-gray-700">{res.trainingDate}</span>
                                      <button onClick={() => startEdit(res)} className="hidden group-hover:block transition-all text-gray-400 hover:text-orange-500"><Edit2 className="h-3 w-3" /></button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={cn(
                                    "rounded-full px-2.5 py-1 text-xs font-bold",
                                    res.score >= 80 ? "bg-green-100 text-green-700" : res.score >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                  )}>
                                    {res.score}점
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                  {res.submittedAt ? format(new Date(res.submittedAt), 'yy-MM-dd HH:mm') : '-'}
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                   <button
                                     onClick={() => handleDelete(res.id)}
                                     className="text-gray-400 transition-colors hover:text-red-500"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center text-gray-500 font-medium">
                                검색 결과가 없습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Project Management */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-500" /> PJT(프로젝트) 목록 관리
                    </h3>
                    <div className="mb-6 flex gap-2">
                      <input
                        type="text"
                        placeholder="새 프로젝트 명..."
                        className="flex-1 rounded-xl bg-gray-50 px-4 py-2 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                      />
                      <button
                        onClick={addProject}
                        className="rounded-xl bg-gray-900 px-4 py-2 font-bold text-white transition-all hover:bg-black active:scale-95"
                      >
                        추가
                      </button>
                    </div>
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {metaData.projects.map(p => (
                        <li key={p} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                          {p}
                          <button onClick={() => deleteProject(p)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                      {metaData.projects.length === 0 && (
                        <li className="py-10 text-center text-gray-400 text-sm">등록된 프로젝트가 없습니다.</li>
                      )}
                    </ul>
                  </div>

                  {/* Contractor Management */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-blue-500" /> 협력업체 목록 관리
                    </h3>
                    <div className="mb-6 flex gap-2">
                      <input
                        type="text"
                        placeholder="새 협력업체 명..."
                        className="flex-1 rounded-xl bg-gray-50 px-4 py-2 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        value={newContractor}
                        onChange={(e) => setNewContractor(e.target.value)}
                      />
                      <button
                        onClick={addContractor}
                        className="rounded-xl bg-gray-900 px-4 py-2 font-bold text-white transition-all hover:bg-black active:scale-95"
                      >
                        추가
                      </button>
                    </div>
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {metaData.contractors.map(c => (
                        <li key={c} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                          {c}
                          <button onClick={() => deleteContractor(c)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                      {metaData.contractors.length === 0 && (
                        <li className="py-10 text-center text-gray-400 text-sm">등록된 업체가 없습니다.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
                <p className="text-sm text-gray-500">{confirmDialog.message}</p>
              </div>
              <div className="flex gap-2 bg-gray-50 p-4">
                {confirmDialog.title === '삭제 확인' && (
                  <button
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
