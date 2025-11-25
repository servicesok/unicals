import React, { useState } from "react";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea,
  IonFooter, IonList, IonToggle
} from "@ionic/react";
import { Rappel } from "../pages/Notifications";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (r: Rappel) => void;
}

const ModalLabo: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [titre, setTitre] = useState("");
  const [jour, setJour] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [salle, setSalle] = useState("");
  const [recurrence, setRecurrence] = useState(false);
  const [priorite, setPriorite] = useState<"critique" | "haute" | "normale">("normale");
  const [modesNotif, setModesNotif] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const validerEtEnregistrer = () => {
    if (!titre || !jour || !heureDebut || !heureFin) {
      alert("⚠️ Tous les champs obligatoires doivent être remplis !");
      return;
    }

    onSave({
      id: Date.now(),
      type: "labo",
      titre,
      jour,
      heureDebut,
      heureFin,
      salle,
      recurrence,
      priorite,
      description,
      modesNotif,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>🔬 Nouveau laboratoire</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="floating">Titre du labo*</IonLabel>
            <IonInput
              placeholder="Ex: Labo 4 – Système embarqué"
              value={titre}
              onIonChange={(e) => setTitre(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Jour du labo*</IonLabel>
            <IonSelect
              value={jour}
              placeholder="Choisir un jour"
              onIonChange={(e) => setJour(e.detail.value!)}
            >
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map((j) => (
                <IonSelectOption key={j} value={j}>{j}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Heure début*</IonLabel>
            <IonInput
              type="time"
              value={heureDebut}
              onIonChange={(e) => setHeureDebut(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Heure fin*</IonLabel>
            <IonInput
              type="time"
              value={heureFin}
              onIonChange={(e) => setHeureFin(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Salle</IonLabel>
            <IonInput
              placeholder="Ex: PK-205"
              value={salle}
              onIonChange={(e) => setSalle(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Se répète chaque semaine</IonLabel>
            <IonToggle
              checked={recurrence}
              onIonChange={(e) => setRecurrence(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Priorité</IonLabel>
            <IonSelect
              value={priorite}
              onIonChange={(e) => setPriorite(e.detail.value!)}
            >
              <IonSelectOption value="critique">Critique 🔴</IonSelectOption>
              <IonSelectOption value="haute">Haute 🟠</IonSelectOption>
              <IonSelectOption value="normale">Normale 🟢</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Modes de notification</IonLabel>
            <IonSelect
              multiple
              value={modesNotif}
              onIonChange={(e) => setModesNotif(e.detail.value!)}
            >
              <IonSelectOption value="push">📱 Push</IonSelectOption>
              <IonSelectOption value="email">📧 Email</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem lines="none">
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              placeholder="Ex: Préparer les exercices avant la séance"
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
            />
          </IonItem>
        </IonList>
      </IonContent>

      <IonFooter className="ion-padding">
        <IonButton color="medium" fill="outline" onClick={onClose}>
          Annuler
        </IonButton>
        <IonButton color="success" expand="block" onClick={validerEtEnregistrer}>
          Enregistrer
        </IonButton>
      </IonFooter>
    </IonModal>
  );
};

export default ModalLabo;
