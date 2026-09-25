/* =========================================================================
   Texte der Hilfen „Warum / Wie / Wo finde ich das?" (Bearbeitungspunkt).
   Verknüpfung: `erkl:'<schlüssel>'` am Feld oder Block in felder-daten.js.

   Eintrag:  titel, warum{…}, wie{geraet, icons?, …}, finden{…}
   Ansicht:  intro, punkte:[…], abschnitte?:[{titel, intro?, punkte}], schluss?
   Punkt:    {t, text, sym?, sub?, methode?}
     sym     RCD-Symbole: ac, a, f, b, b_plus
     methode GER-09: Punkt zur gewählten GER-10-Methode
   Kurzschreibweisen: [[Taste]] · [[Start]] grün · [[Stopp]] rot ·
                      {L} {N} {PE} Buchsen Fluke 1663 · <b> <i> <sub> erlaubt
   Abgeglichen mit: Fluke 1662/1663/1664 FC (Rev. 3) und Fluke 6500-2 (Rev. 2).
   ========================================================================= */

const ERKL = {
pruefnorm: {
  titel:'Prüfnorm',
  wann:{
    intro:'Die Norm richtet sich danach, WAS geprüft wird (Anlage oder Gerät) und WARUM (neu, geändert, wiederkehrend, nach Reparatur). Passend zu STAM-13 „Grund der Prüfung“ wählen.',
    abschnitte:[
      {titel:'Elektrische Anlagen', punkte:[
        {t:'DIN VDE 0100-600', text:'Erstprüfung vor der ersten Inbetriebnahme: Neuanlage, Erweiterung oder Änderung (STAM-13 „Neuanlage“ bzw. „Änderung“). Prüft der Errichter.'},
        {t:'DIN VDE 0105-100', text:'Wiederkehrende Prüfung bestehender Anlagen im Betrieb, z. B. nach DGUV Vorschrift 3 (STAM-13 „Wiederholung“ bzw. „Bestand“). Mess- und Grenzwerte orientieren sich an DIN VDE 0100-600.'},
        {t:'DIN VDE 0100-600 / 0105-100', text:'Bestehende Anlage wiederkehrend prüfen UND geänderte oder erweiterte Teile erstmals prüfen – beides in einem Protokoll.'}
      ]},
      {titel:'Elektrische Geräte', punkte:[
        {t:'DIN EN 50699 (VDE 0702)', text:'Wiederholungsprüfung ortsveränderlicher Geräte im Betrieb.'},
        {t:'DIN EN 50678 (VDE 0701)', text:'Prüfung nach Instandsetzung (Reparatur) oder Änderung eines Geräts.'},
        {t:'DIN VDE 0701-0702', text:'Abgelöste Vorgängernorm – nur noch wählen, wenn an ein altes Protokoll angeknüpft werden muss.'}
      ]}
    ]
  }
},


/* ======================= NETZMESSUNG ======================= */

netzmessung: {
  titel:'Netzmessung – Spannungen und Frequenz',
  warum:{
    intro:'Mit der Netzmessung wird festgestellt, ob am Einspeisepunkt die erwartete Spannung und Frequenz anstehen und ob alle Leiter richtig angeschlossen sind. Sie ist die Grundlage für alle weiteren Messungen, denn Schleifenimpedanz, Kurzschlussstrom und RCD-Prüfung beziehen sich auf die tatsächlich vorhandene Spannung.',
    punkte:[
      {t:'Drehstrom / 1-phasig (a)', text:'Legt fest, welche Messungen sinnvoll sind. Bei einem 1-phasigen Anschluss entfallen die Messungen an L2/L3 und zwischen den Außenleitern.'},
      {t:'Spannung Außenleiter – Neutralleiter (b–d)', text:'Nennwert 230 V. Zu niedrige Werte deuten auf eine überlastete oder zu lange Zuleitung bzw. einen schlechten Kontakt hin, zu hohe Werte häufig auf einen unterbrochenen oder schlecht angeschlossenen Neutralleiter (Sternpunktverschiebung) – angeschlossene Geräte können zerstört werden.'},
      {t:'Spannung Außenleiter – Außenleiter (e–g)', text:'Nennwert 400 V, also rund √3 × 230 V. Fehlt ein Außenleiter (ausgelöste Vorsicherung, loser Kontakt im CEE-Stecker), laufen Drehstrommotoren nur auf zwei Phasen und überhitzen. Deutlich unterschiedliche Werte zeigen eine unsymmetrische Belastung oder einen Fehler in der Zuleitung.'},
      {t:'Spannung Neutralleiter – Schutzleiter (h)', text:'Im fehlerfreien TN-System nur wenige Volt. Ein erhöhter Wert weist auf einen hochohmigen oder unterbrochenen Neutralleiter, eine fehlerhafte N/PE-Aufteilung oder Ausgleichsströme hin und verfälscht außerdem die RCD- und Impedanzmessung.'},
      {t:'Frequenz (i)', text:'Im Verbundnetz sehr stabil. Wichtig bei Stromerzeugern (NEA) und Wechselrichtern: Eine abweichende Frequenz verändert Motordrehzahlen und kann Netzteile, Vorschaltgeräte und Steuerungen stören.'},
      {t:'Bewertung', text:'Nach DIN EN 50160 darf die Spannung um ±10 % und die Frequenz um ±1 % vom Nennwert abweichen. Für U N-PE gibt es keinen festen Normwert (Praxis-Richtwert). Werte außerhalb des beim Unterfeld hinterlegten Bereichs werden rot markiert.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'vhz',
    intro:'Alle Werte dieses Blocks werden in <b>einer</b> Schalterstellung gemessen. Die Spannung erscheint sofort, ein Start mit [[TEST]] ist nicht nötig.',
    punkte:[
      {t:'Drehschalter', text:'Stellung [[V]] wählen.'},
      {t:'Außenleiter – Neutralleiter (b–d)', text:'Rote Leitung {L} an L1, blaue Leitung {N} an N, mit [[F1]] die Anzeige <b>L-N</b> wählen. Danach L2 und L3 genauso gegen N messen. An einer Schutzkontaktsteckdose kann das Netz-Messkabel verwendet werden.'},
      {t:'Außenleiter – Außenleiter (e–g)', text:'Rote Leitung {L} und blaue Leitung {N} an zwei Außenleiter legen, Anzeige <b>L-N</b> lassen – angezeigt wird dann die Spannung zwischen den beiden Leitern. Reihenfolge L1-L2, L2-L3, L1-L3.'},
      {t:'Neutralleiter – Schutzleiter (h)', text:'Blaue Leitung {N} an N, grüne Leitung {PE} an PE, mit [[F1]] die Anzeige <b>N-PE</b> wählen.'},
      {t:'Frequenz (i)', text:'Wird bei jeder Spannungsmessung automatisch mitgemessen und steht in der <b>Unteranzeige</b>.'},
      {t:'Achtung', text:'An Drehstrom nicht mit dem Schuko-Netz-Messkabel arbeiten, sondern mit Prüfspitzen oder einem geeigneten CEE-Messadapter. In CAT-III-/CAT-IV-Umgebungen nur mit aufgesteckten Schutzkappen messen. Der Tester zeigt Wechselspannung bis 500 V an.'}
    ]
  }
},

drehfeld: {
  titel:'Drehfeldrichtung',
  warum:{
    intro:'An Drehstromsteckdosen und -anschlüssen muss die Reihenfolge der Außenleiter L1-L2-L3 ein <i>Rechtsdrehfeld</i> ergeben. Nur dann laufen angeschlossene Drehstrommotoren in der vorgesehenen Richtung.',
    punkte:[
      {t:'Linksdrehfeld', text:'Lüfter, Pumpen und Antriebe laufen falsch herum. Bei Kettenzügen und Bühnenantrieben ist das ein erhebliches Sicherheitsrisiko, weil Endschalter dann unter Umständen nicht mehr wirken.'},
      {t:'Anforderung', text:'Drehstromsteckdosen werden so angeschlossen, dass sich – von vorn auf die Steckdose gesehen – ein Rechtsdrehfeld ergibt (DIN VDE 0100-550).'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'phase',
    intro:'Für die Drehfeldprüfung werden alle drei Messleitungen an die drei Außenleiter angeschlossen.',
    punkte:[
      {t:'Drehschalter', text:'Stellung [[Drehfeld ↻]] (PHASE ROTATION) wählen.'},
      {t:'Anschluss', text:'Rote Leitung {L} an L1, grüne Leitung {PE} an L2, blaue Leitung {N} an L3.'},
      {t:'Ablesen', text:'Das Ergebnis erscheint ohne Tastendruck in der Hauptanzeige:', sub:[
        '<b>1 2 3</b> – Rechtsdrehfeld → „rechts“ eintragen',
        '<b>3 2 1</b> – Linksdrehfeld → „links“ eintragen',
        '<b>- - -</b> – zu geringe Spannung, ein Leiter fehlt oder hat keinen Kontakt'
      ]}
    ]
  }
},

/* ======================= SCHUTZLEITER / ISOLATION ======================= */

rpe: {
  titel:'Schutzleiterwiderstand R_PE (Anlage)',
  warum:{
    intro:'Der Schutzleiter muss im Fehlerfall den Fehlerstrom niederohmig zur Stromquelle zurückführen. Nur dann wird der Strom so groß, dass die Schutzeinrichtung rechtzeitig abschaltet.',
    punkte:[
      {t:'Zu hoher Widerstand oder Unterbrechung', text:'Das Gehäuse eines defekten Betriebsmittels kann eine gefährliche Berührungsspannung annehmen, ohne dass abgeschaltet wird – Lebensgefahr.'},
      {t:'Typische Ursachen', text:'Lose oder korrodierte Klemmen, fehlende Brücken, beschädigte Leitungen, gebrochene Adern in Verlängerungen.'},
      {t:'Bewertung', text:'Durchgängigkeit der Schutzleiter nach DIN VDE 0100-600, Messverfahren nach DIN EN 61557-4. Einen festen Normwert gibt es nicht: Der Messwert darf den Widerstand des Schutzleiters selbst (Länge ÷ (56 × Querschnitt), Kupfer) plus ca. 0,1 Ω für Klemmen und Steckverbindungen nicht überschreiten. Die App rechnet diesen Grenzwert aus LTG-02 (Länge) und LTG-06 (Querschnitt); ohne diese Angaben gilt der Praxis-Richtwert 1 Ω. Beispiel: 50 m · 2,5 mm² → 0,36 Ω + 0,1 Ω = max. 0,46 Ω.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rpe',
    intro:'Niederohmmessung mit mindestens 200 mA Prüfstrom am <b>spannungsfreien</b> Stromkreis.',
    punkte:[
      {t:'Voraussetzung', text:'Stromkreis freischalten und gegen Wiedereinschalten sichern. Liegt noch Spannung an, sperrt der Tester die Messung.'},
      {t:'Drehschalter', text:'Stellung [[R<sub>LO</sub>]] (CONTINUITY) wählen.'},
      {t:'Einstellungen', text:'[[F1]] Messpaar L-PE · [[F3]] Polarität <b>±</b> (misst beide Stromrichtungen und zeigt den Mittelwert) · [[F4]] Prüfstrom <b>250 mA</b>.'},
      {t:'Nullabgleich', text:'Messleitungen mit dem Zero-Adapter kurzschließen und [[F2]] 2–6 s gedrückt halten, bis das Nullsymbol erscheint. Der Leitungswiderstand wird danach automatisch abgezogen.'},
      {t:'Anschluss', text:'Rote Leitung {L} an die PE-Schiene im Verteiler, grüne Leitung {PE} an den zu prüfenden Schutzleiterkontakt (Schutzkontakt der Steckdose, Gehäuse).'},
      {t:'Messung', text:'[[TEST]] gedrückt halten, bis der Wert steht. Leitungen dabei abschnittsweise bewegen – springende Werte zeigen einen Aderbruch oder Wackelkontakt.'},
      {t:'Ablesen', text:'Widerstand in Ω in der Hauptanzeige.'}
    ]
  }
},

riso: {
  titel:'Isolationswiderstand R_ISO (Anlage)',
  warum:{
    intro:'Die Isolationsmessung zeigt, ob die Isolierung zwischen den aktiven Leitern und dem Schutzleiter bzw. der Erde intakt ist. Sie deckt Schäden auf, die bei der Besichtigung nicht zu sehen sind.',
    abschnitte:[
      {titel:'Prüfspannung (a)', intro:'Richtet sich nach der Nennspannung des Stromkreises: hoch genug, um Isolationsschwächen sichtbar zu machen, ohne angeschlossene Betriebsmittel zu schädigen (DIN VDE 0100-600).', punkte:[
        {t:'500 V DC', text:'Standard für Stromkreise bis 500 V Nennspannung, also das 230/400-V-Netz.'},
        {t:'250 V DC mit Verbrauchern', text:'Wenn Überspannungsschutz oder empfindliche Betriebsmittel nicht abgeklemmt werden können.'},
        {t:'1000 V DC', text:'Für Stromkreise über 500 V bis 1000 V Nennspannung.'},
        {t:'SELV / PELV', text:'Schutzkleinspannung: Prüfung mit 250 V DC.'}
      ]},
      {titel:'Messwert (b)', punkte:[
        {t:'Zu niedriger Isolationswiderstand', text:'Es fließen Fehler- und Kriechströme. Folgen sind Körperschluss mit gefährlicher Berührungsspannung, Fehlauslösungen von RCDs oder Brände durch Kriechströme.'},
        {t:'Typische Ursachen', text:'Feuchtigkeit in Dosen, Steckverbindern und Leitungen, gequetschte oder angenagte Leitungen, eine Schraube in der Leitung, gealterte oder verschmutzte Isolierung.'},
        {t:'Bewertung', text:'Mindestens 1 MΩ bei 250 V, 500 V und 1000 V, mindestens 0,5 MΩ bei SELV/PELV (DIN VDE 0100-600). Die App setzt den Grenzwert in b automatisch nach a. Neuanlagen liegen meist weit darüber – ein Wert knapp über der Grenze deutet auf einen beginnenden Fehler hin.'}
      ]}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'riso',
    intro:'Gemessen wird mit hoher Gleichspannung am <b>spannungsfreien</b> Stromkreis.',
    punkte:[
      {t:'Voraussetzung', text:'Stromkreis freischalten, gegen Wiedereinschalten sichern, Spannungsfreiheit feststellen. Verbraucher abklemmen bzw. Stecker ziehen, Überspannungsschutz und Elektronik abtrennen. Liegt Spannung an, sperrt der Tester die Messung.'},
      {t:'Drehschalter', text:'Stellung [[R<sub>ISO</sub>]] (INSULATION) wählen.'},
      {t:'Prüfspannung (a)', text:'Mit [[F4]] zwischen 50, 100, 250, 500 und 1000 V umschalten, bis die gewählte Spannung unten links im Display steht.'},
      {t:'Anschluss', text:'Rote Leitung {L} an den Außenleiter (oder an die zusammengefassten aktiven Leiter L1/L2/L3/N), grüne Leitung {PE} an den Schutzleiter.'},
      {t:'Messung', text:'[[TEST]] gedrückt halten, bis der Wert stabil ist und ein Signalton kommt.'},
      {t:'Ablesen (b)', text:'Hauptanzeige: Isolationswiderstand in MΩ → Unterfeld b. Unteranzeige: tatsächlich anliegende Prüfspannung – sie sollte mindestens der eingestellten Spannung entsprechen, sonst Anschlüsse, Leitungen und Sicherung des Testers prüfen.'},
      {t:'Achtung', text:'Während der Messung keine Leiter berühren. Nach dem Loslassen von [[TEST]] kurz warten, bis sich die Leitungskapazität entladen hat, erst dann abklemmen.'}
    ]
  }
},

/* ======================= ERDUNG / LEITUNG ======================= */

rlo: {
  titel:'Durchgängigkeit des Schutzpotenzialausgleichs',
  warum:{
    intro:'Über den Schutzpotenzialausgleich werden alle leitfähigen Teile, die ein fremdes Potenzial einführen können, mit der Haupterdungsschiene verbunden – Wasser-, Gas- und Heizungsrohre, Gebäudekonstruktion und im Veranstaltungsbereich auch Traversen, Tribünen und Bühnentechnik. So entsteht im Fehlerfall keine gefährliche Spannung zwischen gleichzeitig berührbaren Teilen.',
    punkte:[
      {t:'Unterbrochene Verbindung', text:'Zwischen zwei Metallteilen kann im Fehlerfall eine lebensgefährliche Spannung entstehen, z. B. zwischen einer Traverse und dem Gehäuse eines Scheinwerfers.'},
      {t:'Bewertung', text:'Einen festen Normgrenzwert gibt es nicht. Entscheidend ist ein niederohmiger, stabiler Messwert ohne Schwankungen an jeder Anschlussstelle.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rlo',
    intro:'Gleiche Niederohmmessung wie beim Schutzleiterwiderstand, hier zwischen Potenzialausgleichsschiene und den angeschlossenen Teilen.',
    punkte:[
      {t:'Voraussetzung', text:'Messung nur an spannungsfreien Teilen; liegt Spannung an, sperrt der Tester.'},
      {t:'Drehschalter', text:'Stellung [[R<sub>LO</sub>]] (CONTINUITY) wählen, [[F4]] 250 mA, [[F3]] Polarität ±.'},
      {t:'Nullabgleich', text:'Bei langen Wegen eine verlängerte Messleitung verwenden und <i>mit dieser</i> den Nullabgleich über [[F2]] durchführen.'},
      {t:'Anschluss', text:'Eine Leitung fest an die Haupterdungs- bzw. Potenzialausgleichsschiene, mit der anderen nacheinander jedes angeschlossene leitfähige Teil antasten. Kontaktstelle blank machen (Farbe, Rost, Eloxal).'},
      {t:'Messung', text:'[[TEST]] gedrückt halten, bis der Wert steht, und jeden Wert kurz notieren.'},
      {t:'Bewertung', text:'Alle Verbindungen niederohmig und stabil → ERD-02 auf i.O. setzen.'}
    ]
  }
},

erdung: {
  titel:'Erdungswiderstand R_E',
  warum:{
    intro:'Der Erdungswiderstand beschreibt, wie gut die Erdungsanlage (Fundament-, Tiefen- oder Staberder) Strom ins Erdreich ableiten kann. Er ist im TT-System entscheidend, weil der Fehlerstrom dort über die Erde zur Stromquelle zurückfließt – ebenso bei Stromerzeugern mit eigenem Erder und beim Blitzschutz.',
    punkte:[
      {t:'Zu hoher Erdungswiderstand', text:'Im TT-System erreicht der Fehlerstrom nicht den nötigen Wert, Metallteile können dauerhaft gefährliche Spannung führen.'},
      {t:'Bewertung im TT-System', text:'Es muss R<sub>A</sub> × I<sub>Δn</sub> ≤ 50 V gelten – bei einem 30-mA-RCD also R<sub>A</sub> ≤ 1666 Ω. In der Praxis werden deutlich niedrigere Werte angestrebt; der Grenzwert ist anlagenspezifisch.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663',
    intro:'Der Fluke 1663 misst den Erdungswiderstand mit zwei Hilfserdspießen (Zubehör).',
    punkte:[
      {t:'Voraussetzung', text:'Den zu prüfenden Erder von der Anlage trennen – nicht an einem spannungsführenden System messen.'},
      {t:'Drehschalter', text:'Stellung [[R<sub>E</sub>]] (EARTH) wählen.'},
      {t:'Aufbau', text:'Beide Erdspieße mit dem Erder in einer Linie setzen, den mittleren Spieß bei etwa 62 % des Abstands zum äußeren Spieß. Messleitungen getrennt voneinander verlegen.'},
      {t:'Messung', text:'[[TEST]] drücken und loslassen, das Ende der Messung abwarten.'},
      {t:'Ablesen', text:'Hauptanzeige: Erdungswiderstand. Unteranzeige: Störspannung zwischen den Spießen – über 10 V wird die Messung gesperrt.'},
      {t:'Tipp', text:'Meldet der Tester einen zu hohen Sondenwiderstand, die Spieße tiefer einschlagen oder das Erdreich um die Spieße anfeuchten (nicht am zu prüfenden Erder).'},
      {t:'Alternative', text:'In Anlagen mit Netzanschluss kann R<sub>E</sub> näherungsweise über die Schleifenimpedanz L-PE ermittelt werden; der Wert enthält dann auch den Widerstand des Außenleiters. Ob das zulässig ist, hängt von den örtlichen Vorgaben ab.'}
    ]
  }
},

ltg_durchgang: {
  titel:'Durchgangsprüfung der Leitung',
  warum:{
    intro:'Jede Ader einer Leitung – Außenleiter, Neutralleiter und Schutzleiter – muss von einem Ende zum anderen durchgängig und richtig zugeordnet sein.',
    punkte:[
      {t:'Unterbrochene Ader', text:'Fehlt der Schutzleiter, besteht kein Schutz bei Körperschluss. Ein unterbrochener Neutralleiter kann einphasige Verbraucher mit Überspannung zerstören.'},
      {t:'Vertauschte Adern', text:'Sind Außenleiter und Schutzleiter vertauscht, liegt das Gehäuse angeschlossener Geräte an Netzspannung – Lebensgefahr.'},
      {t:'Aderbruch / Wackelkontakt', text:'Tritt oft an Knickstellen hinter Stecker und Kupplung auf und zeigt sich erst, wenn die Leitung bewegt wird.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2 / Fluke 1663',
    intro:'Kaltgeräte- und Verlängerungsleitungen werden am Gerätetester geprüft, fest verlegte oder lange Leitungen mit dem Installationstester.',
    punkte:[
      {t:'Fluke 6500-2', text:'Taste [[Kaltgeräteleitung]]. Stecker der Leitung in die Prüfsteckdose, Kupplung an den Kaltgeräte-Anschluss des Testers, dann [[Start]]. Geprüft werden Schutzleiterwiderstand und Isolation L/N gegen PE.', sub:[
        'Laut Handbuch wird die L-N-Durchgangs- und Polaritätsprüfung nur in der UK- und AU-Ausführung angezeigt – L und N bei Bedarf mit dem Fluke 1663 nachmessen.'
      ]},
      {t:'Fluke 1663', text:'Leitung spannungsfrei, Drehschalter [[R<sub>LO</sub>]], Nullabgleich mit [[F2]]. Am fernen Ende jeweils eine Ader mit dem Schutzleiter brücken und am nahen Ende zwischen dieser Ader und PE messen – so wird jede Ader einzeln geprüft.'},
      {t:'Bei jeder Methode', text:'Leitung während der Messung abschnittsweise bewegen und auf springende Werte achten.'}
    ]
  }
},

/* ======================= SCHLEIFEN- / NETZIMPEDANZ ======================= */

ls_typ: {
  titel:'Leitungsschutzschalter – Charakteristik und Nennstrom',
  finden:{
    intro:'Gewählt wird der Leitungsschutzschalter, der <b>den gemessenen Stromkreis direkt absichert</b> – also der letzte Schutzschalter vor der Steckdose bzw. dem Verbraucher, nicht die Vorsicherung im Hauptverteiler.',
    punkte:[
      {t:'Aufdruck auf dem LS', text:'Vorn auf dem Schutzschalter steht eine Kombination aus Buchstabe und Zahl, z. B. <b>B16</b> oder <b>C 32</b>:', sub:[
        '<b>Buchstabe</b> = Auslösecharakteristik (B oder C)',
        '<b>Zahl</b> = Nennstrom I<sub>n</sub> in Ampere',
        'Die Zahl im kleinen Kästchen (z. B. <b>6000</b> oder <b>10000</b>) ist das Schaltvermögen in A – <i>nicht</i> der Nennstrom.'
      ]},
      {t:'Charakteristik B', text:'Standard für Steckdosen- und Lichtstromkreise; löst ab dem 5-fachen Nennstrom sofort aus.'},
      {t:'Charakteristik C', text:'Für Verbraucher mit hohem Einschaltstrom (Motoren, Transformatoren, große Scheinwerfer); löst ab dem 10-fachen Nennstrom sofort aus.'},
      {t:'Welcher Stromkreis?', text:'Stromkreisbezeichnung am Verteiler bzw. im Stromkreisverzeichnis mit dem Messort abgleichen. Im Zweifel den LS kurz ausschalten und prüfen, ob der Messort spannungsfrei wird.'},
      {t:'Aufdruck nicht lesbar', text:'Typ aus der Verteilerdokumentation bzw. dem Stromlaufplan entnehmen.'},
      {t:'Andere LS-Charakteristiken', text:'D (20 × I<sub>n</sub>), K (14 × I<sub>n</sub>) und Z (3 × I<sub>n</sub>) manuell eintragen, z. B. „K 16A“ – die App rechnet den Mindest-I<sub>K</sub> selbst.'},
      {t:'Schmelzsicherungen', text:'gG/gL-, NH-, Neozed- (D01–D03) und Diazed-Sicherungen als „gG 35A“, „NH 63A“, „NH00 3x63A“, „D02 35A“ oder „Neozed 16A“ eintragen (Nennstrom auf dem Sicherungseinsatz bzw. Farbe des Kennmelders). Mindest-I<sub>K</sub> = Abschaltstrom I<sub>a</sub> aus der Strom-Zeit-Kennlinie: bis 32 A für 0,4 s (Endstromkreis), darüber für 5 s (DIN VDE 0100-410). Beispiel gG 16 A: I<sub>a</sub> 0,4 s = 107 A.'},
      {t:'Eintragen', text:'Schnellauswahl oder freie Eingabe wie oben – dann greift die automatische Mindestwert-Prüfung bei I<sub>K</sub> (c). Unbekannte Angaben (z. B. Leistungsschalter mit einstellbarem Auslöser) werden nicht bewertet und müssen fachlich beurteilt werden.'}
    ]
  }
},

impedanz: {
  titel:'Schleifen- und Netzimpedanz mit Kurzschlussstrom',
  warum:{
    intro:'Im Fehlerfall muss ein so großer Strom fließen, dass die vorgeschaltete Schutzeinrichtung schnell genug abschaltet. Wie groß dieser Strom wird, hängt vom Widerstand des Stromwegs ab – der <i>Impedanz</i>. Deshalb werden die Impedanzen gemessen und daraus die Kurzschlussströme berechnet.',
    abschnitte:[
      {titel:'Schleifenimpedanz Z<sub>S</sub> und Kurzschlussstrom I<sub>K</sub> (b, c) – je Stromkreis', punkte:[
        {t:'Was wird gemessen', text:'Der Widerstand der gesamten Fehlerschleife: vom Transformator über den Außenleiter bis zur Fehlerstelle und über den Schutzleiter zurück (L–PE).'},
        {t:'Abschaltbedingung', text:'Der Kurzschlussstrom I<sub>K</sub> = 230 V / Z<sub>S</sub> muss mindestens den Strom erreichen, bei dem der Leitungsschutzschalter sofort auslöst: 5 × I<sub>n</sub> bei Charakteristik B, 10 × I<sub>n</sub> bei C. Dann wird im TN-System die zulässige Abschaltzeit (0,4 s in Endstromkreisen, DIN VDE 0100-410) sicher eingehalten.'},
        {t:'Zu hohe Schleifenimpedanz', text:'Der LS löst nicht oder zu spät aus – eine gefährliche Berührungsspannung bleibt bestehen, zusätzlich droht Brandgefahr. Ursachen: zu lange oder zu dünne Leitungen, lose Klemmen, schlechte Steckverbindungen.'}
      ]},
      {titel:'Netzimpedanz Z<sub>I</sub> und Kurzschlussstrom I<sub>K2</sub> (d, e) – je Einspeisung', punkte:[
        {t:'Was wird gemessen', text:'Der Widerstand des Versorgungsnetzes zwischen Außen- und Neutralleiter bis zum Übergabepunkt (L–N). Er zeigt, wie leistungsfähig eine Einspeisung ist – wichtig bei Baustromverteilern, Übergabepunkten und Stromerzeugern.'},
        {t:'Zu kleiner Kurzschlussstrom', text:'Die Vorsicherung (NETZ-05) schaltet einen Kurzschluss nicht schnell genug ab, unter Last entsteht ein großer Spannungsfall.'},
        {t:'Zu großer Kurzschlussstrom', text:'Die Schutzgeräte müssen ihn sicher abschalten können – I<sub>K2</sub> darf das Schaltvermögen der eingesetzten LS (z. B. 6 kA oder 10 kA) nicht überschreiten.'}
      ]},
      {titel:'Bewertung in der App', punkte:[
        {t:'I<sub>K</sub> (c)', text:'Mindestwert aus der Schutzeinrichtung bei ZNS-01a: LS B/C/D/K/Z = 5 / 10 / 20 / 14 / 3 × I<sub>n</sub>, gG-Sicherung = I<sub>a</sub> aus Tabelle (0,4 s bis 32 A, sonst 5 s).'},
        {t:'I<sub>K2</sub> (e)', text:'Mindestwert als Praxis-Näherung etwa 5 × Nennstrom der Vorsicherung aus NETZ-05; bei NEA keine automatische Bewertung.'},
        {t:'Anzeige', text:'Unter I<sub>K</sub> und I<sub>K2</sub> steht immer, ob der Wert reicht und gegen welchen Bezugswert geprüft wurde. Ist er zu niedrig, werden Kurzschlussstrom <i>und</i> Impedanz rot markiert. Fehlt der Bezugswert (LS bzw. Vorsicherung), weist ein gelber Hinweis darauf hin.'},
        {t:'Reserve einplanen', text:'Leitungen erwärmen sich im Betrieb, ihr Widerstand steigt. Ein Wert knapp über dem Mindestwert ist kritisch zu bewerten.'}
      ]}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'zns',
    intro:'Beide Messungen erfolgen am spannungsführenden Anschluss. Die Messleitungen einmalig je Leitungssatz nullen: Leitungen an den Zero-Adapter, [[F2]] gedrückt halten, bis das Nullsymbol erscheint.',
    abschnitte:[
      {titel:'Schleifenimpedanz Z<sub>S</sub> (b) → I<sub>K</sub> (c)', intro:'Möglichst an der am weitesten entfernten Steckdose des Stromkreises messen – dort ist der Wert am ungünstigsten.', punkte:[
        {t:'Drehschalter', text:'Mit RCD im Stromkreis: [[Z<sub>I</sub> mit RCD]] – der RCD löst nicht aus. Nur ohne RCD: [[Z<sub>I</sub> ohne RCD]] – schneller und genauer, ein vorhandener RCD würde aber auslösen.'},
        {t:'Messpaar', text:'Mit [[F1]] <b>L-PE</b> wählen.'},
        {t:'Anschluss', text:'Netz-Messkabel in die Steckdose oder die drei Messleitungen an {L}, {PE} und {N} (bei „mit RCD“ werden alle drei benötigt).'},
        {t:'Messung', text:'Berührelektrode rund um [[TEST]] antippen und auf das Warnsymbol achten, dann [[TEST]] drücken und das Ende abwarten.'},
        {t:'Ablesen', text:'Hauptanzeige: Z<sub>S</sub> in Ω → Unterfeld b. Unteranzeige: Erdschlussstrom <b>PEFC</b> → wird in c automatisch berechnet und kann mit dem angezeigten Wert überschrieben werden. Mit [[▼]] durch weitere Ergebnisse blättern.'},
        {t:'Tipp', text:'Mit [[F3]] <b>Zmax</b> einschalten – bei mehreren Steckdosen eines Stromkreises wird automatisch der höchste Wert festgehalten.'}
      ]},
      {titel:'Netzimpedanz Z<sub>I</sub> (d) → I<sub>K2</sub> (e)', intro:'Möglichst direkt am Übergabepunkt bzw. Netzeingang messen.', punkte:[
        {t:'Drehschalter', text:'Stellung [[Z<sub>I</sub> ohne RCD]].'},
        {t:'Anschluss', text:'Rote Leitung {L} an den Außenleiter, blaue Leitung {N} an den Neutralleiter; mit [[F1]] <b>L-N</b> wählen. Bei L-N löst ein RCD nicht aus.'},
        {t:'Messung', text:'[[TEST]] drücken und das Ende abwarten.'},
        {t:'Ablesen', text:'Hauptanzeige: Z<sub>I</sub> → Unterfeld d. Unteranzeige: Kurzschlussstrom <b>PSC</b> – die App berechnet I<sub>K2</sub> in e automatisch.'}
      ]}
    ]
  }
},

/* ======================= RCD ======================= */

rcd_typ: {
  titel:'RCD-Typ',
  finden:{
    intro:'Der Typ steht vorn auf dem Fehlerstrom-Schutzschalter als kleines Symbol, oft zusätzlich als Text („Typ A“). Gewählt wird der RCD, der <b>den gemessenen Stromkreis schützt</b>. Jeder höhere Typ erfasst auch alle Fehlerströme der vorherigen Typen, deshalb sind die Symbole kumuliert:',
    punkte:[
      {t:'Typ AC', sym:['ac'], text:'Nur Sinus-Wechselfehlerströme. In Deutschland für neue Anlagen nicht mehr zulässig – Bestand als Mangel prüfen.'},
      {t:'Typ A', sym:['a'], text:'Zusätzlich pulsierende Gleichfehlerströme (bis 6 mA glatter Gleichstrom überlagert). Der Standard in Steckdosen- und Lichtstromkreisen.'},
      {t:'Typ F', sym:['a','f'], text:'Zusätzlich Mischfrequenzen bis 1 kHz, z. B. hinter einphasigen Frequenzumrichtern (bis 10 mA glatter Gleichstrom überlagert).'},
      {t:'Typ B', sym:['a','f','b'], text:'Zusätzlich glatte Gleichfehlerströme, z. B. aus dreiphasigen Frequenzumrichtern, PV-Wechselrichtern oder DC-Ladetechnik. Wird auch als <i>allstromsensitiv</i> bezeichnet.'},
      {t:'Typ B+', sym:['a','f','b','b_plus'], text:'Wie B, zusätzlich bis 20 kHz mit Auslösegrenze 420 mA – für den vorbeugenden Brandschutz.'},
      {t:'Zusatzzeichen <b>S</b> im Kästchen', text:'Selektiver (zeitverzögerter) RCD – z. B. „A S“. Den Typ wie oben wählen; am Prüfgerät die S-Einstellung verwenden, die Auslösezeit-Grenzen sind dann länger.'},
      {t:'Kein RCD vorhanden', text:'Sitzt vor dem Stromkreis kein Fehlerstrom-Schutzschalter (auch nicht in einer vorgeschalteten Verteilung), „ohne RCD“ wählen – die übrigen RCD-Felder werden dann ausgeblendet.'}
    ],
    abschnitte:[
      {titel:'Einstellung am Fluke 1663 (Taste [[F3]])', punkte:[
        {t:'Typ AC', sym:['ac'], text:'Prüfstrom Sinus.'},
        {t:'Typ A und F', sym:['a'], text:'Sinus- und Halbwellen-Prüfstrom (eine eigene F-Einstellung gibt es nicht).'},
        {t:'Typ B und B+', sym:['a','f','b'], text:'Glatter Gleichstrom, alle drei Messleitungen {L} {N} {PE}, beide Phasenlagen 0°/180° ([[F1]]); zusätzlich einmal mit Sinus messen.'}
      ]}
    ]
  }
},

rcd_in: {
  titel:'Bemessungsstrom I_n des RCD',
  finden:{
    intro:'Der Bemessungsstrom ist der Strom, den der RCD dauerhaft führen darf. Er ist eine Eigenschaft des RCD selbst und hat nichts mit dem Leitungsschutzschalter (ZNS-01a) zu tun.',
    punkte:[
      {t:'Aufdruck', text:'Die Angabe in <b>A</b> ohne „m“ auf dem RCD, z. B. <b>40 A</b> oder <b>I<sub>n</sub> = 40 A</b>. Häufig zusammen mit dem Fehlerstrom als Bruch geschrieben: <b>40/0,03</b> → I<sub>n</sub> = 40 A.'},
      {t:'Nicht verwechseln', text:'Die Angabe in mA (bzw. 0,03 A) ist der Bemessungs<i>fehler</i>strom I<sub>Δn</sub> (Unterfeld c).'},
      {t:'Übliche Werte', text:'16 A, 25 A, 40 A, 63 A.'}
    ]
  }
},

rcd_idn: {
  titel:'Bemessungsfehlerstrom I_Δn',
  finden:{
    intro:'Der Bemessungsfehlerstrom gibt an, bei welchem Fehlerstrom der RCD spätestens auslösen muss. Er steht auf dem RCD und wird am Prüfgerät genau so eingestellt – davon hängen alle Grenzwerte der RCD-Messung ab.',
    punkte:[
      {t:'Aufdruck', text:'Angabe mit Δ-Zeichen, z. B. <b>I<sub>Δn</sub> = 30 mA</b> oder <b>0,03 A</b>. Umrechnung: 0,03 A = 30 mA · 0,1 A = 100 mA · 0,3 A = 300 mA. Beim Bruch <b>40/0,03</b> ist die zweite Zahl I<sub>Δn</sub>.'},
      {t:'30 mA', text:'Zusätzlicher Personenschutz, u. a. vorgeschrieben für Steckdosenstromkreise bis 32 A und für Ausstellungs-, Show- und Standbereiche.'},
      {t:'100 mA / 300 mA', text:'Fehler- und Brandschutz, meist als vorgeschalteter, oft selektiver RCD für ganze Verteiler.'},
      {t:'Am Fluke 1663', text:'In Stellung [[ΔT]] bzw. [[I<sub>ΔN</sub>]] mit [[F4]] denselben Wert einstellen (10, 30, 100, 300, 500, 1000 mA oder VAR für Sonderwerte).'}
    ]
  }
},

rcd_strom: {
  titel:'Auslösestrom I_Δ (Rampentest)',
  warum:{
    intro:'Die Messung zeigt, bei welchem Fehlerstrom der RCD tatsächlich auslöst. Ein gealterter oder verschmutzter RCD kann träge werden und erst oberhalb seines Bemessungsfehlerstroms – oder gar nicht mehr – auslösen.',
    punkte:[
      {t:'Zu hoher Auslösestrom', text:'Der RCD schützt nicht mehr zuverlässig.'},
      {t:'Zu niedriger Auslösestrom', text:'Führt zu Fehlauslösungen. Oft liegt die Ursache in Ableitströmen der angeschlossenen Geräte, die sich zum Prüfstrom addieren.'},
      {t:'Bewertung', text:'Mit Sinus-Prüfstrom muss der RCD zwischen 50 % und 100 % von I<sub>Δn</sub> auslösen. Mit Halbwellen- bzw. Gleichstrom gelten andere Bereiche (Typ A etwa 35–140 %, Typ B 50–200 %).'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rcd',
    intro:'Der Tester erhöht den Prüfstrom stufenweise, bis der RCD auslöst. Gemessen wird hinter dem RCD am spannungsführenden Stromkreis.',
    punkte:[
      {t:'Vorher', text:'Verbindung N–PE prüfen (NMESS-01h) und angeschlossene Verbraucher möglichst abschalten – Ableitströme verfälschen das Ergebnis.'},
      {t:'Drehschalter', text:'Stellung [[I<sub>ΔN</sub>]] wählen.'},
      {t:'Einstellungen', text:'[[F4]] I<sub>Δn</sub> · [[F3]] Prüfstromform passend zum RCD-Typ (siehe RCD-01a) · [[F1]] Phasenlage 0° oder 180°.'},
      {t:'Anschluss', text:'Mindestens {L} und {PE} anschließen oder das Netz-Messkabel in eine Steckdose hinter dem RCD stecken. Bei Typ B alle drei Leitungen {L} {N} {PE}.'},
      {t:'Messung', text:'Berührelektrode antippen, [[TEST]] drücken. Nach dem Auslösen den RCD wieder einschalten.'},
      {t:'Ablesen', text:'Hauptanzeige: Auslösestrom in mA. Unteranzeige: Berührungsspannung U<sub>F</sub> (→ RCD-01i). Bei Sinus- und Halbwellenprüfung zeigt [[▼]] zusätzlich die Auslösezeit.'},
      {t:'Bewertung', text:'Das Symbol <b>RCD ✓</b> im Display bestätigt, dass der Wert die Anforderungen erfüllt. In beiden Phasenlagen messen und den ungünstigeren Wert eintragen.'}
    ]
  }
},

rcd_zeit: {
  titel:'Auslösezeit Δt',
  warum:{
    intro:'Für den Personenschutz entscheidend ist, wie schnell der RCD bei einem Fehlerstrom abschaltet. Je kürzer der Strom durch den Körper fließt, desto geringer ist die Gefahr von Herzkammerflimmern.',
    punkte:[
      {t:'Unverzögerte RCDs', text:'Bei 1 × I<sub>Δn</sub> höchstens 300 ms, bei 5 × I<sub>Δn</sub> höchstens 40 ms.'},
      {t:'Selektive RCDs [S]', text:'Bewusst verzögert, damit der nachgeschaltete RCD zuerst auslöst: 130–500 ms bei 1 × I<sub>Δn</sub>, 50–150 ms bei 5 × I<sub>Δn</sub>.'},
      {t:'Prüfung mit ½ × I<sub>Δn</sub>', text:'Der RCD darf hier <i>nicht</i> auslösen – Kontrolle auf Überempfindlichkeit.'},
      {t:'Verlängerte Zeiten', text:'Hinweis auf einen schwergängigen oder defekten RCD. Auch nachgeschaltete Motoren oder Kondensatoren können die Zeit verlängern.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rcd',
    intro:'Der Tester speist einen genau definierten Fehlerstrom ein und misst die Zeit bis zur Abschaltung – am spannungsführenden Stromkreis hinter dem RCD.',
    punkte:[
      {t:'Drehschalter', text:'Stellung [[ΔT]] (RCD TIME) wählen.'},
      {t:'Einstellungen', text:'[[F4]] I<sub>Δn</sub> · [[F2]] Multiplikator ×½, ×1, ×5 oder AUTO · [[F3]] Prüfstromform passend zum RCD-Typ · [[F1]] Phasenlage 0°/180°.'},
      {t:'Hinweis zu 2 × I<sub>Δn</sub>', text:'Diesen Multiplikator bietet der Fluke 1663 nicht an – möglich sind ×½, ×1, ×5 und AUTO.'},
      {t:'Anschluss', text:'Mindestens {L} und {PE} anschließen oder das Netz-Messkabel stecken; bei Typ B alle drei Leitungen.'},
      {t:'Messung', text:'Berührelektrode antippen, [[TEST]] drücken, danach den RCD wieder einschalten. Vorab prüft der Tester, ob die Berührungsspannung den eingestellten Grenzwert überschreiten würde, und bricht dann mit Fehler 4 ab.'},
      {t:'AUTO-Modus', text:'Nur für 10, 30 und 100 mA. Der Tester prüft nacheinander ×½ (keine Auslösung), ×1 und ×5 in beiden Phasenlagen; den RCD nach jeder Auslösung wieder einschalten. Mit [[▲]] [[▼]] durch die Ergebnisse blättern.'},
      {t:'Ablesen', text:'Hauptanzeige: Auslösezeit in ms. Unteranzeige: Berührungsspannung U<sub>F</sub>. <b>RCD ✓</b> = Grenzwert eingehalten.'}
    ]
  }
},

rcd_ul: {
  titel:'Dauernd zulässige Berührungsspannung U_L',
  warum:{
    intro:'U<sub>L</sub> ist die Spannung, die ein Mensch unter den jeweiligen Umgebungsbedingungen dauerhaft ohne Gefahr berühren kann. Sie hängt davon ab, wie gut der Körper in dieser Umgebung Strom leitet.',
    punkte:[
      {t:'Normale Bedingungen', text:'U<sub>L</sub> = 50 V AC bzw. 120 V DC.'},
      {t:'Erhöhte Gefährdung', text:'Bei Nässe, in landwirtschaftlichen Betriebsstätten, in engen leitfähigen Räumen oder bei großflächigem Körperkontakt ist der Körperwiderstand geringer: U<sub>L</sub> = 25 V AC bzw. 60 V DC.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rcd',
    intro:'Der Grenzwert wird im Tester hinterlegt; er steht oben rechts im Display als „U<sub>L</sub> = 50“.',
    punkte:[
      {t:'Werkseinstellung', text:'50 V.'},
      {t:'Umschalten 25 V / 50 V', text:'Tester ausgeschaltet: [[Ein/Aus]] und [[F4]] gleichzeitig drücken, dann [[Ein/Aus]] loslassen. Die Einstellung bleibt auch nach dem Ausschalten erhalten.'}
    ]
  }
},

rcd_ub: {
  titel:'Berührungsspannung U_F',
  warum:{
    intro:'Während der RCD-Prüfung ermittelt der Tester, welche Spannung am Schutzleiter entsteht, wenn der Bemessungsfehlerstrom fließt. Das ist die Spannung, die ein Mensch im Fehlerfall an einem Gehäuse berühren würde, bevor der RCD abschaltet.',
    punkte:[
      {t:'Grenzwert', text:'U<sub>F</sub> darf die zulässige Berührungsspannung U<sub>L</sub> (RCD-01h) nicht überschreiten.'},
      {t:'Zu hohe Berührungsspannung', text:'Schutzleiter- oder Erdungswiderstand zu hoch, z. B. durch eine lose PE-Klemme oder einen schlechten Erder im TT-System.'},
      {t:'Rückschluss', text:'Aus U<sub>F</sub> lässt sich der Widerstand der Fehlerschleife abschätzen: R ≈ U<sub>F</sub> / I<sub>Δn</sub>.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663', icons:'rcd',
    intro:'Kein eigener Messschritt – die Berührungsspannung wird bei jeder Auslösezeit- und Auslösestrommessung automatisch mitgemessen.',
    punkte:[
      {t:'Ablesen', text:'Wert <b>U<sub>F</sub></b> in der Unteranzeige nach der RCD-Messung; er ist auf I<sub>Δn</sub> bezogen.'},
      {t:'Grenzwert im Tester', text:'Überschreitet die Vorprüfung den eingestellten Grenzwert U<sub>L</sub>, startet die Messung nicht (Fehler 4) – dann Schutzleiter und Erdung prüfen.'}
    ]
  }
},

/* ======================= ERPROBEN ======================= */

polaritaet: {
  titel:'Polarität und Steckdosenbelegung',
  warum:{
    intro:'An jeder Steckdose müssen Außenleiter, Neutralleiter und Schutzleiter an den dafür vorgesehenen Kontakten liegen.',
    punkte:[
      {t:'Außenleiter und Schutzleiter vertauscht', text:'Das Gehäuse angeschlossener Geräte der Schutzklasse I liegt direkt an Netzspannung – Lebensgefahr.'},
      {t:'Fehlender Schutz- oder Neutralleiter', text:'Kein Schutz bei Körperschluss bzw. Überspannung an einphasigen Verbrauchern.'},
      {t:'Außen- und Neutralleiter vertauscht', text:'An Festanschlüssen, Verteilern und CEE-Steckdosen ein Mangel: einpolige Schalter und Sicherungen liegen dann im Neutralleiter und trennen nicht mehr sicher.'}
    ]
  },
  wie:{
    geraet:'Fluke 1663',
    intro:'Der Tester prüft die Belegung automatisch, sobald das Netz-Messkabel steckt – z. B. in Stellung [[V]] oder [[Z<sub>I</sub> mit RCD]].',
    punkte:[
      {t:'Anschluss', text:'Netz-Messkabel in die Steckdose stecken bzw. alle drei Messleitungen {L} {N} {PE} anschließen.'},
      {t:'Berührelektrode', text:'Immer antippen. Führt der Schutzleiter Spannung (über 100 V), leuchtet das Warnsymbol und ein Signalton ertönt.'},
      {t:'Anschlusssymbol im Display', sub:[
        'Pfeil <b>über</b> dem Symbol: L und N vertauscht (der Tester polt intern um und misst weiter)',
        'Pfeil <b>unter</b> dem Symbol: L und PE vertauscht – die Prüfung wird gesperrt',
        'Fehlender oder unterbrochener Leiter wird am betreffenden Anschluss angezeigt'
      ]},
      {t:'CEE-Drehstrom', text:'Die Reihenfolge der Außenleiter wird mit der Drehfeldprüfung (NMESS-09) kontrolliert.'}
    ]
  }
},

/* ======================= GERÄTEPRÜFUNG ======================= */

ger_sicht: {
  titel:'Sichtprüfung (Gerät)',
  warum:{
    intro:'Die Sichtprüfung steht immer am Anfang der Geräteprüfung. Ein großer Teil der Mängel an ortsveränderlichen Geräten ist schon mit bloßem Auge zu erkennen, bevor überhaupt gemessen wird.',
    punkte:[
      {t:'Reihenfolge', text:'Ein Gerät mit sichtbaren Schäden wird nicht weiter elektrisch geprüft. Isolations- und Ableitstrommessungen erst nach bestandener Sichtprüfung durchführen.'},
      {t:'Warum kritisch in der App', text:'Die Sichtprüfung ist nie vorbelegt und hat kein „n.a.“ – eine nicht durchgeführte Prüfung darf nicht als i.O. im Protokoll erscheinen.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2',
    intro:'Mit der Taste [[Sichtprüfung]] führt der Gerätetester durch die Sichtprüfung; geprüft wird mit Augen und Händen.',
    punkte:[
      {t:'Anschlussleitung', text:'Keine Schnitte, Quetschungen oder Risse in der Isolierung; Zugentlastung und Knickschutz vorhanden und wirksam.'},
      {t:'Stecker und Kupplung', text:'Unbeschädigt, keine Verfärbung durch Hitze, Kontakte fest; ggf. richtige Sicherung.'},
      {t:'Gehäuse', text:'Keine Risse, fehlenden Abdeckungen oder Schrauben, keine Überhitzungsspuren; Lüftungsöffnungen frei.'},
      {t:'Schalter und Bedienelemente', text:'Fest, unbeschädigt und schaltbar.'},
      {t:'Aufschriften', text:'Typschild und Sicherheitskennzeichen lesbar.'},
      {t:'Bestätigen', text:'Bestandene Sichtprüfung am Tester mit [[Ja]] bestätigen, nicht bestanden mit [[Nein]].'}
    ]
  }
},

rpe_ger: {
  titel:'Schutzleiterwiderstand R_PE (Gerät)',
  warum:{
    intro:'Bei Geräten der Schutzklasse I ist das Metallgehäuse über den Schutzleiter der Anschlussleitung geerdet. Die Messung prüft die Verbindung vom Schutzkontakt des Steckers bis zu jedem berührbaren leitfähigen Teil.',
    punkte:[
      {t:'Unterbrochener oder hochohmiger Schutzleiter', text:'Bei einem Isolationsfehler im Gerät steht das Gehäuse unter Spannung, ohne dass eine Schutzeinrichtung abschaltet.'},
      {t:'Häufige Fehlerstelle', text:'Aderbrüche an der Knickstelle hinter dem Stecker oder an der Geräteeinführung – deshalb wird die Leitung während der Messung bewegt.'},
      {t:'Bewertung', text:'Leitungen bis 1,5 mm²: bis 5 m höchstens 0,3 Ω, je weitere 7,5 m +0,1 Ω (anteilig), maximal 1 Ω (GER-08). Über 1,5 mm² (LTG-06): Leiterwiderstand l ÷ (56 × A) + 0,1 Ω Übergang. Bei Schutzklasse II entfällt die Messung.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2', icons:'rpe_ger',
    intro:'Gemessen wird zwischen dem Schutzkontakt der Prüfsteckdose und dem Gehäuse; das Gerät ist dabei nicht am Netz.',
    punkte:[
      {t:'Voraussetzung', text:'Sichtprüfung bestanden. Messleitung kompensiert – erkennbar am Symbol <b>Ø</b> im Display. Ohne Kompensation ist die Messung gesperrt: [[Einstellungen]] → Messleitungskompensation, Sonde an den Kompensationsanschluss am Tester halten.'},
      {t:'Taste', text:'[[R<sub>PE</sub> 200 mA]] für die Messung mit 200 mA Prüfstrom. Die zweite Schutzleiter-Taste startet die Hochstrommessung ([[R<sub>PE</sub> 10 A]] in der deutschen Ausführung).'},
      {t:'Anschluss', text:'Netzstecker des Prüflings in die Prüfsteckdose, Krokodilklemme der R<sub>PE</sub>-Messleitung an ein blankes Metallteil des Gehäuses.'},
      {t:'Messung', text:'[[Start]] kurz drücken (Einzelmessung) oder länger als 2 s halten (Dauermessung). Die Anschlussleitung dabei abschnittsweise über die ganze Länge bewegen.'},
      {t:'Mehrere Metallteile', text:'Jedes berührbare leitfähige Teil einzeln messen – der höchste Wert wird eingetragen.'}
    ]
  }
},

riso_ger_spannung: {
  titel:'Prüfspannung Isolationsmessung (Gerät)',
  warum:{
    intro:'Geräte werden standardmäßig mit 500 V DC auf ihre Isolation geprüft.',
    punkte:[
      {t:'500 V DC', text:'Regelfall für Geräte der Schutzklassen I und II.'},
      {t:'250 V DC', text:'Für Geräte mit eingebauten Überspannungsableitern (z. B. Steckdosenleisten mit Überspannungsschutz), die bei 500 V ansprechen und das Ergebnis verfälschen würden.'},
      {t:'Empfindliche Elektronik', text:'Kann ein Gerät durch die Isolationsmessung Schaden nehmen, wird stattdessen der Ableitstrom gemessen (GER-10/GER-09).'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2', icons:'riso_ger',
    intro:'Der Fluke 6500-2 kennt nur diese beiden Prüfspannungen.',
    punkte:[
      {t:'Einstellen', text:'Nach der Taste [[R<sub>ISO</sub>]] mit den Pfeiltasten [[◀]] [[▶]] 250 V oder 500 V wählen.'}
    ]
  }
},

riso_ger: {
  titel:'Isolationswiderstand R_ISO (Gerät)',
  warum:{
    intro:'Die Messung prüft, ob die Isolierung zwischen den aktiven Teilen (L und N, im Tester zusammengeschaltet) und dem Schutzleiter bzw. den berührbaren leitfähigen Teilen ausreicht.',
    punkte:[
      {t:'Zu niedriger Wert', text:'Hinweis auf Feuchtigkeit, Verschmutzung (z. B. Nebelfluid- und Staubablagerungen), beschädigte Leitungen oder gealterte Isolierung. Es droht Körperschluss.'},
      {t:'Bewertung', text:'Schutzklasse I mindestens 1 MΩ, Schutzklasse II mindestens 2 MΩ – höhere Anforderung, weil keine Schutzleiter-Rückfallebene vorhanden ist. Schutzklasse I mit Heizelementen (GER-14 „Ja“) mindestens 0,3 MΩ, Schutzklasse III mindestens 0,25 MΩ – die App setzt den Grenzwert automatisch.'},
      {t:'Reihenfolge', text:'Nur messen, wenn Sichtprüfung und Schutzleitermessung bestanden sind.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2', icons:'riso_ger',
    intro:'Der Tester legt die Prüfspannung zwischen die zusammengeschalteten Kontakte L/N und den Schutzleiter bzw. die Prüfsonde.',
    punkte:[
      {t:'Taste', text:'[[R<sub>ISO</sub>]], danach die Prüfspannung mit [[◀]] [[▶]] wählen (GER-05b).'},
      {t:'Anschluss Schutzklasse I', text:'Netzstecker in die Prüfsteckdose – eine Sonde ist nicht nötig.'},
      {t:'Anschluss Schutzklasse II', text:'Netzstecker in die Prüfsteckdose, mit der Prüfsonde nacheinander alle berührbaren Metallteile antasten.'},
      {t:'Gerät einschalten', text:'Den Netzschalter des Prüflings auf EIN stellen, damit auch die Teile hinter dem Schalter mitgeprüft werden.'},
      {t:'Messung', text:'[[Start]] drücken. Liegt an den Messanschlüssen Spannung an (über 30 V), sperrt der Tester.'},
      {t:'Achtung', text:'Während der Messung den Prüfling nicht berühren (bis 500 V). Erst abstecken, wenn die Messung beendet ist und sich das Gerät entladen hat.'}
    ]
  }
},

ableit_methode: {
  titel:'Messmethode Ableitstrom',
  warum:{
    intro:'Für den Ableitstrom gibt es drei Messverfahren. Sie erfassen unterschiedliche Ströme – deshalb ist ein Messwert nur zusammen mit der Methode aussagekräftig.',
    punkte:[
      {t:'Ersatzableitstrom I<sub>EA</sub>', text:'Gerät nicht am Netz, einfache und sichere Messung. Nicht geeignet für Geräte mit netzspannungsabhängigen Schaltern (Relais, Schütze) oder Schaltnetzteilen, weil deren Teile ohne Netzspannung nicht mitgeprüft werden.'},
      {t:'Differenzstrom I<sub>Δ</sub> / I<sub>L</sub>', text:'Gerät im Betrieb. Gemessen wird der Unterschied zwischen hin- und zurückfließendem Strom – also alles, was über den Schutzleiter oder andere Wege abfließt. Typisch für Schutzklasse I.'},
      {t:'Direktmessung I<sub>B</sub> (Berührungsstrom)', text:'Gerät im Betrieb. Gemessen wird der Strom, der über einen Menschen an einem berührbaren leitfähigen Teil fließen würde. Typisch für Schutzklasse II und für Teile der Schutzklasse I ohne Schutzleiterverbindung.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2', icons:'ableit',
    intro:'Jede Methode hat am Tester eine eigene Taste – die Symbole entsprechen den Icons dieser Karte:',
    punkte:[
      {t:'Ersatzableitstrom', text:'Taste [[I<sub>EA</sub>]].'},
      {t:'Differenzstrom', text:'Taste [[I<sub>Δ</sub> / I<sub>L</sub>]] (Last-/Differenzstrom).'},
      {t:'Direktmessung', text:'Taste [[I<sub>B</sub>]] (Berührungsstrom).'}
    ]
  }
},

ableit: {
  titel:'Ableitstrom',
  warum:{
    intro:'Auch ein intaktes Gerät lässt über Isolierung, Entstörkondensatoren und Filter einen kleinen Strom abfließen. Die Messung stellt sicher, dass dieser Strom unter den zulässigen Grenzen bleibt.',
    punkte:[
      {t:'Zu hoher Schutzleiterstrom', text:'Bei unterbrochenem Schutzleiter würde dieser Strom über den Menschen fließen. Zudem summieren sich Ableitströme mehrerer Geräte und können einen 30-mA-RCD auslösen.'},
      {t:'Zu hoher Berührungsstrom', text:'Bei Berührung fließt ein spürbarer bis gefährlicher Strom durch den Körper.'},
      {t:'Grenzwerte', text:'Schutzleiterstrom (SK I, Ersatzableit- oder Differenzstrom) ≤ 3,5 mA – bei Heizelementen über 3,5 kW 1 mA je kW, höchstens 10 mA (GER-14/15). Berührungsstrom (Direktmessung, SK II bzw. Teile ohne Schutzleiter) ≤ 0,5 mA. Schutzklasse III: keine Ableitstrommessung. Verlängerungen, Kabeltrommeln und Mehrfachsteckdosen ohne eigene Verbraucher: Methode „entfällt“.'},
      {t:'Ergänzung zur Isolationsmessung', text:'Bei Geräten mit Elektronik, Relais oder Schaltnetzteilen erfasst die Isolationsmessung nicht alle Teile – die Messung unter Netzspannung ist dann aussagekräftiger.'}
    ]
  },
  wie:{
    geraet:'Fluke 6500-2', icons:'ableit',
    intro:'Ablauf je nach der in GER-10 gewählten Methode – die gewählte Methode wird hervorgehoben:',
    punkte:[
      {t:'Ersatzableitstrom', methode:'Ersatzableitstrom', text:'Taste [[I<sub>EA</sub>]]. Netzstecker in die Prüfsteckdose, Netzschalter des Geräts auf EIN (das Gerät läuft nicht, es liegt keine Netzspannung an). Schutzklasse II: mit der Prüfsonde alle berührbaren Metallteile antasten. [[Start]] drücken.'},
      {t:'Differenzstrom', methode:'Differenzstrom', text:'Taste [[I<sub>Δ</sub> / I<sub>L</sub>]]. Das Gerät wird mit Netzspannung betrieben – Sichtprüfung, R<sub>PE</sub> und R<sub>ISO</sub> müssen bestanden sein. Gerät einschalten, die Prüfung unter Spannung mit [[Ja]] bestätigen, [[Start]] drücken. Der Tester führt eine L-N-Vorprüfung durch und zeigt dann Laststrom, Leistung und Schutzleiterstrom.'},
      {t:'Direktmessung', methode:'Direktmessung', text:'Taste [[I<sub>B</sub>]]. Die Prüfsonde an berührbare leitfähige Teile halten (Schutzklasse II: alle, Schutzklasse I: nur Teile ohne Schutzleiterverbindung); der Tester misst über einen Messwiderstand von ca. 2 kΩ gegen Erde. Gerät läuft unter Netzspannung, mit [[Ja]] bestätigen, [[Start]] drücken.'},
      {t:'Polarität', text:'Bei nicht gepolten Steckern (Schuko) die Messungen unter Netzspannung in beiden Polaritäten durchführen und den höheren Wert eintragen.'},
      {t:'Abbrechen', text:'Eine laufende Messung jederzeit mit [[Stopp]] beenden.'},
      {t:'Achtung', text:'Der Prüfling läuft unter Netzspannung: auf Motoren, Heizungen, bewegte Teile und heiße Leuchtmittel achten. Bei einem defekten Prüfling kann ein vorgeschalteter RCD auslösen.'}
    ]
  }
}
};
