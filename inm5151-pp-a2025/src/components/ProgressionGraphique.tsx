import React from "react";
import { IonCard, IonCardHeader, IonCardTitle } from "@ionic/react";
import { Doughnut, Bar } from "react-chartjs-2";
import "chart.js/auto";

interface DonutProps {
  completed: number;
  total: number;
}

export const DonutProgress: React.FC<DonutProps> = ({ completed, total }) => {
  const value = total === 0 ? 0 : Math.round((completed / total) * 100);

  const data = {
    labels: ["Complété", "Restant"],
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: ["#34a853", "#e0e0e0"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Progression des tâches</IonCardTitle>
      </IonCardHeader>
      <div style={{ width: "210px", margin: "0 auto" }}>
        <Doughnut data={data} />
      </div>
      <p style={{ textAlign: "center", marginTop: "10px" }}>
        {value}% complété
      </p>
    </IonCard>
  );
};

interface WeeklyProps {
  data: number[];
}

const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const WeeklyStudyChart: React.FC<WeeklyProps> = ({ data }) => {
  const chartData = {
    labels: jours,
    datasets: [
      {
        label: "Heures étudiées",
        data,
        backgroundColor: "#4285f4",
        borderRadius: 8,
      },
    ],
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Progression académique (semaine)</IonCardTitle>
      </IonCardHeader>
      <Bar data={chartData} />
    </IonCard>
  );
};
