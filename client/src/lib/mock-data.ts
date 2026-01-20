export interface Question {
  id: number;
  text: string;
  answer: string;
  type: 'YES_NO' | 'OPEN';
}

export interface Player {
  id: number;
  name: string;
  points: number;
  status: 'ACTIVE' | 'ELIMINATED';
}

export const INITIAL_PLAYERS: Player[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  points: 0,
  status: 'ACTIVE',
}));

export const ROUNDS = [
  { id: 1, name: 'ROUND 1 - WARM UP', type: 'YES_NO', description: 'Simple yes/no questions. Wrong answer eliminates.' },
  { id: 2, name: 'ROUND 2 - SURVIVAL', type: 'YES_NO', description: 'Simple yes/no questions. Wrong answer eliminates.' },
  { id: 3, name: 'ROUND 3 - MANDATORY', type: 'OPEN', description: 'All players must answer. Correct +1 point. Bottom 40% eliminated.' },
  { id: 4, name: 'ROUND 4 - BATTLE', type: 'OPEN', description: 'Buzzer round. Correct answer challenges another player.' },
];

export const QUESTIONS: Record<string, Question[]> = {
  '1': [
    { id: 1, text: 'Czy stolicą Szwecji jest Sztokholm?', answer: 'TAK', type: 'YES_NO' },
    { id: 2, text: 'Czy Szwajcaria należy do Unii Europejskiej?', answer: 'NIE', type: 'YES_NO' },
    { id: 3, text: 'Czy walutą Australii jest dolar australijski?', answer: 'TAK', type: 'YES_NO' },
    { id: 4, text: 'Czy Polska leży w Azji?', answer: 'NIE', type: 'YES_NO' },
    { id: 5, text: 'Czy Rzym jest stolicą Włoch?', answer: 'TAK', type: 'YES_NO' },
    { id: 6, text: 'Czy euro jest walutą Wielkiej Brytanii?', answer: 'NIE', type: 'YES_NO' },
    { id: 7, text: 'Czy Japonia jest wyspą?', answer: 'TAK', type: 'YES_NO' },
    { id: 8, text: 'Czy Amazonka jest najdłuższą rzeką świata?', answer: 'NIE', type: 'YES_NO' },
  ],
  '2': [
    { id: 9, text: 'Czy woda wrze w 100°C?', answer: 'TAK', type: 'YES_NO' },
    { id: 10, text: 'Czy pingwiny żyją na biegunie północnym?', answer: 'NIE', type: 'YES_NO' },
    { id: 11, text: 'Czy Warszawa leży nad Wisłą?', answer: 'TAK', type: 'YES_NO' },
    { id: 12, text: 'Czy Księżyc jest planetą?', answer: 'NIE', type: 'YES_NO' },
  ],
  '3': [
    { id: 21, text: 'Jak nazywa się stolica Francji?', answer: 'Paryż', type: 'OPEN' },
    { id: 22, text: 'Ile dni ma tydzień?', answer: '7', type: 'OPEN' },
    { id: 23, text: 'Jak nazywa się największa planeta Układu Słonecznego?', answer: 'Jowisz', type: 'OPEN' },
    { id: 24, text: 'W jakim kraju znajduje się Koloseum?', answer: 'Włochy', type: 'OPEN' },
    { id: 25, text: 'Jak nazywa się najwyższa góra świata?', answer: 'Mount Everest', type: 'OPEN' },
  ],
  '4': [
    { id: 41, text: 'Kto namalował „Mona Lisę”?', answer: 'Leonardo da Vinci', type: 'OPEN' },
    { id: 42, text: 'W którym roku Polska weszła do Unii Europejskiej?', answer: '2004', type: 'OPEN' },
    { id: 43, text: 'Jak nazywa się pierwiastek chemiczny o symbolu O?', answer: 'Tlen', type: 'OPEN' },
    { id: 44, text: 'Jak nazywa się największy ocean na Ziemi?', answer: 'Ocean Spokojny', type: 'OPEN' },
    { id: 45, text: 'Kto był pierwszym człowiekiem na Księżycu?', answer: 'Neil Armstrong', type: 'OPEN' },
  ]
};
