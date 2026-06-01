import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ClipboardCheck, User as UserIcon, Calendar, Building2, HardHat, CheckCircle2, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { SAFETY_QUESTIONS, Question } from '../constants/questions';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

interface SafetyTestProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function SafetyTest({ onComplete, onBack }: SafetyTestProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectName: '',
    contractorName: '',
    supervisorName: '',
    trainingDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [projects, setProjects] = useState<string[]>([]);
  const [contractors, setContractors] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 결과 상세 표시 목적의 상태변수 추가
  const [testScore, setTestScore] = useState<number | null>(null);
  const [testDetails, setTestDetails] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const projSnapshot = await getDocs(collection(db, 'projects'));
        const contSnapshot = await getDocs(collection(db, 'contractors'));

        setProjects(projSnapshot.docs.map(d => d.data().name || d.id));
        setContractors(contSnapshot.docs.map(d => d.data().name || d.id));
        
        // 전체 문제 중 20문제 랜덤 추출
        const shuffled = [...SAFETY_QUESTIONS].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 20));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.projectName || !formData.contractorName || !formData.supervisorName || !formData.trainingDate) {
        alert('모든 정보를 입력해주세요.');
        return;
      }
      setStep(2);
    }
  };

  const handleAnswerSelect = (index: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = index;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (userAnswers[currentQuestionIndex] === undefined) {
      alert('정답을 선택해주세요.');
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (userAnswers[currentQuestionIndex] === undefined) {
      alert('정답을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let correctCount = 0;
      const details = questions.map((q, idx) => {
        const isCorrect = q.correctIndex === userAnswers[idx];
        if (isCorrect) correctCount++;
        return {
          questionText: q.text,
          options: q.options,
          selected: userAnswers[idx],
          correctIndex: q.correctIndex,
          isCorrect
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);
      setTestScore(score);
      setTestDetails(details);

      await addDoc(collection(db, 'testResults'), {
        ...formData,
        score,
        details,
        submittedAt: new Date().toISOString(),
      });

      setStep(3);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-gray-500 font-medium">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-0">
      <div className={cn("mx-auto transition-all duration-300", step === 3 ? "max-w-3xl" : "max-w-lg")}>
        {/* Back button and Progress bar */}
        <div className="mb-8 flex items-center gap-4 px-2">
          {step < 3 && (
            <button
              onClick={() => step === 1 ? onBack() : setStep(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-100 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex flex-1 items-center justify-between gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                  step === s ? "bg-orange-50 text-white" : step > s ? "bg-green-50 text-white font-bold" : "bg-gray-300 text-gray-600"
                )}>
                  {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
                <div className={cn(
                  "h-1 flex-1 rounded-full",
                  step > s ? "bg-green-500" : "bg-gray-300"
                )} />
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100"
            >
              <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <ClipboardCheck className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">기본 정보 입력</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> PJT(프로젝트)명
                  </label>
                  <select
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  >
                    <option value="">선택하세요</option>
                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <HardHat className="h-4 w-4" /> 협력업체명
                  </label>
                  <select
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.contractorName}
                    onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                  >
                    <option value="">선택하세요</option>
                    {contractors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> 관리감독자 성명
                  </label>
                  <input
                    type="text"
                    placeholder="성명을 입력하세요"
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.supervisorName}
                    onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> 관리감독자 교육 수료일자
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.trainingDate}
                    onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleNextStep}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white shadow-lg transition-all hover:bg-black active:scale-95"
                >
                  다음 단계로 이동 <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100"
            >
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">안전 수칙 테스트</h2>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>

              <div className="mb-8">
                <p className="text-lg font-medium leading-relaxed text-gray-800">
                  Q. {questions[currentQuestionIndex].text}
                </p>
              </div>

              <div className="space-y-4">
                {questions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all ring-1 ring-inset",
                      userAnswers[currentQuestionIndex] === idx
                        ? "bg-orange-50 ring-orange-500 text-orange-900 font-semibold"
                        : "bg-white ring-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      userAnswers[currentQuestionIndex] === idx ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-bold text-white shadow-lg transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? '제출 중...' : '최종 제출하기'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white shadow-lg transition-all hover:bg-black active:scale-95"
                  >
                    다음 문제 <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-white p-8 md:p-12 shadow-sm ring-1 ring-gray-100"
            >
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">제출이 완료되었습니다!</h2>
                <p className="text-gray-500 text-sm">기본 정보 및 안전 수칙 테스트 결과가 안전하게 제출되었습니다.</p>
              </div>

              {/* 점수 요약 섹션 */}
              <div className="mb-8 rounded-2xl bg-gray-50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-gray-100">
                <div className="text-center md:text-left">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">TEST SCORE</span>
                  <div className="flex items-baseline gap-2 justify-center md:justify-start">
                    <span className={cn(
                      "text-5xl font-extrabold tracking-tight",
                      testScore !== null && testScore >= 70 ? "text-green-600" : "text-orange-500"
                    )}>
                      {testScore}
                    </span>
                    <span className="text-gray-400 font-bold">/ 100점</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    전체 {questions.length}문항 중 {testDetails.filter(d => d.isCorrect).length}문항 정답
                  </p>
                </div>

                <div className="flex-1 max-w-sm text-center md:text-right">
                  {testScore !== null && testScore >= 70 ? (
                    <div className="rounded-xl bg-green-100/60 p-3 px-4 text-green-800 text-sm font-semibold inline-block border border-green-200">
                      🎉 축하합니다! 안전 수칙 테스트 합격 기준(70점)을 충족하며 교육 및 테스트 이수를 완료하셨습니다.
                    </div>
                  ) : (
                    <div className="rounded-xl bg-orange-100/60 p-3 px-4 text-orange-800 text-sm font-semibold inline-block border border-orange-200">
                      ⚠️ 합격 기준(70점)보다 낮습니다. 아래 오답 분석을 확인하여 안전 세부 규정을 다시 확인해주시기 바랍니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 오답 확인 섹션 */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>오답 분석 및 피드백</span>
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {testDetails.filter(d => !d.isCorrect).length}개 오답
                  </span>
                </h3>

                {testDetails.filter(d => !d.isCorrect).length === 0 ? (
                  <div className="rounded-xl bg-green-50/50 border border-green-100 py-8 text-center text-green-700 text-sm font-medium">
                    👏 축하합니다! 모든 오답이 없는 완벽한 만점입니다. 안전 관리에 완벽히 준비 상태이십니다!
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {testDetails.map((detail, index) => {
                      if (detail.isCorrect) return null;
                      return (
                        <div key={index} className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <p className="font-semibold text-gray-800 mb-3 text-sm flex gap-2">
                            <span className="text-red-500 shrink-0">질문 {index + 1}.</span>
                            <span>{detail.questionText}</span>
                          </p>
                          <div className="space-y-2 mt-2 pl-6 text-xs border-l-2 border-red-100">
                            <div className="flex items-center gap-2 text-red-600 bg-red-50/40 rounded-lg p-2 border border-red-100">
                              <span className="font-bold shrink-0">내가 선택한 오답:</span>
                              <span className="text-gray-700 font-medium">
                                {detail.options[detail.selected]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-green-700 bg-green-50/40 rounded-lg p-2 border border-green-100">
                              <span className="font-bold shrink-0">올바른 정답:</span>
                              <span className="text-gray-800 font-bold">
                                {detail.options[detail.correctIndex]}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onComplete()}
                className="w-full rounded-xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black active:scale-[0.99] shadow-md shadow-gray-200"
              >
                처음으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
