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
    { id: 9, text: 'Czy Berlin jest stolicą Niemiec?', answer: 'TAK', type: 'YES_NO' },
    { id: 10, text: 'Czy Mount Everest jest w Europie?', answer: 'NIE', type: 'YES_NO' },
    { id: 11, text: 'Czy język hiszpański jest urzędowy w Brazylii?', answer: 'NIE', type: 'YES_NO' },
    { id: 12, text: 'Czy kangury żyją naturalnie w Afryce?', answer: 'NIE', type: 'YES_NO' },
    { id: 13, text: 'Czy Słońce jest gwiazdą?', answer: 'TAK', type: 'YES_NO' },
    { id: 14, text: 'Czy Wielki Mur Chiński widać z Księżyca gołym okiem?', answer: 'NIE', type: 'YES_NO' },
    { id: 15, text: 'Czy delfiny są ssakami?', answer: 'TAK', type: 'YES_NO' },
    { id: 16, text: 'Czy rok przestępny ma 366 dni?', answer: 'TAK', type: 'YES_NO' },
    { id: 17, text: 'Czy Mozart był kompozytorem?', answer: 'TAK', type: 'YES_NO' },
    { id: 18, text: 'Czy pingwiny potrafią latać?', answer: 'NIE', type: 'YES_NO' },
    { id: 19, text: 'Czy miedź jest metalem?', answer: 'TAK', type: 'YES_NO' },
    { id: 20, text: 'Czy człowiek ma trzy płuca?', answer: 'NIE', type: 'YES_NO' },
    { id: 21, text: 'Czy Sahara jest największą pustynią na świecie?', answer: 'TAK', type: 'YES_NO' },
    { id: 22, text: 'Czy diamenty powstają z węgla?', answer: 'TAK', type: 'YES_NO' },
    { id: 23, text: 'Czy sekunda to jednostka czasu?', answer: 'TAK', type: 'YES_NO' },
  ],
  '2': [
    { id: 24, text: 'Czy woda wrze w 100°C?', answer: 'TAK', type: 'YES_NO' },
    { id: 25, text: 'Czy pingwiny żyją na biegunie północnym?', answer: 'NIE', type: 'YES_NO' },
    { id: 26, text: 'Czy Warszawa leży nad Wisłą?', answer: 'TAK', type: 'YES_NO' },
    { id: 27, text: 'Czy Księżyc jest planetą?', answer: 'NIE', type: 'YES_NO' },
  ],
  '3': [
    { id: 30, text: 'Jak nazywa się stolica Francji?', answer: 'Paryż', type: 'OPEN' },
    { id: 31, text: 'Ile dni ma tydzień?', answer: '7', type: 'OPEN' },
    { id: 32, text: 'Jak nazywa się największa planeta Układu Słonecznego?', answer: 'Jowisz', type: 'OPEN' },
    { id: 33, text: 'W jakim kraju znajduje się Koloseum?', answer: 'Włochy', type: 'OPEN' },
    { id: 34, text: 'Jak nazywa się najwyższa góra świata?', answer: 'Mount Everest', type: 'OPEN' },
  ],
  '4': [
    { id: 40, text: 'Kto namalował „Mona Lisę”?', answer: 'Leonardo da Vinci', type: 'OPEN' },
    { id: 41, text: 'W którym roku Polska weszła do Unii Europejskiej?', answer: '2004', type: 'OPEN' },
    { id: 42, text: 'Jak nazywa się pierwiastek chemiczny o symbolu O?', answer: 'Tlen', type: 'OPEN' },
    { id: 43, text: 'Jak nazywa się największy ocean na Ziemi?', answer: 'Ocean Spokojny', type: 'OPEN' },
    { id: 44, text: 'Kto był pierwszym człowiekiem na Księżycu?', answer: 'Neil Armstrong', type: 'OPEN' },
  ]
};
