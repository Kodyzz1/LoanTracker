import { useState } from 'react';
import './App.css';
import PaymentForm from './PaymentForm.jsx';
import PaymentList from './PaymentList.jsx'; // Step 1: Import PaymentList

function App() {
  const [totalAmount, setTotalAmount] = useState(7500);
  const [payments, setPayments] = useState([]);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  const addPaymentHandler = (paymentData) => {
    setPayments((prevPayments) => {
      return [paymentData, ...prevPayments];
    });
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
        <PaymentForm onAddPayment={addPaymentHandler} />
      </section>

      <section className="payment-history">
        <h2>Payment History</h2>
        {/* Step 2: Remove old list logic and render PaymentList */}
        <PaymentList items={payments} />
        {/* The conditional logic and mapping is now inside PaymentList */}
      </section>
    </div>
  );
}

export default App;