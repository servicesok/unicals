import React, { useEffect, useState, useRef, useMemo } from "react";
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
  IonInput,
  IonButtons,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonRange,
  IonSearchbar,
  IonChip,
  IonMenuButton,
  IonText,
} from "@ionic/react";
import {
  pencil,
  trash,
  addCircle,
  refresh,
  bookOutline,
  trophyOutline, // <-- utilisé pour bouton évaluations + Range
  funnelOutline,
  schoolOutline,
  chevronDown,
  chevronForward,
} from "ionicons/icons";

import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  Course,
  CourseInput,
} from "../api/courses.supabase";

import "./Courses.css";
import ModalEvaluation from "../components/ModalEvaluation";

const CoursesPage: React.FC = () => {
  const [items, setItems] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseInput>({
    code: "",
    title: "",
    passing_threshold: 60,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: "",
  });

  // UI polish: search + sort
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"code" | "title" | "threshold">(
    "code"
  );
  const [listOpen, setListOpen] = useState(true);

  const slidingRefs = useRef<{
    [key: string]: HTMLIonItemSlidingElement | null;
  }>({});

  const isEdit = !!editingId;

  // ========== Ajout pour le modal Évaluations ==========
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalCourse, setEvalCourse] = useState<Course | null>(null);

  function openEvalModal(course: Course) {
    setEvalCourse(course);
    setEvalModalOpen(true);
  }

  function closeEvalModal() {
    setEvalModalOpen(false);
    setEvalCourse(null);
  }
  // ================================================================

  async function fetchList() {
    setLoading(true);
    try {
      const data = await listCourses();
      setItems(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setToast({ open: true, msg: error.message });
      } else {
        setToast({ open: true, msg: "Erreur de chargement" });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  function onField<K extends keyof CourseInput>(key: K, val: CourseInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.title.trim()) {
      setToast({ open: true, msg: "Code et titre requis" });
      return;
    }
    try {
      const payload: CourseInput = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        passing_threshold: form.passing_threshold,
      };

      const saved = editingId
        ? await updateCourse(editingId, payload)
        : await createCourse(payload);

      if (editingId) {
        setItems((arr) => arr.map((it) => (it.id === saved.id ? saved : it)));
        setToast({ open: true, msg: "Cours mis à jour" });
      } else {
        setItems((arr) => [...arr, saved]);
        setToast({ open: true, msg: "Cours ajouté" });
      }
      resetForm();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      setToast({ open: true, msg: message });
    }
  }

  function resetForm() {
    setForm({ code: "", title: "", passing_threshold: 60 });
    setEditingId(null);
  }

  async function handleEdit(it: Course) {
    setForm({
      code: it.code,
      title: it.title,
      passing_threshold: it.passing_threshold,
    });
    setEditingId(it.id || null);
    const ref = slidingRefs.current[it.id || ""];
    ref?.closeOpened();
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    try {
      await deleteCourse(id);
      setItems((arr) => arr.filter((it) => it.id !== id));
      setToast({ open: true, msg: "Cours supprimé" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setToast({ open: true, msg: error.message });
      } else {
        setToast({ open: true, msg: "Suppression impossible" });
      }
    } finally {
      const ref = slidingRefs.current[id];
      ref?.closeOpened();
      if (editingId === id) resetForm();
    }
  }

  const getPassingColor = (threshold?: number | null) => {
    if (threshold == null) return "medium";
    if (threshold >= 70) return "danger";
    if (threshold >= 60) return "warning";
    return "success";
  };

  // Filtrage + tri
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q)
        )
      : items.slice();

    base.sort((a, b) => {
      if (sortKey === "threshold") {
        const ta = a.passing_threshold ?? 0;
        const tb = b.passing_threshold ?? 0;
        return tb - ta;
      }
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return a.code.localeCompare(b.code);
    });
    return base;
  }, [items, query, sortKey]);

  const total = items.length;
  const avgThreshold =
    Math.round(
      (items.reduce((s, c) => s + (c.passing_threshold ?? 0), 0) /
        (items.length || 1)) *
        10
    ) / 10;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="hero-toolbar">
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
          <IonTitle className="hero-title">
            <IonIcon icon={schoolOutline} style={{ marginRight: 8 }} />
            Gérer mes cours
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={fetchList}
              aria-label="Rafraîchir"
              className="ghost-btn"
            >
              <IonIcon slot="start" icon={refresh} />
              Rafraîchir
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{total}</div>
            <div className="stat-label">Cours</div>
          </div>
          <div className="stat">
            <div className="stat-num">
              {Number.isFinite(avgThreshold) ? `${avgThreshold}%` : "--"}
            </div>
            <div className="stat-label">Seuil moyen</div>
          </div>
        </div>
      </IonHeader>

      <IonButton routerLink="/priorite" color="primary" fill="outline">
        Voir Priorités
      </IonButton>

      <IonContent className="ion-padding courses-content">
        {/* Toolbar: recherche + tri */}
        <div className="top-actions">
          <IonSearchbar
            value={query}
            onIonInput={(e) => setQuery(String(e.detail.value ?? ""))}
            placeholder="Rechercher (code, titre)…"
            className="searchbar"
          />
          <div className="sort-chips">
            <IonChip
              outline={sortKey !== "code"}
              color="primary"
              onClick={() => setSortKey("code")}
            >
              <IonIcon icon={funnelOutline} />
              &nbsp;Code
            </IonChip>
            <IonChip
              outline={sortKey !== "title"}
              color="primary"
              onClick={() => setSortKey("title")}
            >
              Titre
            </IonChip>
            <IonChip
              outline={sortKey !== "threshold"}
              color="primary"
              onClick={() => setSortKey("threshold")}
            >
              Seuil
            </IonChip>
          </div>
        </div>

        {/* Formulaire */}
        <IonCard className="form-card">
          <IonCardContent>
            <h2 className="form-title">
              {isEdit ? "✏️ Modifier le cours" : "➕ Ajouter un cours"}
            </h2>

            <form onSubmit={handleSubmit}>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonInput
                      label="Code du cours *"
                      labelPlacement="stacked"
                      required
                      value={form.code}
                      onIonInput={(e) =>
                        onField("code", String(e.detail.value ?? ""))
                      }
                      placeholder="Ex.: INF6150"
                      disabled={isEdit}
                      className="custom-input"
                    />
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonInput
                      label="Titre du cours *"
                      labelPlacement="stacked"
                      required
                      value={form.title}
                      onIonInput={(e) =>
                        onField("title", String(e.detail.value ?? ""))
                      }
                      placeholder="Ex.: Génie logiciel"
                      className="custom-input"
                    />
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <IonLabel className="threshold-label">
                      Saisisr seuil de passage du cours (ex : moyenne à obtenir
                      aux examens) ➡️ {form.passing_threshold || 60}%
                    </IonLabel>
                    <IonRange
                      min={0}
                      max={100}
                      step={5}
                      value={form.passing_threshold || 60}
                      onIonChange={(e) =>
                        onField("passing_threshold", e.detail.value as number)
                      }
                      pin={true}
                      color={getPassingColor(form.passing_threshold)}
                    >
                      <IonIcon slot="start" icon={trophyOutline} />
                      <IonIcon slot="end" icon={trophyOutline} />
                    </IonRange>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonButton
                      type="submit"
                      expand="block"
                      color={isEdit ? "warning" : "success"}
                    >
                      <IonIcon slot="start" icon={addCircle} />
                      {isEdit ? "Mettre à jour" : "Ajouter"}
                    </IonButton>
                  </IonCol>
                  {isEdit && (
                    <IonCol size="12" sizeMd="6">
                      <IonButton
                        type="button"
                        onClick={resetForm}
                        expand="block"
                        fill="outline"
                        color="medium"
                      >
                        Annuler
                      </IonButton>
                    </IonCol>
                  )}
                </IonRow>
              </IonGrid>
            </form>
          </IonCardContent>
        </IonCard>

        {/* Liste des cours – carte repliable */}
        <IonCard className="list-card">
          <IonCardContent>
            <div className="list-header">
              <h2>📘 Liste des cours</h2>
              <div className="list-header-actions">
                <IonBadge color="primary">{visibleItems.length}</IonBadge>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setListOpen((v) => !v)}
                  aria-label={
                    listOpen ? "Replier la liste" : "Déplier la liste"
                  }
                >
                  <IonIcon
                    slot="icon-only"
                    icon={listOpen ? chevronDown : chevronForward}
                  />
                </IonButton>
              </div>
            </div>

            <IonText color="medium" className="swipe-hint">
              <small>
                ❕appuyez sur le cours pour voir les évaluations, balayer vers
                la gauche ← pour modifier le cours, vers la droite → pour le
                supprimer.
              </small>
            </IonText>

            <div className={`collapsible ${listOpen ? "open" : "closed"}`}>
              {loading ? (
                <div className="loading-container">
                  <IonSpinner />
                  <p>Chargement des cours...</p>
                </div>
              ) : visibleItems.length === 0 ? (
                <IonCard className="empty-card inner">
                  <IonCardContent>
                    <IonIcon icon={bookOutline} className="empty-icon" />
                    <p className="empty-text">
                      Aucun cours {query ? "trouvé" : "enregistré"}.
                      {query
                        ? " Essayez un autre terme."
                        : " Ajoutez votre premier cours ci-dessus !"}
                    </p>
                  </IonCardContent>
                </IonCard>
              ) : (
                <IonList inset lines="none" className="courses-list-inner">
                  {visibleItems.map((course) => (
                    <IonItemSliding
                      key={course.id}
                      ref={(el: HTMLIonItemSlidingElement | null) => {
                        slidingRefs.current[course.id || ""] = el;
                      }}
                    >
                      <IonItem
                        button
                        detail={false}
                        className="course-item"
                        onClick={() => openEvalModal(course)} // ✅ clic = ouvrir évaluations
                      >
                        <div className="dot" aria-hidden />
                        <IonLabel>
                          <div className="course-header">
                            <h2 className="course-code">{course.code}</h2>
                            {course.passing_threshold != null && (
                              <IonBadge
                                color={getPassingColor(
                                  course.passing_threshold
                                )}
                              >
                                {course.passing_threshold}%
                              </IonBadge>
                            )}
                          </div>
                          <h3 className="course-title">{course.title}</h3>
                        </IonLabel>
                        <div className="course-actions">
                          {/* Bouton pour lancer une session d’étude sur CE cours */}
                          <IonButton
                            slot="end"
                            routerLink={`/chronometre/${course.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            Lancer une session
                          </IonButton>
                        </div>
                      </IonItem>

                      {/* options de swipe existantes */}
                      <IonItemOptions side="start">
                        <IonItemOption
                          color="warning"
                          onClick={() => handleEdit(course)}
                        >
                          <IonIcon slot="icon-only" icon={pencil} />
                        </IonItemOption>
                      </IonItemOptions>
                      <IonItemOptions side="end">
                        <IonItemOption
                          color="danger"
                          onClick={() => handleDelete(course.id)}
                        >
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </IonList>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* ============== TOAST ============== */}
        <IonToast
          isOpen={toast.open}
          message={toast.msg}
          duration={2000}
          onDidDismiss={() => setToast({ open: false, msg: "" })}
          position="bottom"
        />

        {/* ============== AJOUT DU MODAL ÉVALUATIONS ============== */}
        <ModalEvaluation
          isOpen={evalModalOpen}
          onClose={closeEvalModal}
          course={evalCourse}
        />
        {/* ========================================================= */}
      </IonContent>
    </IonPage>
  );
};

export default CoursesPage;
