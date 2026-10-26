import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, FEEDBACK_COLLECTION } from '../config/firebase';
import type { StructuredFeedback, FirebaseSubmitResult } from '../types';

export class FirebaseRepository {
  private collectionName: string;

  constructor(collectionName = FEEDBACK_COLLECTION) {
    this.collectionName = collectionName;
  }

  async submitFeedback(feedback: StructuredFeedback): Promise<FirebaseSubmitResult> {
    const docId = feedback.sessionId;
    const record = {
      sessionId: feedback.sessionId,
      anchorName: feedback.anchorName,
      timestamp: feedback.timestamp,
      summary: feedback.summary,
      sentiment: feedback.sentiment,
      interestLevel: feedback.interestLevel,
      liked: feedback.liked || [],
      concerns: feedback.concerns || [],
      painPoints: feedback.painPoints || [],
      suggestions: feedback.suggestions || [],
      followUpRequired: Boolean(feedback.followUpRequired),
      transcript: feedback.transcript || '',
      createdAt: serverTimestamp(),
      platform: 'Technology Innovation Summit 2026',
    };

    // Save locally as offline backup/cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `tis_firebase_feedback_${docId}`;
        window.localStorage.setItem(key, JSON.stringify(record));
        const listKey = 'tis_firebase_feedback_sessions';
        const existingStr = window.localStorage.getItem(listKey);
        const existing = existingStr ? JSON.parse(existingStr) : [];
        if (!existing.includes(docId)) {
          existing.unshift(docId);
          window.localStorage.setItem(listKey, JSON.stringify(existing));
        }
      }
    } catch (e) {
      console.warn('Local cache warning:', e);
    }

    try {
      // Create record in Firebase Firestore collection
      const docRef = doc(db, this.collectionName, docId);
      await setDoc(docRef, record);

      return {
        success: true,
        documentId: docId,
        collectionName: this.collectionName,
      };
    } catch (err) {
      console.error('Firebase submission error:', err);
      const message = err instanceof Error ? err.message : 'Unknown Firestore error';
      return {
        success: false,
        documentId: docId,
        collectionName: this.collectionName,
        error: `Firebase Firestore error: ${message}`,
      };
    }
  }
}
