#!/bin/bash
# Alle Tests nacheinander (dauert etwa 45 Minuten). Zeigt je Test nur die Ergebnis- und Fehlerzeilen.
# Bildschirmfotos landen in tests/ausgabe/ (nicht im Repository).
cd "$(dirname "$0")"; mkdir -p ausgabe; cd ausgabe   # manche Tests legen Bilder im aktuellen Ordner ab
run(){ echo "=== $*"; local t=$1; shift; timeout 400 node ../$t "$@" 2>&1 | grep -v 'Failed to load resource' | grep -iE "^(OK|FAIL|FEHL)|fehler|error|PAGEERROR|\bok\b|Geschafft" | tail -6; }
for t in t1 t2 t3 t4 t5 t6 t7 t8 joust t_dg t_dgfight t_hunt t_boar t_kbd t_mood switch; do run einzel/$t.mjs; done
run einzel/t_games.mjs 2
for t in "tp1" "ts1 a" "t1" "t2" "t3b" "t4 545 8" "t6" "tm1" "to1" "tt1" "te2 brand" "tk1" "tk2"; do set -- $t; run mehrspieler/$1.mjs "${@:2}"; done
for t in tw1 tw2 tw5 tb1 tb2 m20 m21 vollbild tafeltasten kirche kirche2 kirche_handy bergland bergland2 stufen30 gegenstaende ostlande kriegszug; do run funktionen/$t.mjs; done
