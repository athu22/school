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
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";

// Grade Calculation Logic
export const calculateGrade = (percentage, pattern = 'default') => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 35) return 'C';
  return 'D (Fail)';
};

export const addExam = async (examData) => {
  try {
    const docRef = await addDoc(collection(db, "exams"), {
      ...examData,
      status: "active",
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding exam:", error);
    throw error;
  }
};

export const saveMarks = async (marksArray) => {
  try {
    const batch = writeBatch(db);
    
    marksArray.forEach((mark) => {
      const markRef = doc(collection(db, "marks"));
      const percentage = (mark.obtainedMarks / mark.totalMarks) * 100;
      const grade = calculateGrade(percentage);
      
      batch.set(markRef, {
        ...mark,
        percentage,
        grade,
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error saving marks:", error);
    throw error;
  }
};

export const generateResult = async (studentId, examId, schoolId) => {
  // Logic to aggregate marks for a student across subjects for an exam
  // and save to 'results' collection
};
