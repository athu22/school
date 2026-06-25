import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useAccounts = (schoolId) => {
  const [transactions, setTransactions] = useState([]);
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    // 1. Transactions Listener
    const qTrans = query(collection(db, 'transactions'), where('schoolId', '==', schoolId));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fees Listener
    const qFees = query(collection(db, 'fees'), where('schoolId', '==', schoolId));
    const unsubFees = onSnapshot(qFees, (snapshot) => {
      setFees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Expenses Listener
    const qExp = query(collection(db, 'expenses'), where('schoolId', '==', schoolId));
    const unsubExp = onSnapshot(qExp, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Ledgers Listener
    const qLedgers = query(collection(db, 'ledgers'), where('schoolId', '==', schoolId));
    const unsubLedgers = onSnapshot(qLedgers, (snapshot) => {
      setLedgers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Vouchers Listener
    const qVouchers = query(collection(db, 'vouchers'), where('schoolId', '==', schoolId));
    const unsubVouchers = onSnapshot(qVouchers, (snapshot) => {
      setVouchers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubTrans();
      unsubFees();
      unsubExp();
      unsubLedgers();
      unsubVouchers();
    };
  }, [schoolId]);

  return { transactions, fees, expenses, ledgers, vouchers, loading };
};
