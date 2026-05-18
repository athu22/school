import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useClasses = (schoolId) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'classes'),
      where('schoolId', '==', schoolId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort classes locally by className (natural sort, e.g. 1, 2, 10)
      items.sort((a, b) => {
        const nameA = String(a.className || '');
        const nameB = String(b.className || '');
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });

      setClasses(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching classes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return { classes, loading };
};

export const useDivisions = (classId) => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    const q = query(
      collection(db, 'divisions'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort divisions locally by divisionName
      items.sort((a, b) => {
        const nameA = String(a.divisionName || '');
        const nameB = String(b.divisionName || '');
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });

      setDivisions(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return { divisions, loading };
};
