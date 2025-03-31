// src/PaymentList.jsx
import PropTypes from 'prop-types';
import PaymentItem from './PaymentItem';
import './PaymentList.css';

// Destructure props: { items, onDeletePayment, paymentStatuses }
function PaymentList({ items, onDeletePayment, paymentStatuses }) {

  if (items.length === 0) {
    return <p className="payment-list__fallback">No payments logged yet.</p>;
  }

  return (
    <ul className="payment-list">
      {items.map((payment) => {
        // Look up the status for this specific payment
        const status = paymentStatuses[payment.id] || 'pending'; // Default to pending if not found

        return (
          <PaymentItem
            key={payment.id}
            id={payment.id}
            date={payment.date}
            amount={payment.amount}
            onDelete={onDeletePayment}
            status={status} // Pass the calculated status down
          />
        );
      })}
    </ul>
  );
}

PaymentList.propTypes = {
  items: PropTypes.arrayOf(/* ... shape ... */).isRequired,
  onDeletePayment: PropTypes.func.isRequired,
  paymentStatuses: PropTypes.objectOf(PropTypes.string) // Statuses is an object { id: statusString }
};
// Make sure propTypes.objectOf(PropTypes.string) is okay, or use PropTypes.object

export default PaymentList;