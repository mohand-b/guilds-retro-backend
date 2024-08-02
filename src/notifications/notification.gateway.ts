import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    client.join(`user-${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId;
    client.leave(`user-${userId}`);
  }

  notifyUser(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
  }

  cancelNotification(userId: number, notificationId: number) {
    console.log('Cancel notification:', notificationId);
    console.log('User:', userId);
    this.server
      .to(`user-${userId}`)
      .emit('cancel-notification', notificationId);
  }
}
