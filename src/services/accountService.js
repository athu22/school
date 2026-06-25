import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  runTransaction,
  doc,
  getDocs,
  limit,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

// helper to generate auto voucher numbers
const generateVoucherNo = (type) => {
  const prefix = type === 'payment' ? 'PV' : type === 'contra' ? 'CV' : type === 'journal' ? 'JV' : 'RV';
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${today}-${rand}`;
};

// 1. Core Double Entry Voucher Posting
export const postAccountingVoucher = async (voucherData) => {
  try {
    const voucherNo = voucherData.voucherNo || generateVoucherNo(voucherData.voucherType);
    
    await runTransaction(db, async (transaction) => {
      // Create Voucher record
      const voucherRef = collection(db, "vouchers");
      const newVoucherDoc = doc(voucherRef);
      
      const finalVoucher = {
        ...voucherData,
        voucherNo,
        createdAt: serverTimestamp()
      };
      transaction.set(newVoucherDoc, finalVoucher);

      // Post Debit Entry in Transactions
      const transRef = collection(db, "transactions");
      const debitDoc = doc(transRef);
      transaction.set(debitDoc, {
        schoolId: voucherData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'debit',
        ledgerName: voucherData.debitLedger,
        amount: Number(voucherData.amount),
        date: voucherData.date,
        narration: voucherData.description,
        createdAt: serverTimestamp()
      });

      // Post Credit Entry in Transactions
      const creditDoc = doc(transRef);
      transaction.set(creditDoc, {
        schoolId: voucherData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'credit',
        ledgerName: voucherData.creditLedger,
        amount: Number(voucherData.amount),
        date: voucherData.date,
        narration: voucherData.description,
        createdAt: serverTimestamp()
      });
    });

    return { success: true, voucherNo };
  } catch (error) {
    console.error("Error posting voucher:", error);
    throw error;
  }
};

// 2. Add Expense with Auto Double Entry Flow
export const addExpense = async (expenseData) => {
  try {
    const voucherNo = generateVoucherNo('payment');
    
    await runTransaction(db, async (transaction) => {
      // 1. Create Expense metadata
      const expRef = collection(db, "expenses");
      const newExpDoc = doc(expRef);
      transaction.set(newExpDoc, {
        ...expenseData,
        voucherNo,
        createdAt: serverTimestamp()
      });

      // 2. Create Payment Voucher
      const voucherRef = collection(db, "vouchers");
      const newVoucherDoc = doc(voucherRef);
      transaction.set(newVoucherDoc, {
        schoolId: expenseData.schoolId,
        voucherNo,
        voucherType: 'payment',
        date: expenseData.expenseDate,
        amount: Number(expenseData.amount),
        debitLedger: expenseData.category, // e.g. "Electricity Bill"
        creditLedger: expenseData.paymentMode === 'Cash' ? 'Cash In Hand' : (expenseData.bankName || 'SBI Bank'),
        paidTo: expenseData.paidTo || 'Vendor',
        description: expenseData.description,
        attachmentUrl: expenseData.attachmentUrl || null,
        expenseId: newExpDoc.id,
        createdAt: serverTimestamp()
      });

      // 3. Post Debit (Expense Account increases)
      const transRef = collection(db, "transactions");
      const debitDoc = doc(transRef);
      transaction.set(debitDoc, {
        schoolId: expenseData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'debit',
        category: expenseData.category,
        ledgerName: expenseData.category,
        amount: Number(expenseData.amount),
        date: expenseData.expenseDate,
        description: expenseData.description,
        referenceId: newExpDoc.id,
        createdAt: serverTimestamp()
      });

      // 4. Post Credit (Cash/Bank Asset decreases)
      const creditDoc = doc(transRef);
      transaction.set(creditDoc, {
        schoolId: expenseData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'credit',
        category: expenseData.category,
        ledgerName: expenseData.paymentMode === 'Cash' ? 'Cash In Hand' : (expenseData.bankName || 'SBI Bank'),
        amount: Number(expenseData.amount),
        date: expenseData.expenseDate,
        description: expenseData.description,
        referenceId: newExpDoc.id,
        createdAt: serverTimestamp()
      });
    });
    return { success: true, voucherNo };
  } catch (error) {
    console.error("Error adding expense transactionally:", error);
    throw error;
  }
};

// Delete Expense with Auto Reversal
export const deleteExpense = async (expenseId, voucherNo) => {
  try {
    // 1. Query related voucher and transactions
    const qVoucher = query(collection(db, "vouchers"), where("voucherNo", "==", voucherNo));
    const qTrans = query(collection(db, "transactions"), where("voucherNo", "==", voucherNo));

    const snapVoucher = await getDocs(qVoucher);
    const snapTrans = await getDocs(qTrans);

    await runTransaction(db, async (transaction) => {
      // Delete expense
      const expDocRef = doc(db, "expenses", expenseId);
      transaction.delete(expDocRef);

      // Delete vouchers
      snapVoucher.docs.forEach(d => {
        transaction.delete(doc(db, "vouchers", d.id));
      });

      // Delete transactions
      snapTrans.docs.forEach(d => {
        transaction.delete(doc(db, "transactions", d.id));
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

// 3. Collect Fee with Auto Double Entry Flow
export const collectFee = async (feeData) => {
  try {
    const voucherNo = generateVoucherNo('receipt');
    
    await runTransaction(db, async (transaction) => {
      // 1. Create Fee Receipt
      const feeRef = collection(db, "fees");
      const newFeeDoc = doc(feeRef);
      transaction.set(newFeeDoc, {
        ...feeData,
        voucherNo,
        createdAt: serverTimestamp()
      });

      // 2. Create Receipt Voucher
      const voucherRef = collection(db, "vouchers");
      const newVoucherDoc = doc(voucherRef);
      transaction.set(newVoucherDoc, {
        schoolId: feeData.schoolId,
        voucherNo,
        voucherType: 'receipt',
        date: feeData.paymentDate,
        amount: Number(feeData.amount),
        debitLedger: feeData.paymentMode === 'Cash' ? 'Cash In Hand' : 'SBI Bank',
        creditLedger: 'Fee',
        paidTo: feeData.studentName,
        description: `Fee collected from student: ${feeData.studentName}`,
        feeId: newFeeDoc.id,
        createdAt: serverTimestamp()
      });

      // 3. Post Debit (Cash/Bank Asset increases)
      const transRef = collection(db, "transactions");
      const debitDoc = doc(transRef);
      transaction.set(debitDoc, {
        schoolId: feeData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'debit',
        category: 'Fee',
        ledgerName: feeData.paymentMode === 'Cash' ? 'Cash In Hand' : 'SBI Bank',
        amount: Number(feeData.amount),
        date: feeData.paymentDate,
        description: `Fee collection from ${feeData.studentName}`,
        referenceId: newFeeDoc.id,
        createdAt: serverTimestamp()
      });

      // 4. Post Credit (Fee Revenue increases)
      const creditDoc = doc(transRef);
      transaction.set(creditDoc, {
        schoolId: feeData.schoolId,
        voucherNo,
        voucherId: newVoucherDoc.id,
        type: 'credit',
        category: 'Fee',
        ledgerName: 'Fee',
        amount: Number(feeData.amount),
        date: feeData.paymentDate,
        description: `Fee collection from ${feeData.studentName}`,
        referenceId: newFeeDoc.id,
        createdAt: serverTimestamp()
      });
    });
    return { success: true, voucherNo };
  } catch (error) {
    console.error("Error collecting fee transactionally:", error);
    throw error;
  }
};

// 4. Fetch Realtime Transactions
export const getTransactions = (schoolId, callback) => {
  const q = query(
    collection(db, "transactions"),
    where("schoolId", "==", schoolId)
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// 5. Fetch Realtime Vouchers
export const getVouchers = (schoolId, callback) => {
  const q = query(
    collection(db, "vouchers"),
    where("schoolId", "==", schoolId)
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// Add Custom Ledger Head
export const addCustomLedger = async (ledgerData) => {
  try {
    const ledgerRef = collection(db, "ledgers");
    await addDoc(ledgerRef, {
      ...ledgerData,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding custom ledger:", error);
    throw error;
  }
};

// Add Manual Transaction Entry (Legacy)
export const addManualTransaction = async (transactionData) => {
  try {
    const transRef = collection(db, "transactions");
    await addDoc(transRef, {
      ...transactionData,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding manual transaction:", error);
    throw error;
  }
};
