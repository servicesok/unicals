/* eslint-disable @typescript-eslint/no-explicit-any */
import { listCourses, Course } from "../api/courses.supabase";
import {
  listDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from "../api/deadlines.supabase";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonNote,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonButtons,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonMenuButton,
} from "@ionic/react";
import { pencil, trash, addCircle, refresh } from "ionicons/icons";

export type DeadlineKind = "exam" | "tp" | "quiz" | "payment";

export interface Deadline {
  id?: string;
  title: string;
  kind: DeadlineKind;
  course_id?: string | null;
  due_at: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "";

const emptyForm: Deadline = {
  title: "",
  kind: "exam",
  course_id: null,
  due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  notes: "",
};

const DeadlinesPage: React.FC = () => {
  const [items, setItems] = useState<Deadline[]>([]);
  const [form, setForm] = useState<Deadline>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: "",
  });

  const slidingRefs = useRef<{
    [key: string]: HTMLIonItemSlidingElement | null;
  }>({});
  const isEdit = useMemo(() => !!editingId, [editingId]);

  async function fetchList() {
    setLoading(true);
    try {
      const data = await listDeadlines();
      setItems(data);
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || "Fetch failed" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      setCoursesLoading(true);
      setCoursesError(null);
      const data = await listCourses();
      setCourses(data);
    } catch (e: any) {
      setCoursesError(e?.message || "Erreur de chargement des cours");
    } finally {
      setCoursesLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    fetchCourses();
  }, []);

  function onField<K extends keyof Deadline>(key: K, val: Deadline[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  const ensureDateFormat = (s: string) => {
    if (/[Zz]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return s;
    return new Date(s).toISOString();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Validation : si exam/tp/quiz -> cours obligatoire
    if (["exam", "tp", "quiz"].includes(form.kind) && !form.course_id) {
      setToast({ open: true, msg: "Merci de choisir un cours." });
      return;
    }

    try {
      // 2. Préparation du payload envoyé à Supabase
      const payload = {
        title: form.title.trim(),
        kind: form.kind,
        due_at: ensureDateFormat(form.due_at),
        notes: (form.notes ?? "").trim() || null,
        course_id: ["exam", "tp", "quiz"].includes(form.kind)
          ? form.course_id
          : null,
      };

      const saved = editingId
        ? await updateDeadline(editingId, payload)
        : await createDeadline(payload);

      // 3. Mise à jour du state local
      if (editingId) {
        setItems((arr) => arr.map((it) => (it.id === saved.id ? saved : it)));
        setToast({ open: true, msg: "Échéance mise à jour." });
      } else {
        setItems((arr) =>
          [...arr, saved].sort((a, b) => a.due_at.localeCompare(b.due_at))
        );
        setToast({ open: true, msg: "Échéance ajoutée." });
      }

      resetForm();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Erreur lors de la sauvegarde",
      });
    }
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  async function handleEdit(it: Deadline) {
    setForm({
      title: it.title,
      kind: it.kind,
      due_at: it.due_at,
      notes: it.notes ?? "",
      id: it.id,
      created_at: it.created_at,
      updated_at: it.updated_at,
      course_id: it.course_id ?? null,
    });
    setEditingId(it.id || null);

    const ref = slidingRefs.current[it.id || ""];
    ref?.closeOpened();
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    try {
      await deleteDeadline(id);
      setItems((arr) => arr.filter((it) => it.id !== id));
      setToast({ open: true, msg: "Échéance supprimée." });
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || "Suppression impossible" });
    } finally {
      const ref = slidingRefs.current[id];
      ref?.closeOpened();
      if (editingId === id) resetForm();
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
          <IonTitle>Échéances</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={fetchList} aria-label="Rafraîchir">
              <IonIcon slot="start" icon={refresh} /> Rafraîchir
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <IonSelect
            label="Type d'échéance *"
            labelPlacement="stacked"
            value={form.kind}
            onIonChange={(e) => {
              const newKind = e.detail.value as DeadlineKind;
              onField("kind", newKind);

              // Si on passe à "payment", on enlève le cours sélectionné
              if (newKind === "payment") {
                onField("course_id", "null");
              }
            }}
          >
            <IonSelectOption value="exam">Examen</IonSelectOption>
            <IonSelectOption value="tp">TP</IonSelectOption>
            <IonSelectOption value="quiz">Quiz</IonSelectOption>
            <IonSelectOption value="payment">Paiement</IonSelectOption>
          </IonSelect>

          {/* 2. Select du cours lié (affiché seulement pour exam/tp/quiz) */}
          {(["exam", "tp", "quiz"] as DeadlineKind[]).includes(form.kind) && (
            <IonSelect
              label="Cours lié *"
              labelPlacement="stacked"
              value={form.course_id || ""}
              onIonChange={(e) =>
                onField("course_id", e.detail.value as string)
              }
            >
              {coursesLoading && (
                <IonSelectOption value="" disabled>
                  Chargement des cours...
                </IonSelectOption>
              )}

              {coursesError && (
                <IonSelectOption value="" disabled>
                  Erreur : {coursesError}
                </IonSelectOption>
              )}

              {!coursesLoading && !coursesError && courses.length === 0 && (
                <IonSelectOption value="" disabled>
                  Aucun cours disponible
                </IonSelectOption>
              )}

              {!coursesLoading &&
                !coursesError &&
                courses.map((c) => (
                  <IonSelectOption key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </IonSelectOption>
                ))}
            </IonSelect>
          )}

          <IonInput
            label="Titre *"
            labelPlacement="stacked"
            required
            value={form.title}
            onIonInput={(e) => onField("title", String(e.detail.value ?? ""))}
            placeholder="Intra d'Algèbre, TP1 Réseaux, Paiement frais de scolarité, etc."
          />

          <div>
            <IonDatetimeButton datetime="duePicker" />
            <IonModal keepContentsMounted={true}>
              <IonDatetime
                id="duePicker"
                presentation="date-time"
                value={form.due_at}
                onIonChange={(e) => {
                  const v = e.detail.value as string | null;
                  if (v) onField("due_at", v);
                }}
              />
            </IonModal>
            <IonNote className="block date">
              Sélectionné: {formatDateTime(form.due_at)}
            </IonNote>
          </div>

          <IonInput
            label="Notes"
            labelPlacement="stacked"
            value={form.notes ?? ""}
            onIonInput={(e) => onField("notes", String(e.detail.value ?? ""))}
            placeholder="Salle, matériel, etc."
          />

          <div className="flex gap-2 items-center">
            <IonButton type="submit" color={isEdit ? "warning" : "primary"}>
              <IonIcon slot="start" icon={addCircle} />{" "}
              {isEdit ? "Mettre à jour" : "Ajouter"}
            </IonButton>
            {isEdit && (
              <IonButton type="button" onClick={resetForm} fill="outline">
                Annuler
              </IonButton>
            )}
          </div>
        </form>

        {/* Liste */}
        <div className="bottom-section">
          {loading ? (
            <div className="flex items-center gap-2">
              <IonSpinner /> Chargement…
            </div>
          ) : (
            <IonList inset>
              {items.map((it) => {
                const course = it.course_id
                  ? courses.find((c) => c.id === it.course_id)
                  : undefined;

                return (
                  <IonItemSliding
                    key={it.id}
                    ref={(el: HTMLIonItemSlidingElement | null) => {
                      slidingRefs.current[it.id || ""] = el;
                    }}
                  >
                    <IonItem button detail={false}>
                      <IonLabel>
                        <div className="font-medium">{it.title}</div>
                        <IonNote className="block">
                          {it.kind.toUpperCase()}
                          {course ? ` • ${course.code}` : ""}
                          {" • "}
                          {formatDateTime(it.due_at)}
                        </IonNote>
                        {it.notes ? (
                          <IonNote className="block opacity">
                            {it.notes}
                          </IonNote>
                        ) : null}
                      </IonLabel>
                    </IonItem>

                    <IonItemOptions side="start">
                      <IonItemOption
                        color="warning"
                        onClick={() => handleEdit(it)}
                      >
                        <IonIcon slot="icon-only" icon={pencil} />
                      </IonItemOption>
                    </IonItemOptions>
                    <IonItemOptions side="end">
                      <IonItemOption
                        color="danger"
                        onClick={() => handleDelete(it.id)}
                      >
                        <IonIcon slot="icon-only" icon={trash} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                );
              })}
            </IonList>
          )}
        </div>

        <IonToast
          isOpen={toast.open}
          message={toast.msg}
          duration={1800}
          onDidDismiss={() => setToast({ open: false, msg: "" })}
        />
      </IonContent>
    </IonPage>
  );
};

export default DeadlinesPage;
