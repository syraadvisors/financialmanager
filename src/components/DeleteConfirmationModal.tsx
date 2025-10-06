import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  warningMessage?: string;
  impactList?: string[];
  isDangerous?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  warningMessage,
  impactList,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
        width: '540px',
        maxWidth: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDangerous ? '#ffebee' : '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} color={isDangerous ? '#f44336' : '#ff9800'} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Item being deleted */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              {itemName}
            </div>
          </div>

          {/* Warning message */}
          {warningMessage && (
            <div style={{
              padding: '16px',
              backgroundColor: isDangerous ? '#ffebee' : '#fff3e0',
              border: `1px solid ${isDangerous ? '#ffcdd2' : '#ffb74d'}`,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '14px',
                color: isDangerous ? '#c62828' : '#e65100',
                lineHeight: '1.6'
              }}>
                {warningMessage}
              </div>
            </div>
          )}

          {/* Impact list */}
          {impactList && impactList.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#333'
              }}>
                This action will:
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '24px',
                listStyle: 'none'
              }}>
                {impactList.map((impact, index) => (
                  <li key={index} style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '8px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '-16px',
                      color: '#2196f3'
                    }}>•</span>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation message */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#666',
              fontWeight: 'bold'
            }}>
              Are you sure you want to continue?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#666'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: isDangerous ? '#f44336' : '#ff9800',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
