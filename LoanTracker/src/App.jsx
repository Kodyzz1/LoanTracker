import { useState, useEffect } from 'react'; // useEffect is still needed
import './App.css';
import PaymentForm from './PaymentForm.jsx';
import PaymentList from './PaymentList.jsx';

// Define the base URL for our API
const API_URL = 'http://localhost:3001/api'; // Use the port your server is running on

function App() {
  // State for core data
  // eslint-disable-next-line no-unused-vars
  const [totalAmount, setTotalAmount] = useState(7500); // Keep this client-side for now
  const [payments, setPayments] = useState([]); // Start with empty array, will be filled by API

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false); // To show loading indicator
  const [error, setError] = useState(null); // To store any API errors

  // --- Fetch Initial Payments ---
  // Use useEffect to fetch payments when the component mounts
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors

      try {
        const response = await fetch(`${API_URL}/payments`);

        if (!response.ok) {
          // Throw an error if response status is not 2xx
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPayments(data); // Update state with fetched payments
      } catch (e) {
        console.error("Failed to fetch payments:", e);
        setError('Failed to load payment history.'); // Set error message
      } finally {
        setIsLoading(false); // Stop loading regardless of success/error
      }
    };

    fetchPayments(); // Call the async function
  }, []); // Empty dependency array [] means this runs only ONCE on mount

  // --- Calculate Derived Values ---
  // These automatically recalculate whenever 'payments' or 'totalAmount' state changes
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  // --- Handle Adding New Payment ---
  const addPaymentHandler = async (paymentDataFromForm) => {
    // Note: paymentDataFromForm contains { date, amount } from the form
    setError(null); // Clear previous errors

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDataFromForm), // Send form data as JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the newly created payment object (with server-generated id/timestamp)
      const newPaymentFromServer = await response.json();

      // Update the frontend state with the confirmed data from the server
      setPayments((prevPayments) => {
        return [newPaymentFromServer, ...prevPayments]; // Add to beginning
      });

    } catch (e) {
      console.error("Failed to add payment:", e);
      setError('Failed to add payment. Please try again.'); // Set error message
    }
    // No loading state needed here unless the POST takes a long time
  };

  // --- Component Return / JSX ---
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
        {/* Display loading message */}
        {isLoading && <p>Loading payments...</p>}
        {/* Display error message */}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {/* Display payment list only if not loading and no error */}
        {!isLoading && !error && <PaymentList items={payments} />}
      </section>
    </div>
  );
}

export default App;