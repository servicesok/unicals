import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { mail, lockClosed, logIn } from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const history = useHistory();

  const showError = (msg: string) => {
    setAlertMsg(msg);
    setShowAlert(true);
    setIsLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password)
      return showError("Veuillez remplir tous les champs.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return showError("Email invalide.");

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        const message = error.message.includes("Invalid login credentials")
          ? "Email ou mot de passe incorrect."
          : "Erreur : " + error.message;
        return showError(message);
      }

      // Connexion réussie → redirection vers la page calendrier
      history.push("/calendrier");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      showError("Erreur : " + message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="text-center font-bold">Connexion</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="login-bg">
        <div className="animated-bg"></div>
        <div className="login-container">
          <div className="login-card">
            <div className="logo">
              <div className="logo-circle">
                <IonIcon icon={logIn} size="large" color="white" />
              </div>
            </div>

            <h2 className="text-center mb-6">Bienvenue</h2>

            <IonItem className="mb-4">
              <IonIcon icon={mail} slot="start" />
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="exemple@gmail.com"
                onIonChange={(e) => setEmail(e.detail.value!)}
                disabled={isLoading}
              />
            </IonItem>

            <IonItem className="mb-6">
              <IonIcon icon={lockClosed} slot="start" />
              <IonLabel position="stacked">Mot de passe</IonLabel>
              <IonInput
                type="password"
                value={password}
                placeholder="******"
                onIonChange={(e) => setPassword(e.detail.value!)}
                disabled={isLoading}
              />
            </IonItem>

            <IonButton
              className="button-login"
              expand="block"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Se connecter"}
            </IonButton>

<div className="text-center mt-2">
  <IonButton
    fill="clear"
    routerLink="/forgot-password"
    routerDirection="forward"
    disabled={isLoading}
    size="small"
  >
    Mot de passe oublié ?
  </IonButton>
</div>

<div className="text-center mt-4">
  <IonButton
    fill="clear"
    routerLink="/creation"
    routerDirection="forward"
    disabled={isLoading}
  >
    Créer un compte
  </IonButton>
</div>
          </div>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          message={alertMsg}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
