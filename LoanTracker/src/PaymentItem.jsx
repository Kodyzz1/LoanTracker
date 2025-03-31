// src/PaymentItem.jsx
import PropTypes from 'prop-types';
import './PaymentItem.css';

// Destructure props: { date, amount, id, onDelete, status }
function PaymentItem({ date, amount, id, onDelete, status }) {

  const deleteHandler = () => {
    onDelete(id);
  };

  // Construct class name based on status
  const itemClasses = `payment-item payment-item--${status || 'pending'}`;

  return (
    // Apply dynamic class name
    <li className={itemClasses}>
      <span className="payment-item__date">{date}</span>
      <span className="payment-item__amount">${amount.toFixed(2)}</span>
      <button onClick={deleteHandler} className="payment-item__delete-button">
        Delete
      </button>
    </li>
  );
}

PaymentItem.propTypes = {
  id: PropTypes.number.isRequired,
  date: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  status: PropTypes.string // Status prop is a string ('met', 'missed', 'pending')
};

export default PaymentItem;