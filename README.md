# Anonym Recensionsbot

En Discord-bot som låter användare skicka in anonyma recensioner och feedback.

## Funktioner

- Skicka in anonyma eller namngivna recensioner med 1-5 stjärnbetyg
- Visa senaste recensionerna med stjärnbetyg
- Övergripande sammanfattning med medelbetyg och fördelningsdiagram
- SQLite-databaslagring
- Inbäddade meddelanden med stjärnemojis

## Kommandon

- `/recension <meddelande> <betyg> [anonym]` - Skicka in en recension med stjärnbetyg (1-5)
- `/recensioner` - Visa de 5 senaste recensionerna med betyg
- `/sammanfattning` - Visa övergripande recensionsstatistik och betygfördelning
- `/hjälp` - Visa tillgängliga kommandon

## Exempel

- `/recension meddelande:Fantastisk service! betyg:5` - Anonym 5-stjärnig recension
- `/recension meddelande:Bra upplevelse betyg:4 anonym:false` - Namngiven 4-stjärnig recension
- `/recension meddelande:Kunde vara bättre betyg:2 anonym:true` - Anonym 2-stjärnig recension
- `/sammanfattning` - Visar medelbetyg och fördelningsdiagram

## Installation

1. Installera beroenden: `npm install`
2. Lägg till din Discord bot-token i `.env`
3. Kör botten: `npm start`

## Nödvändiga Bot-behörigheter

- Skicka meddelanden
- Hantera meddelanden (för att radera ursprungliga recensionsmeddelanden)
- Bädda in länkar
- Läsa meddelandehistorik

Din bot är redo att användas!