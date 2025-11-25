import "./Profil.css";
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonList,
  IonIcon,
  IonInput,
  IonAlert,
  IonSpinner,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import {
  createOutline,
  mailUnreadOutline,
  personOutline,
  phonePortraitOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { supabase } from "../services/supabase";
import { User } from "@supabase/supabase-js";

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const history = useHistory();

  const showError = (msg: string) => {
    setAlertMsg(msg);
    setShowAlert(true);
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        showError("Utilisateur non connecté. Veuillez vous reconnecter.");
        history.push("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("users")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erreur de chargement du profil :", error);
        showError("Impossible de charger votre profil.");
        return;
      }

      setFormData({
        full_name: data?.full_name || "",
        email: user.email || "",
        phone: data?.phone || "",
      });

      setIsLoading(false);
    };

    fetchProfile();
  }, [history]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const updates = {
      full_name: formData.full_name,
      phone: formData.phone,
    };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("Erreur de mise à jour complète :", error);
      showError(
        "Erreur Supabase : " + (error.message || "mise à jour échouée")
      );
    } else {
      setEditMode(false);
      setIsLoading(false);
      setAlertMsg("Profil mis à jour avec succès !");
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="neon-toolbar">
              <IonButtons slot="start">
                <IonMenuButton autoHide={false} />
              </IonButtons>
          <IonTitle>Mon Profil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="profile-page">
        {isLoading ? (
          <div className="profile-loading">
            <IonSpinner name="crescent" />
            <p>Chargement du profil...</p>
          </div>
        ) : (
          <>
            <div className="profile-avatar">
              <img
                src="https://www.gravatar.com/avatar?d=mp&s=200"
                alt="Avatar"
              />
            </div>

            {editMode ? (
              <>
                <IonList inset>
                  <IonItem>
                    <IonLabel position="stacked">Nom complet</IonLabel>
                    <IonInput
                      value={formData.full_name}
                      onIonChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.detail.value || "",
                        })
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Téléphone</IonLabel>
                    <IonInput
                      value={formData.phone}
                      onIonChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.detail.value || "",
                        })
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Courriel</IonLabel>
                    <IonInput value={formData.email} disabled />
                  </IonItem>
                </IonList>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={checkmarkOutline} slot="start" />
                      Enregistrer
                    </>
                  )}
                </IonButton>
              </>
            ) : (
              <>
                <h2 className="profile-title">
                  {formData.full_name || "Nom non défini"}
                </h2>
                <p className="profile-email">{formData.email}</p>

                <IonList inset>
                  <IonItem>
                    <IonIcon icon={personOutline} slot="start" />
                    <IonLabel>{formData.full_name || "—"}</IonLabel>
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={mailUnreadOutline} slot="start" />
                    <IonLabel>{formData.email}</IonLabel>
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={phonePortraitOutline} slot="start" />
                    <IonLabel>{formData.phone || "—"}</IonLabel>
                  </IonItem>
                </IonList>

                <IonButton
                  expand="block"
                  color="primary"
                  onClick={() => setEditMode(true)}
                >
                  <IonIcon icon={createOutline} slot="start" />
                  Modifier le profil
                </IonButton>
              </>
            )}
          </>
        )}

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

export default Profile;
