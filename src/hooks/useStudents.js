import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  startAfter 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useStudents = (schoolId, filters = {}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  useEffect(() => {
    if (!schoolId) return;

    let q = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId),
      // orderBy('createdAt', 'desc'), // Commented out to avoid composite index error
      limit(20)
    );

    if (filters.class) {
      q = query(q, where('class', '==', filters.class));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(items);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId, JSON.stringify(filters)]);

  return { students, loading, lastDoc };
};
