//Examen
import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonButton,
} from "@ionic/react";
import { Rappel } from "../pages/Notifications";

interface ModalExamenProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rappel: Rappel) => void;
}

const ModalExamen: React.FC<ModalExamenProps> = ({ isOpen, onClose, onSave }) => {
  const [cours, setCours] = useState("");
  const [typeExamen, setTypeExamen] = useState("Intra");
  const [dateExam, setDateExam] = useState("");
  const [heureDebutExam, setHeureDebutExam] = useState("");
  const [heureFinExam, setHeureFinExam] = useState("");
  const [salleExam, setSalleExam] = useState("");
  const [priorite, setPriorite] = useState<"critique" | "haute" | "normale">("normale");
  const [modesNotif, setModesNotif] = useState<string[]>(["push"]);
  const [description, setDescription] = useState("");

  const handleSave = () => {
    onSave({
      id: Date.now(),
      type: "examen",
      cours,
      typeExamen,
      dateExam,
      heureDebutExam,
      heureFinExam,
      salleExam,
      priorite,
      modesNotif,
      description,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle>🧾 Planifier un examen</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Nom du cours</IonLabel>
          <IonInput value={cours} onIonChange={e => setCours(e.detail.value || "")} />
        </IonItem>

        <IonItem>
          <IonLabel>Type d'examen</IonLabel>
          <IonSelect value={typeExamen} onIonChange={e => setTypeExamen(e.detail.value!)}>
            <IonSelectOption value="Intra">Intra</IonSelectOption>
            <IonSelectOption value="Final">Final</IonSelectOption>
            <IonSelectOption value="Quiz">Quiz</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Date</IonLabel>
          <IonDatetime
            presentation="date"
            value={dateExam}
            onIonChange={e => setDateExam(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Heure début</IonLabel>
          <IonDatetime
            presentation="time"
            value={heureDebutExam}
            onIonChange={e => setHeureDebutExam(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Heure fin</IonLabel>
          <IonDatetime
            presentation="time"
            value={heureFinExam}
            onIonChange={e => setHeureFinExam(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Salle</IonLabel>
          <IonInput value={salleExam} onIonChange={e => setSalleExam(e.detail.value || "")} />
        </IonItem>

        <IonItem>
          <IonLabel>Priorité</IonLabel>
          <IonSelect value={priorite} onIonChange={e => setPriorite(e.detail.value!)}>
            <IonSelectOption value="normale">Normale</IonSelectOption>
            <IonSelectOption value="haute">Haute</IonSelectOption>
            <IonSelectOption value="critique">Critique</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Notification</IonLabel>
          <IonSelect multiple value={modesNotif} onIonChange={e => setModesNotif(e.detail.value as string[])}>
            <IonSelectOption value="push">Push</IonSelectOption>
            <IonSelectOption value="email">Courriel</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Note facultative</IonLabel>
          <IonInput value={description} onIonChange={e => setDescription(e.detail.value || "")} />
        </IonItem>

        <IonButton expand="block" color="success" onClick={handleSave}>💾 Enregistrer</IonButton>
        <IonButton expand="block" fill="outline" onClick={onClose}>Annuler</IonButton>
      </IonContent>
    </IonModal>
  );
};

export default ModalExamen;
