export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission;
    }
    return 'denied';
  }

  public async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      silent?: boolean;
    } = {}
  ): Promise<boolean> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Request permission if not granted
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: options.icon || '/afroasiaconnect-logo.png',
        badge: options.badge || '/afroasiaconnect-logo.png',
        body: options.body,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  public showMessageNotification(
    senderName: string,
    message: string,
    conversationId: string
  ): Promise<boolean> {
    return this.showNotification(`New message from ${senderName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `message-${conversationId}`,
      data: { type: 'message', conversationId },
      requireInteraction: true,
    });
  }

  public showOnlineNotification(userName: string): Promise<boolean> {
    return this.showNotification(`${userName} is now online`, {
      body: 'Start a conversation now!',
      tag: `online-${userName}`,
      data: { type: 'user_online', userName },
      silent: true,
    });
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = NotificationService.getInstance();
