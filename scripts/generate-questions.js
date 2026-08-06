const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const questions = [
  // WARM UP – TRUE_FALSE (IDs 1–10)
  { ID:1,  ROUND:'WARM UP',   CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'Water boils at 100 degrees Celsius at sea level.',                 CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:2,  ROUND:'WARM UP',   CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'Paris is the capital of France.',                                  CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:3,  ROUND:'WARM UP',   CATEGORY:'History',   TYPE:'TRUE_FALSE', QUESTION:'World War II ended in 1945.',                                      CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:4,  ROUND:'WARM UP',   CATEGORY:'Culture',   TYPE:'TRUE_FALSE', QUESTION:'Shakespeare wrote Romeo and Juliet.',                              CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:5,  ROUND:'WARM UP',   CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'Penguins live in the Arctic.',                                     CORRECT_ANSWER:'FALSE',                DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:6,  ROUND:'WARM UP',   CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'The Pacific Ocean is the largest ocean on Earth.',                 CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:7,  ROUND:'WARM UP',   CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'The human body has 206 bones.',                                   CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:8,  ROUND:'WARM UP',   CATEGORY:'History',   TYPE:'TRUE_FALSE', QUESTION:'The Great Wall of China is visible from space with the naked eye.',CORRECT_ANSWER:'FALSE',                DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:9,  ROUND:'WARM UP',   CATEGORY:'Culture',   TYPE:'TRUE_FALSE', QUESTION:'The Mona Lisa was painted by Leonardo da Vinci.',                  CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  { ID:10, ROUND:'WARM UP',   CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'Russia is the largest country in the world by area.',              CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'EASY',   ACTIVE:1 },
  // SURVIVAL – TRUE_FALSE (IDs 11–20)
  { ID:11, ROUND:'SURVIVAL',  CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'The speed of light is approximately 300,000 km per second.',      CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:12, ROUND:'SURVIVAL',  CATEGORY:'History',   TYPE:'TRUE_FALSE', QUESTION:'The Berlin Wall fell in 1989.',                                   CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:13, ROUND:'SURVIVAL',  CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'Australia is both a country and a continent.',                    CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:14, ROUND:'SURVIVAL',  CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'DNA stands for Deoxyribonucleic Acid.',                           CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:15, ROUND:'SURVIVAL',  CATEGORY:'Culture',   TYPE:'TRUE_FALSE', QUESTION:"The Eiffel Tower was built for the 1900 World's Fair.",           CORRECT_ANSWER:'FALSE',                DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:16, ROUND:'SURVIVAL',  CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'The Amazon River flows into the Pacific Ocean.',                  CORRECT_ANSWER:'FALSE',                DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:17, ROUND:'SURVIVAL',  CATEGORY:'History',   TYPE:'TRUE_FALSE', QUESTION:'Albert Einstein was born in Germany.',                            CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:18, ROUND:'SURVIVAL',  CATEGORY:'Science',   TYPE:'TRUE_FALSE', QUESTION:'A spider has 8 legs.',                                            CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:19, ROUND:'SURVIVAL',  CATEGORY:'Geography', TYPE:'TRUE_FALSE', QUESTION:'The capital of Japan is Osaka.',                                  CORRECT_ANSWER:'FALSE',                DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:20, ROUND:'SURVIVAL',  CATEGORY:'Culture',   TYPE:'TRUE_FALSE', QUESTION:'The original Olympic Games were held in Athens, Greece.',         CORRECT_ANSWER:'TRUE',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  // MANDATORY – OPEN (IDs 21–30)
  { ID:21, ROUND:'MANDATORY', CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'What is the chemical symbol for gold?',                           CORRECT_ANSWER:'Au',                   DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:22, ROUND:'MANDATORY', CATEGORY:'History',   TYPE:'OPEN',       QUESTION:'In which year did World War I begin?',                            CORRECT_ANSWER:'1914',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:23, ROUND:'MANDATORY', CATEGORY:'Geography', TYPE:'OPEN',       QUESTION:'What is the capital of Canada?',                                  CORRECT_ANSWER:'Ottawa',               DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:24, ROUND:'MANDATORY', CATEGORY:'Culture',   TYPE:'OPEN',       QUESTION:'Who wrote the play Hamlet?',                                      CORRECT_ANSWER:'William Shakespeare',  DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:25, ROUND:'MANDATORY', CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'What is the boiling point of water in Fahrenheit?',               CORRECT_ANSWER:'212',                  DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:26, ROUND:'MANDATORY', CATEGORY:'Geography', TYPE:'OPEN',       QUESTION:'In which city is the Colosseum located?',                        CORRECT_ANSWER:'Rome',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:27, ROUND:'MANDATORY', CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'What element has the atomic number 1?',                           CORRECT_ANSWER:'Hydrogen',             DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:28, ROUND:'MANDATORY', CATEGORY:'History',   TYPE:'OPEN',       QUESTION:'In which year did the Titanic sink?',                             CORRECT_ANSWER:'1912',                 DIFFICULTY:'MEDIUM', ACTIVE:1 },
  { ID:29, ROUND:'MANDATORY', CATEGORY:'Culture',   TYPE:'OPEN',       QUESTION:'Who composed Symphony No. 9 in D minor?',                        CORRECT_ANSWER:'Ludwig van Beethoven', DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:30, ROUND:'MANDATORY', CATEGORY:'Geography', TYPE:'OPEN',       QUESTION:'How many continents are there on Earth?',                        CORRECT_ANSWER:'7',                    DIFFICULTY:'EASY',   ACTIVE:1 },
  // BATTLE – OPEN (IDs 31–40)
  { ID:31, ROUND:'BATTLE',    CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'What is the longest bone in the human body?',                     CORRECT_ANSWER:'Femur',                DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:32, ROUND:'BATTLE',    CATEGORY:'History',   TYPE:'OPEN',       QUESTION:'In which year was the United Nations founded?',                   CORRECT_ANSWER:'1945',                 DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:33, ROUND:'BATTLE',    CATEGORY:'Geography', TYPE:'OPEN',       QUESTION:'What is the smallest country in the world by area?',               CORRECT_ANSWER:'Vatican City',         DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:34, ROUND:'BATTLE',    CATEGORY:'Culture',   TYPE:'OPEN',       QUESTION:'What fictional detective was created by Arthur Conan Doyle?',     CORRECT_ANSWER:'Sherlock Holmes',      DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:35, ROUND:'BATTLE',    CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'Which planet in our Solar System has the most moons?',            CORRECT_ANSWER:'Saturn',               DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:36, ROUND:'BATTLE',    CATEGORY:'History',   TYPE:'OPEN',       QUESTION:'In which year was the Magna Carta signed?',                       CORRECT_ANSWER:'1215',                 DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:37, ROUND:'BATTLE',    CATEGORY:'Geography', TYPE:'OPEN',       QUESTION:'What is the longest river in the world?',                         CORRECT_ANSWER:'Nile',                 DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:38, ROUND:'BATTLE',    CATEGORY:'Culture',   TYPE:'OPEN',       QUESTION:'What is the currency of Japan?',                                  CORRECT_ANSWER:'Yen',                  DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:39, ROUND:'BATTLE',    CATEGORY:'Science',   TYPE:'OPEN',       QUESTION:'What is the chemical formula for table salt?',                    CORRECT_ANSWER:'NaCl',                 DIFFICULTY:'HARD',   ACTIVE:1 },
  { ID:40, ROUND:'BATTLE',    CATEGORY:'History',   TYPE:'OPEN',       QUESTION:'Who was the first President of the United States?',               CORRECT_ANSWER:'George Washington',    DIFFICULTY:'HARD',   ACTIVE:1 },
];

const outDir = path.join('client', 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });
const ws = XLSX.utils.json_to_sheet(questions);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Questions');
XLSX.writeFile(wb, path.join(outDir, 'quiz_questions.xlsx'));
console.log(`Generated ${questions.length} questions → client/public/data/quiz_questions.xlsx`);
