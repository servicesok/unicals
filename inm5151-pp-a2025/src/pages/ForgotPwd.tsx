import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonPage,
  IonRouterLink,
  IonText,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonSpinner,
  IonIcon,
} from '@ionic/react';
import { mail } from 'ionicons/icons';
import { useState } from 'react';
import { supabase } from '../services/supabase';
import './ForgotPwd.css';

const ForgotPwd: React.FC = () => {
  const [email, setEmail] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const showMessage = (header: string, msg: string) => {
    setAlertHeader(header);
    setAlertMsg(msg);
    setShowAlert(true);
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return showMessage('Erreur', 'Veuillez entrer votre adresse email.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showMessage('Erreur', 'Adresse email invalide.');
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return showMessage('Erreur', error.message);
      }

      // Succès
      setEmailSent(true);
      showMessage(
        'Email envoyé',
        'Un email avec les instructions de réinitialisation a été envoyé à votre adresse.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      showMessage('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader><div className="title">
        <IonToolbar>
          
            <IonTitle>Logotype</IonTitle>
        
        </IonToolbar>  </div>
      </IonHeader>

<IonContent className="forgot-page ion-padding">
        <br />
        <div className="forgot-container">
  <IonText>
    <h1>Mot de passe oublié ?</h1>
  </IonText>
  <IonText color="medium">
    <p>
      {emailSent
        ? 'Vérifiez votre boîte mail pour les instructions.'
        : 'Entrez votre adresse email pour recevoir les instructions'}
    </p>
  </IonText>

  <form className="forme-forgot" onSubmit={handlePasswordReset}>
    <IonItem className="ion-no-padding">
      <IonIcon icon={mail} slot="start" />
      <IonInput
        label="E-mail"
        labelPlacement="floating"
        type="email"
        value={email}
        onIonChange={(e) => setEmail(e.detail.value!)}
        disabled={isLoading || emailSent}
        required
      />
    </IonItem>

    <IonButton
      expand="block"
      type="submit"
      className="forgot-button ion-margin-vertical"
      disabled={isLoading || emailSent}
    >
      {isLoading ? (
        <IonSpinner name="crescent" />
      ) : emailSent ? (
        'Email envoyé ✓'
      ) : (
        'Envoyer les instructions'
      )}
    </IonButton>
  </form>

  <IonText color="medium">
    <p>
      <IonRouterLink href="/login">Connexion</IonRouterLink>
    </p>
  </IonText>

  <IonAlert
    isOpen={showAlert}
    onDidDismiss={() => setShowAlert(false)}
    header={alertHeader}
    message={alertMsg}
    buttons={['OK']}
        />
        </div>
</IonContent>

    </IonPage>
  );
};

export default ForgotPwd;