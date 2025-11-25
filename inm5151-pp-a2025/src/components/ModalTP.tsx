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
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonButton,
} from "@ionic/react";
import { Rappel } from "../pages/Notifications";

interface ModalTPProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rappel: Rappel) => void;
}

const ModalTP: React.FC<ModalTPProps> = ({ isOpen, onClose, onSave }) => {
  const [titreTP, setTitreTP] = useState("");
  const [dateTP, setDateTP] = useState("");
  const [heureDebutTP, setHeureDebutTP] = useState("");
  const [heureFinTP, setHeureFinTP] = useState("");
  const [descriptionTP, setDescriptionTP] = useState("");
  const [priorite, setPriorite] = useState<"critique" | "haute" | "normale">("normale");
  const [modesNotif, setModesNotif] = useState<string[]>(["push"]);

  const handleSave = () => {
    if (!titreTP || !dateTP) {
      alert("Veuillez renseigner le titre et la date du TP.");
      return;
    }

    onSave({
      id: Date.now(),
      type: "tp",
      titreTP,
      dateTP,
      heureDebutTP,
      heureFinTP,
      descriptionTP,
      priorite,
      modesNotif,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle>🧠 Planifier un TP</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Titre du TP (ex: TP2 Structures)</IonLabel>
          <IonInput
            value={titreTP}
            onIonChange={(e) => setTitreTP(e.detail.value || "")}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel>Date du TP</IonLabel>
          <IonDatetime
            presentation="date"
            value={dateTP}
            onIonChange={(e) =>
              setDateTP(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel>Heure début</IonLabel>
          <IonDatetime
            presentation="time"
            value={heureDebutTP}
            onIonChange={(e) =>
              setHeureDebutTP(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel>Heure fin</IonLabel>
          <IonDatetime
            presentation="time"
            value={heureFinTP}
            onIonChange={(e) =>
              setHeureFinTP(Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || "")
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Description ou instructions</IonLabel>
          <IonInput
            placeholder="Ex: Implémenter les classes et tester les cas limites"
            value={descriptionTP}
            onIonChange={(e) => setDescriptionTP(e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Priorité</IonLabel>
          <IonSelect value={priorite} onIonChange={(e) => setPriorite(e.detail.value!)}>
            <IonSelectOption value="normale">Normale</IonSelectOption>
            <IonSelectOption value="haute">Haute</IonSelectOption>
            <IonSelectOption value="critique">Critique</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Notification</IonLabel>
          <IonSelect
            multiple
            value={modesNotif}
            onIonChange={(e) => setModesNotif(e.detail.value as string[])}
          >
            <IonSelectOption value="push">Push</IonSelectOption>
            <IonSelectOption value="email">Courriel</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonButton expand="block" color="success" onClick={handleSave}>
          💾 Enregistrer
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={onClose}>
          Annuler
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default ModalTP;
