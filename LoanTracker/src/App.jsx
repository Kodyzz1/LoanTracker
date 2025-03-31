import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import './App.css';
import PaymentForm from './PaymentForm.jsx';
import PaymentList from './PaymentList.jsx';

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

  // --- JSX ---
  return (
    <div className="loan-tracker-app">
      <h1>My Loan Tracker</h1>

      {/* Configuration Section */}
      <section className="loan-config">
          <h2>Configuration</h2>
          <div className="config-controls">
              <div className="config-control">
                  <label htmlFor="monthlyGoal">Monthly Goal ($)</label>
                  <input type="number" id="monthlyGoal" value={monthlyGoal} onChange={handleGoalChange} min="0" step="1" />
              </div>
              <div className="config-control">
                  <label htmlFor="dueDay">Payment Due Day (1-31)</label>
                  <input type="number" id="dueDay" value={dueDayInput} onChange={handleDueDayInputChange} onBlur={handleDueDayBlur} placeholder="1-31" min="1" max="31" step="1"/>
              </div>
          </div>
      </section>

      {/* Summary Section */}
      <section className="loan-summary">
        <h2>Summary</h2>
        <div className="summary-details">
          <p>Total Loan Amount: ${totalAmount.toFixed(2)}</p>
          <p>Total Amount Paid: ${totalPaid.toFixed(2)}</p>
          <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p>
        </div>
      </section>

      {/* Add Payment Section */}
      <section className="add-payment-form">
        <h2>Add New Payment</h2>
        <PaymentForm onAddPayment={addPaymentHandler} />
      </section>

      {/* Payment History Section */}
      <section className="payment-history">
        <h2>Payment History</h2>
        {isLoading && <p>Loading payments...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && (
          // Pass statuses object down
          <PaymentList
            items={payments}
            onDeletePayment={deletePaymentHandler}
            paymentStatuses={paymentStatuses} // *** Pass calculated statuses ***
          />
        )}
      </section>
    </div>
  );
}

export default App;