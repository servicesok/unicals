import React, { useState, useRef } from "react";
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
  IonText,
  IonLoading,
  IonIcon,
  IonProgressBar,
  IonChip,
  IonLabel,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";

import {
  cloudUploadOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";

import { useHistory } from "react-router";
import { parseDocument } from "../services/documentParser";
import { CourseProgress } from "../types/courseProgress";
import "./UploadCourse.css";

const UploadCourse: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      alert("Type de fichier non supporté. Utilisez PDF, Word ou PowerPoint.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
    } else if (selectedFile) {
      alert("Type de fichier non supporté. Utilisez PDF, Word ou PowerPoint.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ];
    return validTypes.includes(file.type);
  };

  const simulateProgress = async () => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setProgress(i);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      await simulateProgress();

      const course: CourseProgress = await parseDocument(file);

      const stored = localStorage.getItem("courses");
      let list: CourseProgress[] = stored ? JSON.parse(stored) : [];
      list.push(course);

      localStorage.setItem("courses", JSON.stringify(list));
      setLoading(false);

      history.push(`/taches/${course.id}`);
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setLoading(false);
      alert("Une erreur est survenue lors de l'analyse du document.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Importer un cours</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding upload-container">

        <IonCard className="upload-header-card">
          <IonCardHeader>
            <IonCardTitle>Analyser un syllabus</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText style={{ color: "rgba(255,255,255,0.9)" }}>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                Importez votre syllabus de cours en PDF, Word ou PowerPoint.
                L'application va extraire automatiquement la structure
                (chapitres, sections) pour créer votre plan de révision personnalisé.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {!file ? (
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <IonIcon
              icon={cloudUploadOutline}
              className="upload-icon"
            />
            <h3 className="upload-title">Glissez-déposez votre fichier ici</h3>
            <p className="upload-subtitle">ou</p>
            
            <IonButton color="primary" className="choose-file-btn" onClick={(e) => e.stopPropagation()}>
              <IonIcon icon={documentTextOutline} slot="start" />
              Choisir un fichier
            </IonButton>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            
            <IonText color="medium">
              <p className="upload-info">
                Formats acceptés : PDF, Word (.docx), PowerPoint (.pptx)
              </p>
            </IonText>
          </div>
        ) : (
          <IonCard className="file-preview-card">
            <IonCardHeader>
              <div className="file-preview-header">
                <div className="file-preview-info">
                  <IonIcon 
                    icon={documentTextOutline}
                    className="file-preview-icon"
                  />
                  <div className="file-preview-text">
                    <IonCardTitle className="file-name">
                      {file.name}
                    </IonCardTitle>
                    <IonText color="medium">
                      <p className="file-size">
                        {(file.size / 1024).toFixed(2)} Ko
                      </p>
                    </IonText>
                  </div>
                </div>
                
                <IonButton
                  fill="clear"
                  color="danger"
                  onClick={removeFile}
                  disabled={loading}
                >
                  <IonIcon icon={closeCircleOutline} slot="icon-only" />
                </IonButton>
              </div>
            </IonCardHeader>

            <IonCardContent>
              <IonChip color="success" className="ready-chip">
                <IonIcon icon={checkmarkCircleOutline} />
                <IonLabel>Fichier prêt à être analysé</IonLabel>
              </IonChip>

              {loading && (
                <div className="upload-progress">
                  <IonText>
                    <p className="upload-progress-text">
                      Analyse en cours... {progress}%
                    </p>
                  </IonText>
                  <IonProgressBar 
                    value={progress / 100}
                    className="upload-progress-bar"
                  />
                </div>
              )}

              <IonButton
                expand="block"
                shape="round"
                onClick={handleUpload}
                disabled={loading}
                className="upload-btn"
              >
                <IonIcon icon={cloudUploadOutline} slot="start" />
                Analyser et importer
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

      </IonContent>
    </IonPage>
  );
};

export default UploadCourse;
