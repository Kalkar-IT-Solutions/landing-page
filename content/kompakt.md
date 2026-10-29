---
title: Kalkar Kompakt
description: >-
  Öffentliche Infos zu Kalkar auf einen Blick: Wetter und Rhein,
  Abfuhrtermine, Veranstaltungen, Hofläden, Vereine und das Rathaus. Als
  Web-App, bald für iPhone und Android.
layout: kompakt
url: /kompakt/

# The web app itself (the Flutter build of kalkar-kompakt, see
# .github/workflows/pages.yml).
app: app/

hero:
  kennung: 01 — Bürger-App · Web · bald iPhone und Android
  title: Kalkar auf einen Blick.
  text: >-
    Wetter und Rhein, Abfuhrtermine, Veranstaltungen, Hofläden, Vereine
    und das Rathaus: was in Kalkar und den 13 Ortsteilen gerade wichtig
    ist, an einem ruhigen Ort.
  primary: Web-App öffnen
  secondary: Was drin ist
  note: Ohne Konto, ohne Werbung. Kein Angebot der Stadt Kalkar.

# The screens the phone in the hero runs through, from assets/kompakt/
# (<name>-light.png and <name>-dark.png, 390 × 844 at 3x).
screens:
  - { name: start, label: Start, alt: "Startseite mit Straßensperrungen, Wetter und Rheinpegel, Abfall, Terminen und Einkaufen" }
  - { name: wetter, label: Wetter & Rhein, alt: "Wetter, Warnungen für den Kreis Kleve und der Pegel des Rheins" }
  - { name: abfall, label: Abfall, alt: "Die nächsten Abfuhrtermine des Bezirks mit Erinnerung am Vorabend" }
  - { name: termine, label: Termine, alt: "Veranstaltungen und Ratssitzungen der Woche" }
  - { name: karte, label: Karte, alt: "Die eigene Karte von Kalkar mit Hofläden, Haltestellen und Sehenswertem" }

# What runs along under the horizon, the Rhine below the town.
ticker:
  - Rhein in Rees · Pegel
  - Warnungen Kreis Kleve
  - Gelbe Tonne · Erinnerung am Vorabend
  - Ratssitzungen
  - Hofläden · jetzt geöffnet
  - Bus · Abfahrten live
  - Apotheken im Notdienst
  - Straßensperrungen
  - Amtsblatt
  - 88 Vereine

sections:
  - id: inhalt
    kennung: 02 — Auf einen Blick
    title: Sechs Kacheln statt zwanzig Webseiten.
    text: >-
      Die Startseite zeigt, was heute zählt: ob es Warnungen gibt, wie hoch
      der Rhein steht, wann die nächste Tonne raus muss und was diese Woche
      los ist. Ein Tipp führt zu allem Weiteren.
    facts:
      - { term: Wetter, value: "Warnungen, Vorhersage, Pegel, Pollen" }
      - { term: Abfall, value: "Termine je Straße, Erinnerung" }
      - { term: Termine, value: "Veranstaltungen, Rat, Vereine" }
      - { term: Einkaufen, value: "Märkte und Hofläden, jetzt geöffnet" }
      - { term: Vereine, value: "88, nach Art und Ortsteil" }
      - { term: Info, value: "Notfall, Rathaus, Bus, Amtsblatt" }
    shots: [start, wetter, termine]
  - id: karte
    kennung: 03 — Unterwegs
    title: Eine eigene Karte von Kalkar.
    text: >-
      Hofläden, Märkte, Termine, Sehenswertes, Haltestellen und Sperrungen
      auf einer Karte, die nur für Kalkar und Umgebung gezeichnet ist.
      Selbst gehostet, nicht bei einem großen Kartendienst.
    facts:
      - { term: Karte, value: "OpenStreetMap, selbst gehostet" }
      - { term: Straßen, value: "Sperrungen und Baustellen im Umkreis" }
      - { term: Bus, value: "Abfahrten live" }
      - { term: Ortsteil, value: "Vorschau auf der Startseite" }
    shots: [karte]
  - id: mitmachen
    kennung: 04 — Mitmachen
    title: Was fehlt, ergänzt Kalkar selbst.
    text: >-
      Einen Termin, eine Sperrung, einen Verein oder einen Hofladen melden,
      an jedem Eintrag eine Änderung vorschlagen. Andere bestätigen mit
      „Stimmt das?“, nach drei Bestätigungen steht es in der App.
    facts:
      - { term: Melden, value: "Termine, Sperrungen, Vereine, Hofläden" }
      - { term: Prüfen, value: "drei Bestätigungen von verschiedenen Geräten" }
      - { term: Konto, value: keins nötig }
    # The little report in the section, how it gets confirmed.
    report:
      kind: Gemeldet · Sperrung
      title: Markt
      text: Donnerstags bis 13 Uhr gesperrt, Wochenmarkt
      ask: Stimmt das?
      done: Steht jetzt in der App
      example: Beispiel
  - id: haltung
    kennung: 05 — Haltung
    title: Ruhig, offen und aus der Nähe.
    text: >-
      Die Daten kommen aus öffentlichen Quellen wie dem Deutschen
      Wetterdienst, der Warn-App NINA, den Pegeln am Rhein und den Seiten
      der Stadt. Kein Konto, keine Werbung, nichts von Google. Auf Deutsch
      und Englisch.
    facts:
      - { term: Web, value: "jetzt, im Browser" }
      - { term: Apps, value: "iPhone und Android folgen" }
      - { term: Sprachen, value: "Deutsch, Englisch" }
      - { term: Von, value: "Kalkar IT Solutions" }
---
