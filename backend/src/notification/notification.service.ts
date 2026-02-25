import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class NotificationService implements OnModuleInit {
  private firebaseApp: admin.app.App;
  private isInitialized = false;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        this.isInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
      } catch (error) {
        console.warn('⚠️ Firebase Admin initialization failed:', error.message);
        console.warn('Push notifications will be disabled');
      }
    } else {
      console.warn('⚠️ Firebase service account file not found at:', serviceAccountPath);
      console.warn('Push notifications will be disabled');
      console.warn('To enable push notifications, add your firebase-service-account.json file');
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('Push notification skipped (Firebase not initialized)');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            icon: '/chat-icon.png',
            badge: '/badge-icon.png',
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: 'http://localhost:5173',
          },
        },
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }
}
