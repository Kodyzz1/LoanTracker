import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth'; // Import the custom auth hook
import LoginForm from './LoginForm.jsx'; // Import the Login Form
import PaymentForm from './PaymentForm.jsx';
import PaymentList from './PaymentList.jsx';
import Modal from './Modal.jsx'; // Import the Modal
import EditPaymentForm from './EditPaymentForm.jsx'; // Import the Edit Form
import './App.css';

// Define the base URL for our backend API
const API_URL = 'http://localhost:3001/api';

// localStorage Keys for settings
const LS_KEYS = {
  GOAL: 'loanTrackerMonthlyGoal',
  DUE_DAY: 'loanTrackerDueDay'
};

function App() {
  // --- Authentication State ---
  const { isLoggedIn, isInitialized, user, logout, token } = useAuth(); // Get auth state, user, logout function, and token

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
    return savedGoal !== null ? JSON.parse(savedGoal) : 200;
  });
  const [dueDay, setDueDay] = useState(() => {
    const savedDueDay = localStorage.getItem(LS_KEYS.DUE_DAY);
    return savedDueDay !== null ? JSON.parse(savedDueDay) : 1;
  });
  const [dueDayInput, setDueDayInput] = useState(String(dueDay));

  // --- Editing State ---
  const [editingPayment, setEditingPayment] = useState(null); // Holds payment being edited

  // --- Effects ---

  // Fetch Initial Payments (only if logged in and initialized)
  useEffect(() => {
    // Only fetch if logged in and initialization is complete
    if (isLoggedIn && isInitialized) {
      const fetchPayments = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`${API_URL}/payments`, {
            headers: {
              // Include the token in the Authorization header
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
             // Handle potential auth errors (e.g., 401, 403)
             if (response.status === 401 || response.status === 403) {
                 logout(); // Log out if token is invalid/expired
                 throw new Error('Authentication failed. Please log in again.');
             }
            throw new Error(`HTTP error fetching payments! status: ${response.status}`);
          }
          const data = await response.json();
          setPayments(data);
        } catch (e) {
          console.error("Failed to fetch payments:", e);
          setError(e.message || 'Failed to load payment history.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPayments();
    } else if (isInitialized) {
         // If initialized but not logged in, clear payments
         setPayments([]);
    }
  }, [isLoggedIn, isInitialized, token, logout]); // Re-run if login status changes or token changes


  // Save Config to localStorage (These don't depend on login status)
  useEffect(() => { localStorage.setItem(LS_KEYS.GOAL, JSON.stringify(monthlyGoal)); }, [monthlyGoal]);
  useEffect(() => { localStorage.setItem(LS_KEYS.DUE_DAY, JSON.stringify(dueDay)); }, [dueDay]);
  useEffect(() => { setDueDayInput(String(dueDay)); }, [dueDay]);


  // --- Calculations & Memoization ---
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  const paymentStatuses = useMemo(() => {
    // ... (payment status calculation logic remains the same) ...
    const statuses = {}; const monthlyTotals = {};
    for (const payment of payments) {
      const monthYear = payment.date.substring(0, 7);
      monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + payment.amount;
    }
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


  // --- Handlers ---

  const addPaymentHandler = async (paymentDataFromForm) => {
    // TODO: Update this fetch call to include Authorization header like in fetchPayments useEffect
    setError(null);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, // <-- Add Auth Header
        body: JSON.stringify(paymentDataFromForm),
      });
      if (!response.ok) { /* ... error handling ... */
          let errorMsg = `HTTP error adding payment! status: ${response.status}`;
          if (response.status === 401 || response.status === 403) { logout(); errorMsg = 'Authentication failed.'; }
          else { try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_parseError) {} }
          throw new Error(errorMsg);
       }
      const newPaymentFromServer = await response.json();
      setPayments((prevPayments) => [newPaymentFromServer, ...prevPayments]);
    } catch (e) { console.error("Failed to add payment:", e); setError(`Failed to add payment: ${e.message}`); }
  };

  const deletePaymentHandler = async (idToDelete) => {
     // TODO: Update this fetch call to include Authorization header
    setError(null);
    try {
      const response = await fetch(`${API_URL}/payments/${idToDelete}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` } // <-- Add Auth Header
      });
      if (!response.ok) { /* ... error handling ... */
          let errorMsg = `HTTP error deleting payment! status: ${response.status}`;
          if (response.status === 401 || response.status === 403) { logout(); errorMsg = 'Authentication failed.'; }
          else if (response.status === 404) { errorMsg = `Payment not found.`; }
          else { try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_parseError) {} }
          throw new Error(errorMsg);
      }
      setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== idToDelete));
    } catch (e) { console.error("Failed to delete payment:", e); setError(`Failed to delete payment: ${e.message}`); }
  };

  // Edit Handlers
  const handleStartEdit = (paymentToEdit) => { setEditingPayment(paymentToEdit); console.log("START EDITING:", paymentToEdit); };
  const handleCancelEdit = () => { setEditingPayment(null); console.log("CANCEL EDIT"); };
  // Find this function in App.jsx and replace it entirely with this version:

const handleSaveEdit = async (updatedPaymentData) => {
    // updatedPaymentData comes from EditPaymentForm: { date, amount }
    if (!editingPayment) return; // Exit if no payment is being edited
  
    setError(null); // Clear previous errors
    // Optional: You could set a specific 'isSaving' loading state here if needed
  
    try {
      // Make the PUT request to the backend API endpoint
      const response = await fetch(`${API_URL}/payments/${editingPayment.id}`, {
        method: 'PUT', // Use PUT method for update
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // *** Add Authentication token ***
        },
        body: JSON.stringify(updatedPaymentData), // Send the updated {date, amount}
      });
  
      if (!response.ok) {
        // Handle potential errors from the API
        let errorMsg = `HTTP error updating payment! status: ${response.status}`;
        // Handle specific auth errors
        if (response.status === 401 || response.status === 403) {
            logout(); // Log out if token is invalid/expired
            errorMsg = 'Authentication failed. Please log in again.';
        } else if (response.status === 404) {
            errorMsg = `Payment not found on server.`;
        } else {
            // Try to get message from server body for other errors
            try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_parseError) {}
        }
        throw new Error(errorMsg);
      }
  
      // Get the full updated payment object back from the server response
      const updatedPaymentFromServer = await response.json();
      console.log("SAVE EDIT - Success Response:", updatedPaymentFromServer);
  
      // Update the frontend payments state array
      setPayments(prevPayments =>
        // Create a new array using map
        prevPayments.map(p =>
          // If this payment's ID matches the one we edited,
          // return the updated object from the server, otherwise keep the original
          p.id === editingPayment.id ? updatedPaymentFromServer : p
        )
      );
  
      // Close the modal/clear editing state AFTER successful update
      setEditingPayment(null);
  
    } catch (e) {
      console.error("Failed to save payment edit:", e);
      setError(`Failed to save changes: ${e.message}`);
      // Optional: Decide if you want to leave modal open on error
      // setEditingPayment(null);
    }
    // Optional: Reset any specific 'isSaving' loading state here
  };

  // Config Input Handlers
  const handleGoalChange = (event) => { /* ... remains same ... */ const value = event.target.value; setMonthlyGoal(value === '' ? 0 : parseFloat(value) || 0); };
  const handleDueDayInputChange = (event) => { /* ... remains same ... */ setDueDayInput(event.target.value); };
  const handleDueDayBlur = () => { /* ... remains same ... */ const numericValue = parseInt(dueDayInput); if (dueDayInput === '' || isNaN(numericValue)) { setDueDay(1); setDueDayInput('1'); return; } const clampedDay = Math.max(1, Math.min(31, numericValue)); setDueDay(clampedDay); setDueDayInput(String(clampedDay)); };

  // --- Conditional Rendering Logic ---

  // Don't render anything until the auth state is initialized from localStorage
  if (!isInitialized) {
    return <p className="loading-message">Initializing...</p>; // Or a better loading indicator
  }

  // If not logged in, show the Login Form
  if (!isLoggedIn) {
    // TODO: Pass setError maybe? Or handle login errors within LoginForm
    return <LoginForm />;
    // TODO: Add routing later to show a Register form too
  }

  // --- If Logged In, Render the Main App UI ---
  return (
    <div className="loan-tracker-app">
      <div className="app-header">
         <h1>My Loan Tracker</h1>
         {/* Display username and logout button */}
         <button onClick={logout} className="logout-button">
           Logout ({user?.username})
         </button>
      </div>

      <section className="loan-config">
          <h2>Configuration</h2>
          {/* ... Config inputs JSX ... */}
          <div className="config-controls">
              <div className="config-control"> <label htmlFor="monthlyGoal">Monthly Goal ($)</label> <input type="number" id="monthlyGoal" value={monthlyGoal} onChange={handleGoalChange} min="0" step="1"/> </div>
              <div className="config-control"> <label htmlFor="dueDay">Payment Due Day (1-31)</label> <input type="number" id="dueDay" value={dueDayInput} onChange={handleDueDayInputChange} onBlur={handleDueDayBlur} placeholder="1-31" min="1" max="31" step="1"/> </div>
          </div>
      </section>

      <section className="loan-summary">
        <h2>Summary</h2>
         {/* ... Summary JSX ... */}
         <div className="summary-details"> <p>Total Loan Amount: ${totalAmount.toFixed(2)}</p> <p>Total Amount Paid: ${totalPaid.toFixed(2)}</p> <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p> </div>
      </section>

      <section className="add-payment-form">
        <h2>Add New Payment</h2>
         {/* ... PaymentForm JSX ... */}
         <PaymentForm onAddPayment={addPaymentHandler} />
      </section>

      <section className="payment-history">
        <h2>Payment History</h2>
         {/* ... Loading/Error/List JSX ... */}
         {isLoading && <p className="loading-message">Loading payments...</p>}
         {error && <p className="error-message">Error: {error}</p>}
         {!isLoading && !error && ( <PaymentList items={payments} onDeletePayment={deletePaymentHandler} paymentStatuses={paymentStatuses} onEditPayment={handleStartEdit}/> )}
      </section>

      {/* Edit Modal Rendering */}
      {editingPayment && (
        <Modal onClose={handleCancelEdit}>
          <h2>Edit Payment</h2>
          <EditPaymentForm payment={editingPayment} onSave={handleSaveEdit} onCancel={handleCancelEdit}/>
        </Modal>
      )}

    </div>
  );
}

export default App;