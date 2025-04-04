// src/PaymentList.jsx
import PropTypes from 'prop-types';
import PaymentItem from './PaymentItem';
import './PaymentList.css';

// Destructure props: { items, onDeletePayment, paymentStatuses, onEditPayment }
function PaymentList({ items, onDeletePayment, paymentStatuses, onEditPayment }) {

  if (items.length === 0) {
    return <p className="payment-list__fallback">No payments logged yet.</p>;
  }

  return (
    <ul className="payment-list">
      {items.map((payment) => {
        const status = paymentStatuses[payment.id] || 'pending';

        return (
          <PaymentItem
            key={payment.id}
            payment={payment} // Pass the whole payment object
            status={status}
            onDelete={onDeletePayment} // Pass delete handler
            onEdit={onEditPayment}   // Pass edit handler
          />
        );
      })}
    </ul>
  );
}

PaymentList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string, // MongoDB ID (optional from fetch)
      id: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      serverTimestamp: PropTypes.string // Added by server
    })
  ).isRequired,
  onDeletePayment: PropTypes.func.isRequired,
  paymentStatuses: PropTypes.objectOf(PropTypes.string),
  onEditPayment: PropTypes.func.isRequired // Add prop type for edit handler
};
// Updated shape to include potential MongoDB _id and serverTimestamp

export default PaymentList;