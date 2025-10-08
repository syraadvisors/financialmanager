import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, Building2, Save, Shield, Bell, Globe, Clock } from 'lucide-react';
import { UserProfile, UserProfileFormData, UserPreferencesFormData } from '../types/User';
import { usersService } from '../services/api/users.service';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

type TabType = 'profile' | 'preferences' | 'security';

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UserProfileFormData>({
    fullName: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    bio: ''
  });
  const [preferencesForm, setPreferencesForm] = useState<UserPreferencesFormData>({
    theme: 'light',
    notificationsEnabled: true,
    emailNotifications: true,
    language: 'en',
    timezone: 'America/New_York',
    rememberMe: false
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const response = await usersService.getCurrentUserProfile();

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    if (response.data) {
      setProfile(response.data);
      setProfileForm({
        fullName: response.data.fullName || '',
        jobTitle: response.data.jobTitle || '',
        department: response.data.department || '',
        phoneNumber: response.data.phoneNumber || '',
        bio: response.data.bio || ''
      });
      setPreferencesForm(response.data.preferences);
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const response = await usersService.updateProfile(profileForm);

    if (response.error) {
      setError(response.error);
    } else {
      setSuccessMessage('Profile updated successfully!');
      if (onSave) onSave();
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setSaving(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const response = await usersService.updatePreferences(preferencesForm);

    if (response.error) {
      setError(response.error);
    } else {
      setSuccessMessage('Preferences updated successfully!');
      if (onSave) onSave();
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#2196f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {profile?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                My Profile
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {profile?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          {[
            { id: 'profile' as TabType, label: 'Profile', icon: User },
            { id: 'preferences' as TabType, label: 'Preferences', icon: Bell },
            { id: 'security' as TabType, label: 'Security', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #2196f3' : '3px solid transparent',
                  color: isActive ? '#2196f3' : '#6b7280',
                  fontWeight: isActive ? '600' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading profile...
            </div>
          ) : error ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          ) : (
            <>
              {successMessage && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#d1fae5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  color: '#065f46',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {successMessage}
                </div>
              )}

              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Role Badge */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Shield size={16} color="#2563eb" />
                    <span style={{ fontSize: '14px', color: '#1e40af' }}>
                      Role: <strong style={{ textTransform: 'capitalize' }}>{profile?.role}</strong>
                    </span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Job Title */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <Briefcase size={16} />
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profileForm.jobTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                      placeholder="e.g., Financial Advisor"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <Building2 size={16} />
                      Department
                    </label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      placeholder="e.g., Wealth Management"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="(555) 123-4567"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Theme */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Theme
                    </label>
                    <select
                      value={preferencesForm.theme}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, theme: e.target.value as 'light' | 'dark' })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <Clock size={16} />
                      Timezone
                    </label>
                    <select
                      value={preferencesForm.timezone}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, timezone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="America/New_York">Eastern Time (US)</option>
                      <option value="America/Chicago">Central Time (US)</option>
                      <option value="America/Denver">Mountain Time (US)</option>
                      <option value="America/Los_Angeles">Pacific Time (US)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      <Globe size={16} />
                      Language
                    </label>
                    <select
                      value={preferencesForm.language}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, language: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  {/* Notifications Toggle */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={16} color="#6b7280" />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Enable Notifications
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.notificationsEnabled}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, notificationsEnabled: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Email Notifications Toggle */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="#6b7280" />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Email Notifications
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.emailNotifications}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, emailNotifications: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Remember Me Toggle */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        Remember Me
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Stay logged in for 30 days
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferencesForm.rememberMe}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, rememberMe: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Email Verification Status */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: profile?.emailVerified ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${profile?.emailVerified ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Mail size={16} color={profile?.emailVerified ? '#065f46' : '#991b1b'} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: profile?.emailVerified ? '#065f46' : '#991b1b'
                      }}>
                        Email Verification
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: profile?.emailVerified ? '#065f46' : '#991b1b',
                      margin: 0
                    }}>
                      {profile?.emailVerified
                        ? 'Your email address is verified'
                        : 'Your email address is not verified. Check your inbox for a verification link.'}
                    </p>
                  </div>

                  {/* MFA Status */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: profile?.mfaEnabled ? '#d1fae5' : '#fef3c7',
                    border: `1px solid ${profile?.mfaEnabled ? '#a7f3d0' : '#fde68a'}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Shield size={16} color={profile?.mfaEnabled ? '#065f46' : '#92400e'} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: profile?.mfaEnabled ? '#065f46' : '#92400e'
                      }}>
                        Multi-Factor Authentication (MFA)
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: profile?.mfaEnabled ? '#065f46' : '#92400e',
                      margin: '0 0 12px 0'
                    }}>
                      {profile?.mfaEnabled
                        ? 'MFA is enabled for your account'
                        : 'Add an extra layer of security to your account'}
                    </p>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onClick={() => alert('MFA setup will be implemented via Supabase Auth')}
                    >
                      {profile?.mfaEnabled ? 'Manage MFA' : 'Enable MFA'}
                    </button>
                  </div>

                  {/* Login History */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
                      Login History
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      <p style={{ margin: '4px 0' }}>
                        Last login: {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Total logins: {profile?.loginCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Save Button */}
        {!loading && !error && (activeTab === 'profile' || activeTab === 'preferences') && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={activeTab === 'profile' ? handleSaveProfile : handleSavePreferences}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: saving ? '#93c5fd' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
