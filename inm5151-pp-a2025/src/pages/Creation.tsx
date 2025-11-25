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
} from "@ionic/react";
import { personAdd, mail, lockClosed, call, person } from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useHistory } from "react-router-dom";
import "./Creation.css";

const Creation: React.FC = () => {
  const history = useHistory();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef<HTMLIonContentElement>(null); // référence du IonContent

  const scrollToBottom = async () => {
    if (contentRef.current) {
      await contentRef.current.scrollToBottom(300); // 300ms animation
    }
  };

  // Scroll automatiquement si le clavier apparaît
  useEffect(() => {
    const handleResize = () => {
      // On scroll vers le bas pour rendre les champs visibles
      scrollToBottom();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCreation = async () => {
    setAlertMsg("");
    setIsLoading(true);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
      setAlertMsg("Tous les champs obligatoires doivent être remplis.");
      setShowAlert(true);
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAlertMsg("Email invalide.");
      setShowAlert(true);
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setAlertMsg("Les mots de passe ne correspondent pas.");
      setShowAlert(true);
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setAlertMsg("Mot de passe trop court (6+ caractères).");
      setShowAlert(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        setAlertMsg(
          authError.message.includes("already registered")
            ? "Cet email est déjà utilisé."
            : "Erreur : " + authError.message
        );
        setShowAlert(true);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from("users").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim() || null,
        });
      }

      setAlertMsg("Compte créé avec succès ! Redirection...");
      setShowAlert(true);

      // On connecte automatiquement l'utilisateur et redirige vers calendrier
      history.replace("/calendrier");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setAlertMsg("Erreur : " + message);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = async () => {
    if (contentRef.current) {
      await contentRef.current.scrollToBottom(300); // scroll avec animation
    }
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="text-center font-bold">
            Création de compte
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        scrollEvents={true}
        ref={contentRef}
      >
        <div className="animated-bg"></div>

        <div className="creation-container">
          <div className="creation-card">
            <div className="logo">
              <div className="logo-circle">
                <IonIcon icon={personAdd} size="large" color="white" />
              </div>
            </div>

            <h2 className="text-center mb-6">Créer un compte</h2>

            <IonItem>
              <IonIcon icon={person} slot="start" />
              <IonLabel position="stacked">Prénom *</IonLabel>
              <IonInput
                value={firstName}
                onIonChange={(e) => setFirstName(e.detail.value || "")}
                placeholder="Jean"
                disabled={isLoading}
                onFocus={handleFocus}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={person} slot="start" />
              <IonLabel position="stacked">Nom *</IonLabel>
              <IonInput
                value={lastName}
                onIonChange={(e) => setLastName(e.detail.value || "")}
                placeholder="Dupont"
                disabled={isLoading}
                onFocus={scrollToBottom}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={mail} slot="start" />
              <IonLabel position="stacked">Email *</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value || "")}
                placeholder="exemple@gmail.com"
                disabled={isLoading}
                onFocus={scrollToBottom}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={call} slot="start" />
              <IonLabel position="stacked">Téléphone (optionnel)</IonLabel>
              <IonInput
                type="tel"
                value={phone}
                onIonChange={(e) => setPhone(e.detail.value || "")}
                placeholder="+33612345678"
                disabled={isLoading}
                onFocus={scrollToBottom}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={lockClosed} slot="start" />
              <IonLabel position="stacked">Mot de passe *</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value || "")}
                placeholder="******"
                disabled={isLoading}
                onFocus={scrollToBottom}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={lockClosed} slot="start" />
              <IonLabel position="stacked">Confirmer *</IonLabel>
              <IonInput
                type="password"
                value={confirm}
                onIonChange={(e) => setConfirm(e.detail.value || "")}
                placeholder="******"
                disabled={isLoading}
                onFocus={scrollToBottom}
              />
            </IonItem>

            <IonButton className="button-creation"
              expand="block"
              onClick={handleCreation}
              disabled={isLoading}
            >
              {isLoading ? "Création..." : "Créer"}
            </IonButton>

            <div className="text-center mt-4">
              <IonButton fill="clear" routerLink="/login" disabled={isLoading}>
                Déjà un compte ? Se connecter
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

export default Creation;
