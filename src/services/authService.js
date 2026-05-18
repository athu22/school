import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Secondary Firebase app to create users without logging out the current admin
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export const createNewUser = async (userData) => {
  try {
    // 1. Create Auth Account using secondary instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      userData.email, 
      userData.password
    );
    const user = userCredential.user;

    // 2. Immediate sign out from secondary instance to avoid session conflicts
    await signOut(secondaryAuth);

    // 3. Save User Data to Firestore using primary db instance
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      schoolId: userData.schoolId,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      schoolName: userData.schoolName || "",
      mobile: userData.mobile || "",
      status: "active",
      createdAt: serverTimestamp(),
    });

    return { success: true, uid: user.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};
