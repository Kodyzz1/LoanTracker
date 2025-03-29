import React from 'react';
import PaymentItem from './PaymentItem'; // Import the PaymentItem component
import './PaymentList.css'; // Import the CSS file

// This component receives the list of payments as 'items' prop
function PaymentList(props) {

  // Conditional rendering: Show message if list is empty
  if (props.items.length === 0) {
    return <p className="payment-list__fallback">No payments logged yet.</p>;
  }

  // If list is not empty, render the list
  return (
    <ul className="payment-list">
      {props.items.map((payment) => (
        <PaymentItem
          key={payment.id} // Use the unique ID for the key
          date={payment.date}
          amount={payment.amount}
          // Pass any other payment details as props if needed later
        />
      ))}
    </ul>
  );
}

export default PaymentList;