// src/pages/CoursesList.tsx

import React, { useEffect, useState } from "react";
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
  IonProgressBar,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonText,
} from "@ionic/react";

import { addCircle } from "ionicons/icons";
import { useHistory } from "react-router";
import { CourseProgress } from "../types/courseProgress";

const CoursesList: React.FC = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const history = useHistory();

  useEffect(() => {
    const data = localStorage.getItem("courses");
    if (data) setCourses(JSON.parse(data));
  }, []);

  const goToUpload = () => {
    history.push("/upload-course");
  };

  const openCourse = (courseId: string) => {
    history.push(`/taches/${courseId}`);
  };

  const deleteCourse = (id: string) => {
    const filtered = courses.filter((c) => c.id !== id);
    setCourses(filtered);
    localStorage.setItem("courses", JSON.stringify(filtered));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mes cours</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        {/* PAGE VIDE */}
        {courses.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "80px" }}>
            <IonText color="medium">
              <p style={{ fontSize: "18px" }}>
                Aucun cours téléversé pour l’instant.
              </p>
            </IonText>

            <IonButton
              shape="round"
              color="primary"
              onClick={goToUpload}
              style={{ marginTop: "20px" }}
            >
              Téléverser un cours
            </IonButton>
          </div>
        )}

        {/* AFFICHAGE DES COURS */}
        {courses.map((course) => (
          <IonCard 
            key={course.id} 
            button 
            onClick={() => openCourse(course.id)}
            style={{
              borderRadius: "16px",
              marginBottom: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: "20px", fontWeight: 600 }}>
                {course.title}
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <strong>Progression :</strong>
              <p>{Math.round(course.stats.progress * 100)}%</p>

              <IonProgressBar color="primary" value={course.stats.progress}></IonProgressBar>

              <p style={{ marginTop: "8px", fontSize: "14px" }}>
                {course.stats.completedUnits} unités complétées sur {course.stats.totalUnits}
              </p>

              <IonButton
                color="danger"
                fill="outline"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCourse(course.id);
                }}
                style={{ marginTop: "10px" }}
              >
                Supprimer
              </IonButton>
            </IonCardContent>
          </IonCard>
        ))}

        {/* FAB pour ajouter un cours */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={goToUpload}>
            <IonIcon icon={addCircle} />
          </IonFabButton>
        </IonFab>

      </IonContent>
    </IonPage>
  );
};

export default CoursesList;
