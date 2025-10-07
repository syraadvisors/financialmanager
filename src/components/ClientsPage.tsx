import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, UserCircle, Mail, Phone } from 'lucide-react';
import { Client, ClientStatus, EntityType, ClientFormData } from '../types/Client';
import ClientFormModal from './ClientFormModal';
import { clientsService } from '../services/api/clients.service';
import { checkSupabaseConnection } from '../lib/supabase';
import { useFirm } from '../contexts/FirmContext';

const ClientsPage: React.FC = () => {
  const { firmId, firm, loading: firmLoading } = useFirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients from Supabase on mount
  useEffect(() => {
    loadClients();
    checkSupabaseConnection();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientsService.getAll();

      if (response.error) {
        setError(response.error);
        console.error('Error loading clients:', response.error);
      } else {
        setClients(response.data || []);
      }
    } catch (err) {
      const errorMsg = 'Failed to load clients';
      setError(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      const response = await clientsService.delete(clientId);

      if (response.error) {
        alert('Failed to delete client: ' + response.error);
      } else {
        // Reload clients after successful delete
        await loadClients();
      }
    }
  };

  const handleSaveClient = async (clientData: ClientFormData) => {
    try {
      // Ensure firmId is set for multi-tenant data isolation
      if (!firmId) {
        alert('Firm ID is not available. Please refresh the page.');
        return;
      }

      if (clientData.id) {
        // Edit existing client
        const response = await clientsService.update(clientData.id, clientData);

        if (response.error) {
          alert('Failed to update client: ' + response.error);
          return;
        }
      } else {
        // Add new client - include firmId for multi-tenant isolation
        const response = await clientsService.create({
          ...clientData,
          firmId, // Link client to current firm
        });

        if (response.error) {
          alert('Failed to create client: ' + response.error);
          return;
        }
      }

      // Reload clients after successful save
      await loadClients();
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Error saving client:', err);
      alert('An unexpected error occurred while saving the client');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.fullLegalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.primaryEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || client.clientStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Client Management
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Manage client profiles, contact information, and billing preferences
          </p>
        </div>
        <button
          onClick={handleAddClient}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: '#666' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'ALL')}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={ClientStatus.ACTIVE}>Active</option>
            <option value={ClientStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Clients</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>{clients.length}</div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Active Clients</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {clients.filter(c => c.clientStatus === ClientStatus.ACTIVE).length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total AUM</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
            {formatCurrency(clients.reduce((sum, c) => sum + (c.totalAUM || 0), 0))}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Annual Fees</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0' }}>
            {formatCurrency(clients.reduce((sum, c) => sum + (c.totalAnnualFees || 0), 0))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ color: '#666', fontSize: '16px' }}>Loading clients from Supabase...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#856404', margin: 0 }}>
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={loadClients}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Clients Table */}
      {!loading && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>CLIENT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ENTITY TYPE</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>CONTACT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ADVISOR</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>AUM</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACCOUNTS</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ANNUAL FEES</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>STATUS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e3f2fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserCircle size={24} color="#2196f3" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                          {client.fullLegalName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Client since {formatDate(client.clientSinceDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {client.entityType}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {client.primaryEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666' }}>
                          <Mail size={14} />
                          {client.primaryEmail}
                        </div>
                      )}
                      {client.mobilePhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666' }}>
                          <Phone size={14} />
                          {client.mobilePhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {client.primaryAdvisor || 'N/A'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {formatCurrency(client.totalAUM)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                    {client.numberOfAccounts || 0}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#666' }}>
                    {formatCurrency(client.totalAnnualFees)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: client.clientStatus === ClientStatus.ACTIVE ? '#e8f5e9' :
                                     client.clientStatus === ClientStatus.PROSPECTIVE ? '#fff3e0' :
                                     '#f5f5f5',
                      color: client.clientStatus === ClientStatus.ACTIVE ? '#2e7d32' :
                            client.clientStatus === ClientStatus.PROSPECTIVE ? '#f57c00' :
                            '#999'
                    }}>
                      {client.clientStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditClient(client)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Edit Client"
                      >
                        <Edit2 size={16} color="#666" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete Client"
                      >
                        <Trash2 size={16} color="#f44336" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <UserCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No clients found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};

export default ClientsPage;
