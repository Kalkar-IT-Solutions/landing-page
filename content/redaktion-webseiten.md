---
title: Redaktion
description: >-
  Webseiten-Pflege für Betriebe, Praxen und Vereine am Niederrhein: Texte,
  Termine und Öffnungszeiten in einfachen Formularen ändern, jede Änderung
  als Version, Einrichtung und Betrieb durch Kalkar IT.
layout: redaktion

# The web app itself lives at /kundenportal/ (branch redaktion-build, see
# .github/workflows/pages.yml); this page describes it and must not use that
# address.

# How the page appears in "Arbeiten" on the start page.
arbeit:
  note: Webseiten-Pflege
  status: Demo

hero:
  kennung: Webseiten-Pflege · Betriebe · Praxen · Vereine
  title: Ihre Webseite pflegen Sie selbst.
  text: >-
    Redaktion ist die Webseiten-Pflege von Kalkar IT für Betriebe, Praxen und
    Vereine am Niederrhein. Neuigkeiten, Termine und Öffnungszeiten ändern Sie
    in einfachen Formularen, Einrichtung und Betrieb übernehmen wir. Die Demo
    läuft im Browser, ohne Konto.
  primary: { label: Demo ausprobieren, url: /kundenportal/demo }
  secondary: { label: So läuft es ab, url: "#ablauf" }

# The form in the phone beside the hero: a picture of the editor, made of
# words only. Decoration; the sections say the same.
vorschau:
  kennung: Seite · Kontakt
  title: Öffnungszeiten
  felder:
    - { label: Montag bis Freitag, wert: 8 bis 17 Uhr }
    - { label: Samstag, wert: 9 bis 13 Uhr }
    - { label: Hinweis, wert: Feiertags geschlossen }
  status: Wartet auf Freigabe
  knopf: Vorschau

sections:
  - id: pflegen
    kennung: Pflegen
    title: Was sich ändert, ändern Sie.
    text: >-
      Jeder Bereich Ihrer Seite hat ein eigenes Formular. Sie tragen ein, was
      neu ist, und Redaktion setzt es an die richtige Stelle, im Aussehen
      Ihrer Seite.
    facts:
      - { term: Texte, value: "Startseite, Leistungen, Über uns" }
      - { term: Bilder, value: "hochladen und beschreiben" }
      - { term: Neues, value: "Neuigkeiten und Beiträge" }
      - { term: Termine, value: "Veranstaltungen, Sprechstunden" }
      - { term: Stellen, value: "offene Stellen und Ausbildung" }
      - { term: Zeiten, value: "Öffnungszeiten und Ausnahmen" }
      - { term: Team, value: "Personen mit Bild und Aufgabe" }
      - { term: Menü, value: "Reihenfolge und Namen der Seiten" }
  - id: sicher
    kennung: Sicher
    title: Nichts geht verloren.
    text: >-
      Jede Änderung wird als Version gespeichert und lässt sich zurückholen.
      Mitarbeitende schicken Änderungen zur Freigabe, Inhaberin oder Inhaber
      geben sie frei. Vor dem Veröffentlichen zeigt die Vorschau die ganze
      Seite.
    facts:
      - { term: Versionen, value: "jede Änderung, jederzeit zurück" }
      - { term: Freigabe, value: "durch Inhaberin oder Inhaber" }
      - { term: Vorschau, value: "die ganze Seite vor dem Veröffentlichen" }
      - { term: Hinweise, value: "zu Barrierefreiheit und Suchmaschinen, beim Schreiben" }
      - { term: Sprachen, value: "mehrsprachige Seiten, nebeneinander gepflegt" }
  - id: ablauf
    kennung: Ablauf
    title: Vom ersten Klick zur eigenen Seite.
    text: >-
      Ein kurzer Assistent fragt nach Branche, Zielen und Design. Daraus
      entsteht eine Beispielseite, an der Sie Redaktion ausprobieren. Gefällt
      sie Ihnen, fragen Sie direkt aus der Demo an, und wir richten Ihre Seite
      ein.
    facts:
      - { term: Assistent, value: "ein paar Fragen, jede lässt sich überspringen" }
      - { term: Demo, value: "[Beispielseite im Browser](/kundenportal/demo), nichts wird veröffentlicht" }
      - { term: Anfrage, value: "„Jetzt eigene Seite anfragen“, mit Ihren Antworten" }
      - { term: Einrichtung, value: "Kalkar IT richtet Seite und Zugänge ein" }
  - id: daten
    kennung: Ihre Daten
    title: Ihre Seite gehört Ihnen.
    text: >-
      Seite und Inhalte liegen in einem eigenen Repository, mit allen
      Versionen. Die Daten bleiben in der EU, die Statistik kommt ohne Cookies
      aus und das Kontaktformular ohne fremden Dienst.
    facts:
      - { term: Inhalte, value: "eigenes Repository, mit allen Versionen" }
      - { term: Daten, value: "in der EU, bei Supabase in Frankfurt" }
      - { term: Webspace, value: "bei do.de" }
      - { term: Statistik, value: "Besucher zählen ohne Cookies" }
      - { term: Kontakt, value: "Formular ohne Fremddienst" }
  - id: betrieb
    kennung: Betrieb
    title: Betreut von hier.
    text: >-
      Kalkar IT richtet die Seite ein, hostet sie und hält sie in Betrieb.
      Bei Fragen haben Sie einen Ansprechpartner vor Ort, der Ihre Seite
      kennt.
    facts:
      - { term: Geräte, value: "Im Browser; Apps für iPhone, iPad und Android folgen" }
      - { term: Hosting, value: "Webspace, Betrieb, Wartung" }
      - { term: Vor Ort, value: "Kalkar und Umgebung" }
  - id: zusaetze
    kennung: Zusätze
    title: Was dazukommen kann.
    text: >-
      Nicht jede Seite braucht alles. Diese Angebote kommen bei Bedarf dazu
      und lassen sich wieder abschalten.
    facts:
      - { term: Newsletter, value: "Neuigkeiten per E-Mail an Interessierte" }
      - { term: Buchung, value: "Termine direkt auf der Seite buchen" }
      - { term: Social, value: "Beiträge an Social Media weitergeben" }
  - id: preise
    kennung: Preise
    title: Nach Vereinbarung.
    text: >-
      Preise nach Vereinbarung – Tarife folgen. Schreiben Sie uns, was Ihre
      Seite braucht, dann bekommen Sie ein Angebot.
  - id: fragen
    kennung: Fragen
    title: Was oft gefragt wird.
    text: >-
      Was hier fehlt, beantworten wir gern per E-Mail an
      [hi@kalkar-it.de](mailto:hi@kalkar-it.de).
    fragen:
      - frage: Brauche ich Vorkenntnisse?
        antwort: >-
          Nein. Jedes Feld sagt, was hineingehört, und die Vorschau zeigt vor
          dem Veröffentlichen, wie es aussieht.
      - frage: Was passiert, wenn ich mich vertue?
        antwort: >-
          Jede Änderung ist eine Version. Unter „Verlauf“ holen Sie einen
          früheren Stand zurück.
      - frage: Können mehrere Personen an der Seite arbeiten?
        antwort: >-
          Ja. Mitarbeitende schicken Änderungen zur Freigabe, Inhaberin oder
          Inhaber prüfen und veröffentlichen.
      - frage: Gehört die Seite mir?
        antwort: >-
          Ja. Seite und Inhalte liegen in einem eigenen Repository, das Ihnen
          gehört, mit allen Versionen.
      - frage: Wo liegen meine Daten?
        antwort: >-
          In der EU: Redaktion speichert bei Supabase in Frankfurt, die
          fertige Seite liegt auf einem Webspace bei do.de.
      - frage: Was kostet Redaktion?
        antwort: >-
          Preise nach Vereinbarung – Tarife folgen. Schreiben Sie uns, dann
          bekommen Sie ein Angebot.
  - id: kontakt
    kennung: Anfrage
    title: Ihre eigene Seite.
    text: >-
      Am schnellsten geht es über die [Demo](/kundenportal/demo): Dort fragen Sie
      mit „Jetzt eigene Seite anfragen“ an, Ihre Antworten aus dem Assistenten
      gehen mit. Oder Sie senden uns hier eine Anfrage.

form:
  # Subject of the mailto link behind the hero's button without JavaScript.
  subject: Anfrage zu Redaktion
  name: Name
  namePlaceholder: Vor- und Nachname
  email: E-Mail
  emailPlaceholder: name@beispiel.de
  message: Worum geht es?
  messagePlaceholder: Betrieb, Praxis oder Verein, und was die Seite zeigen soll.
  consent: Ich bin einverstanden, dass meine Angaben gespeichert werden, um meine Anfrage zu beantworten.
  consentLink: Mehr dazu in der Datenschutzerklärung.
  submit: Anfrage senden
  ok: Danke, Ihre Anfrage ist angekommen. Wir melden uns per E-Mail.
  error: Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Angaben und versuchen Sie es noch einmal.
  rate: Gerade kamen sehr viele Anfragen. Bitte versuchen Sie es später noch einmal.
  offline: Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung.
---
