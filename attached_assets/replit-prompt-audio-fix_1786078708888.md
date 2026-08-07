Sprawdź i napraw jedną rzecz z poprzedniego zadania (real-time cross-device sync):

W game-state.tsx istnieją trzy sygnały dźwiękowe/wizualne, które są wysyłane 
przez BroadcastChannel (channelRef.current?.postMessage):
- { type: 'FANFARE' }  — w markCorrect
- { type: 'WRONG' }    — w markWrong
- { type: 'CONFETTI' } — w revealAnswer i przy finałowej eliminacji

Problem: BroadcastChannel działa TYLKO między kartami w tej samej przeglądarce 
na tym samym urządzeniu. Skoro host i audience mogą teraz być na dwóch różnych 
urządzeniach (dzięki nowemu WebSocket), te trzy sygnały prawdopodobnie NIE 
docierają na ekran audience, jeśli jest otwarty na innym urządzeniu niż host.

Zadanie:
1. Sprawdź, czy FANFARE/WRONG/CONFETTI faktycznie przechodzą teraz przez nowy 
   WebSocket, czy nadal tylko przez BroadcastChannel.
2. Jeśli tylko przez BroadcastChannel — przenieś je (albo zduplikuj) tak, żeby 
   serwer WebSocket przekazywał te same eventy do wszystkich podłączonych 
   klientów w tym samym pokoju (room code), analogicznie do STATE_UPDATE.
3. Zachowaj BroadcastChannel jako dodatkowy kanał dla przypadku, gdy host 
   i audience są w dwóch kartach na TYM SAMYM urządzeniu (żeby nic nie zepsuć 
   dla tego scenariusza) — WebSocket ma być dodatkiem, nie zamiennikiem.
4. Przetestuj: otwórz Admin i Audience w dwóch różnych przeglądarkach/urządzeniach 
   (albo dwóch oknach incognito, żeby wymusić brak wspólnego BroadcastChannel), 
   kliknij Correct/Wrong, potwierdź że dźwięk i konfetti odpalają się na 
   ekranie Audience.

Nie zmieniaj nic innego — mechanika gry, wygląd, timer i room-code mają zostać 
bez zmian.
