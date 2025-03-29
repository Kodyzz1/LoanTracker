import { useState } from 'react';
import './App.css';
import PaymentForm from './PaymentForm.jsx'; // Step 1: Import PaymentForm

function App() {
  const [totalAmount, setTotalAmount] = useState(7500); // Noted change: Initial state set to 7500
  const [payments, setPayments] = useState([]);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  // Step 2: Define the handler function to receive data from PaymentForm
  const addPaymentHandler = (paymentData) => {
    // Update the payments state immutably (create a new array)
    // Adds the new payment to the beginning of the list
    setPayments((prevPayments) => {
      return [paymentData, ...prevPayments];
    });
    // Console log to see the update (optional)
    console.log('Updated Payments:', [paymentData, ...payments]);
  };

  return (
    <div className="loan-tracker-app">
      <h1>My Loan Tracker</h1>

      <section className="loan-summary">
        <h2>Summary</h2>
        <div className="summary-details">
          <p>Total Loan Amount: ${totalAmount.toFixed(2)}</p>
          <p>Total Amount Paid: ${totalPaid.toFixed(2)}</p>
          <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p>
        </div>
      </section>

      <section className="add-payment-form">
        <h2>Add New Payment</h2>
        {/* Step 3: Render PaymentForm and pass the handler function as a prop */}
        <PaymentForm onAddPayment={addPaymentHandler} />
      </section>

      <section className="payment-history">
        <h2>Payment History</h2>
        {payments.length === 0 ? (
          <p>No payments logged yet.</p>
        ) : (
          <ul>
            {/* Using payment.id as key now that we generate one */}
            {payments.map((payment) => (
              <li key={payment.id}>
                Date: {payment.date}, Amount: ${payment.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;