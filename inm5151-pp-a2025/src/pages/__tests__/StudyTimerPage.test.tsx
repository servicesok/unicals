import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { act } from "react-dom/test-utils";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import StudyTimerPage from "../StudyTimerPage";
import {
  decrementCourseSessions,
  getCourseById,
} from "../../api/courses.supabase";

vi.mock("../../api/courses.supabase", () => ({
  decrementCourseSessions: vi.fn(),
  getCourseById: vi.fn(),
}));

// Helpers
function renderFreeMode() {
  return render(
    <MemoryRouter initialEntries={["/chronometre"]}>
      <Route path="/chronometre">
        <StudyTimerPage />
      </Route>
    </MemoryRouter>
  );
}

function renderCourseMode(courseId = "course-123") {
  return render(
    <MemoryRouter initialEntries={[`/chronometre/${courseId}`]}>
      <Route path="/chronometre/:courseId">
        <StudyTimerPage />
      </Route>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.useFakeTimers();

  (decrementCourseSessions as any).mockReset();
  (getCourseById as any).mockReset();
  (getCourseById as any).mockResolvedValue({
    id: "course-123",
    title: "Cours de test",
  });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("StudyTimerPage – Chronomètre d'étude", () => {
  test("affiche 'Chronomètre libre' quand aucun courseId n'est fourni", () => {
    renderFreeMode();
    expect(screen.getByText(/Chronomètre libre/i)).toBeInTheDocument();
  });

  test("affiche 'Chronomètre d’étude' en mode cours et appelle getCourseById", async () => {
    renderCourseMode("course-XYZ");

    expect(screen.getByText(/Chronomètre d’étude/i)).toBeInTheDocument();

    expect(getCourseById).toHaveBeenCalledWith("course-XYZ");
  });

  test("affiche la durée initiale 25:00 par défaut", () => {
    renderFreeMode();
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  test("permet de changer de durée (ex. 60 min)", () => {
    renderFreeMode();

    const btn60 = screen.getByText(/60\s*min/i);
    fireEvent.click(btn60);

    expect(screen.getByText("60:00")).toBeInTheDocument();
  });

  test("démarre le timer et décrémente le temps", () => {
    renderFreeMode();

    const startBtn = screen.getByText(/Start/i);
    fireEvent.click(startBtn);

    act(() => {
      vi.advanceTimersByTime(1000); // 1 seconde
    });

    expect(screen.getByText("24:59")).toBeInTheDocument();
  });

  test("met le timer en pause et arrête la décrémentation", () => {
    renderFreeMode();

    const startBtn = screen.getByText(/Start/i);
    fireEvent.click(startBtn);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("24:57")).toBeInTheDocument();

    const pauseBtn = screen.getByText(/Pause/i);
    fireEvent.click(pauseBtn);

    act(() => {
      vi.advanceTimersByTime(5000); // ne doit plus bouger
    });

    expect(screen.getByText("24:57")).toBeInTheDocument();
  });

  test("reprend après une pause et continue de décrémenter", () => {
    renderFreeMode();

    const startBtn = screen.getByText(/Start/i);
    fireEvent.click(startBtn);

    act(() => {
      vi.advanceTimersByTime(2000); // 24:58
    });

    const pauseBtn = screen.getByText(/Pause/i);
    fireEvent.click(pauseBtn);

    const resumeBtn = screen.getByText(/Reprendre/i);
    fireEvent.click(resumeBtn);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("24:56")).toBeInTheDocument();
  });

  test("le bouton Reset remet le chrono à la durée sélectionnée (ex. 45 min)", () => {
    renderFreeMode();

    const btn45 = screen.getByText(/45\s*min/i);
    fireEvent.click(btn45);

    const startBtn = screen.getByText(/Start/i);
    fireEvent.click(startBtn);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const resetBtn = screen.getByText(/Reset/i);
    fireEvent.click(resetBtn);

    expect(screen.getByText("45:00")).toBeInTheDocument();
  });

  test("après écoulement complet, l'alerte de fin de session est ouverte (isOpen = true)", () => {
    const { container } = renderFreeMode();

    const startBtn = screen.getByText(/Start/i);
    fireEvent.click(startBtn);

    // on laisse passer toute la durée
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    const alertEl = container.querySelector("ion-alert") as any;
    expect(alertEl).toBeTruthy();

    expect(alertEl.isOpen).toBe(true);
  });

  test("en mode cours, l'API getCourseById est appelée avec le bon courseId", () => {
    renderCourseMode("course-ABC");

    expect(getCourseById).toHaveBeenCalledWith("course-ABC");
  });
});
