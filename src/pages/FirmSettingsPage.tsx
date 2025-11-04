import React, { useState, useEffect, useRef } from 'react';
import { Building2, Mail, Phone, MapPin, Save, Upload, FileText, DollarSign, Users, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { firmsService, FirmSettings as ApiFirmSettings } from '../services/api/firms.service';
import AddressAutocomplete from '../components/AddressAutocomplete';

interface FirmSettings {
  id?: string;
  companyName: string;
  legalName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logoUrl: string;
  primaryColor: string;
  defaultInvoiceTerms: number;
  defaultInvoiceMessage: string;
}

const FirmSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<FirmSettings>({
    companyName: '',
    legalName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    logoUrl: '',
    primaryColor: '#2196f3',
    defaultInvoiceTerms: 30,
    defaultInvoiceMessage: 'Thank you for your business. Please remit payment by the due date.',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'billing'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFirmSettings();
  }, []);

  const loadFirmSettings = async () => {
    setLoading(true);
    const response = await firmsService.getFirmSettings();

    if (response.error) {
      toast.error(`Failed to load firm settings: ${response.error}`);
      setLoading(false);
      return;
    }

    if (response.data) {
      setSettings({
        id: response.data.id,
        companyName: response.data.firmName || '',
        legalName: response.data.legalName || '',
        address: response.data.address || '',
        address2: response.data.address2 || '',
        city: response.data.city || '',
        state: response.data.state || '',
        zipCode: response.data.zipCode || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        website: response.data.website || '',
        taxId: response.data.taxId || '',
        logoUrl: response.data.logoUrl || '',
        primaryColor: response.data.primaryColor || '#2196f3',
        defaultInvoiceTerms: response.data.defaultInvoiceTerms || 30,
        defaultInvoiceMessage: response.data.defaultInvoiceMessage || 'Thank you for your business. Please remit payment by the due date.',
      });
      setLogoPreview(response.data.logoUrl || null);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings.id) {
      toast.error('No firm ID found');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Saving firm settings...');

    const response = await firmsService.updateFirmSettings(settings.id, {
      firmName: settings.companyName,
      legalName: settings.legalName,
      address: settings.address,
      address2: settings.address2,
      city: settings.city,
      state: settings.state,
      zipCode: settings.zipCode,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      taxId: settings.taxId,
      primaryColor: settings.primaryColor,
      defaultInvoiceTerms: settings.defaultInvoiceTerms,
      defaultInvoiceMessage: settings.defaultInvoiceMessage,
    });

    if (response.error) {
      toast.error(response.error, { id: loadingToast });
    } else {
      toast.success('Firm settings saved successfully!', { id: loadingToast });
    }

    setSaving(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, SVG, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    handleLogoUpload(file);
  };

  const handleLogoUpload = async (file: File) => {
    if (!settings.id) {
      toast.error('No firm ID found');
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading('Uploading logo...');

    const response = await firmsService.uploadLogo(settings.id, file);

    if (response.error) {
      toast.error(response.error, { id: loadingToast });
      // Reset preview on error
      setLogoPreview(settings.logoUrl || null);
    } else if (response.data) {
      toast.success('Logo uploaded successfully!', { id: loadingToast });
      setSettings(prev => ({ ...prev, logoUrl: response.data!.logoUrl }));
    }

    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    if (!settings.id) {
      toast.error('No firm ID found');
      return;
    }

    const loadingToast = toast.loading('Removing logo...');

    const response = await firmsService.removeLogo(settings.id);

    if (response.error) {
      toast.error(response.error, { id: loadingToast });
    } else {
      toast.success('Logo removed successfully!', { id: loadingToast });
      setLogoPreview(null);
      setSettings(prev => ({ ...prev, logoUrl: '' }));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: '8px',
  } as React.CSSProperties;

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#2196f3' : 'transparent',
    color: isActive ? 'white' : '#64748b',
    border: 'none',
    borderBottom: isActive ? 'none' : '1px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s',
  });

  if (loading) {
    return (
      <ErrorBoundary level="page">
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#2196f3',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }} />
            Loading firm settings...
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>
          Firm Settings
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage your firm's information, branding, and default settings
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={tabButtonStyle(activeTab === 'general')}
        >
          <Building2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
          General Information
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          style={tabButtonStyle(activeTab === 'branding')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Branding
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          style={tabButtonStyle(activeTab === 'billing')}
        >
          <DollarSign size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Billing Defaults
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '32px',
      }}>
        {/* General Information Tab */}
        {activeTab === 'general' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1a202c' }}>
              Company Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Legal Name *</label>
                <input
                  type="text"
                  value={settings.legalName}
                  onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                <MapPin size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Street Address *
              </label>
              <AddressAutocomplete
                value={settings.address}
                onChange={(value) => setSettings({ ...settings, address: value })}
                onAddressSelect={(addressComponents) => {
                  // Auto-populate city, state, and zip when address is selected
                  setSettings({
                    ...settings,
                    address: addressComponents.street,
                    city: addressComponents.city,
                    state: addressComponents.state,
                    zipCode: addressComponents.zipCode
                  });
                }}
                placeholder="Start typing to search for addresses..."
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Address Line 2</label>
              <input
                type="text"
                value={settings.address2}
                onChange={(e) => setSettings({ ...settings, address2: e.target.value })}
                placeholder="Suite, Apt, Building, Floor (optional)"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>ZIP Code *</label>
                <input
                  type="text"
                  value={settings.zipCode}
                  onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', marginTop: '32px', color: '#1a202c' }}>
              Contact Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>
                  <Phone size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tax ID / EIN</label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1a202c' }}>
              Brand Identity
            </h2>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>Company Logo</label>
              <div style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
              }}>
                {logoPreview ? (
                  <div>
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '150px',
                        marginBottom: '16px',
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: uploading ? '#93c5fd' : '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        {uploading ? (
                          <>
                            <div style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid white',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite'
                            }} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Change Logo
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleRemoveLogo}
                        disabled={uploading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: 'white',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                      Upload your company logo
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        backgroundColor: uploading ? '#93c5fd' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {uploading ? (
                        <>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite'
                          }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Logo
                        </>
                      )}
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                  PNG, JPG, SVG, or WebP. Max 2MB. Transparent background preferred.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Primary Brand Color</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  style={{
                    width: '80px',
                    height: '40px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  style={{ ...inputStyle, width: '150px' }}
                />
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Used for invoices, reports, and branding
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Billing Defaults Tab */}
        {activeTab === 'billing' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1a202c' }}>
              Default Invoice Settings
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Default Payment Terms (Days)</label>
              <select
                value={settings.defaultInvoiceTerms}
                onChange={(e) => setSettings({ ...settings, defaultInvoiceTerms: parseInt(e.target.value) })}
                style={inputStyle}
              >
                <option value={15}>Net 15</option>
                <option value={30}>Net 30</option>
                <option value={45}>Net 45</option>
                <option value={60}>Net 60</option>
                <option value={90}>Net 90</option>
              </select>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Number of days until invoice payment is due
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Default Invoice Message</label>
              <textarea
                value={settings.defaultInvoiceMessage}
                onChange={(e) => setSettings({ ...settings, defaultInvoiceMessage: e.target.value })}
                placeholder="Enter a default message to appear on all invoices..."
                rows={4}
                style={{
                  ...inputStyle,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                This message will appear at the bottom of all generated invoices
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                Invoice Preview
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                These settings will be automatically applied when generating new invoices. You can override them for individual invoices during generation.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: saving ? '#93c5fd' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </ErrorBoundary>
  );
};

export default FirmSettingsPage;
