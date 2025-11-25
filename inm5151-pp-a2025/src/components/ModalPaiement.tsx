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

interface ModalPaiementProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rappel: Rappel) => void;
}

const ModalPaiement: React.FC<ModalPaiementProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [montant, setMontant] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [priorite, setPriorite] = useState<"critique" | "haute" | "normale">("normale");
  const [modesNotif, setModesNotif] = useState<string[]>(["push"]);
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!datePaiement || !montant) {
      alert("Veuillez remplir la date et le montant.");
      return;
    }

    onSave({
      id: Date.now(),
      type: "paiement",
      montant,
      datePaiement,
      priorite,
      modesNotif,
      description,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>💰 Planifier un paiement</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Montant à payer (ex: 1200 $)</IonLabel>
          <IonInput
            type="number"
            value={montant}
            onIonChange={(e) => setMontant(e.detail.value || "")}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel>Date limite de paiement</IonLabel>
          <IonDatetime
            presentation="date"
            value={datePaiement}
            onIonChange={(e) =>
              setDatePaiement(
                Array.isArray(e.detail.value)
                  ? e.detail.value[0]
                  : e.detail.value || ""
              )
            }
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
          <IonLabel>Type de notification</IonLabel>
          <IonSelect
            multiple
            value={modesNotif}
            onIonChange={(e) => setModesNotif(e.detail.value as string[])}
          >
            <IonSelectOption value="push">Push</IonSelectOption>
            <IonSelectOption value="email">Courriel</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Note facultative</IonLabel>
          <IonInput
            placeholder="Ex: paiement session hiver 2026"
            value={description}
            onIonChange={(e) => setDescription(e.detail.value || "")}
          />
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

export default ModalPaiement;
