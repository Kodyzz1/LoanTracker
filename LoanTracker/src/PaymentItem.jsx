import React from 'react';
import './PaymentItem.css'; // Import the CSS file

// This component receives props for date and amount
function PaymentItem(props) {
  return (
    <li className="payment-item">
      <span className="payment-item__date">{props.date}</span>
      <span className="payment-item__amount">${props.amount.toFixed(2)}</span>
      {/* We could add edit/delete buttons here later */}
    </li>
  );
}

export default PaymentItem;