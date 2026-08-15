import { Body, Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(@Request() req) {
    return this.notificationService.getUserNotifications(req.user.id);
  }

  @Put(':id/read')
  async markRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Put('settings/me')
  async updateSettings(@Request() req, @Body('isNotificationEnabled') isNotificationEnabled: boolean | string | number) {
    const enabled = isNotificationEnabled === true || isNotificationEnabled === 'true' || isNotificationEnabled === 1 || isNotificationEnabled === '1';
    return this.notificationService.updateNotificationSettings(req.user.id, enabled);
  }
}
