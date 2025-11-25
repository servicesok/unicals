import { useEffect, useState } from "react";
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
  IonToast,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonDatetime,
  IonDatetimeButton,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { supabase } from "../services/supabase";

interface Deadline {
  id: string;
  user_id: string;
  title: string;
  kind: "exam" | "tp" | "quiz" | "payment";
  due_at: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const Priorite: React.FC = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: "",
  });

  const [editing, setEditing] = useState<Deadline | null>(null);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    const { data, error } = await supabase
      .from("deadlines")
      .select("*")
      .order("due_at", { ascending: true });

    if (error) {
      setToast({ open: true, msg: error.message });
    } else if (data) {
      setDeadlines(data);
    }
  };

  const computePriority = (dueAt: string) => {
    const today = new Date();
    const due = new Date(dueAt);
    const diff = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff < 0 ? 0 : diff;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("deadlines").delete().eq("id", id);
    if (error) setToast({ open: true, msg: error.message });
    else setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const { error } = await supabase
      .from("deadlines")
      .update({
        title: editing.title,
        kind: editing.kind,
        notes: editing.notes,
        due_at: editing.due_at,
      })
      .eq("id", editing.id);

    if (error) {
      setToast({ open: true, msg: error.message });
      return;
    }

    setEditing(null);
    fetchDeadlines(); // refresh list après modification
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Indice de Priorité</IonTitle>
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (event) => {
            await fetchDeadlines();
            event.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {deadlines.length === 0 && <p>Aucune échéance enregistrée.</p>}

        {deadlines.map((d) => (
          <IonCard key={d.id}>
            <IonCardHeader>
              <IonCardTitle>{d.title}</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <p>
                <strong>Date limite :</strong>{" "}
                {new Date(d.due_at).toLocaleDateString()}
              </p>
              <p>
                <strong>Type :</strong> {d.kind}
              </p>

              {d.notes && (
                <p>
                  <strong>Notes :</strong> {d.notes}
                </p>
              )}

              <p style={{ marginTop: 10 }}>
                <strong>Indice de priorité :</strong>{" "}
                <IonBadge color="danger">{computePriority(d.due_at)}</IonBadge>
              </p>

              <IonButton
                color="primary"
                fill="outline"
                onClick={() => setEditing(d)}
                style={{ marginTop: 10, marginRight: 10 }}
              >
                Modifier
              </IonButton>

              <IonButton
                color="danger"
                fill="outline"
                onClick={() => handleDelete(d.id)}
                style={{ marginTop: 10 }}
              >
                Supprimer
              </IonButton>
            </IonCardContent>
          </IonCard>
        ))}

        {/* Modal d'édition */}
        {editing && (
          <IonModal isOpen={true} onDidDismiss={() => setEditing(null)}>
            <IonContent className="ion-padding">
              <h2>Modifier l’échéance</h2>

              {/* Sélecteur de date */}
              <IonDatetimeButton datetime="datePicker" />
              <IonModal keepContentsMounted={true}>
                <IonDatetime
                  id="datePicker"
                  value={editing.due_at}
                  onIonChange={(e) => {
                    let v = e.detail.value;
                    if (Array.isArray(v)) v = v[0]; // correction typescript
                    setEditing({ ...editing, due_at: v ?? "" });
                  }}
                />
              </IonModal>

              <IonButton
                expand="block"
                onClick={handleUpdate}
                style={{ marginTop: 20 }}
              >
                Sauvegarder
              </IonButton>

              <IonButton
                color="medium"
                expand="block"
                onClick={() => setEditing(null)}
              >
                Annuler
              </IonButton>
            </IonContent>
          </IonModal>
        )}

        <IonToast
          isOpen={toast.open}
          message={toast.msg}
          duration={2000}
          onDidDismiss={() => setToast({ open: false, msg: "" })}
        />
      </IonContent>
    </IonPage>
  );
};

export default Priorite;
