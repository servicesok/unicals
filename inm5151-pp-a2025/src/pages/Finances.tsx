import React, { useState, useEffect } from 'react';
import {
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle,
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonInput,
  IonSelect, 
  IonSelectOption, 
  IonCard, 
  IonCardContent, 
  IonCardHeader,
  IonCardTitle, 
  IonList, 
  IonBadge, 
  IonTextarea, 
  IonItemSliding,
  IonItemOptions, 
  IonItemOption, 
  IonActionSheet, 
  IonNote, 
  IonSegment,
  IonSegmentButton, 
  IonGrid, 
  IonRow, 
  IonCol
} from '@ionic/react';

import { 
  addOutline, cashOutline, refreshOutline, pencil, trashOutline, 
  walletOutline, trendingDownOutline, trendingUpOutline 
} from 'ionicons/icons';

import './Finances.css';

// API Imports
import { listRevenues, createRevenue, updateRevenue, deleteRevenue, Revenue } from '../api/revenus.supabase';
import { listDepenses, createDepense, updateDepense, deleteDepense, Depense } from '../api/depenses.supabase';

const Finances: React.FC = () => {
  // --- ÉTATS ---
  const [view, setView] = useState<'revenus' | 'depenses'>('revenus'); // Pour gérer l'onglet actif
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Depense[]>([]);

  // Formulaire
  const [type, setType] = useState<string>(''); 
  const [montant, setMontant] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [description, setDescription] = useState<string>('');
  const [recurrence, setRecurrence] = useState<string>('unique');
  
  // Édition / Actions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  // Reset du type par défaut quand on change d'onglet
  useEffect(() => {
    if (!editingId) {
      setType(view === 'revenus' ? 'salaire' : 'loyer');
    }
  }, [view, editingId]);

  const loadData = async () => {
    try {
      const [revData, expData] = await Promise.all([listRevenues(), listDepenses()]);
      setRevenues(revData as unknown as Revenue[]);
      setExpenses(expData as unknown as Depense[]);
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  };

  // LOGIQUE SAUVEGARDE
  const handleSave = async () => {
    if (!montant || parseFloat(montant) <= 0) return alert('Montant invalide');

    const formData = {
      type,
      montant: parseFloat(montant),
      date,
      description: description || undefined,
      recurrence
    };

    try {
      if (view === 'revenus') {
        if (editingId) {
          const updated = await updateRevenue(editingId, formData as any);
          setRevenues(revenues.map(r => r.id === editingId ? { ...r, ...updated } as Revenue : r));
        } else {
          const created = await createRevenue(formData as any);
          setRevenues([...revenues, created as unknown as Revenue]);
        }
      } else {
        // Logique DEPENSES
        if (editingId) {
          const updated = await updateDepense(editingId, formData as any);
          setExpenses(expenses.map(e => e.id === editingId ? { ...e, ...updated } as Depense : e));
        } else {
          const created = await createDepense(formData as any);
          setExpenses([...expenses, created as unknown as Depense]);
        }
      }
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ?')) return;
    try {
      if (view === 'revenus') {
        await deleteRevenue(id);
        setRevenues(revenues.filter(r => r.id !== id));
      } else {
        await deleteDepense(id);
        setExpenses(expenses.filter(e => e.id !== id));
      }
      if (editingId === id) resetForm();
      setShowActionSheet(false);
    } catch (e) { alert("Erreur suppression"); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setType(item.type);
    setMontant(item.montant.toString());
    setDate(item.date);
    setDescription(item.description || '');
    setRecurrence(item.recurrence);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setMontant('');
    setDescription('');
    setDate(new Date().toISOString());
    setType(view === 'revenus' ? 'salaire' : 'loyer');
    setRecurrence('unique');
  };

  // CALCULS
  const totalRevenus = revenues.reduce((sum, r) => sum + r.montant, 0);
  const totalDepenses = expenses.reduce((sum, d) => sum + d.montant, 0);
  const solde = totalRevenus - totalDepenses;
  const currentList = view === 'revenus' ? revenues : expenses;

  const getLabel = (val: string) => {
    const map: any = {
      salaire: 'Salaire', aide_familiale: 'Aide fam.', projet_personnel: 'Projet', bourse: 'Bourse',
      loyer: 'Loyer', alimentation: 'Alimentation', transport: 'Transport', etudes: 'Frais de scolarité',
      autre: 'Autre', unique: 'Une fois', mensuel: 'Mensuel'
    };
    return map[val] || val;
  };

  // Couleurs dynamiques selon la vue
  const themeColor = view === 'revenus' ? '#4facfe' : '#eb445a'; 
  const cardBg = view === 'revenus' ? 'white' : '#222'; 
  const cardText = view === 'revenus' ? 'black' : 'white';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-finances">
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} />
          </IonButtons>
          <IonTitle className="ion-text-center">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <IonIcon icon={cashOutline} /> 
              Finances
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={loadData}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="finances-content" style={{ '--background': '#f0f2f5' }}>
        <div style={{ padding: '15px' }}>
          
          {/* --- 1. DASHBOARD HEADER (Les 3 cartes) --- */}
          <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
            <IonRow>
              <IonCol size="4">
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '15px', padding: '15px', color: 'white', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Revenus</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalRevenus.toFixed(2)} $</div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '15px', padding: '15px', color: 'white', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Dépenses</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalDepenses.toFixed(2)} $</div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div style={{ background: solde >= 0 ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', borderRadius: '15px', padding: '15px', color: '#333', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Solde</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{solde.toFixed(2)} $</div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* --- 2. ONGLETS (SEGMENTS) --- */}
          <IonSegment value={view} onIonChange={e => setView(e.detail.value as any)} mode="md" style={{ background: 'transparent', marginBottom: '15px' }}>
            <IonSegmentButton value="revenus" style={{ '--indicator-color': '#4facfe', '--color-checked': '#4facfe' }}>
              <IonLabel style={{ fontWeight: 'bold' }}><IonIcon icon={walletOutline} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> REVENUS</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="depenses" style={{ '--indicator-color': '#eb445a', '--color-checked': '#eb445a' }}>
              <IonLabel style={{ fontWeight: 'bold' }}><IonIcon icon={trendingDownOutline} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> DÉPENSES</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* 3. FORMULAIRE*/}
          <IonCard style={{ 
            background: 'white', 
            color: 'black',    
            borderRadius: '16px',
            marginBottom: '25px'
          }}>
            <IonCardHeader>
              <IonCardTitle style={{ color: 'black', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={addOutline} style={{ marginRight: '8px' }} /> 
                {editingId ? 'Modifier' : 'Ajouter'} {view === 'revenus' ? 'un revenu' : 'une dépense'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList style={{ background: 'transparent' }}>
                
                {/* Type */}
                <IonItem style={{ '--background': 'transparent', '--color': 'black' }}>
                  <IonLabel position="stacked" style={{ color: '#666' }}>Type de {view === 'revenus' ? 'revenu' : 'dépense'} *</IonLabel>
                  <IonSelect value={type} onIonChange={e => setType(e.detail.value)} interface="popover" style={{ color: 'black' }}>
                    {view === 'revenus' ? (
                      <>
                        <IonSelectOption value="salaire">💼 Salaire</IonSelectOption>
                        <IonSelectOption value="aide_familiale">👨‍👩‍👧 Aide familiale</IonSelectOption>
                        <IonSelectOption value="projet_personnel">🚀 Projet personnel</IonSelectOption>
                        <IonSelectOption value="bourse">🎓 Bourse</IonSelectOption>
                        <IonSelectOption value="autre">📌 Autre</IonSelectOption>
                      </>
                    ) : (
                      <>
                        <IonSelectOption value="etudes">🎓 Frais de scolarité</IonSelectOption>
                        <IonSelectOption value="loyer">🏠 Loyer</IonSelectOption>
                        <IonSelectOption value="alimentation">🛒 Alimentation</IonSelectOption>
                        <IonSelectOption value="transport">🚌 Transport</IonSelectOption>
                        <IonSelectOption value="autre">📌 Autre</IonSelectOption>
                      </>
                    )}
                  </IonSelect>
                </IonItem>

                {/* Montant */}
                <IonItem style={{ '--background': 'transparent', '--color': 'black' }}>
                  <IonLabel position="stacked" style={{ color: '#666' }}>Montant ($) *</IonLabel>
                  <IonInput type="number" value={montant} onIonChange={e => setMontant(e.detail.value!)} placeholder="Ex: 500" style={{ color: 'black' }} />
                </IonItem>

                {/* Date */}
                <IonItem style={{ '--background': 'transparent', '--color': 'black' }}>
                  <IonLabel position="stacked" style={{ color: '#666' }}>Date *</IonLabel>
                  <IonInput type="date" value={date.split('T')[0]} onIonChange={e => setDate(e.detail.value + 'T00:00:00')} style={{ color: 'black' }} />
                </IonItem>

                {/* Récurrence */}
                <IonItem style={{ '--background': 'transparent', '--color': 'black' }}>
                  <IonLabel position="stacked" style={{ color: '#666' }}>Récurrence</IonLabel>
                  <IonSelect value={recurrence} onIonChange={e => setRecurrence(e.detail.value)} interface="popover" style={{ color: 'black' }}>
                    <IonSelectOption value="unique">Une fois</IonSelectOption>
                    <IonSelectOption value="mensuel">Mensuel</IonSelectOption>
                    <IonSelectOption value="hebdomadaire">Hebdomadaire</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Description */}
                <IonItem lines="none" style={{ '--background': 'transparent', '--color': 'black' }}>
                  <IonLabel position="stacked" style={{ color: '#666' }}>Description (optionnel)</IonLabel>
                  <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} placeholder="Ex: Session Automne 2024" style={{ color: 'black' }} />
                </IonItem>
              </IonList>

              <IonButton expand="block" onClick={handleSave} style={{ marginTop: '15px', '--background': themeColor }}>
                {editingId ? 'MODIFIER' : 'AJOUTER'}
              </IonButton>
              {editingId && <IonButton expand="block" color="medium" onClick={resetForm}>Annuler</IonButton>}
            </IonCardContent>
          </IonCard>

          {/* 4. LISTE DES DONNÉES */}
          <h3 style={{ marginLeft: '10px', color: '#222', display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={view === 'revenus' ? cashOutline : trendingDownOutline} style={{ marginRight: '8px' }} />
            Mes {view === 'revenus' ? 'revenus' : 'dépenses'}
          </h3>

          <IonList inset style={{ borderRadius: '16px' }}>
            {currentList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Aucune donnée</div>
            ) : (
              currentList.map((item) => (
                <IonItemSliding key={item.id}>
                  <IonItemOptions side="start">
                    <IonItemOption color="warning" onClick={() => handleEdit(item)}>
                      <IonIcon icon={pencil} slot="icon-only" />
                    </IonItemOption>
                  </IonItemOptions>

                  <IonItem button onClick={() => { setSelectedItemId(item.id); setShowActionSheet(true); }}>
                    <IonLabel>
                      <h2>{getLabel(item.type)}</h2>
                      <p>{new Date(item.date).toLocaleDateString()} • {getLabel(item.recurrence)}</p>
                      {item.description && <p style={{ fontSize: '0.8em', opacity: 0.7 }}>{item.description}</p>}
                    </IonLabel>
                    <div slot="end" style={{ fontWeight: 'bold', color: view === 'revenus' ? '#2dd36f' : '#eb445a' }}>
                      {item.montant.toFixed(2)} $
                    </div>
                  </IonItem>

                  <IonItemOptions side="end">
                    <IonItemOption color="danger" onClick={() => handleDelete(item.id)}>
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))
            )}
          </IonList>
        </div>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            { text: 'Modifier', icon: pencil, handler: () => {
              const item = view === 'revenus' ? revenues.find(r => r.id === selectedItemId) : expenses.find(e => e.id === selectedItemId);
              if (item) handleEdit(item);
            }},
            { text: 'Supprimer', role: 'destructive', icon: trashOutline, handler: () => { if (selectedItemId) handleDelete(selectedItemId); }},
            { text: 'Annuler', role: 'cancel' }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Finances;