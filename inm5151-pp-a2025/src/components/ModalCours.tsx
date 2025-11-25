import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonFooter,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { Rappel } from "../pages/Notifications";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (r: Rappel) => void;
}

const ModalCours: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [cours, setCours] = useState("");
  const [coursJour, setCoursJour] = useState("");
  const [coursHeureDebut, setCoursHeureDebut] = useState("");
  const [coursHeureFin, setCoursHeureFin] = useState("");
  const [priorite, setPriorite] = useState<"critique" | "haute" | "normale">("normale");
  const [modesNotif, setModesNotif] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [revisions, setRevisions] = useState<
    { id: number; jour: string; heureDebut: string; heureFin: string }[]
  >([]);

  const ajouterRevision = () => {
    setRevisions([
      ...revisions,
      { id: Date.now(), jour: "", heureDebut: "", heureFin: "" },
    ]);
  };

  const modifierRevision = (id: number, champ: string, valeur: string) => {
    setRevisions((rev) =>
      rev.map((r) => (r.id === id ? { ...r, [champ]: valeur } : r))
    );
  };

  const supprimerRevision = (id: number) => {
    setRevisions(revisions.filter((r) => r.id !== id));
  };

  const validerEtEnregistrer = () => {
    if (!cours || !coursJour || !coursHeureDebut || !coursHeureFin) {
      alert("⚠️ Tous les champs obligatoires doivent être remplis !");
      return;
    }

    onSave({
      id: Date.now(),
      type: "cours",
      titre: cours,
      coursJour,
      coursHeureDebut,
      coursHeureFin,
      priorite,
      description,
      modesNotif,
      revisions,
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>📘 Nouveau cours</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="floating">Nom du cours*</IonLabel>
            <IonInput
              value={cours}
              placeholder="Ex: INF5151 – Génie logiciel"
              onIonChange={(e) => setCours(e.detail.value!)}
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Jour du cours*</IonLabel>
            <IonSelect
              value={coursJour}
              placeholder="Ex: Lundi"
              onIonChange={(e) => setCoursJour(e.detail.value!)}
            >
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
                (jour) => (
                  <IonSelectOption key={jour} value={jour}>
                    {jour}
                  </IonSelectOption>
                )
              )}
            </IonSelect>
          </IonItem>

          <IonGrid>
            <IonRow>
              <IonCol>
                <IonItem>
                  <IonLabel position="floating">Heure début*</IonLabel>
                  <IonInput
                    type="time"
                    value={coursHeureDebut}
                    onIonChange={(e) => setCoursHeureDebut(e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
              <IonCol>
                <IonItem>
                  <IonLabel position="floating">Heure fin*</IonLabel>
                  <IonInput
                    type="time"
                    value={coursHeureFin}
                    onIonChange={(e) => setCoursHeureFin(e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>

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
              placeholder="Choisir un ou plusieurs modes"
              onIonChange={(e) => setModesNotif(e.detail.value!)}
            >
              <IonSelectOption value="push">📱 Push</IonSelectOption>
              <IonSelectOption value="email">📧 Email</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem lines="none">
            <IonLabel position="stacked">Notes / Description</IonLabel>
            <IonTextarea
              placeholder="Ex: Réviser les chapitres 3 et 4 avant le prochain cours"
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
            />
          </IonItem>

          <div style={{ marginTop: "16px" }}>
            <h3>📚 Révisions</h3>
            {revisions.map((rev) => (
              <IonGrid key={rev.id}>
                <IonRow>
                  <IonCol size="4">
                    <IonSelect
                      placeholder="Jour"
                      value={rev.jour}
                      onIonChange={(e) =>
                        modifierRevision(rev.id, "jour", e.detail.value!)
                      }
                    >
                      {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
                        (j) => (
                          <IonSelectOption key={j} value={j}>
                            {j}
                          </IonSelectOption>
                        )
                      )}
                    </IonSelect>
                  </IonCol>
                  <IonCol size="3">
                    <IonInput
                      type="time"
                      value={rev.heureDebut}
                      onIonChange={(e) =>
                        modifierRevision(rev.id, "heureDebut", e.detail.value!)
                      }
                    />
                  </IonCol>
                  <IonCol size="3">
                    <IonInput
                      type="time"
                      value={rev.heureFin}
                      onIonChange={(e) =>
                        modifierRevision(rev.id, "heureFin", e.detail.value!)
                      }
                    />
                  </IonCol>
                  <IonCol size="2">
                    <IonButton
                      color="danger"
                      fill="outline"
                      onClick={() => supprimerRevision(rev.id)}
                    >
                      X
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            ))}
            <IonButton expand="block" onClick={ajouterRevision}>
              ➕ Ajouter une révision
            </IonButton>
          </div>
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

export default ModalCours;
