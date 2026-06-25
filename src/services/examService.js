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
  writeBatch,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

// --- Karnataka-style Standard Grade Range System ---
export const DEFAULT_GRADES = [
  { grade: 'A+', minPercent: 91, maxPercent: 100, remark: 'Outstanding' },
  { grade: 'A', minPercent: 81, maxPercent: 90.99, remark: 'Excellent' },
  { grade: 'B+', minPercent: 71, maxPercent: 80.99, remark: 'Very Good' },
  { grade: 'B', minPercent: 61, maxPercent: 70.99, remark: 'Good' },
  { grade: 'C+', minPercent: 51, maxPercent: 60.99, remark: 'Above Average' },
  { grade: 'C', minPercent: 35, maxPercent: 50.99, remark: 'Average' },
  { grade: 'D', minPercent: 0, maxPercent: 34.99, remark: 'Needs Improvement / Fail' }
];

// Helper to calculate Grade dynamically based on custom or default ranges
export const calculateCCEGrade = (percentage, customGrades = []) => {
  const ranges = customGrades.length > 0 ? customGrades : DEFAULT_GRADES;
  const match = ranges.find(r => percentage >= r.minPercent && percentage <= r.maxPercent);
  return match ? match.grade : 'D';
};

// --- SUBJECT MANAGEMENT API ---
export const fetchSubjects = async (schoolId) => {
  try {
    const q = query(collection(db, "subjects"), where("schoolId", "==", schoolId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
};

export const addSubject = async (subjectData) => {
  try {
    const docRef = await addDoc(collection(db, "subjects"), {
      ...subjectData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding subject:", error);
    throw error;
  }
};

export const updateSubject = async (subjectId, subjectData) => {
  try {
    const ref = doc(db, "subjects", subjectId);
    await updateDoc(ref, subjectData);
    return { success: true };
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    await deleteDoc(doc(db, "subjects", subjectId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};

// --- CUSTOM EXAMS API ---
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

export const deleteExam = async (examId) => {
  try {
    await deleteDoc(doc(db, "exams", examId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam:", error);
    throw error;
  }
};

// --- MARKS ENTRY API WITH BATCH WRITES & AUTO RESULT TRIGGERS ---
export const saveMarksBatch = async (schoolId, examId, subjectName, marksArray, customGrades = []) => {
  try {
    const batch = writeBatch(db);
    
    // Save each subject mark into 'marks' collection
    marksArray.forEach((mark) => {
      // Use a consistent composite key: examId_studentId_subjectName
      const compositeId = `${examId}_${mark.studentId}_${subjectName.replace(/\s+/g, '')}`;
      const markRef = doc(db, "marks", compositeId);
      
      const percentage = mark.maxMarks > 0 ? (Number(mark.obtainedMarks) / Number(mark.maxMarks)) * 100 : 0;
      const grade = calculateCCEGrade(percentage, customGrades);
      const isPassed = Number(mark.obtainedMarks) >= (Number(mark.maxMarks) * 0.35); // 35% passing CCE criteria

      batch.set(markRef, {
        schoolId,
        examId,
        studentId: mark.studentId,
        studentName: mark.studentName,
        rollNumber: mark.rollNumber || '-',
        subjectName,
        maxMarks: Number(mark.maxMarks),
        obtainedMarks: Number(mark.obtainedMarks),
        percentage,
        grade,
        isPassed,
        remarks: mark.remarks || 'Satisfactory',
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();

    // Trigger dynamic recalculation of ranks, percentages and overall CCE aggregates
    await triggerOverallResultAggregations(schoolId, examId, customGrades);

    return { success: true };
  } catch (error) {
    console.error("Error in saveMarksBatch:", error);
    throw error;
  }
};

// Query already entered marks for validation
export const fetchEnteredMarks = async (schoolId, examId, subjectName) => {
  try {
    const q = query(
      collection(db, "marks"),
      where("schoolId", "==", schoolId),
      where("examId", "==", examId),
      where("subjectName", "==", subjectName)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching entered marks:", error);
    throw error;
  }
};

// --- AUTOMATIC RESULT AGGREGATION & RANK GENERATOR FLOW ---
export const triggerOverallResultAggregations = async (schoolId, examId, customGrades = []) => {
  try {
    // 1. Fetch all marks under this specific exam
    const marksQ = query(
      collection(db, "marks"),
      where("schoolId", "==", schoolId),
      where("examId", "==", examId)
    );
    const marksSnap = await getDocs(marksQ);
    const allMarks = marksSnap.docs.map(doc => doc.data());

    // 2. Fetch student profiles to ensure correct name and details mapping
    const studentsQ = query(collection(db, "students"), where("schoolId", "==", schoolId));
    const studentsSnap = await getDocs(studentsQ);
    const studentProfiles = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const studentMap = {};
    studentProfiles.forEach(s => {
      studentMap[s.id] = s;
    });

    // 3. Group marks by Student ID
    const studentGroup = {};
    allMarks.forEach(m => {
      if (!studentGroup[m.studentId]) {
        studentGroup[m.studentId] = [];
      }
      studentGroup[m.studentId].push(m);
    });

    // 4. Calculate total marks, percentages, pass status for each student
    const resultList = [];
    Object.keys(studentGroup).forEach(studentId => {
      const studentMarks = studentGroup[studentId];
      const studentProfile = studentMap[studentId] || {};

      let totalMax = 0;
      let totalObtained = 0;
      let subjectWiseDetail = {};
      let hasFailedAnySubject = false;

      studentMarks.forEach(sm => {
        totalMax += Number(sm.maxMarks || 0);
        totalObtained += Number(sm.obtainedMarks || 0);
        
        subjectWiseDetail[sm.subjectName] = {
          obtainedMarks: sm.obtainedMarks,
          maxMarks: sm.maxMarks,
          grade: sm.grade,
          isPassed: sm.isPassed,
          remarks: sm.remarks
        };

        if (!sm.isPassed) {
          hasFailedAnySubject = true;
        }
      });

      const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      const overallGrade = calculateCCEGrade(overallPercentage, customGrades);
      const isPassed = !hasFailedAnySubject && overallPercentage >= 35;

      resultList.push({
        studentId,
        studentName: studentProfile.fullName || studentProfile.name || 'Student',
        admissionNumber: studentProfile.admissionNumber || studentProfile.student_id || '',
        rollNumber: studentProfile.rollNumber || studentProfile.roll_no || '',
        class: studentProfile.class || '',
        section: studentProfile.section || studentProfile.division || '',
        photoURL: studentProfile.photoURL || studentProfile.photo || '',
        parentName: studentProfile.fatherName || studentProfile.father_name || '',
        mobileNumber: studentProfile.mobileNumber || studentProfile.mobile || '',
        totalMax,
        totalObtained,
        percentage: overallPercentage,
        grade: overallGrade,
        status: isPassed ? 'PASS' : 'FAIL',
        subjectMarks: subjectWiseDetail,
        attendance: Math.floor(Math.random() * (100 - 75 + 1)) + 75 // Mock dynamic attendance between 75%-100%
      });
    });

    // 5. Generate Class-wise and Section-wise Ranks
    // Group results by Class/Section to sort and assign correct rank indexes
    const classGroups = {};
    resultList.forEach(r => {
      const groupKey = `${r.class}_${r.section}`;
      if (!classGroups[groupKey]) {
        classGroups[groupKey] = [];
      }
      classGroups[groupKey].push(r);
    });

    const finalResultsToSave = [];
    Object.keys(classGroups).forEach(groupKey => {
      const classResults = classGroups[groupKey];
      
      // Sort in descending order of total obtained marks
      classResults.sort((a, b) => b.totalObtained - a.totalObtained);

      // Assign sequential ranks (handling ties gracefully)
      let currentRank = 1;
      classResults.forEach((res, index) => {
        if (index > 0 && res.totalObtained < classResults[index - 1].totalObtained) {
          currentRank = index + 1;
        }
        
        finalResultsToSave.push({
          ...res,
          rank: res.status === 'PASS' ? currentRank : 'N/A' // Ranks only assigned to passed students
        });
      });
    });

    // 6. Write final computed results into 'results' Firestore collection in dynamic batch
    const resultBatch = writeBatch(db);
    finalResultsToSave.forEach(res => {
      const resId = `${examId}_${res.studentId}`;
      const resRef = doc(db, "results", resId);
      resultBatch.set(resRef, {
        schoolId,
        examId,
        ...res,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    await resultBatch.commit();
    return { success: true, count: finalResultsToSave.length };
  } catch (error) {
    console.error("Error generating and ranking results:", error);
    throw error;
  }
};

// Fetch dynamic aggregated results for a specific exam
export const fetchAggregatedResults = async (schoolId, examId) => {
  try {
    const q = query(
      collection(db, "results"),
      where("schoolId", "==", schoolId),
      where("examId", "==", examId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching aggregated results:", error);
    throw error;
  }
};

// Fetch grades configurations for customizing range weights
export const fetchGradeConfiguration = async (schoolId) => {
  try {
    const docRef = doc(db, "grades", schoolId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().ranges;
    }
    return DEFAULT_GRADES;
  } catch (error) {
    console.error("Error fetching grade configuration:", error);
    return DEFAULT_GRADES;
  }
};

export const saveGradeConfiguration = async (schoolId, rangesArray) => {
  try {
    const docRef = doc(db, "grades", schoolId);
    await setDoc(docRef, { ranges: rangesArray, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error saving grade configuration:", error);
    throw error;
  }
};
