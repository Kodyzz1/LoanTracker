import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './EditPaymentForm.css';

function EditPaymentForm({ payment, onSave, onCancel }) {
  // State for the form inputs, initialized later by useEffect
  const [enteredDate, setEnteredDate] = useState('');
  const [enteredAmount, setEnteredAmount] = useState('');

  // Effect to pre-fill the form when the 'payment' prop changes
  useEffect(() => {
    if (payment) {
      setEnteredDate(payment.date);
      // Ensure amount is treated as a string for the input value
      setEnteredAmount(String(payment.amount));
    }
  }, [payment]); // Re-run only if the payment object passed in changes

  // Input change handlers
  const dateChangeHandler = (event) => {
    setEnteredDate(event.target.value);
  };

  const amountChangeHandler = (event) => {
    setEnteredAmount(event.target.value);
  };

  // Form submission handler
  const submitHandler = (event) => {
    event.preventDefault(); // Prevent page reload

    // Basic validation
    if (!enteredDate || !enteredAmount || +enteredAmount <= 0) {
      alert('Please enter a valid date and a positive amount.');
      return;
    }

    // Create object with updated data (just date and amount)
    const updatedData = {
      date: enteredDate,
      amount: +enteredAmount, // Convert back to number
    };

    // Call the onSave handler passed from App.jsx
    onSave(updatedData);
  };

  return (
    // Use onSubmit for the save action
    <form onSubmit={submitHandler}>
      <div className="payment-form__controls"> {/* Reuse class names for similar styling */}
        <div className="payment-form__control">
          <label htmlFor="editPaymentDate">Date</label>
          <input
            id="editPaymentDate"
            type="date"
            value={enteredDate}
            onChange={dateChangeHandler}
            required
          />
        </div>
        <div className="payment-form__control">
          <label htmlFor="editPaymentAmount">Amount</label>
          <input
            id="editPaymentAmount"
            type="number"
            min="0.01"
            step="0.01"
            value={enteredAmount}
            onChange={amountChangeHandler}
            required
          />
        </div>
      </div>
      {/* Actions: Save (submit) and Cancel */}
      <div className="payment-form__actions" style={{ marginTop: '1rem' }}> {/* Reuse class name */}
        {/* Use type="button" for Cancel to prevent form submission */}
        <button type="button" onClick={onCancel} style={{ marginRight: '0.5rem' }}>
          Cancel
        </button>
        <button type="submit">Save Changes</button>
      </div>
    </form>
  );
}

EditPaymentForm.propTypes = {
  payment: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    serverTimestamp: PropTypes.string
  }).isRequired, // The payment object being edited
  onSave: PropTypes.func.isRequired, // Function to call when saving
  onCancel: PropTypes.func.isRequired // Function to call when cancelling
};

export default EditPaymentForm;