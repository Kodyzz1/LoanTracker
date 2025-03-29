import { useState } from 'react'; // Only import useState
import PropTypes from 'prop-types'; // Import PropTypes
import './PaymentForm.css'; // Import associated CSS file

// Use prop destructuring { onAddPayment } in the function signature
function PaymentForm({ onAddPayment }) {
  // State for the input fields within this component
  const [enteredDate, setEnteredDate] = useState('');
  const [enteredAmount, setEnteredAmount] = useState('');

  // Handlers to update state when inputs change
  const dateChangeHandler = (event) => {
    setEnteredDate(event.target.value);
  };

  const amountChangeHandler = (event) => {
    setEnteredAmount(event.target.value);
  };

  // Handler for form submission
  const submitHandler = (event) => {
    event.preventDefault(); // Prevent default page reload

    // Basic validation
    if (!enteredDate || !enteredAmount || +enteredAmount <= 0) {
      alert('Please enter a valid date and a positive amount.');
      return;
    }

    // Create the payment data object
    const paymentData = {
      id: Date.now(), // Generate unique enough ID
      date: enteredDate,
      amount: +enteredAmount, // Convert amount string to a number
    };

    // === Crucial Line ===
    // Call the function passed via props, using the destructured variable
    // This line reads both 'onAddPayment' and 'paymentData'
    onAddPayment(paymentData);
    // ====================

    // Clear the form fields after submission
    setEnteredDate('');
    setEnteredAmount('');
  };

  // Return the form structure
  return (
    <form onSubmit={submitHandler}>
      <div className="payment-form__controls">
        <div className="payment-form__control">
          <label htmlFor="paymentDate">Date</label>
          <input
            id="paymentDate"
            type="date"
            value={enteredDate} // Two-way binding
            onChange={dateChangeHandler}
            required
          />
        </div>
        <div className="payment-form__control">
          <label htmlFor="paymentAmount">Amount</label>
          <input
            id="paymentAmount"
            type="number"
            min="0.01"
            step="0.01"
            value={enteredAmount} // Two-way binding
            onChange={amountChangeHandler}
            required
          />
        </div>
      </div>
      <div className="payment-form__actions">
        <button type="submit">Add Payment</button>
      </div>
    </form>
  );
}

// Define prop types (lowercase 'p' in 'propTypes')
PaymentForm.propTypes = {
  onAddPayment: PropTypes.func.isRequired // Prop name is the key
};

export default PaymentForm;