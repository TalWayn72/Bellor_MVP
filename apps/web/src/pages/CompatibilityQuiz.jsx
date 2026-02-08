import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { demoQuestions, QuestionCard, QuizInfoCard } from '@/components/quiz/QuizQuestions';

export default function CompatibilityQuiz() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [localAnswers, setLocalAnswers] = useState([]);

  const { data: questions = demoQuestions } = useQuery({
    queryKey: ['compatibilityQuestions'],
    queryFn: async () => demoQuestions,
  });

  const { data: existingAnswers = localAnswers } = useQuery({
    queryKey: ['myCompatibilityAnswers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return localAnswers;
    },
    enabled: !!currentUser,
  });

  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer, importance }) => {
      const answerData = {
        id: Date.now().toString(),
        user_id: currentUser.id,
        question_id: questionId,
        answer,
        importance
      };
      // Compatibility answer persistence - backend integration pending
      return answerData;
    },
    onSuccess: (answerData) => {
      setLocalAnswers(prev => {
        const existing = prev.findIndex(a => a.question_id === answerData.question_id);
        if (existing >= 0) {
          return prev.map(a => a.question_id === answerData.question_id ? answerData : a);
        }
        return [...prev, answerData];
      });
      queryClient.invalidateQueries({ queryKey: ['myCompatibilityAnswers'] });
    },
  });

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = async (answer, importance = 'somewhat_important') => {
    setAnswers({ ...answers, [currentQuestion.id]: { answer, importance } });
    await saveAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      answer,
      importance
    });

    if (isLastQuestion) {
      alert('Quiz completed! Your answers will help us find better matches for you.');
      navigate(createPageUrl('Profile'));
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (isLoading || questions.length === 0) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Compatibility Quiz</h1>
            </div>
            <BackButton variant="header" position="relative" fallback="/Profile" />
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-match transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <QuestionCard
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />

        <button
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
          className="w-full mt-4 py-3 text-muted-foreground text-sm hover:text-foreground"
        >
          Skip this question
        </button>

        <QuizInfoCard />
      </div>
    </div>
  );
}
