import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useAccounts = (schoolId) => {
  const [transactions, setTransactions] = useState([]);
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
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
      setLoading(false);
    });

    return () => {
      unsubTrans();
      unsubFees();
      unsubExp();
    };
  }, [schoolId]);

  return { transactions, fees, expenses, loading };
};
