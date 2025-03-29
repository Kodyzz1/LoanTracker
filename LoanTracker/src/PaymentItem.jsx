import PropTypes from 'prop-types'; // Import PropTypes
import './PaymentItem.css';

// Destructure props to get date and amount directly
function PaymentItem({ date, amount }) {
  return (
    <li className="payment-item">
      {/* Use the destructured variables */}
      <span className="payment-item__date">{date}</span>
      <span className="payment-item__amount">${amount.toFixed(2)}</span>
    </li>
  );
}

// Define expected prop types
PaymentItem.propTypes = {
  date: PropTypes.string.isRequired, // date should be a string and is required
  amount: PropTypes.number.isRequired // amount should be a number and is required
};

export default PaymentItem;