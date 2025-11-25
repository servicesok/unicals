import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonSpinner,
  IonIcon,
} from '@ionic/react';
import { lockClosed, checkmarkCircle } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const showMessage = (header: string, msg: string) => {
    setAlertHeader(header);
    setAlertMsg(msg);
    setShowAlert(true);
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return showMessage('Erreur', 'Veuillez remplir tous les champs.');
    }

    if (password.length < 6) {
      return showMessage('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
    }

    if (password !== confirmPassword) {
      return showMessage('Erreur', 'Les mots de passe ne correspondent pas.');
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        return showMessage('Erreur', error.message);
      }

      // Succès
      setAlertHeader('Succès');
      setAlertMsg('Votre mot de passe a été réinitialisé avec succès.');
      setShowAlert(true);

      // Redirection vers login après 2 secondes
      setTimeout(() => {
        history.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      showMessage('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Réinitialisation</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <br />
        <IonText>
          <h1>Nouveau mot de passe</h1>
        </IonText>
        <IonText color="medium">
          <p>Entrez votre nouveau mot de passe</p>
        </IonText>

        <form onSubmit={handleResetPassword}>
          <IonItem className="ion-no-padding ion-margin-bottom">
            <IonIcon icon={lockClosed} slot="start" />
            <IonInput
              label="Nouveau mot de passe"
              labelPlacement="floating"
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
              disabled={isLoading}
              required
            />
          </IonItem>

          <IonItem className="ion-no-padding">
            <IonIcon icon={checkmarkCircle} slot="start" />
            <IonInput
              label="Confirmer le mot de passe"
              labelPlacement="floating"
              type="password"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
              disabled={isLoading}
              required
            />
          </IonItem>

          <IonButton
            expand="block"
            type="submit"
            className="ion-margin-vertical"
            disabled={isLoading}
          >
            {isLoading ? <IonSpinner name="crescent" /> : 'Réinitialiser'}
          </IonButton>
        </form>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMsg}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;