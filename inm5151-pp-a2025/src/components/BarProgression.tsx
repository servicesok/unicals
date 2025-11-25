import React, { useEffect, useState } from "react";
import { IonText } from "@ionic/react";

const StudyProgressBar: React.FC = () => {
  const [studyMinutes, setStudyMinutes] = useState(0);
  const goalHours = 10;
  const goalMinutes = goalHours * 60;

  const getWeekKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const week = Math.ceil((days + start.getDay() + 1) / 7);
    return `study_week_${year}_W${week}`;
  };

  useEffect(() => {
    const update = () => {
      const saved = localStorage.getItem(getWeekKey()) || "0";
      setStudyMinutes(parseInt(saved));
    };
    update();
    const id = setInterval(update, 3000);
    return () => clearInterval(id);
  }, []);

  const percent = Math.min(100, Math.round((studyMinutes / goalMinutes) * 100));
  const hours = Math.floor(studyMinutes / 60);
  const mins = studyMinutes % 60;

  return (
    <div
      style={{
        padding: "18px 20px",
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        borderRadius: 16,
        margin: "15px 20px",
        border: "2px solid #86efac",
        boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
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
          <strong style={{ fontSize: 15 }}>
            Temps réel étudié cette semaine
          </strong>
        </IonText>
        <IonText color="success">
          <strong style={{ fontSize: 19 }}>
            {hours}h{mins > 0 && `${mins}`}
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
  );
};

export default StudyProgressBar;
