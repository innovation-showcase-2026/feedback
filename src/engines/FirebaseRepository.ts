import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, FEEDBACK_COLLECTION } from '../config/firebase';
import type { StructuredFeedback, FirebaseSubmitResult } from '../types';

export class FirebaseRepository {
  private parentCollection: string;

  constructor(parentCollection = FEEDBACK_COLLECTION) {
    this.parentCollection = parentCollection;
  }

  async submitFeedback(feedback: StructuredFeedback): Promise<FirebaseSubmitResult> {
    const docId = feedback.sessionId;

    // Sanitize anchor name for valid Firestore document path
    const rawAnchor = feedback.anchorName?.trim() || 'General';
    const anchorDocId = rawAnchor.replace(/\//g, '-');
    const fullPath = `${this.parentCollection}/${anchorDocId}/records`;

    const record = {
      id: docId,
      sessionId: feedback.sessionId,
      anchorName: feedback.anchorName,
      timestamp: feedback.timestamp,
      summary: feedback.summary,
      sentiment: feedback.sentiment,
      participantSentiment: feedback.participantSentiment || feedback.sentiment,
      interestLevel: feedback.interestLevel,
      liked: feedback.liked || [],
      concerns: feedback.concerns || [],
      painPoints: feedback.painPoints || [],
      suggestions: feedback.suggestions || [],
      followUpRequired: Boolean(feedback.followUpRequired),
      transcript: feedback.transcript || '',
      anchorSpeech: feedback.anchorSpeech || '',
      participantSpeech: feedback.participantSpeech || '',
      dialogue: feedback.dialogue || [],
      createdAt: serverTimestamp(),
      platform: 'Technology Innovation Summit 2026',
    };

    // Save locally as offline backup/cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `tis_fb_${anchorDocId}_${docId}`;
        window.localStorage.setItem(key, JSON.stringify(record));
        const listKey = `tis_fb_sessions_${anchorDocId}`;
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
      // 1. Maintain parent anchor document entry in 'feedback' collection
      const anchorDocRef = doc(db, this.parentCollection, anchorDocId);
      await setDoc(
        anchorDocRef,
        {
          anchorName: feedback.anchorName,
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Store the single feedback record in: feedback -> {anchorName} -> records -> {docId}
      const recordDocRef = doc(db, this.parentCollection, anchorDocId, 'records', docId);
      await setDoc(recordDocRef, record);

      return {
        success: true,
        documentId: docId,
        collectionName: fullPath,
      };
    } catch (err) {
      console.error('Storage submission error:', err);
      const message = err instanceof Error ? err.message : 'Unknown storage error';
      return {
        success: false,
        documentId: docId,
        collectionName: fullPath,
        error: `Submission error: ${message}`,
      };
    }
  }
}
