import React, { useState } from 'react'; // Import useState
import './PaymentForm.css'; // We'll create this CSS file later (optional)

function PaymentForm(props) {
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
    event.preventDefault(); // Prevent default page reload on submission

    // Basic validation
    if (!enteredDate || !enteredAmount || +enteredAmount <= 0) {
      alert('Please enter a valid date and a positive amount.');
      return;
    }

    // Create the payment data object
    const paymentData = {
      id: Date.now(), // Simple way to generate a unique enough ID for now
      date: enteredDate,
      amount: +enteredAmount, // Convert amount string to a number using '+'
    };

    // Pass the data up to the App component via the prop function
    props.onAddPayment(paymentData);

    // Clear the form fields after submission
    setEnteredDate('');
    setEnteredAmount('');
  };

  return (
    <form onSubmit={submitHandler}>
      <div className="payment-form__controls">
        <div className="payment-form__control">
          <label htmlFor="paymentDate">Date</label>
          <input
            id="paymentDate"
            type="date"
            value={enteredDate} // Bind state to input value
            onChange={dateChangeHandler} // Update state on change
            required // HTML5 validation
          />
        </div>
        <div className="payment-form__control">
          <label htmlFor="paymentAmount">Amount</label>
          <input
            id="paymentAmount"
            type="number"
            min="0.01" // Minimum value
            step="0.01" // Allow cents
            value={enteredAmount} // Bind state to input value
            onChange={amountChangeHandler} // Update state on change
            required // HTML5 validation
          />
        </div>
      </div>
      <div className="payment-form__actions">
        <button type="submit">Add Payment</button>
      </div>
    </form>
  );
}

export default PaymentForm;