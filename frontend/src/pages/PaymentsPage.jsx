import React, { useContext } from 'react';
import PaymentDashboard from '../components/payments/PaymentDashboard';
import { AuthContext } from '../contexts/AuthContext';

const PaymentsPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="payments-page">
      <PaymentDashboard userId={user?.id} />
    </div>
  );
};

// Disable static generation to prevent SSR issues with AuthContext
export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default PaymentsPage;
