import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFooter,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { notificationsOutline, trashOutline } from "ionicons/icons";

import ModalCours from "../components/ModalCours";
import ModalExamen from "../components/ModalExamen";
import ModalTP from "../components/ModalTP";
import ModalLabo from "../components/ModalLabo";
import ModalPaiement from "../components/ModalPaiement";

import "./Notifications.css";

export type Priorite = "critique" | "haute" | "normale";
export type EvenementType = "cours" | "examen" | "tp" | "labo" | "paiement";

export interface Revision {
  id: number;
  jour: string;
  heureDebut: string;
  heureFin: string;
}

export interface Rappel {
  id: number;
  type: EvenementType;
  titre?: string;
  priorite?: Priorite;
  description?: string;
  modesNotif?: string[];
  cours?: string;
  coursJour?: string;
  coursHeureDebut?: string;
  coursHeureFin?: string;
  coursFinSession?: string;
  revisions?: Revision[];
  typeExamen?: string;
  dateExam?: string;
  heureDebutExam?: string;
  heureFinExam?: string;
  salleExam?: string;
  titreTP?: string;
  dateTP?: string;
  heureDebutTP?: string;
  heureFinTP?: string;
  descriptionTP?: string;
  jour?: string;
  recurrence?: boolean;
  heureDebut?: string;
  heureFin?: string;
  salle?: string;
  datePaiement?: string;
  montant?: string;
}

const Notifications: React.FC = () => {
  const [typeEvenement, setTypeEvenement] = useState<string | null>(null);
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [rappelSelectionne, setRappelSelectionne] = useState<Rappel | null>(
    null
  );

  const [showCoursModal, setShowCoursModal] = useState(false);
  const [showExamenModal, setShowExamenModal] = useState(false);
  const [showTPModal, setShowTPModal] = useState(false);
  const [showLaboModal, setShowLaboModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showListeRappels, setShowListeRappels] = useState(false);

  // --- Supprimer un rappel
  const supprimerRappel = (id: number) =>
    setRappels(rappels.filter((r) => r.id !== id));

  // --- Rappels triés par priorité
  const rappelsTries = [...rappels].sort((a, b) => {
    const ordre = { critique: 1, haute: 2, normale: 3 } as const;
    return ordre[a.priorite || "normale"] - ordre[b.priorite || "normale"];
  });

  const planifierRappel = () => {
    switch (typeEvenement) {
      case "cours":
        setShowCoursModal(true);
        break;
      case "examen":
        setShowExamenModal(true);
        break;
      case "tp":
        setShowTPModal(true);
        break;
      case "labo":
        setShowLaboModal(true);
        break;
      case "paiement":
        setShowPaiementModal(true);
        break;
      default:
        alert("Veuillez choisir un type d’événement.");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
          <IonTitle>🔔 Module Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Sélectionner un type d’événement :</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonButton
                    expand="block"
                    fill={typeEvenement === "cours" ? "solid" : "outline"}
                    color="primary"
                    onClick={() => setTypeEvenement("cours")}
                  >
                    📘 Cours
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton
                    expand="block"
                    fill={typeEvenement === "examen" ? "solid" : "outline"}
                    color="danger"
                    onClick={() => setTypeEvenement("examen")}
                  >
                    🧾 Examen
                  </IonButton>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonButton
                    expand="block"
                    fill={typeEvenement === "tp" ? "solid" : "outline"}
                    color="tertiary"
                    onClick={() => setTypeEvenement("tp")}
                  >
                    🧠 TP
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton
                    expand="block"
                    fill={typeEvenement === "labo" ? "solid" : "outline"}
                    color="success"
                    onClick={() => setTypeEvenement("labo")}
                  >
                    🔬 Labo
                  </IonButton>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonButton
                    expand="block"
                    fill={typeEvenement === "paiement" ? "solid" : "outline"}
                    color="warning"
                    onClick={() => setTypeEvenement("paiement")}
                  >
                    💰 Paiement
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <IonButton color="success" onClick={planifierRappel}>
                ⏰ Planifier un rappel
              </IonButton>

              <IonButton
                color="medium"
                onClick={() => setShowListeRappels((v) => !v)}
              >
                {showListeRappels
                  ? "Masquer mes rappels"
                  : "Afficher mes rappels"}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="intro-text">
          <IonIcon icon={notificationsOutline} />
          <p>Gérez vos rappels et notifications ici.</p>
        </div>

        {/* --- LISTE EN BAS --- */}
        {showListeRappels && (
          <div style={{ marginTop: "40px" }}>
            <h2>📌 Rappels en bas de page :</h2>

            {rappelsTries.length === 0 ? (
              <p>Aucun rappel pour l’instant.</p>
            ) : (
              <IonList>
                {rappelsTries.map((rappel) => (
                  <IonItem
                    key={rappel.id}
                    button
                    onClick={() => setRappelSelectionne(rappel)}
                  >
                    <IonLabel>
                      <h3>
                        {rappel.cours || rappel.titre} —{" "}
                        <b>{rappel.type.toUpperCase()}</b>
                      </h3>
                      <p>Priorité : {rappel.priorite}</p>
                    </IonLabel>

                    <IonBadge
                      color={
                        rappel.priorite === "critique"
                          ? "danger"
                          : rappel.priorite === "haute"
                          ? "warning"
                          : "success"
                      }
                    >
                      {rappel.priorite}
                    </IonBadge>

                    <IonButton
                      slot="end"
                      color="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerRappel(rappel.id);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        )}
      </IonContent>

      {/* --- MODALS D’AJOUT --- */}
      <ModalCours
        isOpen={showCoursModal}
        onClose={() => setShowCoursModal(false)}
        onSave={(r: Rappel) => setRappels([...rappels, r])}
      />
      <ModalExamen
        isOpen={showExamenModal}
        onClose={() => setShowExamenModal(false)}
        onSave={(r: Rappel) => setRappels([...rappels, r])}
      />
      <ModalTP
        isOpen={showTPModal}
        onClose={() => setShowTPModal(false)}
        onSave={(r: Rappel) => setRappels([...rappels, r])}
      />
      <ModalLabo
        isOpen={showLaboModal}
        onClose={() => setShowLaboModal(false)}
        onSave={(r: Rappel) => setRappels([...rappels, r])}
      />
      <ModalPaiement
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        onSave={(r: Rappel) => setRappels([...rappels, r])}
      />

      {/* --- MODAL DES DÉTAILS --- */}
      <IonModal
        isOpen={!!rappelSelectionne}
        onDidDismiss={() => setRappelSelectionne(null)}
      >
        <IonHeader>
          <IonToolbar color="tertiary">
            <IonTitle>Détails du rappel</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {rappelSelectionne && (
            <>
              <h2>
                {rappelSelectionne.type.toUpperCase()} –{" "}
                {rappelSelectionne.cours || rappelSelectionne.titre}
              </h2>

              {rappelSelectionne.description && (
                <p>{rappelSelectionne.description}</p>
              )}

              {rappelSelectionne.type === "examen" && (
                <>
                  <h3>📅 Examen ({rappelSelectionne.typeExamen})</h3>
                  <p>Date : {rappelSelectionne.dateExam}</p>
                  <p>
                    Heure : {rappelSelectionne.heureDebutExam?.slice(0, 5)} –{" "}
                    {rappelSelectionne.heureFinExam?.slice(0, 5)}
                  </p>
                  <p>Salle : {rappelSelectionne.salleExam}</p>
                </>
              )}

              {rappelSelectionne.revisions && (
                <>
                  <h3>📚 Révisions</h3>
                  <ul>
                    {rappelSelectionne.revisions.map((rev) => (
                      <li key={rev.id}>
                        {rev.jour}: {rev.heureDebut.slice(0, 5)}–
                        {rev.heureFin.slice(0, 5)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </IonContent>

        <IonFooter className="ion-padding">
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => setRappelSelectionne(null)}
          >
            Fermer
          </IonButton>
        </IonFooter>
      </IonModal>
    </IonPage>
  );
};

export default Notifications;
