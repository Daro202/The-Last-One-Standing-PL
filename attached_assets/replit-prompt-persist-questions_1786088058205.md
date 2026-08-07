Problem: pytania z Excela trzeba wgrywać ręcznie za każdym razem, gdy ktoś 
otwiera panel Admin (np. na nowym urządzeniu albo po odświeżeniu). Czasem 
wydaje się, że "same się ładują" — to prawdopodobnie tylko lokalna pamięć 
przeglądarki (localStorage) na tym jednym urządzeniu, a nie prawdziwy zapis 
na serwerze. Właśnie na innym urządzeniu/sesji pytania NIE wczytały się 
automatycznie.

Zadanie: zrób prawdziwe, trwałe przechowywanie po stronie serwera.

1. Gdy host importuje plik Excel (.xlsx) w panelu Admin, sparsowane pytania 
   (i najlepiej też lista graczy, jeśli jest importowana podobnie) mają zostać 
   zapisane po stronie SERWERA — np. jako plik JSON na dysku serwera 
   (data/questions.json), nie tylko w pamięci przeglądarki hosta.

2. Przy starcie/odświeżeniu panelu Admin (i ewentualnie Audience, jeśli 
   potrzebuje danych o pytaniach) aplikacja ma najpierw spróbować pobrać 
   pytania z serwera (np. GET /api/questions). Dopiero jeśli serwer nie ma 
   jeszcze żadnych zapisanych pytań, pokaż normalny ekran "zaimportuj Excel".

3. Dane mają przetrwać restart serwera (stąd zapis do pliku, nie tylko do 
   pamięci procesu) i być dostępne dla KAŻDEGO, kto otworzy panel — różne 
   urządzenia, różne przeglądarki, nie tylko ta, z której zaimportowano.

4. Zachowaj istniejący przycisk "Import Excel" jako sposób na PODMIANĘ danych 
   (np. gdy chcemy załadować nowy zestaw pytań) — po prostu ma on teraz też 
   zapisywać na serwer, nie tylko lokalnie.

Nie zmieniaj mechaniki gry, WebSocket, room code, wyglądu ani innych funkcji — 
tylko dodaj trwałe przechowywanie pytań po stronie serwera plus automatyczne 
ładowanie ich stamtąd przy starcie.

Przetestuj: zaimportuj Excel na jednym urządzeniu, otwórz panel Admin na 
INNYM urządzeniu/przeglądarce (albo w oknie incognito) i potwierdź, że 
pytania są tam widoczne bez ręcznego importu.
