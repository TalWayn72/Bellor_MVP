import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function CompatibilityQuiz() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Demo compatibility questions
  const demoQuestions = [
    {
      id: '1',
      question_text: 'How do you prefer to spend your weekends?',
      category: 'lifestyle',
      question_type: 'multiple_choice',
      options: ['Relaxing at home', 'Out with friends', 'Exploring new places', 'Working on hobbies'],
      weight: 1
    },
    {
      id: '2',
      question_text: 'What\'s your ideal first date?',
      category: 'interests',
      question_type: 'multiple_choice',
      options: ['Coffee and conversation', 'Dinner at a nice restaurant', 'Fun activity like bowling', 'Outdoor adventure'],
      weight: 1.5
    },
    {
      id: '3',
      question_text: 'How important is physical fitness to you?',
      category: 'lifestyle',
      question_type: 'scale',
      options: ['Not important', 'Somewhat important', 'Very important', 'Extremely important'],
      weight: 1
    },
    {
      id: '4',
      question_text: 'Do you want children in the future?',
      category: 'goals',
      question_type: 'yes_no',
      options: ['Yes, definitely', 'Maybe someday', 'Probably not', 'No, not at all'],
      weight: 2
    },
    {
      id: '5',
      question_text: 'How do you handle conflicts?',
      category: 'personality',
      question_type: 'multiple_choice',
      options: ['Talk it out immediately', 'Need time to cool down', 'Prefer to avoid conflict', 'Depends on the situation'],
      weight: 1.5
    },
    {
      id: '6',
      question_text: 'What\'s your communication style?',
      category: 'personality',
      question_type: 'multiple_choice',
      options: ['Very talkative and expressive', 'Good listener, selective speaker', 'Text more than talk', 'Actions speak louder than words'],
      weight: 1.5
    },
    {
      id: '7',
      question_text: 'How important is religion/spirituality in your life?',
      category: 'values',
      question_type: 'scale',
      options: ['Not important', 'Somewhat important', 'Very important', 'Central to my life'],
      weight: 2
    },
    {
      id: '8',
      question_text: 'What\'s your stance on pets?',
      category: 'lifestyle',
      question_type: 'multiple_choice',
      options: ['Love them, have them', 'Like them, open to having', 'Neutral about pets', 'Prefer no pets'],
      weight: 1
    },
    {
      id: '9',
      question_text: 'How do you prefer to show affection?',
      category: 'relationships',
      question_type: 'multiple_choice',
      options: ['Physical touch', 'Words of affirmation', 'Quality time', 'Acts of service', 'Gifts'],
      weight: 1.5
    },
    {
      id: '10',
      question_text: 'What\'s your approach to finances?',
      category: 'values',
      question_type: 'multiple_choice',
      options: ['Save for the future', 'Balance saving and spending', 'Live in the moment', 'Depends on circumstances'],
      weight: 1.5
    }
  ];

  // Local state for saved answers (demo mode)
  const [localAnswers, setLocalAnswers] = useState([]);

  const { data: questions = demoQuestions } = useQuery({
    queryKey: ['compatibilityQuestions'],
    queryFn: async () => {
      return demoQuestions;
    },
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
      // Log answer save (CompatibilityAnswer service can be added in future)
      const answerData = {
        id: Date.now().toString(),
        user_id: currentUser.id,
        question_id: questionId,
        answer,
        importance
      };
      console.log('Compatibility answer saved:', answerData);
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
            <div className="min-w-[24px]">
              <div className="w-6"></div>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Compatibility Quiz</h1>
            </div>
            <BackButton variant="header" position="relative" fallback="/Profile" />
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-match transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            {/* Question Counter */}
            <div className="text-center mb-6">
              <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{currentQuestion.question_text}</h2>
              <p className="text-sm text-muted-foreground">Category: {currentQuestion.category}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="w-full p-4 text-left border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0"></div>
                    <span className="font-medium text-foreground">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Skip Button */}
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="w-full mt-4 py-3 text-muted-foreground text-sm hover:text-foreground"
            >
              Skip this question
            </button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-4 bg-info/10 border-info/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Why this quiz?</h3>
                <p className="text-xs text-muted-foreground">
                  Your answers help us understand your values and preferences to find more compatible matches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}