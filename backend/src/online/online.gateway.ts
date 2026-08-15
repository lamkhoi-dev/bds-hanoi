import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  path: '/api/v1/socket.io',
  cors: {
    origin: '*',
  },
})
export class OnlineGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsersCount = 0;

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    this.onlineUsersCount++;
    await this.broadcastOnlineCount();
  }

  async handleDisconnect(client: Socket) {
    this.onlineUsersCount = Math.max(0, this.onlineUsersCount - 1);
    await this.broadcastOnlineCount();
  }

  private cachedShowOnlineUsers: boolean = true;
  private lastCacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 60 seconds

  // Force broadcast when settings change
  async broadcastOnlineCount() {
    const now = Date.now();
    if (now - this.lastCacheTime > this.CACHE_TTL) {
      try {
        const settings = await this.prisma.systemSettings.findFirst();
        this.cachedShowOnlineUsers = settings?.showOnlineUsers ?? true;
        this.lastCacheTime = now;
      } catch (error) {
        console.error('Error fetching settings for online count:', error);
      }
    }

    if (this.cachedShowOnlineUsers) {
      // Broadcast real count
      this.server.emit('onlineCountUpdate', { count: this.onlineUsersCount });
    } else {
      // Broadcast null or 0 when disabled
      this.server.emit('onlineCountUpdate', { count: null });
    }
  }
}
