import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './hooks/useAuth'; // Ensure path is correct
import LoginForm from './components/auth/LoginForm.jsx'; // Ensure path is correct
import RegisterForm from './components/auth/RegisterForm.jsx'; // Import RegisterForm
import PaymentForm from './components/payments/PaymentForm.jsx'; // Ensure path is correct
import PaymentList from './components/Payments/PaymentList.jsx'; // Ensure path is correct
import Modal from './components/UI/Modal.jsx'; // Ensure path is correct
import EditPaymentForm from './components/payments/EditPaymentForm.jsx'; // Ensure path is correct
import './App.css';

// Define the base URL for our backend API
const API_URL = 'http://localhost:3001/api';

// localStorage Keys for settings
const LS_KEYS = {
  GOAL: 'loanTrackerMonthlyGoal',
  DUE_DAY: 'loanTrackerDueDay'
};

// --- Main App Component ---
function App() {
  // --- State ---
  const { isLoggedIn, isInitialized, user, logout, token } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const errorTimeoutRef = useRef(null);

  // eslint-disable-next-line no-unused-vars
  const [totalAmount, setTotalAmount] = useState(7500);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const savedGoal = localStorage.getItem(LS_KEYS.GOAL);
    return savedGoal !== null ? JSON.parse(savedGoal) : 200;
  });
  const [dueDay, setDueDay] = useState(() => {
    const savedDueDay = localStorage.getItem(LS_KEYS.DUE_DAY);
    return savedDueDay !== null ? JSON.parse(savedDueDay) : 1;
  });
  const [dueDayInput, setDueDayInput] = useState(String(dueDay));

  const [editingPayment, setEditingPayment] = useState(null);

  // --- Effects ---

  // Fetch Initial Payments
  useEffect(() => {
    if (!isLoggedIn || !isInitialized) {
      if (isInitialized) setPayments([]);
      return;
    }
    const fetchPayments = async () => {
      setIsLoading(true); setError(null);
      try {
        const response = await fetch(`${API_URL}/payments`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
           if (response.status === 401 || response.status === 403) { logout(); throw new Error('Authentication failed. Please log in again.'); }
           throw new Error(`HTTP error fetching payments! status: ${response.status}`);
        }
        const data = await response.json(); setPayments(data);
      } catch (e) { console.error("Failed to fetch payments:", e); setError(e.message || 'Failed to load payment history.'); }
      finally { setIsLoading(false); }
    };
    fetchPayments();
  }, [isLoggedIn, isInitialized, token, logout]);

  // Save Config to localStorage
  useEffect(() => { localStorage.setItem(LS_KEYS.GOAL, JSON.stringify(monthlyGoal)); }, [monthlyGoal]);
  useEffect(() => { localStorage.setItem(LS_KEYS.DUE_DAY, JSON.stringify(dueDay)); }, [dueDay]);
  useEffect(() => { setDueDayInput(String(dueDay)); }, [dueDay]);

  useEffect(() => {
    clearTimeout(errorTimeoutRef.current);

    if (error) {
        errorTimeoutRef.current = setTimeout(() => {
            setError(null);   
        }, 5000);
    }
    return () => {
        clearTimeout(errorTimeoutRef.current);
    };
  }, [error]);

  // --- Calculations ---
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  // Calculate Payment Statuses (Memoized)
  const paymentStatuses = useMemo(() => {
    const statuses = {}; const monthlyTotals = {};
    for (const payment of payments) { const monthYear = payment.date.substring(0, 7); monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + payment.amount; }
    const now = new Date(); const currentYear = now.getFullYear(); const currentMonth = now.getMonth() + 1;
    for (const payment of payments) {
      let paymentYear, paymentMonth;
      try { const paymentDate = new Date(payment.date + 'T12:00:00Z'); paymentYear = paymentDate.getUTCFullYear(); paymentMonth = paymentDate.getUTCMonth() + 1; } catch(e) { console.error("Error parsing payment date:", payment.date, e); statuses[payment.id] = 'pending'; continue; }
      const monthYear = payment.date.substring(0, 7); const monthTotal = monthlyTotals[monthYear] || 0;
      let status = 'pending';
      if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) { status = monthTotal >= monthlyGoal ? 'met' : 'missed'; }
      statuses[payment.id] = status;
    }
    return statuses;
  }, [payments, monthlyGoal]);

  // --- Reusable Error Handler for Fetch ---

const handleFetchError = async (response, defaultAction = 'perform action') => {
    let errorMsg = `Failed to ${defaultAction}. Status: ${response.status}`;
  
    // Handle specific common error statuses
    if (response.status === 401) { // Unauthorized (e.g., bad/expired token)
        logout(); // Log the user out
        errorMsg = 'Authentication failed. Please log in again.';
    } else if (response.status === 403) { // Forbidden (e.g., trying to edit/delete others' data)
        // --- DO NOT LOG OUT ---
        errorMsg = 'Permission denied. You cannot perform this action.';
        // Try to get a more specific message from the server if available
        try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_e) {}
    } else if (response.status === 404) {
        errorMsg = 'Requested resource not found.';
    } else {
        // For other client/server errors (e.g., 400, 500), try parsing the body
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg; // Use server message if available
        } catch (_parseError) {
            // Keep the status-based message if parsing fails
            console.warn('Could not parse error response body');
        }
    }
    // Throw the constructed error message to be caught by the calling handler
    throw new Error(errorMsg);
  };
  
  // Make sure your catch blocks in add/delete/save still just set the error state:
  // catch (e) {
  //   console.error("Failed to ...:", e);
  //   setError(`Failed to ...: ${e.message}`); // This uses the message thrown by handleFetchError
  // }

  // --- Action Handlers ---

  const addPaymentHandler = async (paymentDataFromForm) => {
    setError(null); try {
      const response = await fetch(`${API_URL}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(paymentDataFromForm) });
      if (!response.ok) await handleFetchError(response, 'HTTP error adding payment!');
      const newPaymentFromServer = await response.json(); setPayments((prev) => [newPaymentFromServer, ...prev]);
    } catch (e) { console.error("Failed to add payment:", e); setError(`Failed to add payment: ${e.message}`); }
  };

  const deletePaymentHandler = async (idToDelete) => {
    setError(null); try {
      const response = await fetch(`${API_URL}/payments/${idToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      if (!response.ok) await handleFetchError(response, 'HTTP error deleting payment!');
      setPayments((prev) => prev.filter((p) => p.id !== idToDelete));
    } catch (e) { console.error("Failed to delete payment:", e); setError(`Failed to delete payment: ${e.message}`); }
  };

  const handleStartEdit = (paymentToEdit) => { setEditingPayment(paymentToEdit); };
  const handleCancelEdit = () => { setEditingPayment(null); };
  const handleSaveEdit = async (updatedPaymentData) => {
    if (!editingPayment) return; setError(null); try {
      const response = await fetch(`${API_URL}/payments/${editingPayment.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatedPaymentData) });
      if (!response.ok) await handleFetchError(response, 'HTTP error updating payment!');
      const updatedPaymentFromServer = await response.json(); setPayments(prev => prev.map(p => p.id === editingPayment.id ? updatedPaymentFromServer : p)); setEditingPayment(null);
    } catch (e) { console.error("Failed to save payment edit:", e); setError(`Failed to save changes: ${e.message}`); }
  };

  const handleGoalChange = (event) => { const v = event.target.value; setMonthlyGoal(v === '' ? 0 : parseFloat(v) || 0); };
  const handleDueDayInputChange = (event) => { setDueDayInput(event.target.value); };
  const handleDueDayBlur = () => { const n = parseInt(dueDayInput); if (dueDayInput === '' || isNaN(n)) { setDueDay(1); setDueDayInput('1'); return; } const c = Math.max(1, Math.min(31, n)); setDueDay(c); setDueDayInput(String(c)); };

  // Auth view switching handlers
  const switchToRegister = () => { setAuthMode('register'); };
  const switchToLogin = () => { setAuthMode('login'); };

  // --- Render Logic ---

  if (!isInitialized) {
    return <div className="loading-message">Initializing...</div>;
  }

  return (
    <div className="loan-tracker-app">
      {!isLoggedIn ? (
        // --- Logged Out View ---
        authMode === 'login' ? (
          <LoginForm onSwitchToRegister={switchToRegister} />
        ) : (
          <RegisterForm onSwitchToLogin={switchToLogin} />
        )
      ) : (
        // --- Logged In View ---
        <>
          <div className="app-header">
             <h1>My Loan Tracker</h1>
             <button onClick={logout} className="logout-button">
               Logout ({user?.username})
             </button>
          </div>

          <section className="loan-config">
              <h2>Configuration</h2>
              <div className="config-controls">
                <div className="config-control"> <label htmlFor="monthlyGoal">Monthly Goal ($)</label> <input type="number" id="monthlyGoal" value={monthlyGoal} onChange={handleGoalChange} min="0" step="1"/> </div>
                <div className="config-control"> <label htmlFor="dueDay">Payment Due Day (1-31)</label> <input type="number" id="dueDay" value={dueDayInput} onChange={handleDueDayInputChange} onBlur={handleDueDayBlur} placeholder="1-31" min="1" max="31" step="1"/> </div>
              </div>
          </section>

          <section className="loan-summary">
            <h2>Summary</h2>
            <div className="summary-details"> <p>Total Loan Amount: ${totalAmount.toFixed(2)}</p> <p>Total Amount Paid: ${totalPaid.toFixed(2)}</p> <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p> </div>
          </section>

          <section className="add-payment-form">
            <h2>Add New Payment</h2>
            <PaymentForm onAddPayment={addPaymentHandler} />
          </section>

          <section className="payment-history">
            <h2>Payment History</h2>
            {isLoading && <p className="loading-message">Loading payments...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            {!isLoading && (
              <PaymentList
                items={payments}
                onDeletePayment={deletePaymentHandler}
                paymentStatuses={paymentStatuses}
                onEditPayment={handleStartEdit}
              />
            )}
          </section>

          {/* Edit Modal */}
          {editingPayment && (
            <Modal onClose={handleCancelEdit}>
              <h2>Edit Payment</h2>
              <EditPaymentForm
                  payment={editingPayment}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
              />
            </Modal>
          )}
        </> // End Logged In View Fragment
      )}
    </div> // End .loan-tracker-app div
  ); // End return
} // End App function

export default App;