import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../firebase/config";

export const addClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, "classes"), {
      ...classData,
      totalStudents: 0,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding class:", error);
    throw error;
  }
};

export const updateClass = async (id, classData) => {
  try {
    const classRef = doc(db, "classes", id);
    await updateDoc(classRef, {
      ...classData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

export const addDivision = async (divisionData) => {
  try {
    const docRef = await addDoc(collection(db, "divisions"), {
      ...divisionData,
      totalStudents: 0,
      status: "active",
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding division:", error);
    throw error;
  }
};

export const updateDivision = async (id, divisionData) => {
  try {
    const divRef = doc(db, "divisions", id);
    await updateDoc(divRef, {
      ...divisionData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating division:", error);
    throw error;
  }
};

export const deleteDivision = async (id) => {
  try {
    // Check if students exist in division before deleting
    const q = query(collection(db, "students"), where("divisionId", "==", id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("Cannot delete division: Students are still assigned to it.");
    }
    await deleteDoc(doc(db, "divisions", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting division:", error);
    throw error;
  }
};
