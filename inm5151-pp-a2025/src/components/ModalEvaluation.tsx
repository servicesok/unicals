import React, { useEffect, useMemo, useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { pencil } from "ionicons/icons";
import { Course } from "../api/courses.supabase";
import {
  Evaluation,
  listEvaluationsByCourse,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
} from "../api/evaluations.supabase";

interface ModalEvaluationProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

/**
 * Modal pour :
 * - US1 : ajouter / modifier des évaluations + pondérations
 * - US2 : saisir / modifier les notes
 * - US3 : calcul de la moyenne pondérée actuelle
 * - US4 : calcul du minimum à obtenir pour atteindre le seuil
 */
const ModalEvaluation: React.FC<ModalEvaluationProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire du haut (ajout / édition)
  const [form, setForm] = useState<{ title: string; weight: number }>({
    title: "",
    weight: 10,
  });

  // Id d'évaluation en cours d'édition (sinon null = mode ajout)
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const isEditing = !!editingEvalId;

  // notes tapées dans les inputs (brouillons)
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

  // Charger les évaluations quand on ouvre le modal
  useEffect(() => {
    if (!isOpen) return;

    if (!course?.id) {
      setEvaluations([]);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);
        
        if (!course || !course.id) return;
        const data = await listEvaluationsByCourse(course.id);

        setEvaluations(data);

        const drafts: Record<string, string> = {};
        data.forEach((e) => {
          if (e.id) {
            drafts[e.id] =
              e.score === null || e.score === undefined ? "" : String(e.score);
          }
        });
        setScoreDrafts(drafts);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Erreur lors du chargement";
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isOpen, course?.id]);

  const handleDismiss = () => {
    setEvaluations([]);
    setForm({ title: "", weight: 10 });
    setScoreDrafts({});
    setEditingEvalId(null);
    setErrorMsg(null);
    onClose();
  };

  // --- Formulaire ajout / édition (US1) ---

  function onFormChange(key: "title" | "weight", value: string) {
    if (key === "weight") {
      const num = Number(value.replace(",", "."));
      setForm((f) => ({ ...f, weight: Number.isNaN(num) ? 0 : num }));
    } else {
      setForm((f) => ({ ...f, title: value }));
    }
  }

  // Quand on clique sur ✏️ sur une ligne -> on passe en mode édition
  function startEditEvaluation(ev: Evaluation) {
    if (!ev.id) return;
    setEditingEvalId(ev.id);
    setForm({
      title: ev.title,
      weight: ev.weight ?? 0,
    });
  }

  async function handleSubmitEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!course?.id) return;

    if (!form.title.trim() || form.weight <= 0) {
      setErrorMsg("Titre et pondération > 0 requis");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // mode édition -> update
      if (editingEvalId) {
        const updated = await updateEvaluation(editingEvalId, {
          title: form.title.trim(),
          weight: form.weight,
        });

        setEvaluations((list) =>
          list.map((ev) => (ev.id === updated.id ? updated : ev))
        );
      } else {
        // mode ajout -> create
        const created = await createEvaluation({
          course_id: course.id,
          title: form.title.trim(),
          weight: form.weight,
        });

        setEvaluations((list) => [created, ...list]);
      }

      // reset formulaire
      setForm({ title: "", weight: 10 });
      setEditingEvalId(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  // --- Notes (US2) ---

  function onScoreDraftChange(id: string, value: string) {
    setScoreDrafts((prev) => ({ ...prev, [id]: value }));
  }

  async function saveScore(id: string) {
    const raw = scoreDrafts[id];
    const trimmed = raw.trim();
    const num = trimmed === "" ? null : Number(trimmed.replace(",", "."));

    if (trimmed !== "" && (Number.isNaN(num!) || num! < 0 || num! > 100)) {
      setErrorMsg("La note doit être entre 0 et 100");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const updated = await updateEvaluation(id, { score: num ?? null });
      setEvaluations((list) =>
        list.map((ev) => (ev.id === id ? updated : ev))
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvaluation(id?: string) {
    if (!id) return;
    try {
      setLoading(true);
      await deleteEvaluation(id);
      setEvaluations((list) => list.filter((ev) => ev.id !== id));
    } finally {
      setLoading(false);
    }
  }

  // --- Statistques pondérées (%) (US3 & US4) ---

  const stats = useMemo(() => {
    if (!course || evaluations.length === 0) return null;

    const threshold = course.passing_threshold ?? 50;

    const totalWeight = evaluations.reduce(
      (s, ev) => s + (ev.weight || 0),
      0
    );

    const completed = evaluations.filter(
      (ev) => ev.score !== null && ev.score !== undefined
    );

    const completedWeight = completed.reduce(
      (s, ev) => s + (ev.weight || 0),
      0
    );

    const sumWeightedCompleted = completed.reduce(
      (s, ev) => s + (ev.weight || 0) * (ev.score ?? 0),
      0
    );

    const currentAverage =
      completedWeight > 0 ? sumWeightedCompleted / completedWeight : null;

    const remainingWeight = totalWeight - completedWeight;

    let neededAverage: number | null = null;
    let impossible = false;

    if (totalWeight > 0 && remainingWeight > 0) {
      const targetTotal = threshold * totalWeight;
      const already = sumWeightedCompleted;
      const needed = (targetTotal - already) / remainingWeight;

      if (needed > 100) {
        neededAverage = needed;
        impossible = true;
      } else if (needed <= 0) {
        neededAverage = 0;
      } else {
        neededAverage = needed;
      }
    }

    return {
      threshold,
      totalWeight,
      completedWeight,
      remainingWeight,
      currentAverage,
      neededAverage,
      impossible,
    };
  }, [evaluations, course]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {course
              ? `Évaluations – ${course.code}`
              : "Évaluations du cours"}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>Fermer</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!course && (
          <IonText color="medium">
            <p>Aucun cours sélectionné.</p>
          </IonText>
        )}

        {course && (
          <>
            <p>
              <strong>{course.title}</strong>
              {course.passing_threshold != null && (
                <> – seuil : {course.passing_threshold}%</>
              )}
            </p>

            {errorMsg && (
              <IonText color="danger">
                <p>{errorMsg}</p>
              </IonText>
            )}

            {/* Formulaire ajout / édition (US1) */}
            <form onSubmit={handleSubmitEvaluation}>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonText color="primary">
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>
                        {isEditing
                          ? "Modifier l'évaluation"
                          : "Nom de l'évaluation"}
                      </p>
                    </IonText>
                    <IonInput
                      placeholder="Ex.: Quiz 1, Intra, TP2..."
                      value={form.title}
                      onIonInput={(e) =>
                        onFormChange(
                          "title",
                          String(e.detail.value ?? "")
                        )
                      }
                      required
                    />
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonText color="primary">
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>
                        Pondération (%)
                      </p>
                    </IonText>
                    <IonInput
                      type="number"
                      value={String(form.weight)}
                      onIonInput={(e) =>
                        onFormChange(
                          "weight",
                          String(e.detail.value ?? "")
                        )
                      }
                      min={0}
                      max={100}
                      required
                    />
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonButton type="submit" expand="block">
                      {isEditing
                        ? "Mettre à jour l'évaluation"
                        : "Ajouter l'évaluation"}
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </form>

            {/* Liste + notes (US2) */}
            <IonList>
              {loading && evaluations.length === 0 && (
                <IonItem>
                  <IonLabel>
                    <IonSpinner /> Chargement…
                  </IonLabel>
                </IonItem>
              )}

              {!loading && evaluations.length === 0 && (
                <IonItem>
                  <IonLabel>
                    Aucune évaluation pour ce cours pour l’instant.
                  </IonLabel>
                </IonItem>
              )}

              {evaluations.map((ev) => (
                <IonItem key={ev.id}>
                  <IonLabel>
                    <div>
                      <strong>{ev.title}</strong> – {ev.weight}%
                    </div>
                    {ev.score != null && (
                      <IonText color="medium">
                        Note enregistrée : {ev.score}%
                      </IonText>
                    )}
                  </IonLabel>

                  {ev.id && (
                    <>
                      {/* Bouton éditer nom + poids */}
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => startEditEvaluation(ev)}
                      >
                        <IonIcon icon={pencil} />
                      </IonButton>

                      {/* Zone note + OK + SUPPR */}
                      <div style={{ minWidth: "130px" }}>
                        <IonInput
                          type="number"
                          placeholder="Note"
                          value={scoreDrafts[ev.id] ?? ""}
                          onIonInput={(e) =>
                            onScoreDraftChange(
                              ev.id!,
                              String(e.detail.value ?? "")
                            )
                          }
                          min={0}
                          max={100}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 4,
                            justifyContent: "flex-end",
                          }}
                        >
                          <IonButton
                            size="small"
                            onClick={() => saveScore(ev.id!)}
                          >
                            OK
                          </IonButton>
                          <IonButton
                            size="small"
                            color="danger"
                            fill="clear"
                            onClick={() => handleDeleteEvaluation(ev.id)}
                          >
                            Suppr
                          </IonButton>
                        </div>
                      </div>
                    </>
                  )}
                </IonItem>
              ))}
            </IonList>

            {/* Stats (US3 & US4) */}
            {stats && (
              <div style={{ marginTop: 16 }}>
                <IonText>
                  <p>
                    <strong>
                      Moyenne pondérée actuelle (évaluations notées) :
                    </strong>{" "}
                    {stats.currentAverage == null
                      ? "--"
                      : `${stats.currentAverage.toFixed(1)}%`}
                  </p>
                  <p>
                    Poids complété :{" "}
                    {stats.completedWeight.toFixed(1)}% /{" "}
                    {stats.totalWeight.toFixed(1)}% définis
                  </p>
                  <p>
                    Poids restant : {stats.remainingWeight.toFixed(1)}%
                  </p>
                  <p>
                    <strong>
                      Minimum moyen à obtenir sur le reste pour
                      atteindre le seuil de {stats.threshold}% :
                    </strong>{" "}
                    {stats.remainingWeight <= 0
                      ? "Aucun poids restant – tout est déjà noté."
                      : stats.neededAverage == null
                      ? "–"
                      : stats.impossible
                      ? `${stats.neededAverage.toFixed(
                          1
                        )}% (impossible, > 100%)`
                      : `${stats.neededAverage.toFixed(1)}%`}
                  </p>
                </IonText>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ModalEvaluation;