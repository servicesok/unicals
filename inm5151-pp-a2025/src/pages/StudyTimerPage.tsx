import React, { useEffect, useRef, useState } from "react";
import {
  decrementCourseSessions,
  getCourseById,
} from "../api/courses.supabase";
import "./StudyTimer.css";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonText,
  IonMenuButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonAlert,
} from "@ionic/react";
import { checkmarkDoneOutline } from "ionicons/icons";
import { useParams } from "react-router-dom";

const DURATIONS = [25, 45, 60, 90];
type IntervalRef = ReturnType<typeof setInterval> | null;

type RouteParams = {
  courseId?: string;
};

const StudyTimerPage: React.FC = () => {
  const { courseId } = useParams<RouteParams>();

  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndAlert, setShowEndAlert] = useState(false);
  const isCourseMode = !!courseId;
  const [courseCode, setCourseCode] = useState<string | null>(null);

  const [studyMinutesThisWeek, setStudyMinutesThisWeek] = useState(0);
  const [goalHours, setGoalHours] = useState<number>(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCurrentWeekKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const week = Math.ceil((days + start.getDay() + 1) / 7);
    return `study_week_${year}_W${week}`;
  };

  useEffect(() => {
    const savedGoal = localStorage.getItem("study_goal_hours");
    if (savedGoal) setGoalHours(parseInt(savedGoal));
  }, []);

  useEffect(() => {
    const update = () => {
      const saved = localStorage.getItem(getCurrentWeekKey()) || "0";
      setStudyMinutesThisWeek(parseInt(saved));
    };
    update();
    const id = setInterval(update, 3000);
    return () => clearInterval(id);
  }, []);

  const handleGoalChange = (value: number | undefined) => {
    if (value && value > 0 && value <= 50) {
      setGoalHours(value);
      localStorage.setItem("study_goal_hours", value.toString());
    }
  };

  const saveStudyTime = (minutes: number) => {
    if (minutes <= 0) return;
    const key = getCurrentWeekKey();
    const previous = parseInt(localStorage.getItem(key) || "0");
    const newTotal = previous + minutes;
    localStorage.setItem(key, String(newTotal));
    setStudyMinutesThisWeek(newTotal);
  };

  const finishSessionEarly = () => {
    if (!isRunning && !isPaused) return;
    const totalPlanned = (selectedMinutes || 0) * 60;
    const secondsDone = totalPlanned - remainingSeconds;
    const minutesDone = Math.floor(secondsDone / 60);
    saveStudyTime(minutesDone);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!courseId) return; // en mode libre, on ne fait rien
        const course = await getCourseById(courseId);
        setCourseCode(course.code);
      } catch (err) {
        console.error("Erreur chargement du cours pour le chronomètre :", err);
      }
    };

    loadCourse();
  }, [courseId]);

  const startCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Fin de session : arrêt automatique + popup
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          setIsPaused(false);
          setShowEndAlert(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startTimer = () => {
    if (!selectedMinutes || isRunning) return;

    const totalSeconds = selectedMinutes * 60;
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);
    setIsPaused(false);
    setShowEndAlert(false);

    startCountdown();
  };

  const pauseTimer = () => {
    if (!isRunning || isPaused) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeTimer = () => {
    if (!isRunning || !isPaused || remainingSeconds <= 0) return;

    setIsPaused(false);
    startCountdown();
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const displayedSeconds =
    remainingSeconds > 0
      ? remainingSeconds
      : isRunning || isPaused
      ? 0
      : (selectedMinutes ?? 0) * 60;

  // Fonction pour décrémenter le nombre de séances dans la base de données
  const handleStopSession = async () => {
    resetTimer();

    try {
      if (courseId) {
        await decrementCourseSessions(courseId);
      } else {
        console.warn(
          "Aucun courseId fourni à StudyTimerPage : nombre_seances ne sera pas décrémenté."
        );
      }
    } catch (err) {
      console.error(
        "Erreur lors de la décrémentation de nombre_seances :",
        err
      );
    }
  };

  // Prolonger la session (+5 / +10 / +15 min)
  const handleExtendSession = (extraMinutes: number) => {
    setShowEndAlert(false);
    setIsRunning(true);
    setIsPaused(false);

    const extraSeconds = extraMinutes * 60;
    setRemainingSeconds(extraSeconds);

    startCountdown();
  };

  const goalMinutes = goalHours * 60;
  const percent = Math.min(
    100,
    Math.round((studyMinutesThisWeek / goalMinutes) * 100)
  );
  const hoursDone = Math.floor(studyMinutesThisWeek / 60);
  const minsDone = studyMinutesThisWeek % 60;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {isCourseMode ? "Chronomètre d’étude" : "Chronomètre libre"}
            {isCourseMode && courseCode ? ` – ${courseCode}` : ""}{" "}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard className="study-timer-card">
          <IonCardHeader>
            <IonCardTitle>Focus mode</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <div className="duration-selector">
              <IonText>
                <p>Choisis la durée de ton bloc :</p>
              </IonText>
              <div className="duration-buttons">
                {DURATIONS.map((min) => (
                  <IonButton
                    key={min}
                    fill={selectedMinutes === min ? "solid" : "outline"}
                    color={selectedMinutes === min ? "primary" : "medium"}
                    onClick={() => !isRunning && setSelectedMinutes(min)}
                  >
                    {min} min
                  </IonButton>
                ))}
              </div>
            </div>

            <div className="timer-display">
              <IonText color="light">
                <h1>{formatTime(displayedSeconds)}</h1>
              </IonText>
            </div>

            {/* Boutons de contrôle */}
            <IonButtons className="timer-controls">
              <IonButton
                onClick={startTimer}
                disabled={isRunning || !selectedMinutes}
              >
                Start
              </IonButton>
              {!isPaused ? (
                <IonButton
                  color="medium"
                  onClick={pauseTimer}
                  disabled={!isRunning}
                >
                  Pause
                </IonButton>
              ) : (
                <IonButton color="medium" onClick={resumeTimer}>
                  Reprendre
                </IonButton>
              )}
              <IonButton color="danger" fill="outline" onClick={resetTimer}>
                Reset
              </IonButton>
              {(isRunning || isPaused) && (
                <IonButton
                  color="success"
                  fill="solid"
                  onClick={finishSessionEarly}
                >
                  <IonIcon icon={checkmarkDoneOutline} slot="start" />
                  Terminer
                </IonButton>
              )}
            </IonButtons>

            <IonItem lines="none" style={{ marginTop: 20 }}>
              <IonLabel>Objectif hebdomadaire (heures)</IonLabel>
              <IonInput
                type="number"
                value={goalHours}
                min="1"
                max="50"
                style={{ width: 80, textAlign: "center" }}
                onIonChange={(e) => handleGoalChange(parseInt(e.detail.value!))}
              />
            </IonItem>

            <div
              style={{
                marginTop: 20,
                padding: "18px",
                background: "#f0fdf4",
                borderRadius: 16,
                border: "2px solid #86efac",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <IonText>
                  <strong>Temps réel étudié cette semaine</strong>
                </IonText>
                <IonText color="success">
                  <strong>
                    {hoursDone}h{minsDone > 0 && `${minsDone}m`}
                  </strong>
                </IonText>
              </div>
              <div
                style={{
                  height: 16,
                  background: "#bbf7d0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: percent >= 100 ? "#16a34a" : "#22c55e",
                    borderRadius: 8,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  fontSize: 14,
                  color: "#166534",
                }}
              >
                {percent}% • Objectif {goalHours}h/semaine
              </div>
            </div>
          </IonCardContent>
        </IonCard>
        {/* Alerte de fin de session */}
        <IonAlert
          isOpen={showEndAlert}
          header="Fin de session d'étude"
          message="Ta session est terminée. Que veux-tu faire ?"
          backdropDismiss={false}
          onDidDismiss={() => setShowEndAlert(false)}
          buttons={[
            {
              text: "Arrêter",
              role: "cancel",
              handler: handleStopSession,
            },
            {
              text: "+5 min",
              handler: () => handleExtendSession(5),
            },
            {
              text: "+10 min",
              handler: () => handleExtendSession(10),
            },
            {
              text: "+15 min",
              handler: () => handleExtendSession(15),
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default StudyTimerPage;
