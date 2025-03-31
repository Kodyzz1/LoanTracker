import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import './App.css';
import PaymentForm from './PaymentForm.jsx';
import PaymentList from './PaymentList.jsx';
import Modal from './Modal.jsx';

// Define the base URL for our backend API
const API_URL = 'http://localhost:3001/api';

// localStorage Keys for settings
const LS_KEYS = {
  GOAL: 'loanTrackerMonthlyGoal',
  DUE_DAY: 'loanTrackerDueDay'
};

function App() {
  // --- Core Data State ---
  // eslint-disable-next-line no-unused-vars
  const [totalAmount, setTotalAmount] = useState(7500);
  const [payments, setPayments] = useState([]);

  // --- UI State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Configuration State ---
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const savedGoal = localStorage.getItem(LS_KEYS.GOAL);
    return savedGoal !== null ? JSON.parse(savedGoal) : 200; // Default goal: 200
  });

  const [dueDay, setDueDay] = useState(() => {
    const savedDueDay = localStorage.getItem(LS_KEYS.DUE_DAY);
    return savedDueDay !== null ? JSON.parse(savedDueDay) : 1; // Default due day: 1
  });

  // State for the due day input field's displayed value (string)
  const [dueDayInput, setDueDayInput] = useState(String(dueDay));
  const [editingPayment, setEditingPayment] = useState(null);

  // --- Effects ---

  // Fetch Initial Payments on Mount
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/payments`);
        if (!response.ok) {
          throw new Error(`HTTP error fetching payments! status: ${response.status}`);
        }
        const data = await response.json();
        setPayments(data);
      } catch (e) {
        console.error("Failed to fetch payments:", e);
        setError('Failed to load payment history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []); // Runs once on mount

  // Save Monthly Goal to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEYS.GOAL, JSON.stringify(monthlyGoal));
  }, [monthlyGoal]);

  // Save Due Day (numeric state) to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEYS.DUE_DAY, JSON.stringify(dueDay));
  }, [dueDay]);

  // Sync Due Day Input string state when numeric Due Day state changes
  useEffect(() => {
    setDueDayInput(String(dueDay));
  }, [dueDay]);


  // --- Calculations ---
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  // --- Calculate Payment Statuses (Memoized) --- // *** NEW Calculation ***
  const paymentStatuses = useMemo(() => {
    console.log('Calculating payment statuses...'); // For debugging
    const statuses = {}; // { paymentId: 'status' }
    const monthlyTotals = {}; // { 'YYYY-MM': total }

    // 1. Group payments and calculate monthly totals
    for (const payment of payments) {
      const monthYear = payment.date.substring(0, 7); // "YYYY-MM"
      monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + payment.amount;
    }

    // 2. Determine status for each payment
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    for (const payment of payments) {
      // Use try-catch for robust date parsing, although YYYY-MM-DD should be safe
      let paymentYear, paymentMonth;
      try {
         // Adding time ensures date isn't affected by timezone shifts near midnight
         const paymentDate = new Date(payment.date + 'T12:00:00Z');
         paymentYear = paymentDate.getUTCFullYear();
         paymentMonth = paymentDate.getUTCMonth() + 1; // 1-12
      } catch(e) {
          console.error("Error parsing payment date:", payment.date, e);
          statuses[payment.id] = 'pending'; // Default if date is invalid
          continue;
      }

      const monthYear = payment.date.substring(0, 7);
      const monthTotal = monthlyTotals[monthYear] || 0;

      let status = 'pending'; // Default status

      // Check if the payment's month is definitively in the past
      if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
        status = monthTotal >= monthlyGoal ? 'met' : 'missed';
      }
      // else: Payment is in the current or future month, status remains 'pending'

      statuses[payment.id] = status;
    }
    return statuses;
  }, [payments, monthlyGoal]); // Recalculate when payments or goal change


  // --- Handlers ---

  const addPaymentHandler = async (paymentDataFromForm) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentDataFromForm),
      });
      if (!response.ok) {
        let errorMsg = `HTTP error adding payment! status: ${response.status}`;
        try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_parseError) {}
        throw new Error(errorMsg);
      }
      const newPaymentFromServer = await response.json();
      setPayments((prevPayments) => [newPaymentFromServer, ...prevPayments]);
    } catch (e) { console.error("Failed to add payment:", e); setError(`Failed to add payment: ${e.message}`); }
  };

  const deletePaymentHandler = async (idToDelete) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/payments/${idToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        if (response.status === 404) throw new Error(`Payment not found.`);
        throw new Error(`HTTP error deleting payment! status: ${response.status}`);
      }
      setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== idToDelete));
    } catch (e) { console.error("Failed to delete payment:", e); setError(`Failed to delete payment: ${e.message}`); }
  };

  // Add these handler functions inside the App component

const handleStartEdit = (paymentToEdit) => {
    setEditingPayment(paymentToEdit);
    // TODO: Later, we'll add logic here to open an Edit Modal
    console.log("START EDITING:", paymentToEdit); // Check console for now
  };
  
  const handleCancelEdit = () => {
    setEditingPayment(null);
    console.log("CANCEL EDIT");
  };
  
  // Placeholder for saving the edit - will contain API call later
  const handleSaveEdit = async (updatedPaymentData) => {
    // updatedPaymentData will come from the Edit Form, e.g., { date, amount }
    if (!editingPayment) return; // Should not happen if modal logic is right
  
    console.log("SAVE EDIT - ID:", editingPayment.id, "New Data:", updatedPaymentData);
    // TODO: Implement fetch PUT/PATCH request to backend API
    // TODO: Update payments state array upon successful save
    // TODO: Close the Edit Modal
  
    // For now, just close the editing state
    setEditingPayment(null);
  };

  // Configuration Input Handlers
  const handleGoalChange = (event) => {
    const value = event.target.value;
    setMonthlyGoal(value === '' ? 0 : parseFloat(value) || 0);
  };
  const handleDueDayInputChange = (event) => { setDueDayInput(event.target.value); };
  const handleDueDayBlur = () => {
    const numericValue = parseInt(dueDayInput);
    if (dueDayInput === '' || isNaN(numericValue)) { setDueDay(1); setDueDayInput('1'); return; }
    const clampedDay = Math.max(1, Math.min(31, numericValue));
    setDueDay(clampedDay); setDueDayInput(String(clampedDay));
  };

  // --- Component Return / JSX ---
  return (
    <div className="loan-tracker-app">
      <h1>My Loan Tracker</h1>

      {/* --- Configuration Section --- */}
      <section className="loan-config">
          <h2>Configuration</h2>
          <div className="config-controls">
              <div className="config-control">
                  <label htmlFor="monthlyGoal">Monthly Goal ($)</label>
                  <input
                      type="number"
                      id="monthlyGoal"
                      value={monthlyGoal} // Bind to numeric goal state
                      onChange={handleGoalChange}
                      min="0"
                      step="1"
                  />
              </div>
              <div className="config-control">
                  <label htmlFor="dueDay">Payment Due Day (1-31)</label>
                  <input
                      type="number"
                      id="dueDay"
                      value={dueDayInput} // Bind to string input state
                      onChange={handleDueDayInputChange} // Update string state on change
                      onBlur={handleDueDayBlur} // Validate/update numeric state on blur
                      placeholder="1-31"
                      min="1" // Browser hints
                      max="31" // Browser hints
                      step="1"
                  />
              </div>
          </div>
      </section>

      {/* --- Summary Section --- */}
      <section className="loan-summary">
        <h2>Summary</h2>
        <div className="summary-details">
          <p>Total Loan Amount: ${totalAmount.toFixed(2)}</p>
          <p>Total Amount Paid: ${totalPaid.toFixed(2)}</p>
          <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p>
        </div>
      </section>

      {/* --- Add Payment Section --- */}
      <section className="add-payment-form">
        <h2>Add New Payment</h2>
        <PaymentForm onAddPayment={addPaymentHandler} />
      </section>

      {/* --- Payment History Section --- */}
      <section className="payment-history">
        <h2>Payment History</h2>
        {/* Display loading message */}
        {isLoading && <p className="loading-message">Loading payments...</p>}
        {/* Display error message */}
        {error && <p className="error-message">Error: {error}</p>}
        {/* Display payment list only if not loading and no error */}
        {!isLoading && !error && (
          <PaymentList
            items={payments}
            onDeletePayment={deletePaymentHandler}
            paymentStatuses={paymentStatuses}
            onEditPayment={handleStartEdit} // Pass edit handler
          />
        )}
      </section>

      {/* --- NEW: Conditionally Render Edit Modal --- */}
      {/* This renders only when editingPayment state holds a payment object */}
      {editingPayment && (
        <Modal onClose={handleCancelEdit}> {/* Pass cancel handler to Modal */}
          {/* Content for the Modal */}
          <h2>Edit Payment</h2>
          <p>Here we will put the edit form for payment ID: {editingPayment.id}</p>
          <p>Date: {editingPayment.date}, Amount: ${editingPayment.amount.toFixed(2)}</p>
          {/* Add placeholder buttons for now */}
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
             {/* Cancel button closes modal by calling handleCancelEdit */}
             <button type="button" onClick={handleCancelEdit} style={{ marginRight: '0.5rem' }}>Cancel</button>
             {/* Save button will eventually call handleSaveEdit */}
             {/* We pass placeholder data for now, will be form data later */}
             <button type="button" onClick={() => handleSaveEdit({ date: editingPayment.date, amount: editingPayment.amount })}>
               Save Changes (Placeholder)
            </button>
          </div>
        </Modal>
      )}
      {/* --- End Edit Modal --- */}

    </div>
  );
}

export default App;