import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import GetStartedComponent from '../components/GetStartedComponent';

const {
  FiBuilding, FiPalette, FiFileText, FiCreditCard, FiLogOut, FiX, FiBookOpen, FiRefreshCw, FiCheck,
  FiEdit2, FiTrash2, FiSave, FiPlus, FiEye, FiSettings, FiUser, FiMail, FiLock, FiStar, FiAlertCircle,
  FiDatabase, FiUsers
} = FiIcons;

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const { themeSettings } = useData();
  const {
    organizations, plans, payments, globalThemeSettings, loading,
    saveOrganization, saveSubscriptionPlan, saveGlobalThemeSettings,
    deleteOrganization, deleteSubscriptionPlan, refreshData
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('organizations');
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Organization Management
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    domain: '',
    contact: '',
    plan: 'Basic',
    managerName: '',
    managerEmail: '',
    managerEmailConfirm: '',
    managerPassword: '',
    changePassword: false
  });

  // Global Theme Settings
  const [globalThemeForm, setGlobalThemeForm] = useState(globalThemeSettings);

  // Subscription Plans
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    priceMonthly: '',
    priceYearly: '',
    features: [''],
    popular: false
  });

  // Payment Management
  const [showPaymentDetails, setShowPaymentDetails] = useState(null);

  // Update form when globalThemeSettings changes
  React.useEffect(() => {
    setGlobalThemeForm(globalThemeSettings);
  }, [globalThemeSettings]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Toegang Geweigerd</h1>
          <p className="text-gray-600 mb-4">Je hebt geen administratorrechten.</p>
          <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  // Organization Management Functions
  const handleAddOrganization = () => {
    setEditingOrg(null);
    setOrgForm({
      name: '',
      domain: '',
      contact: '',
      plan: plans.length > 0 ? plans[0].name : 'Basic',
      managerName: '',
      managerEmail: '',
      managerEmailConfirm: '',
      managerPassword: '',
      changePassword: false
    });
    setShowOrgForm(true);
  };

  const handleEditOrganization = (org) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      domain: org.domain,
      contact: org.contact,
      plan: org.plan,
      managerName: org.managerName || '',
      managerEmail: org.managerEmail || '',
      managerEmailConfirm: org.managerEmail || '',
      managerPassword: '',
      changePassword: false
    });
    setShowOrgForm(true);
  };

  const handleSaveOrganization = async () => {
    if (!orgForm.name || !orgForm.domain || !orgForm.contact) {
      alert('Naam, domein en contact zijn verplicht');
      return;
    }

    if (!orgForm.managerName || !orgForm.managerEmail) {
      alert('Manager naam en email zijn verplicht');
      return;
    }

    if (orgForm.managerEmail !== orgForm.managerEmailConfirm) {
      alert('Manager email adressen komen niet overeen');
      return;
    }

    if (!editingOrg && !orgForm.managerPassword) {
      alert('Manager wachtwoord is verplicht voor nieuwe organisaties');
      return;
    }

    if (editingOrg && orgForm.changePassword && !orgForm.managerPassword) {
      alert('Nieuw wachtwoord is verplicht wanneer wachtwoord wijzigen is aangevinkt');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orgForm.managerEmail)) {
      alert('Ongeldig manager email adres');
      return;
    }

    setSaving(true);
    try {
      const orgData = {
        ...orgForm,
        id: editingOrg?.id,
        status: editingOrg?.status || 'Actief',
        users: editingOrg?.users || 0,
        coaches: editingOrg?.coaches || 0,
        participants: editingOrg?.participants || 0,
        managerPassword: editingOrg && !orgForm.changePassword ? editingOrg.managerPassword : orgForm.managerPassword
      };

      await saveOrganization(orgData);
      setShowOrgForm(false);
      alert('Organisatie succesvol opgeslagen! Globale thema-instellingen zijn gekopieerd naar de nieuwe organisatie.');
    } catch (error) {
      console.error('Error saving organization:', error);
      alert(`Fout bij opslaan van organisatie: ${error.message || 'Onbekende fout'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    if (window.confirm('Weet je zeker dat je deze organisatie wilt verwijderen? Dit verwijdert ook alle gerelateerde data.')) {
      try {
        await deleteOrganization(orgId);
        alert('Organisatie succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting organization:', error);
        alert(`Fout bij verwijderen van organisatie: ${error.message || 'Onbekende fout'}`);
      }
    }
  };

  // Global Theme Functions
  const handleSaveGlobalTheme = async () => {
    setSaving(true);
    try {
      await saveGlobalThemeSettings(globalThemeForm);
      alert('Globale thema instellingen opgeslagen! Nieuwe organisaties krijgen deze instellingen automatisch.');
    } catch (error) {
      console.error('Error saving global theme:', error);
      alert(`Fout bij opslaan van globale thema instellingen: ${error.message || 'Onbekende fout'}`);
    } finally {
      setSaving(false);
    }
  };

  // Plan Management Functions
  const handleAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      priceMonthly: '',
      priceYearly: '',
      features: [''],
      popular: false
    });
    setShowPlanForm(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      priceMonthly: plan.priceMonthly.toString(),
      priceYearly: plan.priceYearly.toString(),
      features: [...plan.features],
      popular: plan.popular
    });
    setShowPlanForm(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.priceMonthly || !planForm.priceYearly) {
      alert('Naam, maandprijs en jaarprijs zijn verplicht');
      return;
    }

    const validFeatures = planForm.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      alert('Minimaal één feature is verplicht');
      return;
    }

    setSaving(true);
    try {
      const planData = {
        id: editingPlan?.id,
        name: planForm.name,
        priceMonthly: parseFloat(planForm.priceMonthly),
        priceYearly: parseFloat(planForm.priceYearly),
        features: validFeatures,
        popular: planForm.popular
      };

      await saveSubscriptionPlan(planData);
      setShowPlanForm(false);
      alert('Plan succesvol opgeslagen!');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(`Fout bij opslaan van plan: ${error.message || 'Onbekende fout'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Weet je zeker dat je dit plan wilt verwijderen?')) {
      try {
        await deleteSubscriptionPlan(planId);
        alert('Plan succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert(`Fout bij verwijderen van plan: ${error.message || 'Onbekende fout'}`);
      }
    }
  };

  const addFeatureField = () => {
    setPlanForm({ ...planForm, features: [...planForm.features, ''] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...planForm.features];
    newFeatures[index] = value;
    setPlanForm({ ...planForm, features: newFeatures });
  };

  const removeFeature = (index) => {
    const newFeatures = planForm.features.filter((_, i) => i !== index);
    setPlanForm({ ...planForm, features: newFeatures });
  };

  // Payment Functions
  const handleViewPayment = (payment) => {
    setShowPaymentDetails(payment);
  };

  const stats = {
    totalOrganizations: organizations.length,
    totalCoaches: organizations.reduce((sum, org) => sum + (org.coaches || 0), 0),
    totalParticipants: organizations.reduce((sum, org) => sum + (org.participants || 0), 0),
    totalUsers: organizations.reduce((sum, org) => sum + (org.users || 0), 0),
    monthlyRevenue: payments
      .filter(p => p.status === 'Betaald' && new Date(p.date).getMonth() === new Date().getMonth())
      .reduce((sum, p) => sum + p.amount, 0),
    yearlyRevenue: payments
      .filter(p => p.status === 'Betaald')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color-outer,#f3f4f6)' }}>
        <div className="flex items-center gap-3">
          <SafeIcon icon={FiRefreshCw} className="text-2xl text-blue-600 animate-spin" />
          <span className="text-lg">Laden van admin gegevens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color-outer,#f3f4f6)' }}>
      {/* App Header */}
      {(themeSettings.logoUrl || themeSettings.appName !== 'Coaching App') && (
        <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="py-2">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
               style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}>
            <div className="flex items-center gap-4">
              {themeSettings.logoUrl && (
                <img src={themeSettings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{themeSettings.appName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="min-h-screen">
        <div className={`mx-auto ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
             style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}>

          {/* Header */}
          <header style={{ backgroundColor: 'var(--header-bg-color,#ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Administrator Dashboard</h1>
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    <SafeIcon icon={FiCheck} className="text-xs" />
                    <span>Platform Admin</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowGetStarted(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiBookOpen} />
                    Aan de slag
                  </button>
                  <button
                    onClick={refreshData}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                    title="Gegevens vernieuwen"
                  >
                    <SafeIcon icon={FiRefreshCw} />
                    Vernieuwen
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <SafeIcon icon={FiLogOut} />
                    Uitloggen
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Database Setup Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <SafeIcon icon={FiDatabase} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Multi-Tenant Database</h3>
                  <p className="text-sm text-blue-700">
                    Elke organisatie heeft zijn eigen data. Nieuwe organisaties krijgen automatisch de globale thema-instellingen.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('organizations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'organizations' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'organizations' 
                  ? { backgroundColor: 'var(--button-bg-color,#3B82F6)' } 
                  : { backgroundColor: 'var(--bg-color-cards,#ffffff)' }
                }
              >
                <SafeIcon icon={FiBuilding} className="inline mr-2" />
                Organisaties
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'theme' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'theme' 
                  ? { backgroundColor: 'var(--button-bg-color,#3B82F6)' } 
                  : { backgroundColor: 'var(--bg-color-cards,#ffffff)' }
                }
              >
                <SafeIcon icon={FiPalette} className="inline mr-2" />
                Globaal Thema
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'plans' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'plans' 
                  ? { backgroundColor: 'var(--button-bg-color,#3B82F6)' } 
                  : { backgroundColor: 'var(--bg-color-cards,#ffffff)' }
                }
              >
                <SafeIcon icon={FiFileText} className="inline mr-2" />
                Plannen
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'payments' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'payments' 
                  ? { backgroundColor: 'var(--button-bg-color,#3B82F6)' } 
                  : { backgroundColor: 'var(--bg-color-cards,#ffffff)' }
                }
              >
                <SafeIcon icon={FiCreditCard} className="inline mr-2" />
                Betalingen
              </button>
            </div>

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Organisatie Beheer</h2>
                  <button
                    onClick={handleAddOrganization}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <SafeIcon icon={FiPlus} />
                    Organisatie Toevoegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizations.map((org) => (
                    <div key={org.id} className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <SafeIcon icon={FiBuilding} className="text-2xl text-blue-600" />
                        <h3 className="text-lg font-semibold">{org.name}</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Status:</span> {org.status}</p>
                        <div className="flex items-center gap-2">
                          <SafeIcon icon={FiUsers} className="text-gray-400" />
                          <span className="font-medium">Gebruikers:</span>
                          <span className="text-blue-600 font-semibold">{org.coaches || 0}</span>
                          <span className="text-gray-400">coaches,</span>
                          <span className="text-green-600 font-semibold">{org.participants || 0}</span>
                          <span className="text-gray-400">deelnemers</span>
                        </div>
                        <p><span className="font-medium">Plan:</span> {org.plan}</p>
                        <p><span className="font-medium">Domain:</span> {org.domain}</p>
                        <p><span className="font-medium">Manager:</span> {org.managerName}</p>
                        <p><span className="font-medium">Manager Email:</span> {org.managerEmail}</p>
                        <p><span className="font-medium">Aangemaakt:</span> {new Date(org.created).toLocaleDateString('nl-NL')}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <SafeIcon icon={FiEdit2} />
                          Bewerken
                        </button>
                        <button
                          onClick={() => alert(`Instellingen voor ${org.name}`)}
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                        >
                          <SafeIcon icon={FiSettings} />
                          Instellingen
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(org.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Updated Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                  <div className="rounded-lg shadow p-4" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Totaal Organisaties</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
                      </div>
                      <SafeIcon icon={FiBuilding} className="text-xl text-blue-600" />
                    </div>
                  </div>
                  <div className="rounded-lg shadow p-4" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Totaal Begeleiders</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalCoaches}</p>
                      </div>
                      <SafeIcon icon={FiUser} className="text-xl text-blue-600" />
                    </div>
                  </div>
                  <div className="rounded-lg shadow p-4" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Totaal Deelnemers</p>
                        <p className="text-2xl font-bold text-green-600">{stats.totalParticipants}</p>
                      </div>
                      <SafeIcon icon={FiUsers} className="text-xl text-green-600" />
                    </div>
                  </div>
                  <div className="rounded-lg shadow p-4" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Jaarlijkse Omzet</p>
                        <p className="text-2xl font-bold text-gray-900">€{stats.yearlyRevenue.toFixed(2)}</p>
                      </div>
                      <SafeIcon icon={FiFileText} className="text-xl text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Globale Standaard Thema Instellingen</h2>
                
                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Let op:</strong> Deze instellingen worden automatisch gekopieerd naar nieuwe organisaties. 
                      Bestaande organisaties behouden hun eigen thema-instellingen.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Standaard App Naam</label>
                      <input
                        type="text"
                        value={globalThemeForm.appName}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, appName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Standaard Logo URL</label>
                      <input
                        type="url"
                        value={globalThemeForm.logoUrl}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Outer Background</label>
                      <input
                        type="color"
                        value={globalThemeForm.backgroundColorOuter}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, backgroundColorOuter: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Container Background</label>
                      <input
                        type="color"
                        value={globalThemeForm.backgroundColorContainer}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, backgroundColorContainer: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cards Background</label>
                      <input
                        type="color"
                        value={globalThemeForm.backgroundColorCards}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, backgroundColorCards: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                      <input
                        type="color"
                        value={globalThemeForm.buttonBackgroundColor}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, buttonBackgroundColor: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Hover Color</label>
                      <input
                        type="color"
                        value={globalThemeForm.buttonHoverColor}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, buttonHoverColor: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Background</label>
                      <input
                        type="color"
                        value={globalThemeForm.headerBackgroundColor}
                        onChange={(e) => setGlobalThemeForm({ ...globalThemeForm, headerBackgroundColor: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveGlobalTheme}
                    disabled={saving}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Opslaan...' : 'Globale Standaarden Opslaan'}
                  </button>
                </div>
              </div>
            )}

            {/* Plans Tab - same as before */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Abonnement Plannen</h2>
                  <button
                    onClick={handleAddPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <SafeIcon icon={FiPlus} />
                    Plan Toevoegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-lg shadow p-4 relative ${plan.popular ? 'border-2 border-blue-500' : 'border'}`}
                      style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                            <SafeIcon icon={FiStar} />
                            Populair
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      </div>
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-gray-900">
                          €{plan.priceMonthly}<span className="text-sm font-normal text-gray-600">/maand</span>
                        </p>
                        <p className="text-lg font-semibold text-gray-700">
                          €{plan.priceYearly}<span className="text-sm font-normal text-gray-600">/jaar</span>
                        </p>
                      </div>
                      <ul className="space-y-1 text-xs text-gray-600 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab - same as before */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Betalingen & Facturering</h2>

                {/* Payment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Deze Maand</h3>
                    <p className="text-3xl font-bold text-green-600">€{stats.monthlyRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Betaalde facturen</p>
                  </div>
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Openstaand</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      €{payments.filter(p => p.status === 'Openstaand').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{payments.filter(p => p.status === 'Openstaand').length} facturen</p>
                  </div>
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Totaal</h3>
                    <p className="text-3xl font-bold text-blue-600">€{stats.yearlyRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Alle betalingen</p>
                  </div>
                </div>

                {/* Recent Payments Table */}
                <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Alle Betalingen</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organisatie</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {payment.organization}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.plan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{payment.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  payment.status === 'Betaald'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.date).toLocaleDateString('nl-NL')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleViewPayment(payment)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <SafeIcon icon={FiEye} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All modals remain the same as before... */}
      {/* Organization Form Modal */}
      {showOrgForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingOrg ? 'Organisatie Bewerken' : 'Nieuwe Organisatie'}
              </h3>
              <button
                onClick={() => setShowOrgForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            {!editingOrg && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Automatische Setup:</strong> Deze nieuwe organisatie krijgt automatisch de huidige globale thema-instellingen.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Organization Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Organisatie Gegevens</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organisatie Naam *</label>
                  <input
                    type="text"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domein *</label>
                  <input
                    type="text"
                    value={orgForm.domain}
                    onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact E-mail *</label>
                  <input
                    type="email"
                    value={orgForm.contact}
                    onChange={(e) => setOrgForm({ ...orgForm, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={orgForm.plan}
                    onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.name}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manager Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <SafeIcon icon={FiUser} />
                  Manager Gegevens
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam Manager *</label>
                  <input
                    type="text"
                    value={orgForm.managerName}
                    onChange={(e) => setOrgForm({ ...orgForm, managerName: e.target.value })}
                    placeholder="Jan de Vries"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Manager *</label>
                  <input
                    type="email"
                    value={orgForm.managerEmail}
                    onChange={(e) => setOrgForm({ ...orgForm, managerEmail: e.target.value })}
                    placeholder="manager@organisatie.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Email Manager *</label>
                  <input
                    type="email"
                    value={orgForm.managerEmailConfirm}
                    onChange={(e) => setOrgForm({ ...orgForm, managerEmailConfirm: e.target.value })}
                    placeholder="manager@organisatie.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                {editingOrg && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={orgForm.changePassword}
                        onChange={(e) => setOrgForm({ ...orgForm, changePassword: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Wachtwoord wijzigen</span>
                    </label>
                  </div>
                )}

                {(!editingOrg || orgForm.changePassword) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Wachtwoord {!editingOrg ? '*' : ''}
                    </label>
                    <input
                      type="password"
                      value={orgForm.managerPassword}
                      onChange={(e) => setOrgForm({ ...orgForm, managerPassword: e.target.value })}
                      placeholder="Minimaal 8 karakters"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Met deze gegevens kan de manager inloggen op het Manager Dashboard
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOrgForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveOrganization}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} className="inline mr-2" />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Plan Form Modal - same as before */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingPlan ? 'Plan Bewerken' : 'Nieuw Plan'}
              </h3>
              <button
                onClick={() => setShowPlanForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Naam *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prijs per maand (€) *</label>
                  <input
                    type="number"
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prijs per jaar (€) *</label>
                  <input
                    type="number"
                    value={planForm.priceYearly}
                    onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={planForm.popular}
                    onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <SafeIcon icon={FiStar} />
                    Populair plan (blauwe kader)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                {planForm.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Feature beschrijving"
                    />
                    {planForm.features.length > 1 && (
                      <button
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addFeatureField}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  + Feature toevoegen
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPlanForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                Annuleren
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} className="inline mr-2" />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Details Modal - same as before */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Betaling Details</h3>
              <button
                onClick={() => setShowPaymentDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Organisatie:</span> {showPaymentDetails.organization}
              </div>
              <div>
                <span className="font-medium">Plan:</span> {showPaymentDetails.plan}
              </div>
              <div>
                <span className="font-medium">Bedrag:</span> €{showPaymentDetails.amount.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    showPaymentDetails.status === 'Betaald'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {showPaymentDetails.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Datum:</span> {new Date(showPaymentDetails.date).toLocaleDateString('nl-NL')}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPaymentDetails(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Sluiten
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* GetStarted Modal - same as before */}
      {showGetStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Aan de slag</h3>
              <button
                onClick={() => setShowGetStarted(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <GetStartedComponent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;