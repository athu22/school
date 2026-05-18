import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  runTransaction,
  doc
} from "firebase/firestore";
import { db } from "../firebase/config";

// Collect Fee
export const collectFee = async (feeData) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create Fee Receipt
      const feeRef = collection(db, "fees");
      const newFeeDoc = doc(feeRef);
      transaction.set(newFeeDoc, {
        ...feeData,
        createdAt: serverTimestamp()
      });

      // 2. Create Accounting Transaction (Double Entry)
      const transRef = collection(db, "transactions");
      const newTransDoc = doc(transRef);
      transaction.set(newTransDoc, {
        schoolId: feeData.schoolId,
        type: 'credit',
        category: 'Fee',
        amount: feeData.amount,
        description: `Fee collection from ${feeData.studentName}`,
        date: feeData.paymentDate,
        referenceId: newFeeDoc.id,
        createdAt: serverTimestamp()
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Error collecting fee:", error);
    throw error;
  }
};

// Record Expense
export const addExpense = async (expenseData) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create Expense Record
      const expRef = collection(db, "expenses");
      const newExpDoc = doc(expRef);
      transaction.set(newExpDoc, {
        ...expenseData,
        createdAt: serverTimestamp()
      });

      // 2. Create Accounting Transaction
      const transRef = collection(db, "transactions");
      const newTransDoc = doc(transRef);
      transaction.set(newTransDoc, {
        schoolId: expenseData.schoolId,
        type: 'debit',
        category: 'Expense',
        amount: expenseData.amount,
        description: expenseData.description,
        date: expenseData.expenseDate,
        referenceId: newExpDoc.id,
        createdAt: serverTimestamp()
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Fetch Realtime Transactions
export const getTransactions = (schoolId, callback) => {
  const q = query(
    collection(db, "transactions"),
    where("schoolId", "==", schoolId),
    // orderBy("date", "desc") // Commented out to avoid index error
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};
