import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";

const STUDENT_COLLECTION = "students";

export const uploadFile = async (file, path) => {
  if (!file) return null;
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export const addStudent = async (studentData, photoFile, documents = []) => {
  try {
    let photoURL = "";
    if (photoFile) {
      photoURL = await uploadFile(photoFile, "student-photos");
    }

    const docURLs = await Promise.all(
      documents.map(async (doc) => ({
        name: doc.name,
        url: await uploadFile(doc.file, "student-documents"),
        type: doc.type
      }))
    );

    const docRef = await addDoc(collection(db, STUDENT_COLLECTION), {
      ...studentData,
      photoURL,
      documents: docURLs,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

export const updateStudent = async (id, studentData, photoFile) => {
  try {
    const studentRef = doc(db, STUDENT_COLLECTION, id);
    const dataToSave = { ...studentData };
    
    if (photoFile) {
      const photoURL = await uploadFile(photoFile, "student-photos");
      dataToSave.photoURL = photoURL;
    }
    
    // Clean up temporary photoFile property before saving to Firestore
    delete dataToSave.photoFile;
    delete dataToSave.id; // Ensure we don't store ID inside document data

    await updateDoc(studentRef, {
      ...dataToSave,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

export const deleteStudent = async (id) => {
  try {
    await deleteDoc(doc(db, STUDENT_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};
