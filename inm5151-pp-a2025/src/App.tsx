import { Redirect, Route } from "react-router-dom";
import StudyTimerPage from "./pages/StudyTimerPage";
import UploadCourse from "./pages/UploadCourse";
import CoursesList from "./pages/CoursesList";
import {
  IonApp,
  IonRouterOutlet,
  IonPage,
  IonContent,
  setupIonicReact,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabs,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonMenuToggle,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  calendarOutline,
  checkboxOutline,
  walletOutline,
  timeOutline,
  schoolOutline,
  notificationsOutline,
  personOutline,
  logOutOutline,
  logInOutline,
  refreshOutline,
  hourglassOutline,
  timer,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

/* Pages */
import Profil from "./pages/Profil";
import Calendrier from "./pages/Calendrier";
import Taches from "./pages/Taches";
import Finances from "./pages/Finances";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Creation";
import Deadlinepage from "./pages/Deadlines";
import CoursesPage from "./pages/Courses";
import Notifications from "./pages/Notifications";
import ForgotPwd from "./pages/ForgotPwd";
import ResetPassword from "./pages/ResetPassword";

import PublicRoute from "./components/PublicRoute";
import PrivateRoute from "./components/PrivateRoute";

/* CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variables.css";
import Priorite from "./pages/Priorites";

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session?.user);
      } catch (err) {
        console.error("Erreur checkAuth:", err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authenticated = !!session?.user;
        setIsAuthenticated(authenticated);

        if (!authenticated && window.location.pathname !== "/login") {
          window.location.replace("/login");
        } else if (authenticated && window.location.pathname === "/login") {
          window.location.replace("/calendrier");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonMenu contentId="main" type="overlay" side="start">
            <IonHeader>
              <IonToolbar color="primary">
                <IonTitle>Navigation</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList>
                <IonMenuToggle autoHide={true}>
                  {isAuthenticated ? (
                    <>
                      <IonItem routerLink="/calendrier">
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>Calendrier</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/cours">
                        <IonIcon icon={schoolOutline} slot="start" />
                        <IonLabel>Cours</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/deadlines">
                        <IonIcon icon={timeOutline} slot="start" />
                        <IonLabel>Deadlines</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/chronometre">
                        <IonIcon icon={timer} slot="start" />
                        <IonLabel>Chronomètre</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/finances">
                        <IonIcon icon={walletOutline} slot="start" />
                        <IonLabel>Finances</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/notifications">
                        <IonIcon icon={notificationsOutline} slot="start" />
                        <IonLabel>Notifications</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/profil">
                        <IonIcon icon={personOutline} slot="start" />
                        <IonLabel>Profil</IonLabel>
                      </IonItem>
                      <IonItem
                        button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.replace("/login");
                        }}
                      >
                        <IonIcon icon={logOutOutline} slot="start" />
                        <IonLabel>Déconnexion</IonLabel>
                      </IonItem>
                    </>
                  ) : (
                    <>
                      <IonItem routerLink="/login">
                        <IonIcon icon={logInOutline} slot="start" />
                        <IonLabel>Connexion</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/forgot-password">
                        <IonIcon icon={refreshOutline} slot="start" />
                        <IonLabel>Mot de passe oublié</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/reset-password">
                        <IonIcon icon={refreshOutline} slot="start" />
                        <IonLabel>Réinitialisation</IonLabel>
                      </IonItem>
                    </>
                  )}
                </IonMenuToggle>
              </IonList>
            </IonContent>
          </IonMenu>

          <IonPage id="main">
            <IonTabs>
              <IonRouterOutlet><Route exact path="/upload-course">
                  <UploadCourse />
                </Route>

                <Route exact path="/courses">
                  <CoursesList />
                </Route>

                <Route exact path="/taches">
                  <Taches />
                </Route>
                </IonRouterOutlet>

              {isAuthenticated && <IonTabBar slot="bottom"></IonTabBar>}
            </IonTabs>
          </IonPage>
        </IonReactRouter>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <IonMenu contentId="main" type="overlay">
            <IonHeader>
              <IonToolbar color="primary">
                <IonTitle>Navigation</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList>
                <IonMenuToggle autoHide={false}>
                  {!isAuthenticated && (
                    <>
                      <IonItem routerLink="/login">
                        <IonIcon icon={logInOutline} slot="start" />
                        <IonLabel>Connexion</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/forgot-password">
                        <IonIcon icon={refreshOutline} slot="start" />
                        <IonLabel>Mot de passe oublié</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/reset-password">
                        <IonIcon icon={refreshOutline} slot="start" />
                        <IonLabel>Réinitialisation</IonLabel>
                      </IonItem>
                    </>
                  )}

                  {isAuthenticated && (
                    <>
                      <IonItem routerLink="/calendrier">
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>Calendrier</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/cours">
                        <IonIcon icon={schoolOutline} slot="start" />
                        <IonLabel>Cours</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/taches">
                        <IonIcon icon={checkboxOutline} slot="start" />
                        <IonLabel>Tâches</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/deadlines">
                        <IonIcon icon={timeOutline} slot="start" />
                        <IonLabel>Deadlines</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/chronometre">
                        <IonIcon icon={timer} slot="start" />
                        <IonLabel>Chronomètre</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/finances">
                        <IonIcon icon={walletOutline} slot="start" />
                        <IonLabel>Finances</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/notifications">
                        <IonIcon icon={notificationsOutline} slot="start" />
                        <IonLabel>Notifications</IonLabel>
                      </IonItem>
                      <IonItem routerLink="/profil">
                        <IonIcon icon={personOutline} slot="start" />
                        <IonLabel>Profil</IonLabel>
                      </IonItem>
                      <IonItem
                        button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.replace("/login");
                        }}
                      >
                        <IonIcon icon={logOutOutline} slot="start" />
                        <IonLabel>Déconnexion</IonLabel>
                      </IonItem>
                    </>
                  )}
                </IonMenuToggle>
              </IonList>
            </IonContent>
          </IonMenu>

          <IonPage id="main">
            <IonTabs>
              <IonRouterOutlet>
                <PublicRoute
                  path="/login"
                  component={LoginPage}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PublicRoute
                  path="/creation"
                  component={RegisterPage}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PublicRoute
                  path="/forgot-password"
                  component={ForgotPwd}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PublicRoute
                  path="/reset-password"
                  component={ResetPassword}
                  isAuthenticated={isAuthenticated}
                  exact
                />

                {/* Routes privées */}

                <PrivateRoute
                  path="/priorite"
                  component={Priorite}
                  isAuthenticated={isAuthenticated}
                  exact
                />

                <PrivateRoute
                  path="/calendrier"
                  component={Calendrier}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/taches"
                  component={Taches}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/deadlines"
                  component={Deadlinepage}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/chronometre"
                  component={StudyTimerPage}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/chronometre/:courseId"
                  component={StudyTimerPage}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/finances"
                  component={Finances}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/notifications"
                  component={Notifications}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/profil"
                  component={Profil}
                  isAuthenticated={isAuthenticated}
                  exact
                />
                <PrivateRoute
                  path="/cours"
                  component={CoursesPage}
                  isAuthenticated={isAuthenticated}
                  exact
                />

                <Route
                  path="/"
                  exact
                  render={() =>
                    isAuthenticated ? (
                      <Redirect to="/calendrier" />
                    ) : (
                      <Redirect to="/login" />
                    )
                  }
                />
              </IonRouterOutlet>

              {/*               {isAuthenticated && (
                <IonTabBar slot="bottom">
                  <IonTabButton tab="calendrier" href="/calendrier">
                    <IonIcon icon={calendarOutline} />
                    <IonLabel>Calendrier</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="cours" href="/cours">
                    <IonIcon icon={schoolOutline} />
                    <IonLabel>Cours</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="deadlines" href="/deadlines">
                    <IonIcon icon={timeOutline} />
                    <IonLabel>Deadlines</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="taches" href="/taches">
                    <IonIcon icon={checkboxOutline} />
                    <IonLabel>Tâches</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="notifications" href="/notifications">
                    <IonIcon icon={notificationsOutline} />
                    <IonLabel>Notifications</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="finances" href="/finances">
                    <IonIcon icon={walletOutline} />
                    <IonLabel>Finances</IonLabel>
                  </IonTabButton>

                  <IonTabButton tab="profil" href="/profil">
                    <IonIcon icon={personOutline} />
                    <IonLabel>Profil</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              )} */}
            </IonTabs>
          </IonPage>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
