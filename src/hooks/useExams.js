import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useExams = (schoolId, filters = {}) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    let q = query(
      collection(db, 'exams'),
      where('schoolId', '==', schoolId)
    );

    if (filters.classId) q = query(q, where('classId', '==', filters.classId));
    if (filters.examType) q = query(q, where('examType', '==', filters.examType));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort exams locally by createdAt descending (newest first)
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setExams(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching exams:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId, JSON.stringify(filters)]);

  return { exams, loading };
};
