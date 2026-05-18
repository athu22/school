import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

export const saveCertificateHistory = async (certificateData) => {
  try {
    const docRef = await addDoc(collection(db, "certificateHistory"), {
      ...certificateData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving certificate history:", error);
    throw error;
  }
};

export const getCertificateHistory = (schoolId, callback) => {
  const q = query(
    collection(db, "certificateHistory"),
    where("schoolId", "==", schoolId),
    // orderBy("createdAt", "desc") // Commented out to avoid index error
  );

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(history);
  });
};
