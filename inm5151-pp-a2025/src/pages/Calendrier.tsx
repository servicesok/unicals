/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect } from "react";
//Liste des composants Ionic
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonButtons,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonRange,
  IonToggle,
  IonMenuButton,
  IonToast,
} from "@ionic/react";

//Importation des icônes Ionicons
import {
  expandOutline, // Icône pour l'expansion en plein écran
  chevronBackOutline, // Icône pour le retour en arrière
  chevronForwardOutline, // Icône pour l'avance
  closeOutline, // Icône pour la fermeture
  colorPaletteOutline, // Icône pour la palette de couleurs
  checkmarkOutline, // Icône pour la validation
} from "ionicons/icons";

import "./Calendrier.css"; // Importation du fichier CSS pour le style

/* import { useHistory } from "react-router-dom";
import { supabase } from "../services/supabase"; */
import "./Calendrier.css";
import { listDeadlines, Deadline } from "../api/deadlines.supabase";
import { listCourses, Course } from "../api/courses.supabase";

// 🎯 nouveaux imports pour les blocs d'étude auto + algorithme
import {
  listStudyBlocks,
  createStudyBlock,
  deleteStudyBlock,
  StudyBlock,
  StudyBlockInput,
} from "../api/studyBlocks.supabase";
import { findFirstFreeSlot } from "../utils/findFirstFreeSlot";

// Types pour les événements
interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "cours" | "examen" | "tp" | "paiement" | "travail" | "personnel";
  course?: string;
}

// Types pour la personnalisation
interface CustomizationSettings {
  colors: {
    cours: string;
    examen: string;
    tp: string;
    paiement: string;
    travail: string;
    personnel: string;
  };
  font: {
    family: string;
    size: number;
    bold: boolean;
  };
}

// Durées possibles d’un bloc d’étude automatique (en minutes)
const STUDY_DURATIONS = [25, 45, 60, 90];

// Composant principal Calendrier
const Calendrier: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [calendarView, setCalendarView] = useState<"weekly" | "daily">(
    "weekly"
  );
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedDayInDaily, setSelectedDayInDaily] = useState(new Date());
  const today = new Date();
  // const history = useHistory();

  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Données réelles
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);
  const [deadlinesError, setDeadlinesError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // 🔹 Blocs d’étude stockés en base
  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
  const [lastAutoBlockId, setLastAutoBlockId] = useState<string | null>(null);
  const [selectedBlockDuration, setSelectedBlockDuration] =
    useState<number>(STUDY_DURATIONS[0]);
  const [isPlacingBlock, setIsPlacingBlock] = useState(false);
  const [blockToast, setBlockToast] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  useEffect(() => {
    async function fetchData() {
      try {
        setDeadlinesLoading(true);
        setDeadlinesError(null);

        // On charge échéances + cours + blocs d’étude
        const [deadlinesData, coursesData, blocksData] = await Promise.all([
          listDeadlines(),
          listCourses(),
          listStudyBlocks(),
        ]);

        setDeadlines(deadlinesData);
        setCourses(coursesData);
        setStudyBlocks(blocksData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setDeadlinesError(e?.message || "Erreur de chargement des échéances");
      } finally {
        setDeadlinesLoading(false);
      }
    }

    fetchData();
  }, []);

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      if (c.id) map[c.id] = c;
    });
    return map;
  }, [courses]);

  // Transformer les échéances + blocs d’étude en événements du calendrier
  const events: Event[] = useMemo(() => {
    // 1) Échéances (examens, TP, paiements…)
    const deadlineEvents: Event[] = deadlines.map((d) => {
      // type d’événement pour le calendrier
      let type: Event["type"];
      switch (d.kind) {
        case "exam":
          type = "examen";
          break;
        case "tp":
        case "quiz":
          type = "tp";
          break;
        case "payment":
          type = "paiement";
          break;
        default:
          type = "personnel";
      }

      const dateObj = new Date(d.due_at);

      return {
        id: d.id!,
        title: d.title,
        date: dateObj,
        startTime: dateObj.toISOString().slice(11, 16),
        type,
        course: d.course_id ? courseById[d.course_id!]?.code : undefined,
      };
    });

    // 2) Blocs d’étude automatiques
    const studyEvents: Event[] = studyBlocks.map((b) => {
      const start = new Date(b.start_at);
      const end = new Date(b.end_at);

      return {
        id: b.id || `block-${b.start_at}`,
        title: b.title || "Bloc d'étude",
        date: start,
        startTime: start.toISOString().slice(11, 16),
        endTime: end.toISOString().slice(11, 16),
        type: "travail", // on réutilise la couleur "travail"
        course: b.course_id ? courseById[b.course_id]?.code : undefined,
      };
    });

    return [...deadlineEvents, ...studyEvents];
  }, [deadlines, courseById, studyBlocks]);

  // État pour la personnalisation
  const [customization, setCustomization] = useState<CustomizationSettings>({
    colors: {
      cours: "#4285f4",
      examen: "#ea4335",
      tp: "#9c27b0",
      paiement: "#34a853",
      travail: "#fbbc04",
      personnel: "#00bcd4",
    },
    font: {
      family: "Arial",
      size: 14,
      bold: false,
    },
  });

  // Couleurs prédéfinies disponibles
  const availableColors = [
    "#4285f4", // Bleu Google
    "#ea4335", // Rouge Google
    "#9c27b0", // Violet
    "#34a853", // Vert Google
    "#fbbc04", // Jaune Google
    "#00bcd4", // Cyan
    "#ff6f00", // Orange
    "#e91e63", // Rose
    "#3f51b5", // Indigo
    "#009688", // Teal
    "#8bc34a", // Vert clair
    "#ff5722", // Orange profond
    "#795548", // Marron
    "#607d8b", // Bleu gris
    "#f44336", // Rouge
    "#2196f3", // Bleu
  ];

  // Polices disponibles pour la personnalisation
  const availableFonts = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Verdana",
    "Comic Sans MS",
    "Impact",
    "Trebuchet MS",
    "Roboto",
  ];

  // Fonction pour obtenir la couleur d'un type d'événement
  const getEventColor = (type: string) => {
    return (
      customization.colors[type as keyof typeof customization.colors] ||
      "#757575"
    );
  };

  // Fonction pour changer la couleur d'un type d'événement
  const changeEventColor = (
    type: keyof typeof customization.colors,
    color: string
  ) => {
    setCustomization((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [type]: color,
      },
    }));
  };

  // Fonction pour réinitialiser les couleurs par défaut
  const resetColors = () => {
    setCustomization((prev) => ({
      ...prev,
      colors: {
        cours: "#4285f4",
        examen: "#ea4335",
        tp: "#9c27b0",
        paiement: "#34a853",
        travail: "#fbbc04",
        personnel: "#00bcd4",
      },
    }));
  };

  // Obtenir les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Navigation mois précédent
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };
  // Navigation mois suivant
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // Navigation semaine précédente
  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
    setSelectedDayInDaily(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    setSelectedDayInDaily(newDate);
  };

  // Ouvrir la fenêtre plein écran et réinitialiser à la semaine actuelle
  const openFullscreen = () => {
    setCurrentDate(new Date()); // Réinitialiser à aujourd'hui
    setSelectedDayInDaily(new Date());
    setIsFullscreen(true);
  };

  // Filtrer les événements selon le cours sélectionné
  const getFilteredEvents = () => {
    if (selectedCourse === "all") {
      return events;
    }
    return events.filter((event) => event.course === selectedCourse);
  };

  const filteredEvents = getFilteredEvents();

  // Obtenir les événements à venir
  const upcomingEvents = filteredEvents
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  // Vue hebdomadaire pour le plein écran
  const getWeekDays = (referenceDate?: Date) => {
    const week = [];
    const baseDate = referenceDate || currentDate;
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays(); // Jours de la semaine actuelle
  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // Heures de 8h à 23h

  // Obtenir les événements pour un jour spécifique
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(
      (e) =>
        e.date.getDate() === date.getDate() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getFullYear() === date.getFullYear()
    );
  };

  // Obtenir les événements pour un jour du mois (par numéro)
  const getEventsForDayNumber = (day: number | null) => {
    if (!day) return [];
    return filteredEvents.filter(
      (e) =>
        e.date.getDate() === day &&
        e.date.getMonth() === currentDate.getMonth() &&
        e.date.getFullYear() === currentDate.getFullYear()
    );
  };

  // 🔍 Créneaux occupés pour un jour donné (pour éviter les overlaps)
  const getBusyIntervalsForDay = (date: Date) => {
    return events
      .filter(
        (e) =>
          e.date.getDate() === date.getDate() &&
          e.date.getMonth() === date.getMonth() &&
          e.date.getFullYear() === date.getFullYear()
      )
      .filter((e) => e.startTime)
      .map((e) => {
        const [sh, sm] = e.startTime!.split(":").map(Number);
        const start = new Date(date);
        start.setHours(sh || 0, sm || 0, 0, 0);

        const end = new Date(date);
        if (e.endTime) {
          const [eh, em] = e.endTime.split(":").map(Number);
          end.setHours(eh || 0, em || 0, 0, 0);
        } else {
          // Par défaut, on bloque 1h si aucune heure de fin
          end.setTime(start.getTime() + 60 * 60 * 1000);
        }

        return { start, end };
      });
  };

  // Fenêtre de placement par défaut pour un jour (8h–22h)
  const getWindowForDay = (date: Date) => {
    const windowStart = new Date(date);
    windowStart.setHours(8, 0, 0, 0);
    const windowEnd = new Date(date);
    windowEnd.setHours(22, 0, 0, 0);
    return { windowStart, windowEnd };
  };

  // ⚙️ Génération automatique d'un bloc d'étude dans la journée sélectionnée
  const handleGenerateBlock = async () => {
    try {
      setIsPlacingBlock(true);

      const { windowStart, windowEnd } = getWindowForDay(selectedDayInDaily);
      const busy = getBusyIntervalsForDay(selectedDayInDaily);

      const slot = findFirstFreeSlot(
        selectedBlockDuration,
        windowStart,
        windowEnd,
        busy
      );

      if (!slot) {
        setBlockToast({
          open: true,
          message: "Aucun créneau libre disponible pour cette durée.",
        });
        return;
      }

      const input: StudyBlockInput = {
        title: "Bloc d'étude",
        start_at: slot.start.toISOString(),
        end_at: slot.end.toISOString(),
        duration_minutes: selectedBlockDuration,
        source: "auto",
      };

      const created = await createStudyBlock(input);
      setStudyBlocks((prev) => [...prev, created]);
      setLastAutoBlockId(created.id ?? null);

      const timeLabel = slot.start.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setBlockToast({
        open: true,
        message: `Bloc d'étude ajouté à ${timeLabel}.`,
      });
    } catch (e: any) {
      setBlockToast({
        open: true,
        message:
          e?.message || "Erreur lors de la génération du bloc d'étude.",
      });
    } finally {
      setIsPlacingBlock(false);
    }
  };

  // 🔙 Undo : supprime le dernier bloc généré automatiquement
  const handleUndoLastBlock = async () => {
    if (!lastAutoBlockId) return;
    try {
      await deleteStudyBlock(lastAutoBlockId);
      setStudyBlocks((prev) => prev.filter((b) => b.id !== lastAutoBlockId));
      setBlockToast({
        open: true,
        message: "Dernier bloc d'étude supprimé.",
      });
      setLastAutoBlockId(null);
    } catch (e: any) {
      setBlockToast({
        open: true,
        message: e?.message || "Impossible de supprimer le bloc d'étude.",
      });
    }
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Vérifier si une date complète est aujourd'hui
  const isTodayFullDate = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Formater une date en chaîne lisible
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  // Calculer les statistiques de la semaine actuelle
  const getWeekStatistics = () => {
    const weekEvents = filteredEvents.filter((e) => {
      return weekDays.some(
        (day) =>
          e.date.getDate() === day.getDate() &&
          e.date.getMonth() === day.getMonth() &&
          e.date.getFullYear() === day.getFullYear()
      );
    });

    // Calcul des statistiques
    const totalEvents = weekEvents.length;
    const coursHours = weekEvents
      .filter((e) => e.type === "cours" && e.startTime && e.endTime)
      .reduce((sum, e) => {
        const start = parseInt(e.startTime!.split(":")[0]);
        const end = parseInt(e.endTime!.split(":")[0]);
        return sum + (end - start);
      }, 0);

    const deadlines = weekEvents.filter(
      (e) => e.type === "examen" || e.type === "tp" || e.type === "travail"
    ).length;

    // Pourcentage du temps planifié (heures planifiées / 40 heures)
    const plannedHours = weekEvents
      .filter((e) => e.startTime && e.endTime)
      .reduce((sum, e) => {
        const start = parseInt(e.startTime!.split(":")[0]);
        const end = parseInt(e.endTime!.split(":")[0]);
        return sum + (end - start);
      }, 0);

    const plannedPercentage = Math.round((plannedHours / 40) * 100);

    return { totalEvents, coursHours, deadlines, plannedPercentage };
  };

  const stats = getWeekStatistics();

  /*   const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    history.push("/login");
  }; */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
          <IonTitle>📅 Mon Calendrier UNICAL</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="calendar-content" scrollY={true}>
        <div
          style={{
            padding: "20px",
            maxWidth: "1400px",
            margin: "0 auto",
            paddingBottom: "60px",
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Calendrier principal MINIMAL */}
            <div
              style={{
                flex: "1",
                minWidth: "300px",
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <IonSelect
                    value={selectedCourse}
                    onIonChange={(e) => setSelectedCourse(e.detail.value)}
                    style={{
                      maxWidth: "200px",
                      color: "#0095eb",
                      fontWeight: 500,
                    }}
                  >
                    <IonSelectOption value="all">
                      Tous les cours
                    </IonSelectOption>
                    {courses.map((c) => (
                      <IonSelectOption key={c.id} value={c.code}>
                        {c.code}
                      </IonSelectOption>
                    ))}
                  </IonSelect>

                  {selectedCourse !== "all" && (
                    <IonBadge color="primary" style={{ fontSize: "11px" }}>
                      Filtre actif: {selectedCourse}
                    </IonBadge>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {/* BOUTON DE PERSONNALISATION */}
                  <IonButton
                    fill="outline"
                    color="secondary"
                    onClick={() => setIsCustomizationOpen(true)}
                    className="customize-btn"
                    style={{
                      color: "#0095eb",
                      textTransform: "capitalize",
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 600,
                      padding: "8px 12px",
                      minWidth: "auto",
                      height: "36px",
                      borderRadius: "8px",
                    }}
                  >
                    <IonIcon
                      icon={colorPaletteOutline}
                      slot="start"
                      style={{ fontSize: "18px" }}
                    />
                    <span className="btn-text">Personnaliser</span>
                  </IonButton>

                  {/* BOUTON PLEIN ÉCRAN - À DROITE */}
                  <IonButton
                    fill="outline"
                    onClick={openFullscreen}
                    className="fullscreen-btn"
                    style={{
                      height: "36px",
                      minWidth: "36px",
                      padding: "8px",
                      margin: 0,
                      borderRadius: "8px",
                      "--color": "#0095eb",
                      color: "#0095eb",
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={expandOutline}
                      style={{ fontSize: "22px", color: "#0095eb" }}
                    />
                  </IonButton>
                </div>
              </div>

              {/* Navigation mois */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <IonButton fill="clear" onClick={previousMonth}>
                  <IonIcon icon={chevronBackOutline} />
                </IonButton>
                <h2
                  style={{
                    color: "#0095eb",
                    textTransform: "capitalize",
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 600,
                    fontStyle: "inherit",
                  }}
                >
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <IonButton fill="clear" onClick={nextMonth}>
                  <IonIcon icon={chevronForwardOutline} />
                </IonButton>
              </div>

              {/* En-têtes jours */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(
                  (day) => (
                    <div
                      key={day}
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#8898aa",
                        padding: "10px 0",
                        fontStyle: "inherit",
                      }}
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Grille calendrier MINIMALE avec petits POINTS */}
              <div
                className="calendar-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: "1px",
                  width: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  backgroundColor: "#f1f3f5",
                  borderRadius: "12px",
                  padding: "4px",
                }}
              >
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDayNumber(day);
                  const isCurrentDay = isToday(day);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: day
                          ? isCurrentDay
                            ? "#e3f2fd"
                            : "white"
                          : "transparent",
                        borderRadius: "10px",
                        padding: "10px 6px",
                        textAlign: "center",
                        minHeight: "70px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "6px",
                        cursor: day ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        boxShadow: isCurrentDay
                          ? "0 0 0 2px #0095eb inset"
                          : "0 1px 3px rgba(0,0,0,0.08)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onClick={() => day && console.log("Jour cliqué:", day)} // à remplacer
                      onMouseEnter={(e) => {
                        if (day)
                          e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        if (day)
                          e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {day && (
                        <>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: isCurrentDay ? 700 : 500,
                              color: isCurrentDay ? "#0095eb" : "#32325d",
                              marginBottom: "8px",
                              fontStyle: "inherit",
                            }}
                          >
                            {day}
                          </div>

                          {/* Indicateur d'événements (petits points colorés) */}
                          {hasEvents && (
                            <div
                              style={{
                                display: "flex",
                                gap: "3px",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                width: "100%",
                              }}
                            >
                              {dayEvents.slice(0, 4).map((event, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    width: "7px",
                                    height: "7px",
                                    backgroundColor: getEventColor(event.type),
                                    borderRadius: "50%",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}
                                  title={event.title}
                                />
                              ))}
                              {dayEvents.length > 4 && (
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#7f8c8d",
                                    fontWeight: "500",
                                  }}
                                >
                                  +{dayEvents.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar événements à venir */}
            <div
              style={{
                width: "350px",
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "24px" }}>📌</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#32325d",
                    fontStyle: "inherit",
                  }}
                >
                  Événements à venir
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const dateStr = eventDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });

                  return (
                    <div
                      key={event.id}
                      style={{
                        padding: "15px",
                        borderLeft: `4px solid ${getEventColor(event.type)}`,
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#32325d",
                          marginBottom: "5px",
                          fontSize: "14px",
                          fontStyle: "inherit",
                        }}
                      >
                        {event.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#8898aa",
                          textTransform: "capitalize",
                          fontStyle: "inherit",
                        }}
                      >
                        {dateStr}
                      </div>
                      {event.startTime && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#525f7f",
                            marginTop: "5px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontStyle: "inherit",
                          }}
                        >
                          🕐 {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </div>
                      )}
                      {event.course && (
                        <IonBadge
                          color="primary"
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                          }}
                        >
                          {event.course}
                        </IonBadge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal PERSONNALISATION */}
        <IonModal
          isOpen={isCustomizationOpen}
          onDidDismiss={() => setIsCustomizationOpen(false)}
          style={
            {
              "--width": "90%",
              "--max-width": "800px",
              "--height": "85vh",
              "--border-radius": "16px",
            } as React.CSSProperties
          }
        >
          <IonHeader>
            <IonToolbar color="secondary">
              <IonTitle>🎨 Personnalisation du calendrier</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsCustomizationOpen(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {/* Section Couleurs */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  color: "#32325d",
                  marginBottom: "20px",
                  fontSize: "18px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                🎨 Couleurs des événements
              </h3>

              {Object.entries(customization.colors).map(([type, color]) => (
                <div
                  key={type}
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: color,
                          borderRadius: "6px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 500,
                          color: "#32325d",
                          textTransform: "capitalize",
                        }}
                      >
                        {type === "cours"
                          ? "Cours"
                          : type === "examen"
                          ? "Examens"
                          : type === "tp"
                          ? "TP/Quiz"
                          : type === "paiement"
                          ? "Paiements"
                          : type === "travail"
                          ? "Travail"
                          : "Personnel"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#8898aa",
                        fontFamily: "monospace",
                      }}
                    >
                      {color}
                    </span>
                  </div>

                  {/* Palette de couleurs */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "7px",
                    }}
                  >
                    {availableColors.map((availableColor) => (
                      <div
                        key={availableColor}
                        onClick={() =>
                          changeEventColor(
                            type as keyof typeof customization.colors,
                            availableColor
                          )
                        }
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: availableColor,
                          borderRadius: "6px",
                          cursor: "pointer",
                          border:
                            color === availableColor
                              ? "3px solid #32325d"
                              : "2px solid #e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.2s",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        {color === availableColor && (
                          <IonIcon
                            icon={checkmarkOutline}
                            style={{
                              color: "white",
                              fontSize: "20px",
                              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <IonButton
                expand="block"
                fill="outline"
                onClick={resetColors}
                style={{ marginTop: "15px" }}
              >
                Réinitialiser les couleurs par défaut
              </IonButton>
            </div>

            {/* Section Police */}
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  color: "#32325d",
                  marginBottom: "20px",
                  fontSize: "18px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                ✒️ Style de texte
              </h3>

              {/* Sélection de police */}
              <IonList>
                <IonItem>
                  <IonLabel>Police de caractères</IonLabel>
                  <IonSelect
                    value={customization.font.family}
                    onIonChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        font: { ...prev.font, family: e.detail.value },
                      }))
                    }
                  >
                    {availableFonts.map((font) => (
                      <IonSelectOption
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                {/* Taille de police */}
                <IonItem>
                  <IonLabel>
                    Taille de police: {customization.font.size}px
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonRange
                    min={10}
                    max={24}
                    value={customization.font.size}
                    onIonChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        font: { ...prev.font, size: e.detail.value as number },
                      }))
                    }
                    pin={true}
                  />
                </IonItem>

                {/* Texte en gras */}
                <IonItem>
                  <IonLabel>Texte en gras</IonLabel>
                  <IonToggle
                    checked={customization.font.bold}
                    onIonChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        font: { ...prev.font, bold: e.detail.checked },
                      }))
                    }
                  />
                </IonItem>
              </IonList>

              {/* Aperçu */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8898aa",
                    marginBottom: "10px",
                  }}
                >
                  Aperçu du texte
                </div>
                <div
                  style={{
                    fontStyle: "inherit",
                    color: "#32325d",
                  }}
                >
                  Exemple de texte dans le calendrier
                </div>
              </div>
            </div>
          </IonContent>

          <div
            style={{
              padding: "15px",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              gap: "10px",
              backgroundColor: "white",
            }}
          >
            <IonButton
              expand="block"
              onClick={() => setIsCustomizationOpen(false)}
              style={{ flex: 1 }}
            >
              <IonIcon icon={checkmarkOutline} slot="start" />
              Appliquer
            </IonButton>
          </div>
        </IonModal>

        {/* Modal Vue hebdomadaire DÉTAILLÉE plein écran */}
        <IonModal
          isOpen={isFullscreen}
          onDidDismiss={() => setIsFullscreen(false)}
          className="fullscreen-modal"
          backdropDismiss={false}
          style={
            {
              "--width": "100%",
              "--height": "100%",
              "--border-radius": "0",
              "--box-shadow": "none",
            } as React.CSSProperties
          }
        >
          <IonHeader>
            <IonToolbar style={{ backgroundColor: "#5e72e4", color: "white" }}>
              <IonButtons slot="start">
                <IonButton onClick={previousWeek}>
                  <IonIcon icon={chevronBackOutline} />
                  Semaine précédente
                </IonButton>
              </IonButtons>

              <IonTitle>
                <IonButton
                  size="small"
                  fill="outline"
                  style={{
                    "--border-color": "white",
                    "--color": "white",
                    textTransform: "capitalize",
                    fontSize: "15px",
                    fontWeight: 600,
                    height: "36px",
                    "--border-width": "2px",
                    margin: "0 auto",
                  }}
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDayInDaily(today);
                  }}
                >
                  Semaine actuelle
                </IonButton>
              </IonTitle>

              <IonButtons slot="end">
                <IonButton onClick={nextWeek}>
                  Semaine suivante
                  <IonIcon icon={chevronForwardOutline} />
                </IonButton>
                <IonButton onClick={() => setIsFullscreen(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>

            <div
              style={{
                display: "flex",
                backgroundColor: "#5e72e4",
                color: "white",
                padding: "20px",
                justifyContent: "space-around",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    fontStyle: "inherit",
                  }}
                >
                  {stats.totalEvents}
                </div>
                <div style={{ fontSize: "14px", fontStyle: "inherit" }}>
                  Événements cette semaine
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    fontStyle: "inherit",
                  }}
                >
                  {stats.coursHours}h
                </div>
                <div style={{ fontSize: "14px", fontStyle: "inherit" }}>
                  Heures de cours
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    fontStyle: "inherit",
                  }}
                >
                  {stats.deadlines}
                </div>
                <div style={{ fontSize: "14px", fontStyle: "inherit" }}>
                  Échéances importantes
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    fontStyle: "inherit",
                  }}
                >
                  {stats.plannedPercentage}%
                </div>
                <div style={{ fontSize: "14px", fontStyle: "inherit" }}>
                  Temps planifié
                </div>
              </div>
            </div>

            {/* Vue options */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "10px 20px",
                backgroundColor: "#f8f9fa",
              }}
            >
              <IonButton
                size="small"
                fill={calendarView === "weekly" ? "solid" : "outline"}
                onClick={() => setCalendarView("weekly")}
              >
                Hebdomadaire
              </IonButton>
              <IonButton
                size="small"
                fill={calendarView === "daily" ? "solid" : "outline"}
                onClick={() => setCalendarView("daily")}
              >
                Quotidien
              </IonButton>
            </div>
          </IonHeader>

          <IonContent>
            {/* Vue conditionnelle*/}
            {calendarView === "weekly" ? (
              // VUE HEBDOMADAIRE
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px repeat(7, 1fr)",
                    overflowX: "auto",
                  }}
                >
                  {/* En-têtes des jours */}
                  <div
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "white",
                      zIndex: 10,
                    }}
                  ></div>
                  {weekDays.map((day, index) => {
                    const dayNames = [
                      "LUNDI",
                      "MARDI",
                      "MERCREDI",
                      "JEUDI",
                      "VENDREDI",
                      "SAMEDI",
                      "DIMANCHE",
                    ];
                    const isCurrentDay = isTodayFullDate(day);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const isSelectedDay =
                      selectedDayInDaily.getDate() === day.getDate() &&
                      selectedDayInDaily.getMonth() === day.getMonth() &&
                      selectedDayInDaily.getFullYear() === day.getFullYear();

                    return (
                      <div
                        key={index}
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: isCurrentDay ? "#ffe5b4" : "white",
                          padding: "15px",
                          textAlign: "center",
                          borderBottom: "2px solid #e0e0e0",
                          borderRight: "1px solid #e0e0e0",
                          zIndex: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            fontStyle: "inherit",
                          }}
                        >
                          {dayNames[index]}
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            marginTop: "5px",
                            fontStyle: "inherit",
                          }}
                        >
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}

                  {/* Grille horaire hebdomadaire */}
                  {hours.map((hour) => (
                    <React.Fragment key={hour}>
                      <div
                        style={{
                          padding: "10px 5px",
                          fontSize: "12px",
                          color: "#666",
                          borderBottom: "1px solid #f0f0f0",
                          textAlign: "right",
                          fontStyle: "inherit",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </div>

                      {weekDays.map((day, dayIndex) => {
                        const dayEvents = getEventsForDay(day).filter((e) => {
                          if (!e.startTime) return false;
                          const eventHour = parseInt(e.startTime.split(":")[0]);
                          return eventHour === hour;
                        });

                        return (
                          <div
                            key={dayIndex}
                            style={{
                              borderRight: "1px solid #e0e0e0",
                              borderBottom: "1px solid #f0f0f0",
                              minHeight: "60px",
                              position: "relative",
                              backgroundColor: isTodayFullDate(day)
                                ? "#fffef5"
                                : "white",
                            }}
                          >
                            {dayEvents.map((event) => {
                              const startHour = parseInt(
                                event.startTime!.split(":")[0]
                              );
                              const endHour = event.endTime
                                ? parseInt(event.endTime.split(":")[0])
                                : startHour + 1;
                              const duration = endHour - startHour;

                              return (
                                <div
                                  key={event.id}
                                  style={{
                                    position: "absolute",
                                    top: "2px",
                                    left: "4px",
                                    right: "4px",
                                    height: `${duration * 60 - 4}px`,
                                    backgroundColor: getEventColor(event.type),
                                    opacity: 0.85,
                                    borderRadius: "4px",
                                    borderLeft: `4px solid ${getEventColor(
                                      event.type
                                    )}`,
                                    padding: "8px",
                                    fontSize: "12px",
                                    color: "white",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    fontStyle: "inherit",
                                  }}
                                >
                                  <div style={{ fontWeight: "bold" }}>
                                    {event.title}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {event.startTime} - {event.endTime}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Légende hebdomadaire */}
                <div
                  style={{
                    padding: "25px",
                    backgroundColor: "#f8f9fa",
                    borderTop: "3px solid #e0e0e0",
                    display: "flex",
                    gap: "25px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#32325d",
                      marginRight: "10px",
                      fontStyle: "inherit",
                    }}
                  >
                    Légende :
                  </div>
                  {[
                    { type: "cours", label: "Cours" },
                    { type: "examen", label: "Examens" },
                    { type: "tp", label: "TP/Quiz" },
                    { type: "paiement", label: "Paiements" },
                    { type: "travail", label: "Travail" },
                    { type: "personnel", label: "Personnel" },
                  ].map((item) => (
                    <div
                      key={item.type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: getEventColor(item.type),
                          borderRadius: "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#32325d",
                          fontStyle: "inherit",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // VUE QUOTIDIENNE
              (() => {
                // Calculer la semaine à partir du jour sélectionné
                const weekDaysDaily = (() => {
                  const week = [];
                  const startOfWeek = new Date(selectedDayInDaily);
                  startOfWeek.setDate(
                    selectedDayInDaily.getDate() -
                      selectedDayInDaily.getDay() +
                      1
                  );
                  for (let i = 0; i < 7; i++) {
                    const day = new Date(startOfWeek);
                    day.setDate(startOfWeek.getDate() + i);
                    week.push(day);
                  }
                  return week;
                })();
                return (
                  <div
                    style={{
                      padding: "20px",
                      maxWidth: "600px",
                      margin: "0 auto",
                      backgroundColor: "#f8f9fa",
                      minHeight: "100%",
                    }}
                  >
                    {/* Mini calendrier du mois */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      {/* Titre du mois */}
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#32325d",
                          marginBottom: "15px",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        {monthNames[currentDate.getMonth()]}
                      </div>
                      {/* Jours de la semaine en une seule ligne */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        {weekDaysDaily.map((day, index) => {
                          const dayNames = [
                            "Dim",
                            "Lun",
                            "Mar",
                            "Mer",
                            "Jeu",
                            "Ven",
                            "Sam",
                          ];
                          const isSelectedDay =
                            selectedDayInDaily.getDate() === day.getDate() &&
                            selectedDayInDaily.getMonth() === day.getMonth() &&
                            selectedDayInDaily.getFullYear() ===
                              day.getFullYear();
                          const dayOfWeek = day.getDay();
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                setCurrentDate(day);
                                setSelectedDayInDaily(day);
                              }}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                                padding: "10px",
                                borderRadius: "12px",
                                backgroundColor: isSelectedDay
                                  ? "#6366f1"
                                  : "transparent",
                                color: isSelectedDay ? "white" : "#32325d",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                minWidth: "50px",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelectedDay) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f1f3f5";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelectedDay) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              {/* Nom du jour */}
                              <div
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: isSelectedDay ? "white" : "#8898aa",
                                  textTransform: "uppercase",
                                }}
                              >
                                {dayNames[dayOfWeek]}
                              </div>
                              {/* Numéro du jour */}
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: isSelectedDay ? 700 : 600,
                                }}
                              >
                                {day.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Navigation avec flèches + Section Aujourd'hui */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                        gap: "15px",
                      }}
                    >
                      {/* Flèche gauche */}
                      <IonButton
                        fill="clear"
                        onClick={previousWeek}
                        style={{ minWidth: "40px", margin: 0 }}
                      >
                        <IonIcon
                          icon={chevronBackOutline}
                          style={{ fontSize: "24px" }}
                        />
                      </IonButton>

                      {/* Titre Aujourd'hui */}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#32325d",
                          }}
                        >
                          Aujourd'hui
                        </h3>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#8898aa",
                            marginTop: "4px",
                          }}
                        >
                          {selectedDayInDaily.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                      </div>

                      {/* Flèche droite */}
                      <IonButton
                        fill="clear"
                        onClick={nextWeek}
                        style={{ minWidth: "40px", margin: 0 }}
                      >
                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{ fontSize: "24px" }}
                        />
                      </IonButton>
                    </div>

                    {/* ⚙️ Bloc d'étude automatique : choix durée + boutons */}
                    <div
                      style={{
                        marginBottom: "18px",
                        padding: "12px 14px",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          flex: 1,
                          minWidth: "180px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#32325d",
                          }}
                        >
                          Bloc d'étude automatique
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                          }}
                        >
                          Choisis une durée : UNICAL place le premier créneau
                          libre de la journée, sans chevaucher tes événements.
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <IonSelect
                          value={selectedBlockDuration}
                          onIonChange={(e) =>
                            setSelectedBlockDuration(e.detail.value)
                          }
                          interface="popover"
                          style={{ minWidth: "110px" }}
                        >
                          {STUDY_DURATIONS.map((d) => (
                            <IonSelectOption key={d} value={d}>
                              {d} min
                            </IonSelectOption>
                          ))}
                        </IonSelect>

                        <IonButton
                          size="small"
                          onClick={handleGenerateBlock}
                          disabled={isPlacingBlock}
                        >
                          {isPlacingBlock ? "Placement..." : "Générer un bloc"}
                        </IonButton>

                        <IonButton
                          size="small"
                          fill="outline"
                          onClick={handleUndoLastBlock}
                          disabled={!lastAutoBlockId}
                        >
                          Annuler le dernier
                        </IonButton>
                      </div>
                    </div>

                    {/* Liste des événements du jour */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {getEventsForDay(selectedDayInDaily).length > 0 ? (
                        getEventsForDay(selectedDayInDaily).map((event) => (
                          <div
                            key={event.id}
                            style={{
                              backgroundColor: "white",
                              borderRadius: "12px",
                              padding: "16px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                              display: "flex",
                              gap: "12px",
                              alignItems: "flex-start",
                              transition: "transform 0.2s, box-shadow 0.2s",
                              cursor: "pointer",
                              position: "relative",
                              overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(0,0,0,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 6px rgba(0,0,0,0.06)";
                            }}
                          >
                            {/* Barre colorée à gauche */}
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "4px",
                                backgroundColor: getEventColor(event.type),
                              }}
                            />

                            {/* Heure */}
                            <div
                              style={{
                                minWidth: "50px",
                                paddingLeft: "8px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#8898aa",
                                  fontWeight: 500,
                                }}
                              >
                                {event.startTime}
                              </div>
                            </div>

                            {/* Point coloré */}
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: getEventColor(event.type),
                                marginTop: "6px",
                                flexShrink: 0,
                              }}
                            />

                            {/* Contenu de l'événement */}
                            <div
                              style={{
                                flex: 1,
                                paddingRight: "10px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  color: "#32325d",
                                  marginBottom: "4px",
                                }}
                              >
                                {event.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#8898aa",
                                }}
                              >
                                {event.startTime} - {event.endTime || "N/A"}
                              </div>
                              {event.course && (
                                <div
                                  style={{
                                    marginTop: "6px",
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    backgroundColor: `${getEventColor(
                                      event.type
                                    )}20`,
                                    color: getEventColor(event.type),
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {event.course}
                                </div>
                              )}
                            </div>

                            {/* Fond coloré léger */}
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: "100%",
                                backgroundColor: `${getEventColor(
                                  event.type
                                )}08`,
                                zIndex: -1,
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "40px 20px",
                            textAlign: "center",
                            color: "#8898aa",
                          }}
                        >
                          <div
                            style={{ fontSize: "48px", marginBottom: "10px" }}
                          >
                            📅
                          </div>
                          <div style={{ fontSize: "14px" }}>
                            Aucun événement prévu aujourd'hui
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </IonContent>
        </IonModal>

        {/* Toast global pour les blocs auto (succès / erreurs) */}
        <IonToast
          isOpen={blockToast.open}
          message={blockToast.message}
          duration={2200}
          position="top"
          color="dark"
          onDidDismiss={() =>
            setBlockToast((prev) => ({ ...prev, open: false }))
          }
        />
      </IonContent>
    </IonPage>
  );
};

export default Calendrier;
