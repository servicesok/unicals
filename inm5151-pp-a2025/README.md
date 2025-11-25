# inf6150-a2025-equipe9

# UNICAL : Plan d’études intelligent adapté à un étudiant d’université 

## Idée générale 

Les étudiants universitaires jonglent avec leurs cours, travaux, examens et souvent un emploi, en plus d’un budget serré. Le but, c’est simple : aider les étudiants à réussir leurs études tout en gardant leurs finances sous contrôle. 

Les applis de to-do ou de Pomodoro aident un peu à s’organiser, mais elles ne tiennent pas compte de nos vrais horaires, de nos plans de cours ni de nos finances. 

Avec **UNICAL**, l’étudiant entre son horaire, ses échéances académiques et son budget. L’application calcule la priorité des tâches et remplit automatiquement les créneaux libres avec des blocs d’étude adaptés. Chaque tâche a des cases à cocher et un % de progression, avec un minuteur intégré et un suivi prévu vs réel. 

Et grâce à l’_***IA***_, le système s’adapte : si une séance prend plus ou moins de temps, il réajuste le planning. En parallèle, il analyse aussi les dépenses étudiantes et propose des recommandations, comme réduire un poste de dépense pour investir dans un manuel ou libérer du temps pour réviser un examen. 


    -> L’étudiant entre son horaire (les plans de cours) manuellement (dates d’examens, TPs, quizs) et autres activités inclues dans l’horaire au besoin (cours, job, sport, vie perso) et.  

    -> UNICAL génère automatiquement un « plan d’études » : blocs d’étude placés dans les créneaux libres, avec priorités, minuteur et suivi prévu vs réel. 

    -> En parallèle, un module Finances-Études suit les revenus et dépenses étudiantes, et propose des recommandations budgétaires liées aux besoins académiques (ex. manuels, logiciels, transport). 

## Entrées (ce que l’étudiant fournit manuellement) 

- **Horaire** : jours/heures des cours, labs, job, activités récurrentes, indisponibilités. 

- **Plans de cours** : pour chaque cours, échéancier (examens, travaux pratiques, quiz), pondérations (%), objectifs/chapitres. 
 
- **Préférences** : durées de focus (25/45/90 min), heures préférées, pauses, charge max/jour. 
 
- **Budget** : revenus (prêt, bourse, job) et dépenses (logement, nourriture, loisirs, matériel d’étude). 

## Sorties (ce que l’app propose) 

- **Calendrier d’étude hebdo personnalisé** (créneaux libres → blocs d’étude). 

- **Priorités par cours et par tâch**e (ex. « Réviser Chap. 3 », « TP1 : analyse »). 

- **Minuteur intégré** + suivi **temps prévu vs temps réel**. 

- **Ajustements automatiques** si une séance est ratée ou si la charge est trop élevée. 

- **Progression** : pour chaque tâche et pour chaque cours, un % d’avancement avec cases à cocher (sous‑tâches). 
    -  Ex. : Tâche « Réviser Chap. 3 » → 4 sous‑tâches (3/4 cochées ⇒ 75 %). 

- **Cours** : agrégation pondérée par les % du plan de cours (examens/TP/quiz). 

- **Tableau budgétaire** : suivi des revenus et dépenses par catégories. 

- **Recommandations** : ex. « Ton budget pour septembre est de 2 050 $. 
    - Le premier versement de prêt étudiant pour la session d’automne 2025 arrive le 19 septembre et sera de 1 000 $ ». 

## Fonctionnement  

**Analyse des échéances (plans de cours)** → calcul de l’urgence par tâche. 

**Score de priorité** = importance (poids %) + urgence (date) + effort estimé. 

**Placement** : on remplit les créneaux libres de la semaine avec des blocs d’étude (25/45/90), en respectant limites (heures tardives, pauses, job). 

**Boucle d’apprentissage** : si une tâche prend plus/moins de temps, UNICAL réajuste les prochaines durées et priorités. 

### Progression & % : 

**Tâche** = (sous‑tâches cochées / total) × 100 ou (temps réel / temps prévu, capé à 100). 

**Cours** = somme pondérée des tâches selon le plan de cours (ex. Examen 40 %, TP 30 %, Quiz 30 %). 

**Module finance** : génération de recommandations budgétaires en lien avec les études (ex. prévoir le montant du manuel, droits de scolarité, matériel obligatoire). 

## Objets principaux (pour UML) 

Utilisateur, Cours, PlanCours, Échéance (examen/TP/quiz), Tâche, ScorePriorité, Créneau, BlocTemps, Session, Rapport. 

### Relations clés : 

- Un Cours a un PlanCours composé d’Échéances. 

- Les Échéances génèrent des Tâches (révision, préparation, remise). 

- Les Tâches (avec ScorePriorité) génèrent des BlocsTemps dans des Créneaux libres. 

- Une Tâche peut avoir plusieurs Sessions; les Rapports agrègent prévu vs réel. 

- Revenu, Dépense, Budget, RecommandationFinance. 

### Relations : 

Un Utilisateur a un Budget composé de Revenus et Dépenses. 

Le Budget alimente des Recommandations financières. 

 

 

## Sprints  

### Sprint 1 : Base académique + notifications de base  

**Livrable**: calendrier académique interactif avec rappels de base. 

- [X] Création du  framework (Python + React + PostgreSQL). 

- [X] Ajout/saisie : cours, horaires, indispo, échéances académiques (examens, TP, quiz). 

- [X] Génération du calendrier  de base (créneaux libres affichés). 
-
- [ ] Minuteur simple (Pomodoro basique). 

- [X] Notifications simples : rappels examens, TP, rendez-vous. 

 

### Sprint 2 : Discipline + finance simple 

**Livrable**: un plan d’étude intelligent + suivi budget simple. 

- [ ] Priorisation auto des tâches (importance/urgence/effort). 

- [ ] Placement automatique de blocs d’étude (25/45/90) dans créneaux libres. 

- [ ] Tableau de bord progression : cases à cocher, % tâche et % cours pondéré. 

- [ ] Module finance basique : saisir revenus/dépenses, affichage budget mensuel (catégories). 

- [ ] Notifications finances : rappel dépenses prévues ou seuil atteint. 

  

###  Sprint 3 : IA & intégration finances/études 

**Livrable**: application complète qui gère études + finances, avec IA de recommandations croisées. 

- [ ] Réajustement auto du calendrier (prévu vs réel). 

- [ ] Suggestions IA pour études : “ajoute 2 h de révision avant l’examen de demain”. 

- [ ] Suggestions IA pour finances : objectifs d’épargne (ex. mettre 30 $ de côté pour un manuel), gestion dette (répartir sur X mois). 

- [ ] Quiz interactifs : finances de base (“planifie ton budget”) + révision académique (questions auto). 

- [ ] Personnalisation légère (badges, thèmes, félicitations). 
 


## Technologies  

- **Backend** : Python FastAPI (API REST /tasks, /calendar, /budget, /progress). 

- **Frontend** : React (calendrier, UI, Pomodoro, dashboards). 

- **DB** : PostgreSQL (ou SQLite en dev)., DuckDB 

- **AI** : Python (facile d’intégrer XGBoost, scikit-learn, pandas pour les recommandations) 

- **CI/CD** : GitLab 

- **Conteneurisation** : Docker Compose (backend, frontend, db). 


 
