import PropTypes from 'prop-types'; // Import PropTypes
import PaymentItem from './PaymentItem';
import './PaymentList.css';

// Destructure props to get 'items' directly
function PaymentList({ items }) {

  // Use 'items' directly now instead of props.items
  if (items.length === 0) {
    return <p className="payment-list__fallback">No payments logged yet.</p>;
  }

  // Map directly over 'items'
  return (
    <ul className="payment-list">
      {items.map((payment) => (
        <PaymentItem
          key={payment.id}
          date={payment.date}
          amount={payment.amount}
        />
      ))}
    </ul>
  );
}

// Define expected prop types
PaymentList.propTypes = {
  items: PropTypes.arrayOf( // items should be an array...
    PropTypes.shape({      // ...of objects with a specific shape:
      id: PropTypes.number.isRequired,      // - id (required number, from Date.now())
      date: PropTypes.string.isRequired,    // - date (required string)
      amount: PropTypes.number.isRequired // - amount (required number)
    })
  ).isRequired // The items array itself is required
};

export default PaymentList;