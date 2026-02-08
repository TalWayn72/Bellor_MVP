import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const demoQuestions = [
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
    question_text: "What's your ideal first date?",
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
    question_text: "What's your communication style?",
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
    question_text: "What's your stance on pets?",
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
    question_text: "What's your approach to finances?",
    category: 'values',
    question_type: 'multiple_choice',
    options: ['Save for the future', 'Balance saving and spending', 'Live in the moment', 'Depends on circumstances'],
    weight: 1.5
  }
];

export function QuestionCard({ question, questionIndex, totalQuestions, onAnswer }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Question {questionIndex + 1} of {totalQuestions}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{question.question_text}</h2>
          <p className="text-sm text-muted-foreground">Category: {question.category}</p>
        </div>

        <div className="space-y-3">
          {question.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onAnswer(option)}
              className="w-full p-4 text-left border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0"></div>
                <span className="font-medium text-foreground">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuizInfoCard() {
  return (
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
  );
}
