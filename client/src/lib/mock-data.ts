export interface Question {
  id: number;
  text: string;
  answer: string;
  type: 'TRUE_FALSE' | 'OPEN';
  plant?: string;
  location?: string;
}

export interface Player {
  id: number;
  name: string;
  points: number;
  lives: number;
  status: 'ACTIVE' | 'ELIMINATED';
}

export const INITIAL_PLAYERS: Player[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  points: 0,
  lives: 2,
  status: 'ACTIVE',
}));

export const ROUNDS = [
  { id: 1, name: 'WARM UP',    description: 'TRUE / FALSE questions. Wrong answer costs 1 life.' },
  { id: 2, name: 'SURVIVAL',   description: 'TRUE / FALSE questions. Wrong answer costs 1 life.' },
  { id: 3, name: 'MANDATORY',  description: 'Open questions. Correct answer +1 point. Wrong answer costs 1 life.' },
  { id: 4, name: 'BATTLE',     description: 'Open questions. Last player standing wins.' },
];

export const QUESTIONS: Record<string, Question[]> = {
  '1': [
    { id: 1,  text: 'The capital of Sweden is Stockholm.',               answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 2,  text: 'Switzerland is a member of the European Union.',    answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 3,  text: 'The currency of Australia is the Australian dollar.',answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 4,  text: 'Poland is located in Asia.',                        answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 5,  text: 'Rome is the capital of Italy.',                     answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 6,  text: 'The euro is the currency of the United Kingdom.',   answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 7,  text: 'Japan is an island nation.',                        answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 8,  text: 'The Amazon is the longest river in the world.',     answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 9,  text: 'Berlin is the capital of Germany.',                 answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 10, text: 'Mount Everest is located in Europe.',               answer: 'FALSE', type: 'TRUE_FALSE' },
  ],
  '2': [
    { id: 11, text: 'Dolphins are mammals.',                             answer: 'TRUE',  type: 'TRUE_FALSE' },
    { id: 12, text: 'A leap year has 365 days.',                         answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 13, text: 'Penguins can fly.',                                 answer: 'FALSE', type: 'TRUE_FALSE' },
    { id: 14, text: 'The Sun is a star.',                                answer: 'TRUE',  type: 'TRUE_FALSE' },
  ],
  '3': [
    { id: 20, text: 'What is the capital of France?',                    answer: 'Paris',        type: 'OPEN' },
    { id: 21, text: 'How many days are in a week?',                      answer: '7',            type: 'OPEN' },
    { id: 22, text: 'What is the largest planet in the Solar System?',   answer: 'Jupiter',      type: 'OPEN' },
    { id: 23, text: 'In which country is the Colosseum located?',        answer: 'Italy',        type: 'OPEN' },
    { id: 24, text: 'What is the highest mountain in the world?',        answer: 'Mount Everest',type: 'OPEN' },
  ],
  '4': [
    { id: 30, text: 'Who painted the Mona Lisa?',                        answer: 'Leonardo da Vinci', type: 'OPEN' },
    { id: 31, text: 'What is the chemical symbol for oxygen?',           answer: 'O',                 type: 'OPEN' },
    { id: 32, text: 'What is the largest ocean on Earth?',               answer: 'Pacific Ocean',     type: 'OPEN' },
    { id: 33, text: 'Who was the first person to walk on the Moon?',     answer: 'Neil Armstrong',    type: 'OPEN' },
  ],
};
