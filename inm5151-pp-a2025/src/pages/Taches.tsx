// src/pages/Taches.tsx
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
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonAccordion,
  IonAccordionGroup,
  IonProgressBar,
  IonText,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonBadge,
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { CourseProgress, LearningUnit } from "../types/courseProgress";
import { updateCourseProgress } from "../utils/courseProgressUtils";
import "./Taches.css";

interface RouteParams {
  courseId?: string;
}

const Taches: React.FC = () => {
  const { courseId } = useParams<RouteParams>();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
  const history = useHistory();

  useEffect(() => {
    loadCourses();
  }, [courseId]);

  const loadCourses = () => {
    const data = localStorage.getItem("courses");
    if (data) {
      const parsedCourses = JSON.parse(data);
      setCourses(parsedCourses);

      if (courseId) {
        const course = parsedCourses.find((c: CourseProgress) => c.id === courseId);
        if (course) {
          setSelectedCourse(course);
        }
      } else if (parsedCourses.length > 0) {
        setSelectedCourse(parsedCourses[0]);
      }
    }
  };

  const handleToggleUnit = (unitId: string, completed: boolean) => {
    if (!selectedCourse) return;

    const updatedCourse = updateCourseProgress(selectedCourse, unitId, completed);

    const updatedCourses = courses.map((c) =>
      c.id === updatedCourse.id ? updatedCourse : c
    );

    setCourses(updatedCourses);
    setSelectedCourse(updatedCourse);
    localStorage.setItem("courses", JSON.stringify(updatedCourses));
  };

  const handleDeleteCourse = (courseId: string) => {
    const filtered = courses.filter((c) => c.id !== courseId);
    setCourses(filtered);
    localStorage.setItem("courses", JSON.stringify(filtered));

    // Si le cours supprimé était sélectionné, sélectionner le premier cours restant
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(filtered.length > 0 ? filtered[0] : null);
      if (filtered.length > 0) {
        history.push(`/taches/${filtered[0].id}`);
      } else {
        history.push("/taches");
      }
    }
  };

  // Fonction pour obtenir l'icône selon le type d'unité
  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return '📚';
      case 'section':
        return '📖';
      case 'subsection':
        return '📄';
      default:
        return '📌';
    }
  };

  // Fonction pour obtenir la couleur selon le type
  const getUnitColor = (type: string, level: number) => {
    if (level === 0) return '#1976d2'; // Bleu pour chapitre
    if (level === 1) return '#388e3c'; // Vert pour section
    return '#f57c00'; // Orange pour sous-section
  };

  // Calculer les statistiques d'un parent
  const calculateUnitStats = (unit: LearningUnit): { completed: number; total: number } => {
    if (!unit.children || unit.children.length === 0) {
      return { completed: unit.completed ? 1 : 0, total: 1 };
    }

    let completed = 0;
    let total = 0;

    for (const child of unit.children) {
      const childStats = calculateUnitStats(child);
      completed += childStats.completed;
      total += childStats.total;
    }

    return { completed, total };
  };

  const renderUnit = (unit: LearningUnit, level: number = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const indent = level * 16;
    const icon = getUnitIcon(unit.type);
    const color = getUnitColor(unit.type, level);

    if (hasChildren) {
      const stats = calculateUnitStats(unit);
      const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return (
        <IonAccordion key={unit.id} value={unit.id}>
          <IonItem
            slot="header"
            style={{
              paddingLeft: `${indent}px`,
              '--background': level === 0 ? '#f5f5f5' : 'transparent',
              borderLeft: `3px solid ${color}`
            }}
          >
            <IonCheckbox
              slot="start"
              checked={unit.completed}
              onIonChange={(e) => handleToggleUnit(unit.id, e.detail.checked)}
              style={{ marginRight: "12px" }}
            />
            <IonLabel>
              <h3 style={{
                fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400,
                fontSize: level === 0 ? '16px' : level === 1 ? '15px' : '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{icon}</span>
                <span>{unit.title}</span>
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '4px'
              }}>
                <p style={{ fontSize: "12px", color: "gray", margin: 0 }}>
                  {stats.completed} / {stats.total} complété{stats.total > 1 ? 's' : ''}
                </p>
                <IonBadge
                  color={progressPercent === 100 ? 'success' : progressPercent > 0 ? 'warning' : 'medium'}
                  style={{ fontSize: '11px' }}
                >
                  {progressPercent}%
                </IonBadge>
              </div>
            </IonLabel>
          </IonItem>

          <div slot="content" style={{ backgroundColor: level === 0 ? '#fafafa' : 'white' }}>
            {unit.children?.map((child) => renderUnit(child, level + 1))}
          </div>
        </IonAccordion>
      );
    }

    return (
      <IonItem
        key={unit.id}
        style={{
          paddingLeft: `${indent}px`,
          borderLeft: `3px solid ${color}`
        }}
      >
        <IonCheckbox
          slot="start"
          checked={unit.completed}
          onIonChange={(e) => handleToggleUnit(unit.id, e.detail.checked)}
          style={{ marginRight: "12px" }}
        />
        <IonLabel>
          <p style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            margin: 0
          }}>
            <span>{icon}</span>
            <span>{unit.title}</span>
          </p>
        </IonLabel>
      </IonItem>
    );
  };

  const selectCourse = (course: CourseProgress) => {
    setSelectedCourse(course);
    history.push(`/taches/${course.id}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Tâches d'apprentissage</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {courses.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "80px" }}>
            <IonText color="medium">
              <p style={{ fontSize: "18px" }}>
                Aucun cours téléversé pour l'instant.
              </p>
            </IonText>

            <IonButton
              shape="round"
              color="primary"
              onClick={() => history.push("/upload-course")}
              style={{ marginTop: "20px" }}
            >
              Téléverser un cours
            </IonButton>
          </div>
        )}

        {courses.length > 0 && (
          <>
            {/* Sélecteur de cours si plusieurs cours */}
            {courses.length > 1 && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Sélectionner un cours</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {courses.map((course) => (
                      <IonItem
                        key={course.id}
                        button
                        onClick={() => selectCourse(course)}
                        color={selectedCourse?.id === course.id ? "light" : ""}
                      >
                        <IonLabel>
                          <h2>{course.title}</h2>
                          <p>
                            {Math.round(course.stats.progress * 100)}% complété
                          </p>
                        </IonLabel>
                        <IonBadge slot="end" color="primary">
                          {course.stats.completedUnits} / {course.stats.totalUnits}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            {/* Affichage du cours sélectionné */}
            {selectedCourse && (
              <>
                <IonCard style={{ marginTop: "20px" }}>
                  <IonCardHeader>
                    <IonCardTitle>{selectedCourse.title}</IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <IonText>
                          <strong>Progression globale</strong>
                        </IonText>
                        <IonText color="primary">
                          <strong>
                            {Math.round(selectedCourse.stats.progress * 100)}%
                          </strong>
                        </IonText>
                      </div>

                      <IonProgressBar
                        value={selectedCourse.stats.progress}
                        color="success"
                      />

                      <IonText color="medium">
                        <p style={{ fontSize: "14px", marginTop: "8px" }}>
                          {selectedCourse.stats.completedUnits} unités complétées
                          sur {selectedCourse.stats.totalUnits}
                        </p>
                      </IonText>
                    </div>

                    {/* Bouton de suppression du cours */}
                    <IonButton
                      color="danger"
                      fill="outline"
                      size="small"
                      onClick={() => {
                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le cours "${selectedCourse.title}" ?`)) {
                          handleDeleteCourse(selectedCourse.id);
                        }
                      }}
                      style={{ marginTop: "12px" }}
                    >
                      Supprimer ce cours
                    </IonButton>
                  </IonCardContent>
                </IonCard>

                <IonCard style={{ marginTop: "20px" }}>
                  <IonCardHeader>
                    <IonCardTitle>Structure du cours</IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <IonAccordionGroup>
                      {selectedCourse.roots.map((unit) => renderUnit(unit, 0))}
                    </IonAccordionGroup>
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Taches;