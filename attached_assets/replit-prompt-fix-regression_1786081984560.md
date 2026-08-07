Wystąpił regres: wkleiłem starszą wersję admin.tsx (przygotowaną poza Replitem, 
zanim istniał room code / WebSocket), która nadpisała Twój nowszy kod. Efekt: 
na Controls tab zniknął box z ROOM CODE i prawdopodobnie inne elementy 
związane z WebSocket/room code, które wcześniej tam były.

Zadanie:
1. Przywróć box z ROOM CODE (i wszystko inne związane z WebSocket/pokojem, 
   co mogło zniknąć) na górze panelu Controls — dokładnie tak, jak działało 
   PRZED tym nadpisaniem.

2. Zachowaj nową funkcję, która została dodana w tym nadpisanym pliku i jest 
   potrzebna: na ekranach mobilnych (poniżej ~1024px szerokości) admin ma 
   pokazywać TYLKO JEDNĄ z trzech kolumn naraz (Controls / Question / Players), 
   przełączaną paskiem zakładek na dole ekranu. Na desktopie (≥1024px) ma zostać 
   bez zmian — trzy kolumny obok siebie jak było. Jeśli ten mechanizm nadal 
   działa w obecnym kodzie — zostaw go, tylko dołóż z powrotem brakujący Room 
   Code i inne elementy WebSocket.

3. Dodatkowy bug do naprawienia przy okazji: na zakładce "Question" (mobile), 
   tekst pytania jest ucięty / nie zawija się poprawnie — widać tylko ostatnie 
   słowo/fragment zamiast całego pytania. To wygląda na zbyt duży, sztywny 
   rozmiar czcionki nieprzystosowany do wąskiego ekranu. Popraw rozmiar 
   czcionki pytania tak, żeby responsywnie się zmniejszał na mobile (np. 
   mniejszy text-size poniżej lg breakpointu) i cały tekst pytania był widoczny 
   bez przycinania.

Przed zakończeniem: przetestuj na symulowanym mobilnym viewport (~390px 
szerokości) że: (a) Room Code jest widoczny na Controls, (b) pełne pytanie 
jest widoczne na zakładce Question, (c) trzy zakładki na dole nadal przełączają 
panele poprawnie, (d) desktop layout (≥1024px) wygląda dokładnie tak jak wcześniej.
