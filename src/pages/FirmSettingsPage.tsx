import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Save, Upload, FileText, DollarSign, Users } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

interface FirmSettings {
  companyName: string;
  legalName: string;
  address: string;
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
    companyName: 'Your Firm Name',
    legalName: 'Your Firm Name, LLC',
    address: '123 Main Street, Suite 100',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '(555) 123-4567',
    email: 'billing@yourfirm.com',
    website: 'www.yourfirm.com',
    taxId: '12-3456789',
    logoUrl: '',
    primaryColor: '#2196f3',
    defaultInvoiceTerms: 30,
    defaultInvoiceMessage: 'Thank you for your business. Please remit payment by the due date.',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'billing'>('general');

  const handleSave = () => {
    // Save settings logic here
    alert('Firm settings saved successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
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
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
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
                {settings.logoUrl ? (
                  <div>
                    <img
                      src={settings.logoUrl}
                      alt="Company Logo"
                      style={{ maxWidth: '200px', maxHeight: '100px', marginBottom: '16px' }}
                    />
                    <div>
                      <label
                        htmlFor="logo-upload"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: '#2196f3',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} />
                        Change Logo
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                      Upload your company logo
                    </p>
                    <label
                      htmlFor="logo-upload"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Upload Logo
                    </label>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                  Recommended: PNG or JPG, max 2MB, transparent background preferred
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </ErrorBoundary>
  );
};

export default FirmSettingsPage;
