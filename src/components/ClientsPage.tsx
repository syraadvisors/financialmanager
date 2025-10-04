import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, UserCircle, Mail, Phone, DollarSign } from 'lucide-react';
import { Client, ClientStatus, EntityType, ClientFormData } from '../types/Client';
import ClientFormModal from './ClientFormModal';

const ClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Mock data for demonstration
  const mockClients: Client[] = [
    {
      id: '1',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-10-01'),
      fullLegalName: 'John Smith',
      taxIdType: 'SSN' as any,
      taxIdNumber: '***-**-1234',
      dateOfBirth: new Date('1965-03-20'),
      entityType: EntityType.INDIVIDUAL,
      primaryEmail: 'john.smith@email.com',
      mobilePhone: '(555) 123-4567',
      clientStatus: ClientStatus.ACTIVE,
      billingFrequency: 'Quarterly' as any,
      billingMethod: 'Debit from Account' as any,
      primaryAdvisor: 'Jane Advisor',
      clientSinceDate: new Date('2020-03-15'),
      doNotContact: false,
      doNotEmail: false,
      doNotCall: false,
      totalAUM: 2500000,
      numberOfAccounts: 3,
      totalAnnualFees: 25000,
    },
    {
      id: '2',
      createdAt: new Date('2023-06-10'),
      updatedAt: new Date('2024-09-28'),
      fullLegalName: 'Smith Family Trust',
      taxIdType: 'EIN' as any,
      taxIdNumber: '**-***5678',
      entityType: EntityType.TRUST,
      primaryEmail: 'trustee@smithfamily.com',
      mobilePhone: '(555) 234-5678',
      clientStatus: ClientStatus.ACTIVE,
      billingFrequency: 'Quarterly' as any,
      billingMethod: 'Invoice' as any,
      primaryAdvisor: 'Jane Advisor',
      clientSinceDate: new Date('2021-06-10'),
      doNotContact: false,
      doNotEmail: false,
      doNotCall: false,
      totalAUM: 5800000,
      numberOfAccounts: 5,
      totalAnnualFees: 52200,
    },
    {
      id: '3',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-09-15'),
      fullLegalName: 'Tech Startup LLC',
      taxIdType: 'EIN' as any,
      taxIdNumber: '**-***9012',
      entityType: EntityType.LLC,
      primaryEmail: 'cfo@techstartup.com',
      officePhone: '(555) 345-6789',
      clientStatus: ClientStatus.ACTIVE,
      billingFrequency: 'Annual' as any,
      billingMethod: 'Wire Transfer' as any,
      primaryAdvisor: 'Bob Consultant',
      clientSinceDate: new Date('2024-02-01'),
      doNotContact: false,
      doNotEmail: false,
      doNotCall: false,
      totalAUM: 1200000,
      numberOfAccounts: 2,
      totalAnnualFees: 14400,
    },
  ];

  const [clients, setClients] = useState<Client[]>(mockClients);

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      setClients(prev => prev.filter(c => c.id !== clientId));
    }
  };

  const handleSaveClient = (clientData: ClientFormData) => {
    if (clientData.id) {
      // Edit existing client
      setClients(prev => prev.map(c =>
        c.id === clientData.id
          ? { ...c, ...clientData, updatedAt: new Date() }
          : c
      ));
    } else {
      // Add new client
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        fullLegalName: clientData.fullLegalName,
        taxIdType: clientData.taxIdType,
        taxIdNumber: clientData.taxIdNumber,
        entityType: clientData.entityType,
        clientStatus: clientData.clientStatus,
        billingFrequency: clientData.billingFrequency,
        billingMethod: clientData.billingMethod,
        doNotContact: clientData.doNotContact,
        doNotEmail: clientData.doNotEmail,
        doNotCall: clientData.doNotCall,
      };
      setClients(prev => [...prev, newClient]);
    }
    setIsModalOpen(false);
    setEditingClient(null);
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

      {/* Clients Table */}
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
