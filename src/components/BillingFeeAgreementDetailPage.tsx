import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Tag,
  XCircle,
} from 'lucide-react';
import { BillingFeeAgreement } from '../types/BillingFeeAgreement';
import { FeeException, FeeExceptionType, FeeExceptionStatus } from '../types/FeeException';
import FeeExceptionFormModal from './FeeExceptionFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { feeExceptionsService } from '../services/api/feeExceptions.service';
import { useFirm } from '../contexts/FirmContext';

interface BillingFeeAgreementDetailPageProps {
  agreement: BillingFeeAgreement;
  onBack: () => void;
}

const BillingFeeAgreementDetailPage: React.FC<BillingFeeAgreementDetailPageProps> = ({
  agreement,
  onBack,
}) => {
  const { firmId } = useFirm();
  const [exceptions, setExceptions] = useState<FeeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<FeeException | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingException, setDeletingException] = useState<FeeException | null>(null);

  // Fetch fee exceptions for this agreement
  useEffect(() => {
    const fetchExceptions = async () => {
      setLoading(true);
      const response = await feeExceptionsService.getByAgreementId(agreement.id);

      if (response.data) {
        setExceptions(response.data);
      } else if (response.error) {
        console.error('Failed to fetch fee exceptions:', response.error);
      }

      setLoading(false);
    };

    fetchExceptions();
  }, [agreement.id]);

  const handleAddException = () => {
    setEditingException(null);
    setIsExceptionModalOpen(true);
  };

  const handleEditException = (exception: FeeException) => {
    setEditingException(exception);
    setIsExceptionModalOpen(true);
  };

  const handleDeleteException = (exception: FeeException) => {
    setDeletingException(exception);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteException = async () => {
    if (!deletingException) return;

    const response = await feeExceptionsService.delete(deletingException.id);

    if (response.error) {
      console.error('Failed to delete fee exception:', response.error);
      alert('Failed to delete fee exception');
      return;
    }

    setExceptions(prev => prev.filter(e => e.id !== deletingException.id));
    setIsDeleteModalOpen(false);
    setDeletingException(null);
  };

  const handleSaveException = async (exceptionData: any) => {
    if (!firmId) return;

    if (editingException) {
      // Update existing exception
      const response = await feeExceptionsService.update(editingException.id, exceptionData);
      if (response.data) {
        setExceptions(prev =>
          prev.map(e => (e.id === editingException.id ? response.data! : e))
        );
      } else if (response.error) {
        console.error('Failed to update fee exception:', response.error);
        alert('Failed to update fee exception');
        return;
      }
    } else {
      // Create new exception
      const response = await feeExceptionsService.create(agreement.id, firmId, exceptionData);
      if (response.data) {
        setExceptions(prev => [...prev, response.data!]);
      } else if (response.error) {
        console.error('Failed to create fee exception:', response.error);
        alert('Failed to create fee exception');
        return;
      }
    }

    setIsExceptionModalOpen(false);
    setEditingException(null);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: FeeExceptionStatus) => {
    const colors = {
      [FeeExceptionStatus.ACTIVE]: { bg: '#e8f5e9', color: '#2e7d32' },
      [FeeExceptionStatus.INACTIVE]: { bg: '#f5f5f5', color: '#999' },
      [FeeExceptionStatus.EXPIRED]: { bg: '#ffebee', color: '#c62828' },
    };
    return colors[status] || { bg: '#f5f5f5', color: '#666' };
  };

  const getExceptionTypeIcon = (type: FeeExceptionType) => {
    const iconProps = { size: 18 };
    switch (type) {
      case FeeExceptionType.MINIMUM_FEE:
        return <TrendingUp {...iconProps} />;
      case FeeExceptionType.MAXIMUM_FEE:
        return <TrendingDown {...iconProps} />;
      case FeeExceptionType.DEBIT_AMOUNT:
        return <Plus {...iconProps} />;
      case FeeExceptionType.CREDIT_AMOUNT:
        return <TrendingDown {...iconProps} />;
      case FeeExceptionType.PREMIUM_PERCENTAGE:
        return <Percent {...iconProps} />;
      case FeeExceptionType.DISCOUNT_PERCENTAGE:
        return <Percent {...iconProps} />;
      case FeeExceptionType.FUND_EXCLUSION:
        return <XCircle {...iconProps} />;
      case FeeExceptionType.DOLLAR_AMOUNT_EXCLUSION:
        return <DollarSign {...iconProps} />;
      default:
        return <Tag {...iconProps} />;
    }
  };

  const getExceptionValue = (exception: FeeException) => {
    switch (exception.exceptionType) {
      case FeeExceptionType.MINIMUM_FEE:
        return `Min: ${formatCurrency(exception.minimumFeeAmount)}`;
      case FeeExceptionType.MAXIMUM_FEE:
        return `Max: ${formatCurrency(exception.maximumFeeAmount)}`;
      case FeeExceptionType.DEBIT_AMOUNT:
        return `+${formatCurrency(exception.debitAmount)}`;
      case FeeExceptionType.CREDIT_AMOUNT:
        return `-${formatCurrency(exception.creditAmount)}`;
      case FeeExceptionType.PREMIUM_PERCENTAGE:
        return `+${exception.premiumPercentage}%`;
      case FeeExceptionType.DISCOUNT_PERCENTAGE:
        return `-${exception.discountPercentage}%`;
      case FeeExceptionType.FUND_EXCLUSION:
        return `${exception.excludedFundTickers?.length || 0} fund${
          (exception.excludedFundTickers?.length || 0) !== 1 ? 's' : ''
        }`;
      case FeeExceptionType.DOLLAR_AMOUNT_EXCLUSION:
        return `Exclude: ${formatCurrency(exception.excludedDollarAmount)}`;
      default:
        return '';
    }
  };

  // Get available accounts from the agreement
  const availableAccounts = (agreement.accountIds || []).map((id, index) => ({
    id,
    accountNumber: agreement.accountNumbers?.[index] || `Account ${index + 1}`,
    accountName: agreement.accountNames?.[index] || '',
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Billing Fee Agreements
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '8px',
              }}
            >
              {agreement.agreementNumber}
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Fee exceptions and adjustments for this billing agreement
            </p>
          </div>
          <button
            onClick={handleAddException}
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
            Add Exception
          </button>
        </div>
      </div>

      {/* Agreement Summary Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px',
          }}
        >
          Agreement Details
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              Fee Schedule
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {agreement.feeScheduleCode} - {agreement.feeScheduleName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              Relationship
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {agreement.relationshipName || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              Accounts
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {agreement.numberOfAccounts || 0} account
              {(agreement.numberOfAccounts || 0) !== 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              Billing Frequency
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {agreement.billingFrequency} ({agreement.billingMethod})
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Total Exceptions
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>
            {exceptions.length}
          </div>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {exceptions.filter(e => e.status === FeeExceptionStatus.ACTIVE).length}
          </div>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Inactive</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#999' }}>
            {exceptions.filter(e => e.status === FeeExceptionStatus.INACTIVE).length}
          </div>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Expired</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f44336' }}>
            {exceptions.filter(e => e.status === FeeExceptionStatus.EXPIRED).length}
          </div>
        </div>
      </div>

      {/* Exceptions List */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  TYPE
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  VALUE
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  APPLIES TO
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  EFFECTIVE DATES
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exception, index) => {
                const statusStyle = getStatusColor(exception.status);
                const accountCount = exception.accountIds.length;

                return (
                  <tr
                    key={exception.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666',
                          }}
                        >
                          {getExceptionTypeIcon(exception.exceptionType)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#333',
                            }}
                          >
                            {exception.exceptionType}
                          </div>
                          {exception.description && (
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {exception.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                        }}
                      >
                        {getExceptionValue(exception)}
                      </div>
                      {exception.exceptionType === FeeExceptionType.FUND_EXCLUSION &&
                        exception.excludedFundTickers && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#999',
                              marginTop: '4px',
                            }}
                          >
                            {exception.excludedFundTickers.slice(0, 3).join(', ')}
                            {exception.excludedFundTickers.length > 3 &&
                              `, +${exception.excludedFundTickers.length - 3} more`}
                          </div>
                        )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {accountCount === 0 ? (
                          <span style={{ fontWeight: '500' }}>All accounts</span>
                        ) : (
                          <>
                            {accountCount} account{accountCount !== 1 ? 's' : ''}
                          </>
                        )}
                      </div>
                      {accountCount > 0 && exception.accountNumbers && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '4px',
                          }}
                        >
                          {exception.accountNumbers.slice(0, 2).join(', ')}
                          {exception.accountNumbers.length > 2 &&
                            `, +${exception.accountNumbers.length - 2} more`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#666',
                        }}
                      >
                        <Calendar size={14} />
                        {formatDate(exception.effectiveDate)}
                      </div>
                      {exception.expirationDate && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '4px',
                            marginLeft: '20px',
                          }}
                        >
                          Until {formatDate(exception.expirationDate)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {exception.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleEditException(exception)}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Edit Exception"
                        >
                          <Edit2 size={16} color="#666" />
                        </button>
                        <button
                          onClick={() => handleDeleteException(exception)}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete Exception"
                        >
                          <Trash2 size={16} color="#f44336" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <p style={{ fontSize: '16px' }}>Loading fee exceptions...</p>
          </div>
        )}

        {!loading && exceptions.length === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No fee exceptions found</p>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Add exceptions to customize fee calculations for this agreement
            </p>
            <button
              onClick={handleAddException}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Add First Exception
            </button>
          </div>
        )}
      </div>

      {/* Fee Exception Form Modal */}
      <FeeExceptionFormModal
        isOpen={isExceptionModalOpen}
        onClose={() => {
          setIsExceptionModalOpen(false);
          setEditingException(null);
        }}
        onSubmit={handleSaveException}
        exception={editingException}
        agreementNumber={agreement.agreementNumber}
        availableAccounts={availableAccounts}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingException(null);
        }}
        onConfirm={confirmDeleteException}
        title="Delete Fee Exception"
        itemName={deletingException?.exceptionType || ''}
        warningMessage={
          deletingException?.accountIds && deletingException.accountIds.length > 0
            ? `This exception applies to ${deletingException.accountIds.length} specific account${
                deletingException.accountIds.length !== 1 ? 's' : ''
              }.`
            : 'This exception applies to all accounts in the agreement.'
        }
        impactList={[
          'Remove the fee exception',
          'Future fee calculations will not include this exception',
          'Historical calculations remain unchanged',
        ]}
        isDangerous={true}
      />
    </div>
  );
};

export default BillingFeeAgreementDetailPage;
