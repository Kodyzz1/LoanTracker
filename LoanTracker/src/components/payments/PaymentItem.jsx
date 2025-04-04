// src/PaymentItem.jsx
import PropTypes from 'prop-types';
import './PaymentItem.css';

// Destructure props: { payment, status, onDelete, onEdit }
function PaymentItem({ payment, status, onDelete, onEdit }) {

  const deleteHandler = () => {
    // Pass the specific ID needed for delete
    onDelete(payment.id);
  };

  const startEditHandler = () => {
    // Pass the whole payment object needed for editing
    onEdit(payment);
  };

  const itemClasses = `payment-item payment-item--${status || 'pending'}`;

  return (
    <li className={itemClasses}>
      {/* Access data from payment object */}
      <span className="payment-item__date">{payment.date}</span>
      <span className="payment-item__amount">${payment.amount.toFixed(2)}</span>
      <div className="payment-item__actions"> {/* Wrap buttons */}
        <button onClick={startEditHandler} className="payment-item__edit-button">
          Edit
        </button>
        <button onClick={deleteHandler} className="payment-item__delete-button">
          Delete
        </button>
      </div>
    </li>
  );
}

PaymentItem.propTypes = {
  // Expect the whole payment object
  payment: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    serverTimestamp: PropTypes.string
  }).isRequired,
  status: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired // Add onEdit prop type
};

export default PaymentItem;